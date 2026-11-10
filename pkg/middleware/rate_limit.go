package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"

	"kadcoda-backend/pkg/httputil"
)

// slidingWindowScript implements an atomic Redis sliding-window rate limiter using a sorted set (ZSET).
// KEYS[1]: rate limit key
// ARGV[1]: current timestamp in milliseconds
// ARGV[2]: window size in milliseconds
// ARGV[3]: max allowed requests in window
// ARGV[4]: unique member ID for this request
var slidingWindowScript = redis.NewScript(`
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local clearBefore = now - window

redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local currentCount = redis.call('ZCARD', key)

if currentCount >= limit then
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local resetMs = window
    if oldest[2] then
        resetMs = (tonumber(oldest[2]) + window) - now
    end
    return {0, 0, resetMs}
end

redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, window)
return {1, limit - (currentCount + 1), window}
`)

// RateLimit enforces a Redis-backed sliding-window rate limit per client IP (and per mobile for OTP SMS routes).
func RateLimit(redisClient *redis.Client, limit int, windowSeconds int) gin.HandlerFunc {
	return func(c *gin.Context) {
		if redisClient == nil || limit <= 0 || windowSeconds <= 0 {
			c.Next()
			return
		}

		clientIP := c.ClientIP()
		if clientIP == "" {
			clientIP = "unknown"
		}

		// Determine if this is an SMS OTP dispatch endpoint that also requires strict per-mobile rate limiting (1 req/min/mobile)
		path := c.Request.URL.Path
		if strings.HasSuffix(path, "/otp/send") && c.Request.Method == http.MethodPost {
			if mobile := peekMobileFromBody(c); mobile != "" {
				mobileKey := fmt.Sprintf("rl:sms:mobile:%s", mobile)
				if !evaluateSlidingWindow(c, redisClient, mobileKey, 1, 60) {
					return
				}
			}
		}

		ipKey := fmt.Sprintf("rl:ip:%s:%s", clientIP, c.FullPath())
		if !evaluateSlidingWindow(c, redisClient, ipKey, limit, windowSeconds) {
			return
		}

		c.Next()
	}
}

// RateLimitByMobile enforces a strict Redis sliding-window rate limit keyed by the "mobile" JSON field.
func RateLimitByMobile(redisClient *redis.Client, limit int, windowSeconds int) gin.HandlerFunc {
	return func(c *gin.Context) {
		if redisClient == nil || limit <= 0 || windowSeconds <= 0 {
			c.Next()
			return
		}

		identifier := peekMobileFromBody(c)
		if identifier == "" {
			identifier = c.ClientIP()
		}

		key := fmt.Sprintf("rl:mobile:%s:%s", identifier, c.FullPath())
		if !evaluateSlidingWindow(c, redisClient, key, limit, windowSeconds) {
			return
		}

		c.Next()
	}
}

func evaluateSlidingWindow(c *gin.Context, redisClient *redis.Client, key string, limit int, windowSeconds int) bool {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	nowMs := time.Now().UnixMilli()
	windowMs := int64(windowSeconds) * 1000
	member := fmt.Sprintf("%d-%d", nowMs, time.Now().UnixNano())

	res, err := slidingWindowScript.Run(ctx, redisClient, []string{key}, nowMs, windowMs, limit, member).Int64Slice()
	if err != nil || len(res) < 3 {
		// Fail open if Redis is unavailable to preserve availability
		return true
	}

	allowed := res[0] == 1
	remaining := res[1]
	resetSeconds := int((res[2] + 999) / 1000)
	if resetSeconds < 1 {
		resetSeconds = 1
	}

	c.Header("X-RateLimit-Limit", strconv.Itoa(limit))
	c.Header("X-RateLimit-Remaining", strconv.FormatInt(remaining, 10))
	c.Header("X-RateLimit-Reset", strconv.Itoa(resetSeconds))

	if !allowed {
		c.Header("Retry-After", strconv.Itoa(resetSeconds))
		httputil.AbortWithProblem(
			c,
			http.StatusTooManyRequests,
			"https://kadcoda.ir/probs/rate-limit-exceeded",
			"Too Many Requests",
			fmt.Sprintf("تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً %d ثانیه دیگر مجدداً تلاش کنید.", resetSeconds),
		)
		return false
	}

	return true
}

func peekMobileFromBody(c *gin.Context) string {
	if c.Request == nil || c.Request.Body == nil {
		return ""
	}

	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		return ""
	}
	// Restore the request body so downstream Gin handlers can bind it normally
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	if len(bodyBytes) == 0 {
		return ""
	}

	var payload struct {
		Mobile string `json:"mobile"`
	}
	if err := json.Unmarshal(bodyBytes, &payload); err != nil {
		return ""
	}

	return strings.TrimSpace(payload.Mobile)
}
