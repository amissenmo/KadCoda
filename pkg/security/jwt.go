package security

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	// AccessTokenTTL is the 15-minute lifetime for short-lived JWT access tokens.
	AccessTokenTTL = 15 * time.Minute
	defaultIssuer  = "kadcoda-api"
)

var (
	ErrInvalidToken = errors.New("invalid or expired access token")
)

// AccessTokenClaims represents the JWT claims for KadCoda authentication.
type AccessTokenClaims struct {
	UserID string `json:"sub"`
	Mobile string `json:"mobile"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateAccessToken issues a signed 15-minute JWT access token containing sub (user_id), mobile, and role.
func GenerateAccessToken(userID uuid.UUID, mobile, role string) (string, error) {
	now := time.Now().UTC()
	claims := AccessTokenClaims{
		UserID: userID.String(),
		Mobile: mobile,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    defaultIssuer,
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(AccessTokenTTL)),
			ID:        uuid.NewString(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(getJWTSecret())
	if err != nil {
		return "", fmt.Errorf("failed to sign access token: %w", err)
	}

	return signed, nil
}

// ValidateAccessToken parses and verifies an HS256 JWT access token and returns its claims.
func ValidateAccessToken(tokenString string) (*AccessTokenClaims, error) {
	if tokenString == "" {
		return nil, ErrInvalidToken
	}

	token, err := jwt.ParseWithClaims(
		tokenString,
		&AccessTokenClaims{},
		func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return getJWTSecret(), nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(defaultIssuer),
	)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}

	claims, ok := token.Claims.(*AccessTokenClaims)
	if !ok || !token.Valid || claims.UserID == "" {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "kadcoda-dev-secret-change-in-production-32bytes"
	}
	return []byte(secret)
}
