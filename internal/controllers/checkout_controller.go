package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kadcoda-backend/internal/models/dto"
	"kadcoda-backend/internal/services"
	"kadcoda-backend/pkg/httputil"
	"kadcoda-backend/pkg/middleware"
)

// CheckoutController handles discount validation, payment initiation, and gateway verification callbacks.
type CheckoutController struct {
	checkoutService *services.CheckoutService
}

// NewCheckoutController constructs a new CheckoutController.
func NewCheckoutController(checkoutService *services.CheckoutService) *CheckoutController {
	return &CheckoutController{
		checkoutService: checkoutService,
	}
}

// ValidateDiscount handles POST /api/v1/checkout/validate-discount (and /api/v1/user/checkout/validate-discount)
func (ctrl *CheckoutController) ValidateDiscount(c *gin.Context) {
	var req dto.ValidateDiscountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Discount Validation Payload",
			"Both 'code' and a valid 'course_id' UUID are required.",
		)
		return
	}

	result, err := ctrl.checkoutService.ValidateDiscount(c.Request.Context(), req.Code, req.CourseID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrCourseNotFound):
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/course-not-found",
				"Course Not Found",
				"The specified course does not exist or is not published.",
			)
		case errors.Is(err, services.ErrDiscountNotFound):
			httputil.AbortWithProblem(
				c,
				http.StatusBadRequest,
				"https://kadcoda.ir/probs/invalid-discount-code",
				"Invalid Discount Code",
				"کد تخفیف وارد شده نامعتبر یا غیرفعال است.",
			)
		case errors.Is(err, services.ErrDiscountExpired):
			httputil.AbortWithProblem(
				c,
				http.StatusBadRequest,
				"https://kadcoda.ir/probs/discount-expired",
				"Discount Code Expired",
				"مهلت استفاده از این کد تخفیف به پایان رسیده است.",
			)
		case errors.Is(err, services.ErrDiscountUsageExceeded):
			httputil.AbortWithProblem(
				c,
				http.StatusBadRequest,
				"https://kadcoda.ir/probs/discount-limit-reached",
				"Discount Usage Limit Reached",
				"ظرفیت استفاده از این کد تخفیف تکمیل شده است.",
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/internal-server-error",
				"Discount Validation Error",
				"An unexpected error occurred while validating the discount code.",
			)
		}
		return
	}

	c.JSON(http.StatusOK, result)
}

// Pay handles POST /api/v1/checkout/pay (and /api/v1/user/checkout/pay)
func (ctrl *CheckoutController) Pay(c *gin.Context) {
	userID, ok := extractAuthenticatedUserUUID(c)
	if !ok {
		return
	}

	var req dto.CheckoutPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Checkout Payload",
			"A valid 'course_id' UUID is required to initiate payment.",
		)
		return
	}

	result, err := ctrl.checkoutService.InitiateCheckout(c.Request.Context(), userID, req.CourseID, req.DiscountCode)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrCourseNotFound):
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/course-not-found",
				"Course Not Found",
				"The requested course does not exist or is unavailable for purchase.",
			)
		case errors.Is(err, services.ErrAlreadyEnrolled):
			httputil.AbortWithProblem(
				c,
				http.StatusConflict,
				"https://kadcoda.ir/probs/already-enrolled",
				"Already Enrolled",
				"شما قبلاً در این دوره ثبت‌نام کرده‌اید.",
			)
		case errors.Is(err, services.ErrDiscountNotFound),
			errors.Is(err, services.ErrDiscountExpired),
			errors.Is(err, services.ErrDiscountUsageExceeded):
			httputil.AbortWithProblem(
				c,
				http.StatusBadRequest,
				"https://kadcoda.ir/probs/invalid-discount-code",
				"Invalid Discount Code",
				err.Error(),
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/checkout-initiation-failed",
				"Checkout Initiation Failed",
				"Could not initiate payment with the banking gateway.",
			)
		}
		return
	}

	c.JSON(http.StatusCreated, result)
}

// Callback handles GET /api/v1/checkout/callback
func (ctrl *CheckoutController) Callback(c *gin.Context) {
	var query dto.PaymentCallbackQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-callback-params",
			"Invalid Payment Callback Parameters",
			"Both 'Authority' and 'Status' query parameters are required.",
		)
		return
	}

	result, err := ctrl.checkoutService.ProcessCallback(c.Request.Context(), query.Authority, query.Status)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrOrderNotFound):
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/order-not-found",
				"Order Not Found",
				"No transaction matching the provided Authority code was found.",
			)
		case errors.Is(err, services.ErrPaymentCancelled),
			errors.Is(err, services.ErrPaymentVerifyMismatch):
			httputil.AbortWithProblem(
				c,
				http.StatusUnprocessableEntity,
				"https://kadcoda.ir/probs/payment-verification-failed",
				"Payment Verification Failed",
				"تراکنش بانکی ناموفق بود یا توسط کاربر لغو شد.",
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/callback-processing-error",
				"Payment Callback Processing Error",
				"An unexpected error occurred while finalizing your enrollment and SpotPlayer license.",
			)
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "پرداخت با موفقیت تایید شد و لایسنس دوره صادر گردید",
		"data":    result,
	})
}

func extractAuthenticatedUserUUID(c *gin.Context) (uuid.UUID, bool) {
	rawUserID, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		httputil.AbortWithProblem(
			c,
			http.StatusUnauthorized,
			"https://kadcoda.ir/probs/unauthorized",
			"Unauthorized",
			"Authentication is required to perform checkout operations.",
		)
		return uuid.Nil, false
	}

	userIDStr, ok := rawUserID.(string)
	if !ok {
		httputil.AbortWithProblem(
			c,
			http.StatusUnauthorized,
			"https://kadcoda.ir/probs/unauthorized",
			"Invalid User Context",
			"Unable to read authenticated user ID.",
		)
		return uuid.Nil, false
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusUnauthorized,
			"https://kadcoda.ir/probs/invalid-user-id",
			"Invalid User Identifier",
			"The user ID in token claims is not a valid UUID.",
		)
		return uuid.Nil, false
	}

	return userID, true
}
