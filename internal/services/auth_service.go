package services

import (
	"context"
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"kadcoda-backend/internal/models"
	"kadcoda-backend/pkg/security"
	"kadcoda-backend/pkg/sms"
)

const (
	// OTPTTL is the 3-minute expiration window for 6-digit OTP codes in Redis.
	OTPTTL = 3 * time.Minute
	// OTPCooldownTTL is the 60-second rate-limit cooldown per mobile number.
	OTPCooldownTTL = 60 * time.Second
	// VerifiedProofTTL is the 10-minute validity window for OTP verification proof tokens.
	VerifiedProofTTL = 10 * time.Minute
	// RefreshTokenTTL is the 14-day expiration window for refresh tokens.
	RefreshTokenTTL = 14 * 24 * time.Hour
)

var (
	ErrOTPCooldownActive     = errors.New("please wait 60 seconds before requesting a new OTP")
	ErrOTPInvalidOrExpired   = errors.New("invalid or expired OTP code")
	ErrProofInvalidOrExpired = errors.New("invalid or expired OTP verification proof")
	ErrMobileAlreadyExists   = errors.New("a user with this mobile number is already registered")
	ErrInvalidCredentials    = errors.New("invalid mobile number or password")
	ErrAccountSuspended      = errors.New("user account is suspended or inactive")
	ErrRefreshTokenInvalid   = errors.New("invalid or expired refresh token")
)

type refreshSessionPayload struct {
	UserID string `json:"user_id"`
	Mobile string `json:"mobile"`
	Role   string `json:"role"`
}

// AuthResult holds the tokens and user entity returned upon authentication.
type AuthResult struct {
	AccessToken  string       `json:"access_token"`
	RefreshToken string       `json:"-"`
	ExpiresIn    int          `json:"expires_in"`
	User         *models.User `json:"user"`
}

// AuthService encapsulates authentication, OTP lifecycle, registration, and session management.
type AuthService struct {
	db          *gorm.DB
	redis       *redis.Client
	smsProvider sms.Provider
}

// NewAuthService constructs a new AuthService instance with the injected SMS provider.
func NewAuthService(db *gorm.DB, redisClient *redis.Client, smsProvider sms.Provider) *AuthService {
	return &AuthService{
		db:          db,
		redis:       redisClient,
		smsProvider: smsProvider,
	}
}

// SendOTP enforces the 60s cooldown, generates a 6-digit OTP, stores it in Redis for 3m, and dispatches the SMS via sms.ir.
func (s *AuthService) SendOTP(ctx context.Context, mobile string, templateTypes ...string) (int, error) {
	mobile = normalizeMobile(mobile)
	cooldownKey := fmt.Sprintf("otp:cooldown:%s", mobile)
	otpKey := fmt.Sprintf("otp:%s", mobile)

	exists, err := s.redis.Exists(ctx, cooldownKey).Result()
	if err != nil {
		return 0, fmt.Errorf("failed to check OTP cooldown: %w", err)
	}
	if exists > 0 {
		ttl, _ := s.redis.TTL(ctx, cooldownKey).Result()
		remaining := int(ttl.Seconds())
		if remaining <= 0 {
			remaining = int(OTPCooldownTTL.Seconds())
		}
		return remaining, ErrOTPCooldownActive
	}

	code, err := security.GenerateOTP()
	if err != nil {
		return 0, err
	}

	pipe := s.redis.TxPipeline()
	pipe.Set(ctx, otpKey, code, OTPTTL)
	pipe.Set(ctx, cooldownKey, "1", OTPCooldownTTL)
	if _, err := pipe.Exec(ctx); err != nil {
		return 0, fmt.Errorf("failed to persist OTP in redis: %w", err)
	}

	templateType := ""
	if len(templateTypes) > 0 {
		templateType = strings.TrimSpace(templateTypes[0])
	}
	if templateType == "" {
		templateType = s.resolveDefaultTemplateType(ctx, mobile)
	}

	if s.smsProvider != nil {
		if err := s.smsProvider.SendOTP(ctx, mobile, code, templateType); err != nil {
			log.Printf("[SMS ERROR] Failed to dispatch OTP via sms.ir (mobile=%s, template=%s): %v", mobile, templateType, err)
		}
	}

	return int(OTPCooldownTTL.Seconds()), nil
}

func (s *AuthService) resolveDefaultTemplateType(ctx context.Context, mobile string) string {
	if s.db != nil {
		var count int64
		if err := s.db.WithContext(ctx).Model(&models.User{}).Where("mobile = ?", mobile).Count(&count).Error; err == nil && count > 0 {
			return sms.TemplateTypeLogin
		}
	}
	return sms.TemplateTypeRegister
}

// VerifyOTP validates the 6-digit OTP code from Redis and issues a one-time verified proof token.
func (s *AuthService) VerifyOTP(ctx context.Context, mobile, code string) (string, error) {
	mobile = normalizeMobile(mobile)
	code = strings.TrimSpace(code)
	otpKey := fmt.Sprintf("otp:%s", mobile)

	storedCode, err := s.redis.Get(ctx, otpKey).Result()
	if errors.Is(err, redis.Nil) {
		return "", ErrOTPInvalidOrExpired
	}
	if err != nil {
		return "", fmt.Errorf("failed to read OTP from redis: %w", err)
	}

	if subtle.ConstantTimeCompare([]byte(storedCode), []byte(code)) != 1 {
		return "", ErrOTPInvalidOrExpired
	}

	proofToken, err := security.GenerateVerifiedProofToken()
	if err != nil {
		return "", err
	}

	proofKey := fmt.Sprintf("otp:verified:%s", mobile)
	pipe := s.redis.TxPipeline()
	pipe.Del(ctx, otpKey)
	pipe.Set(ctx, proofKey, proofToken, VerifiedProofTTL)
	if _, err := pipe.Exec(ctx); err != nil {
		return "", fmt.Errorf("failed to store OTP verification proof: %w", err)
	}

	return proofToken, nil
}

