package security

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"math/big"
)

// GenerateOTP generates a cryptographically secure 6-digit numeric OTP code (100000–999999).
func GenerateOTP() (string, error) {
	max := big.NewInt(900000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", fmt.Errorf("failed to generate secure OTP: %w", err)
	}
	code := n.Int64() + 100000
	return fmt.Sprintf("%06d", code), nil
}

// GenerateRefreshToken generates a cryptographically secure random URL-safe string (256-bit entropy).
func GenerateRefreshToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate refresh token: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

// GenerateVerifiedProofToken generates a cryptographically secure proof token after OTP verification.
func GenerateVerifiedProofToken() (string, error) {
	bytes := make([]byte, 24)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("failed to generate proof token: %w", err)
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}
