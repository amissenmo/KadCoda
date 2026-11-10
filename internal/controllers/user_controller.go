package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"

	"kadcoda-backend/internal/models/dto"
	"kadcoda-backend/internal/services"
	"kadcoda-backend/pkg/httputil"
)

// UserController handles student dashboard metrics and profile management endpoints.
type UserController struct {
	userService *services.UserService
}

// NewUserController constructs a new UserController instance.
func NewUserController(userService *services.UserService) *UserController {
	return &UserController{
		userService: userService,
	}
}

// GetDashboard handles GET /api/v1/user/dashboard
func (ctrl *UserController) GetDashboard(c *gin.Context) {
	userID, ok := extractAuthenticatedUserUUID(c)
	if !ok {
		return
	}

	stats, err := ctrl.userService.GetStudentDashboardStats(c.Request.Context(), userID)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Load Dashboard Stats",
			"An error occurred while aggregating student dashboard metrics.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}

// GetProfile handles GET /api/v1/user/profile
func (ctrl *UserController) GetProfile(c *gin.Context) {
	userID, ok := extractAuthenticatedUserUUID(c)
	if !ok {
		return
	}

	user, err := ctrl.userService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/user-not-found",
				"User Not Found",
				"Authenticated user record was not found.",
			)
			return
		}

		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Fetch Profile",
			"An error occurred while loading your user profile.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

// UpdateProfile handles PUT /api/v1/user/profile
func (ctrl *UserController) UpdateProfile(c *gin.Context) {
	userID, ok := extractAuthenticatedUserUUID(c)
	if !ok {
		return
	}

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Profile Update Payload",
			"Please provide valid profile fields (full_name, email, bio, avatar_url).",
		)
		return
	}

	user, err := ctrl.userService.UpdateProfile(c.Request.Context(), userID, req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/user-not-found",
				"User Not Found",
				"Authenticated user record was not found.",
			)
		case errors.Is(err, services.ErrEmailAlreadyInUse):
			httputil.AbortWithProblem(
				c,
				http.StatusConflict,
				"https://kadcoda.ir/probs/email-already-exists",
				"Email Already in Use",
				"این آدرس ایمیل قبلاً توسط کاربر دیگری ثبت شده است.",
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/internal-server-error",
				"Profile Update Failed",
				"An error occurred while updating your profile.",
			)
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "اطلاعات کاربری با موفقیت بروزرسانی شد",
		"user":    user,
	})
}

// ChangePassword handles PUT /api/v1/user/password
func (ctrl *UserController) ChangePassword(c *gin.Context) {
	userID, ok := extractAuthenticatedUserUUID(c)
	if !ok {
		return
	}

	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Password Change Payload",
			"لطفاً رمز عبور فعلی و رمز عبور جدید (حداقل ۸ کاراکتر) را به درستی وارد کنید.",
		)
		return
	}

	if err := ctrl.userService.ChangePassword(c.Request.Context(), userID, req); err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/user-not-found",
				"User Not Found",
				"کاربر مورد نظر یافت نشد.",
			)
		case errors.Is(err, services.ErrInvalidCurrentPass):
			httputil.AbortWithProblem(
				c,
				http.StatusUnauthorized,
				"https://kadcoda.ir/probs/invalid-credentials",
				"Invalid Current Password",
				"رمز عبور فعلی وارد شده اشتباه است.",
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/internal-server-error",
				"Password Change Failed",
				"خطایی در هنگام تغییر رمز عبور رخ داد.",
			)
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "رمز عبور شما با موفقیت تغییر یافت",
	})
}
