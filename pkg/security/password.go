package security

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// DefaultBcryptCost defines the work factor for bcrypt password hashing.
const DefaultBcryptCost = 12

// HashPassword generates a bcrypt hash from a plain-text password.
func HashPassword(password string) (string, error) {
	if password == "" {
		return "", fmt.Errorf("password cannot be empty")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), DefaultBcryptCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hashedBytes), nil
}

// CheckPasswordHash compares a plain-text password with a stored bcrypt hash.
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
