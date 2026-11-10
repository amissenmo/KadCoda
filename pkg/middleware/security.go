package middleware

import (
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// SecurityHeaders injects enterprise HTTP security headers to mitigate XSS, Clickjacking, MIME sniffing, and downgrade attacks.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	}
}

// Cors configures strict Cross-Origin Resource Sharing policies with explicit origin allowlists and credential support.
func Cors() gin.HandlerFunc {
	allowedOrigins := []string{
		"http://localhost:5173",
		"http://localhost:3000",
		"https://kadcoda.com",
		"https://www.kadcoda.com",
		"https://kadcoda.ir",
		"https://www.kadcoda.ir",
	}

	if envOrigins := strings.TrimSpace(os.Getenv("CORS_ALLOWED_ORIGINS")); envOrigins != "" {
		for _, origin := range strings.Split(envOrigins, ",") {
			trimmed := strings.TrimSpace(origin)
			if trimmed != "" {
				allowedOrigins = append(allowedOrigins, trimmed)
			}
		}
	}

	return cors.New(cors.Config{
		AllowOrigins: allowedOrigins,
		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Content-Length",
			"Accept",
			"Authorization",
			"X-Requested-With",
			"X-CSRF-Token",
		},
		ExposeHeaders: []string{
			"Content-Length",
			"X-Cache",
			"X-RateLimit-Limit",
			"X-RateLimit-Remaining",
			"X-RateLimit-Reset",
		},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}
