package controllers

import (
	"errors"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"kadcoda-backend/internal/services"
	"kadcoda-backend/pkg/httputil"
)

const (
	RefreshTokenCookieName = "kadcoda_refresh_token"
	RefreshTokenCookiePath = "/api/v1/auth"
)

// AuthController handles HTTP requests for OTP, registration, login, token refresh, and logout.
type AuthController struct {
	authService *services.AuthService
}

// NewAuthController initializes a new AuthController.
func NewAuthController(authService *services.AuthService) *AuthController {
	return &AuthController{
		authService: authService,
	}
}

type sendOTPRequest struct {
	Mobile       string `json:"mobile" binding:"required"`
	TemplateType string `json:"template_type"`
}

type verifyOTPRequest struct {
	Mobile string `json:"mobile" binding:"required"`
	Code   string `json:"code" binding:"required,len=6"`
}

type registerRequest struct {
	Mobile        string `json:"mobile" binding:"required"`
	VerifiedProof string `json:"verified_proof" binding:"required"`
	Password      string `json:"password" binding:"required,min=8"`
	FullName      string `json:"full_name"`
}

type loginRequest struct {
	Mobile   string `json:"mobile" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// SendOTP handles POST /api/v1/auth/otp/send
func (ctrl *AuthController) SendOTP(c *gin.Context) {
	var req sendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Request Payload",
			"A valid mobile number is required to send an OTP code.",
		)
		return
	}

	cooldownSeconds, err := ctrl.authService.SendOTP(c.Request.Context(), req.Mobile, req.TemplateType)
	if err != nil {
		if errors.Is(err, services.ErrOTPCooldownActive) {
			httputil.AbortWithProblem(
				c,
				http.StatusTooManyRequests,
				"https://kadcoda.ir/probs/otp-cooldown",
				"Too Many OTP Requests",
				"Please wait 60 seconds before requesting another OTP code.",
			)
			return
		}

		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"OTP Dispatch Failed",
			"Could not generate or send OTP at this time.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "کد تایید با موفقیت ارسال شد",
		"cooldown_seconds": cooldownSeconds,
		"expires_in":       int(services.OTPTTL.Seconds()),
	})
}

// VerifyOTP handles POST /api/v1/auth/otp/verify
func (ctrl *AuthController) VerifyOTP(c *gin.Context) {
	var req verifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Request Payload",
			"Both mobile number and a 6-digit OTP code are required.",
		)
		return
	}

	proofToken, err := ctrl.authService.VerifyOTP(c.Request.Context(), req.Mobile, req.Code)
	if err != nil {
		if errors.Is(err, services.ErrOTPInvalidOrExpired) {
			httputil.AbortWithProblem(
				c,
				http.StatusUnauthorized,
				"https://kadcoda.ir/probs/invalid-otp",
				"Invalid or Expired OTP",
				"The provided OTP code is incorrect or has expired.",
			)
			return
		}

		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"OTP Verification Error",
			"An error occurred while verifying the OTP code.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "شماره موبایل با موفقیت تایید شد",
		"verified_proof": proofToken,
		"expires_in":     int(services.VerifiedProofTTL.Seconds()),
	})
}

// Register handles POST /api/v1/auth/register
func (ctrl *AuthController) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Registration Payload",
			"Mobile, verified proof token, and a password of at least 8 characters are required.",
		)
		return
	}

	result, err := ctrl.authService.Register(
		c.Request.Context(),
		req.Mobile,
		req.VerifiedProof,
		req.Password,
		req.FullName,
	)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrProofInvalidOrExpired):
			httputil.AbortWithProblem(
				c,
				http.StatusBadRequest,
				"https://kadcoda.ir/probs/invalid-otp-proof",
				"Invalid OTP Verification Proof",
				"Your mobile verification session has expired or is invalid. Please verify your OTP again.",
			)
		case errors.Is(err, services.ErrMobileAlreadyExists):
			httputil.AbortWithProblem(
				c,
				http.StatusConflict,
				"https://kadcoda.ir/probs/user-already-exists",
				"Mobile Already Registered",
				"An account with this mobile number already exists.",
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/internal-server-error",
				"Registration Failed",
				"An unexpected error occurred while creating your account.",
			)
		}
		return
	}

	setRefreshTokenCookie(c, result.RefreshToken)
	c.JSON(http.StatusCreated, result)
}

// Login handles POST /api/v1/auth/login
func (ctrl *AuthController) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Login Payload",
			"Both mobile number and password are required.",
		)
		return
	}

	result, err := ctrl.authService.Login(c.Request.Context(), req.Mobile, req.Password)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidCredentials):
			httputil.AbortWithProblem(
				c,
				http.StatusUnauthorized,
				"https://kadcoda.ir/probs/invalid-credentials",
				"Authentication Failed",
				"Invalid mobile number or password.",
			)
		case errors.Is(err, services.ErrAccountSuspended):
			httputil.AbortWithProblem(
				c,
				http.StatusForbidden,
				"https://kadcoda.ir/probs/account-suspended",
				"Account Suspended",
				"Your account has been suspended. Please contact support.",
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/internal-server-error",
				"Login Error",
				"An unexpected error occurred while signing in.",
			)
		}
		return
	}

	setRefreshTokenCookie(c, result.RefreshToken)
	c.JSON(http.StatusOK, result)
}

// Refresh handles POST /api/v1/auth/refresh
func (ctrl *AuthController) Refresh(c *gin.Context) {
	refreshToken, err := c.Cookie(RefreshTokenCookieName)
	if err != nil || refreshToken == "" {
		httputil.AbortWithProblem(
			c,
			http.StatusUnauthorized,
			"https://kadcoda.ir/probs/missing-refresh-token",
			"Missing Refresh Token",
			"No valid refresh token cookie was provided.",
		)
		return
	}

	result, err := ctrl.authService.RefreshAccessToken(c.Request.Context(), refreshToken)
	if err != nil {
		clearRefreshTokenCookie(c)
		httputil.AbortWithProblem(
			c,
			http.StatusUnauthorized,
			"https://kadcoda.ir/probs/invalid-refresh-token",
			"Session Expired",
			"Your session has expired or been revoked. Please log in again.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": result.AccessToken,
		"expires_in":   result.ExpiresIn,
		"user":         result.User,
	})
}

// Logout handles POST /api/v1/auth/logout
func (ctrl *AuthController) Logout(c *gin.Context) {
	if refreshToken, err := c.Cookie(RefreshTokenCookieName); err == nil && refreshToken != "" {
		_ = ctrl.authService.RevokeRefreshToken(c.Request.Context(), refreshToken)
	}

	clearRefreshTokenCookie(c)
	c.JSON(http.StatusOK, gin.H{
		"message": "خروج از حساب کاربری با موفقیت انجام شد",
	})
}

func setRefreshTokenCookie(c *gin.Context, token string) {
	isSecure := os.Getenv("APP_ENV") == "production"
	maxAge := int(services.RefreshTokenTTL.Seconds())

	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(
		RefreshTokenCookieName,
		token,
		maxAge,
		RefreshTokenCookiePath,
		"",
		isSecure,
		true, // HttpOnly
	)
}

func clearRefreshTokenCookie(c *gin.Context) {
	isSecure := os.Getenv("APP_ENV") == "production"

	c.SetSameSite(http.SameSiteStrictMode)
	c.SetCookie(
		RefreshTokenCookieName,
		"",
		-1,
		RefreshTokenCookiePath,
		"",
		isSecure,
		true, // HttpOnly
	)
}
