package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kadcoda-backend/internal/models/dto"
	"kadcoda-backend/internal/services"
	"kadcoda-backend/pkg/httputil"
)

// AdminController handles platform-wide metrics, user administration, and financial transaction reporting.
type AdminController struct {
	adminService *services.AdminService
}

// NewAdminController constructs a new AdminController instance.
func NewAdminController(adminService *services.AdminService) *AdminController {
	return &AdminController{
		adminService: adminService,
	}
}

// GetDashboard handles GET /api/v1/admin/dashboard
func (ctrl *AdminController) GetDashboard(c *gin.Context) {
	metrics, err := ctrl.adminService.GetPlatformMetrics(c.Request.Context())
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Load Platform Metrics",
			"An error occurred while aggregating admin dashboard statistics.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"metrics": metrics,
	})
}

// ListUsers handles GET /api/v1/admin/users
func (ctrl *AdminController) ListUsers(c *gin.Context) {
	var filter dto.AdminListFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-query-params",
			"Invalid Query Parameters",
			"Invalid query parameters for listing users.",
		)
		return
	}

	result, err := ctrl.adminService.ListUsers(c.Request.Context(), filter)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Fetch Users",
			"An error occurred while listing platform users.",
		)
		return
	}

	c.JSON(http.StatusOK, result)
}

// UpdateUser handles PUT /api/v1/admin/users/:id
func (ctrl *AdminController) UpdateUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-uuid",
			"Invalid User ID",
			"The user ID parameter must be a valid UUID.",
		)
		return
	}

	var req dto.AdminUpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid User Update Payload",
			"Please provide valid user update fields.",
		)
		return
	}

	user, err := ctrl.adminService.UpdateUser(c.Request.Context(), userID, req)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/user-not-found",
				"User Not Found",
				"کاربر مورد نظر یافت نشد.",
			)
			return
		}
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Update User",
			"خطا در بروزرسانی اطلاعات کاربر.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "اطلاعات کاربر با موفقیت بروزرسانی شد",
		"user":    user,
	})
}

// ListTransactions handles GET /api/v1/admin/transactions
func (ctrl *AdminController) ListTransactions(c *gin.Context) {
	var filter dto.AdminListFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-query-params",
			"Invalid Query Parameters",
			"Invalid query parameters for listing financial transactions.",
		)
		return
	}

	result, err := ctrl.adminService.ListTransactions(c.Request.Context(), filter)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Fetch Transactions",
			"An error occurred while retrieving financial transactions.",
		)
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetFinancialReport handles GET /api/v1/admin/reports/finance
func (ctrl *AdminController) GetFinancialReport(c *gin.Context) {
	var filter dto.AdminListFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-query-params",
			"Invalid Query Parameters",
			"Invalid query parameters for generating financial report.",
		)
		return
	}

	result, err := ctrl.adminService.GetFinancialReport(c.Request.Context(), filter)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Generate Financial Report",
			"An error occurred while compiling the financial report.",
		)
		return
	}

	c.JSON(http.StatusOK, result)
}

// ListDiscounts handles GET /api/v1/admin/discounts
func (ctrl *AdminController) ListDiscounts(c *gin.Context) {
	discounts, err := ctrl.adminService.ListDiscounts(c.Request.Context())
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Fetch Discounts",
			"An error occurred while retrieving discount codes.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": discounts,
	})
}

// CreateDiscount handles POST /api/v1/admin/discounts
func (ctrl *AdminController) CreateDiscount(c *gin.Context) {
	var req dto.CreateDiscountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Discount Payload",
			"لطفاً کد تخفیف و درصد تخفیف معتبر وارد کنید.",
		)
		return
	}

	discount, err := ctrl.adminService.CreateDiscount(c.Request.Context(), req)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Create Discount",
			"خطا در ثبت کد تخفیف جدید.",
		)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "کد تخفیف با موفقیت ایجاد شد",
		"discount": discount,
	})
}

// UpdateTicketStatus handles PUT /api/v1/admin/support/tickets/:id/status
func (ctrl *AdminController) UpdateTicketStatus(c *gin.Context) {
	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-uuid",
			"Invalid Ticket ID",
			"The ticket ID parameter must be a valid UUID.",
		)
		return
	}

	var req dto.UpdateTicketStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Ticket Status",
			"Status must be one of: open, pending, answered, closed.",
		)
		return
	}

	ticket, err := ctrl.adminService.UpdateTicketStatus(c.Request.Context(), ticketID, req.Status)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Update Ticket Status",
			"خطا در تغییر وضعیت تیکت.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "وضعیت تیکت بروزرسانی شد",
		"ticket":  ticket,
	})
}
