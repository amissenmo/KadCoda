package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"kadcoda-backend/pkg/httputil"
	"kadcoda-backend/pkg/security"
)

// Context keys for authenticated user metadata.
const (
	ContextUserIDKey     = "auth_user_id"
	ContextUserMobileKey = "auth_user_mobile"
	ContextUserRoleKey   = "auth_user_role"
)

// Supported RBAC role constants.
const (
	RoleStudent = "student"
	RoleTeacher = "teacher"
	RoleAdmin   = "admin"
)

// RequireAuth extracts the Bearer JWT from the Authorization header, validates it,
// and injects user claims (`sub`, `mobile`, `role`) into the Gin context.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
		if authHeader == "" {
			httputil.AbortWithProblem(
				c,
				http.StatusUnauthorized,
				"https://kadcoda.ir/probs/missing-authorization",
				"Unauthorized",
				"Missing Authorization header. Expected 'Bearer <token>'.",
			)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || strings.TrimSpace(parts[1]) == "" {
			httputil.AbortWithProblem(
				c,
				http.StatusUnauthorized,
				"https://kadcoda.ir/probs/malformed-authorization",
				"Malformed Authorization Header",
				"Authorization header format must be 'Bearer <token>'.",
			)
			return
		}

		claims, err := security.ValidateAccessToken(strings.TrimSpace(parts[1]))
		if err != nil {
			httputil.AbortWithProblem(
				c,
				http.StatusUnauthorized,
				"https://kadcoda.ir/probs/invalid-token",
				"Invalid or Expired Token",
				"The provided access token is invalid or has expired.",
			)
			return
		}

		c.Set(ContextUserIDKey, claims.UserID)
		c.Set(ContextUserMobileKey, claims.Mobile)
		c.Set(ContextUserRoleKey, claims.Role)

		c.Next()
	}
}

// RequireRole enforces Role-Based Access Control (RBAC) for the given allowed roles (e.g., student, teacher, admin).
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		normalized := strings.ToLower(strings.TrimSpace(r))
		allowed[normalized] = struct{}{}
		// Treat "teacher" and "instructor" as equivalent instructor roles
		if normalized == RoleTeacher {
			allowed["instructor"] = struct{}{}
		}
	}

	return func(c *gin.Context) {
		roleVal, exists := c.Get(ContextUserRoleKey)
		if !exists {
			httputil.AbortWithProblem(
				c,
				http.StatusUnauthorized,
				"https://kadcoda.ir/probs/unauthorized",
				"Unauthorized",
				"Authentication is required to access this resource.",
			)
			return
		}

		userRole, ok := roleVal.(string)
		if !ok {
			httputil.AbortWithProblem(
				c,
				http.StatusForbidden,
				"https://kadcoda.ir/probs/forbidden",
				"Forbidden",
				"Unable to determine user role permissions.",
			)
			return
		}

		if _, permitted := allowed[strings.ToLower(userRole)]; !permitted {
			httputil.AbortWithProblem(
				c,
				http.StatusForbidden,
				"https://kadcoda.ir/probs/insufficient-permissions",
				"Insufficient Permissions",
				"You do not have the required role permissions to access this endpoint.",
			)
			return
		}

		c.Next()
	}
}
