package middleware

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// cachedResponseWriter intercepts the HTTP response body written by downstream Gin handlers
// so that successful JSON responses can be stored in Redis.
type cachedResponseWriter struct {
	gin.ResponseWriter
	body *bytes.Buffer
}

func (w *cachedResponseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w *cachedResponseWriter) WriteString(s string) (int, error) {
	w.body.WriteString(s)
	return w.ResponseWriter.WriteString(s)
}

// RedisCache caches HTTP 200 JSON responses for GET endpoints in Redis using a SHA-256 hash of the request URL.
// On cache hit, it immediately serves the cached payload with `X-Cache: HIT` for sub-10ms latency.
func RedisCache(redisClient *redis.Client, ttl time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if redisClient == nil || c.Request.Method != http.MethodGet {
			c.Next()
			return
		}

		rawURL := c.Request.URL.RequestURI()
		hash := sha256.Sum256([]byte(rawURL))
		cacheKey := "cache:http:" + hex.EncodeToString(hash[:])

		ctx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
		defer cancel()

		if cachedBytes, err := redisClient.Get(ctx, cacheKey).Bytes(); err == nil && len(cachedBytes) > 0 {
			c.Header("X-Cache", "HIT")
			c.Data(http.StatusOK, "application/json; charset=utf-8", cachedBytes)
			c.Abort()
			return
		}

		c.Header("X-Cache", "MISS")
		writer := &cachedResponseWriter{
			ResponseWriter: c.Writer,
			body:           bytes.NewBuffer(nil),
		}
		c.Writer = writer

		c.Next()

		if c.Writer.Status() == http.StatusOK && writer.body.Len() > 0 {
			storeCtx, storeCancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer storeCancel()
			_ = redisClient.Set(storeCtx, cacheKey, writer.body.Bytes(), ttl).Err()
		}
	}
}
