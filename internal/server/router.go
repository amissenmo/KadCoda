package server

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"kadcoda-backend/internal/controllers"
	"kadcoda-backend/internal/services"
	"kadcoda-backend/pkg/drm"
	"kadcoda-backend/pkg/httputil"
	"kadcoda-backend/pkg/middleware"
	"kadcoda-backend/pkg/payment"
	"kadcoda-backend/pkg/sms"
)

// Dependencies aggregates core infrastructure dependencies injected into the HTTP server.
type Dependencies struct {
	DB    *gorm.DB
	Redis *redis.Client
}

// NewRouter initializes the Gin engine, middleware, RFC 7807 fallback handlers, and /api/v1 routes.
func NewRouter(deps Dependencies) *gin.Engine {
	router := gin.New()
	router.Use(gin.Logger())
	router.Use(recoveryMiddleware())
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.SecurityHeaders())
	router.Use(middleware.Cors())

	router.NoRoute(func(c *gin.Context) {
		httputil.AbortWithProblem(
			c,
			http.StatusNotFound,
			"https://kadcoda.ir/probs/not-found",
			"Resource Not Found",
			"The requested endpoint does not exist.",
		)
	})

	router.NoMethod(func(c *gin.Context) {
		httputil.AbortWithProblem(
			c,
			http.StatusMethodNotAllowed,
			"https://kadcoda.ir/probs/method-not-allowed",
			"Method Not Allowed",
			"The HTTP method is not supported for this endpoint.",
		)
	})

	// Initialize Services & Controllers
	smsProvider := sms.NewSmsIrProvider("zUbhSXLP62aMVEExljNxEZVbaYwNNiXeXBXyrFkOq7VNrOtk")
	authService := services.NewAuthService(deps.DB, deps.Redis, smsProvider)
	authController := controllers.NewAuthController(authService)

	courseService := services.NewCourseService(deps.DB)
	courseController := controllers.NewCourseController(courseService)

	zarinpalGateway := payment.NewZarinpalGateway()
	spotPlayerClient := drm.NewSpotPlayerClient()
	checkoutService := services.NewCheckoutService(deps.DB, zarinpalGateway, spotPlayerClient)
	checkoutController := controllers.NewCheckoutController(checkoutService)

	supportService := services.NewSupportService(deps.DB)
	supportController := controllers.NewSupportController(supportService)

	articleService := services.NewArticleService(deps.DB)
	articleController := controllers.NewArticleController(articleService)

	userService := services.NewUserService(deps.DB)
	userController := controllers.NewUserController(userService)

	adminService := services.NewAdminService(deps.DB)
	adminController := controllers.NewAdminController(adminService)

	v1 := router.Group("/api/v1")
	{
		v1.GET("/health", healthCheckHandler(deps))

		// Authentication & Session endpoints (Rate Limited: 5 req/min per IP, 1 req/min per Mobile for SMS)
		authGroup := v1.Group("/auth")
		authGroup.Use(middleware.RateLimit(deps.Redis, 5, 60))
		{
			authGroup.POST("/otp/send", middleware.RateLimitByMobile(deps.Redis, 1, 60), authController.SendOTP)
			authGroup.POST("/otp/verify", authController.VerifyOTP)
			authGroup.POST("/register", authController.Register)
			authGroup.POST("/login", authController.Login)
			authGroup.POST("/refresh", authController.Refresh)
			authGroup.POST("/logout", authController.Logout)
		}

		// Public Course Catalog endpoints (Cached in Redis for 10 minutes)
		coursesGroup := v1.Group("/courses")
		{
			coursesGroup.GET("", middleware.RedisCache(deps.Redis, 10*time.Minute), courseController.ListCourses)
			coursesGroup.GET("/:slug", middleware.RedisCache(deps.Redis, 10*time.Minute), courseController.GetCourseBySlug)
		}

		// Public CMS Articles endpoints (Cached in Redis for 10 minutes)
		articlesGroup := v1.Group("/articles")
		{
			articlesGroup.GET("", middleware.RedisCache(deps.Redis, 10*time.Minute), articleController.ListArticles)
			articlesGroup.GET("/:slug", middleware.RedisCache(deps.Redis, 10*time.Minute), articleController.GetArticleBySlug)
		}

		// Public Payment Gateway Callback (Bank redirects directly without JWT headers)
		v1.GET("/checkout/callback", checkoutController.Callback)

		// Authenticated Checkout endpoints (RBAC: student, admin)
		checkoutGroup := v1.Group("/checkout")
		checkoutGroup.Use(middleware.RequireAuth(), middleware.RequireRole("student", "admin"))
		{
			checkoutGroup.POST("/validate-discount", checkoutController.ValidateDiscount)
			checkoutGroup.POST("/pay", checkoutController.Pay)
		}

		// Student Panel endpoints (RBAC: student, admin)
		userGroup := v1.Group("/user")
		userGroup.Use(middleware.RequireAuth(), middleware.RequireRole("student", "admin"))
		{
			userGroup.GET("/dashboard", userController.GetDashboard)
			userGroup.GET("/profile", userController.GetProfile)
			userGroup.PUT("/profile", userController.UpdateProfile)
			userGroup.PUT("/password", userController.ChangePassword)
			userGroup.GET("/courses", courseController.GetUserCourses)
			userGroup.POST("/checkout/validate-discount", checkoutController.ValidateDiscount)
			userGroup.POST("/checkout/pay", checkoutController.Pay)
		}

		// Support Ticket endpoints (RBAC: student, admin)
		supportGroup := v1.Group("/support")
		supportGroup.Use(middleware.RequireAuth(), middleware.RequireRole("student", "admin"))
		{
			supportGroup.POST("/tickets", supportController.CreateTicket)
			supportGroup.GET("/tickets", supportController.GetUserTickets)
			supportGroup.GET("/tickets/:id", supportController.GetTicketMessages)
			supportGroup.POST("/tickets/:id/reply", supportController.ReplyToTicket)
		}

		// Admin Panel endpoints (RBAC: admin)
		adminGroup := v1.Group("/admin")
		adminGroup.Use(middleware.RequireAuth(), middleware.RequireRole("admin"))
		{
			adminGroup.GET("/dashboard", adminController.GetDashboard)
			adminGroup.GET("/users", adminController.ListUsers)
			adminGroup.PUT("/users/:id", adminController.UpdateUser)
			adminGroup.GET("/transactions", adminController.ListTransactions)
			adminGroup.GET("/reports/finance", adminController.GetFinancialReport)
			adminGroup.GET("/discounts", adminController.ListDiscounts)
			adminGroup.POST("/discounts", adminController.CreateDiscount)

			adminGroup.POST("/courses", courseController.CreateCourse)
			adminGroup.POST("/courses/:id/chapters", courseController.AddChapter)
			adminGroup.POST("/chapters/:id/episodes", courseController.AddEpisode)

			adminGroup.POST("/articles", articleController.CreateArticle)
			adminGroup.PUT("/articles/:id", articleController.UpdateArticle)

			adminGroup.GET("/support/tickets", supportController.GetAdminTickets)
			adminGroup.PUT("/support/tickets/:id/status", adminController.UpdateTicketStatus)
		}
	}

	return router
}

func healthCheckHandler(deps Dependencies) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
		defer cancel()

		servicesStatus := gin.H{
			"postgres": "up",
			"redis":    "up",
		}
		healthy := true

		if deps.DB != nil {
			sqlDB, err := deps.DB.DB()
			if err != nil || sqlDB.PingContext(ctx) != nil {
				servicesStatus["postgres"] = "down"
				healthy = false
			}
		} else {
			servicesStatus["postgres"] = "unconfigured"
		}

		if deps.Redis != nil {
			if err := deps.Redis.Ping(ctx).Err(); err != nil {
				servicesStatus["redis"] = "down"
				healthy = false
			}
		} else {
			servicesStatus["redis"] = "unconfigured"
		}

		if !healthy {
			httputil.AbortWithProblem(
				c,
				http.StatusServiceUnavailable,
				"https://kadcoda.ir/probs/service-unavailable",
				"Service Unavailable",
				"One or more backing data stores (PostgreSQL/Redis) are unreachable.",
			)
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status":    "ok",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"services":  servicesStatus,
		})
	}
}

func recoveryMiddleware() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Internal Server Error",
			"An unexpected internal error occurred while processing the request.",
		)
	})
}