// Register validates the OTP verification proof, hashes the password, creates the student user, and issues tokens.
func (s *AuthService) Register(ctx context.Context, mobile, verifiedProof, password, fullName string) (*AuthResult, error) {
	mobile = normalizeMobile(mobile)
	proofKey := fmt.Sprintf("otp:verified:%s", mobile)

	storedProof, err := s.redis.Get(ctx, proofKey).Result()
	if errors.Is(err, redis.Nil) {
		return nil, ErrProofInvalidOrExpired
	}
	if err != nil {
		return nil, fmt.Errorf("failed to verify OTP proof in redis: %w", err)
	}

	if subtle.ConstantTimeCompare([]byte(storedProof), []byte(strings.TrimSpace(verifiedProof))) != 1 {
		return nil, ErrProofInvalidOrExpired
	}

	var existingCount int64
	if err := s.db.WithContext(ctx).Model(&models.User{}).Where("mobile = ?", mobile).Count(&existingCount).Error; err != nil {
		return nil, fmt.Errorf("failed to check existing user: %w", err)
	}
	if existingCount > 0 {
		return nil, ErrMobileAlreadyExists
	}

	passwordHash, err := security.HashPassword(password)
	if err != nil {
		return nil, err
	}

	if strings.TrimSpace(fullName) == "" {
		fullName = "کاربر کدکدا"
	}

	user := &models.User{
		Mobile:           mobile,
		FullName:         strings.TrimSpace(fullName),
		PasswordHash:     passwordHash,
		Role:             models.RoleStudent,
		Status:           models.UserStatusActive,
		IsVerified:       true,
		HasSupportAccess: true,
	}

	if err := s.db.WithContext(ctx).Create(user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user record: %w", err)
	}

	_ = s.redis.Del(ctx, proofKey).Err()

	return s.issueTokens(ctx, user)
}

// Login authenticates a user by mobile and password and issues new Access and Refresh tokens.
func (s *AuthService) Login(ctx context.Context, mobile, password string) (*AuthResult, error) {
	mobile = normalizeMobile(mobile)

	var user models.User
	if err := s.db.WithContext(ctx).Where("mobile = ?", mobile).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("database error during login: %w", err)
	}

	if user.Status != models.UserStatusActive {
		return nil, ErrAccountSuspended
	}

	if !security.CheckPasswordHash(password, user.PasswordHash) {
		return nil, ErrInvalidCredentials
	}

	return s.issueTokens(ctx, &user)
}

// RefreshAccessToken validates a refresh token stored in Redis and mints a fresh 15-minute Access Token.
func (s *AuthService) RefreshAccessToken(ctx context.Context, refreshToken string) (*AuthResult, error) {
	refreshToken = strings.TrimSpace(refreshToken)
	if refreshToken == "" {
		return nil, ErrRefreshTokenInvalid
	}

	refreshKey := fmt.Sprintf("auth:refresh:%s", refreshToken)
	rawSession, err := s.redis.Get(ctx, refreshKey).Result()
	if errors.Is(err, redis.Nil) {
		return nil, ErrRefreshTokenInvalid
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query refresh token: %w", err)
	}

	var session refreshSessionPayload
	if err := json.Unmarshal([]byte(rawSession), &session); err != nil {
		return nil, ErrRefreshTokenInvalid
	}

	userID, err := uuid.Parse(session.UserID)
	if err != nil {
		return nil, ErrRefreshTokenInvalid
	}

	var user models.User
	if err := s.db.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			_ = s.redis.Del(ctx, refreshKey).Err()
			return nil, ErrRefreshTokenInvalid
		}
		return nil, fmt.Errorf("failed to load user for token refresh: %w", err)
	}

	if user.Status != models.UserStatusActive {
		_ = s.redis.Del(ctx, refreshKey).Err()
		return nil, ErrAccountSuspended
	}

	accessToken, err := security.GenerateAccessToken(user.ID, user.Mobile, user.Role)
	if err != nil {
		return nil, err
	}

	return &AuthResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int(security.AccessTokenTTL.Seconds()),
		User:         &user,
	}, nil
}

// RevokeRefreshToken deletes the refresh token session from Redis upon logout.
func (s *AuthService) RevokeRefreshToken(ctx context.Context, refreshToken string) error {
	refreshToken = strings.TrimSpace(refreshToken)
	if refreshToken == "" {
		return nil
	}
	refreshKey := fmt.Sprintf("auth:refresh:%s", refreshToken)
	return s.redis.Del(ctx, refreshKey).Err()
}

func (s *AuthService) issueTokens(ctx context.Context, user *models.User) (*AuthResult, error) {
	accessToken, err := security.GenerateAccessToken(user.ID, user.Mobile, user.Role)
	if err != nil {
		return nil, err
	}

	refreshToken, err := security.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	payload, err := json.Marshal(refreshSessionPayload{
		UserID: user.ID.String(),
		Mobile: user.Mobile,
		Role:   user.Role,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to serialize refresh session: %w", err)
	}

	refreshKey := fmt.Sprintf("auth:refresh:%s", refreshToken)
	if err := s.redis.Set(ctx, refreshKey, string(payload), RefreshTokenTTL).Err(); err != nil {
		return nil, fmt.Errorf("failed to store refresh token in redis: %w", err)
	}

	return &AuthResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int(security.AccessTokenTTL.Seconds()),
		User:         user,
	}, nil
}

func normalizeMobile(mobile string) string {
	return strings.TrimSpace(mobile)
}
