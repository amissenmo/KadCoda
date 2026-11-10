package security

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateAndValidateAccessToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "unit-test-super-secret-jwt-key-32bytes!")

	tests := []struct {
		name   string
		userID uuid.UUID
		mobile string
		role   string
	}{
		{
			name:   "student token claims roundtrip",
			userID: uuid.New(),
			mobile: "09123456789",
			role:   "student",
		},
		{
			name:   "admin token claims roundtrip",
			userID: uuid.New(),
			mobile: "09120001122",
			role:   "admin",
		},
		{
			name:   "teacher token claims roundtrip",
			userID: uuid.New(),
			mobile: "09351112233",
			role:   "teacher",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			tokenStr, err := GenerateAccessToken(tc.userID, tc.mobile, tc.role)
			require.NoError(t, err)
			require.NotEmpty(t, tokenStr)

			claims, err := ValidateAccessToken(tokenStr)
			require.NoError(t, err)
			require.NotNil(t, claims)

			assert.Equal(t, tc.userID.String(), claims.UserID)
			assert.Equal(t, tc.userID.String(), claims.Subject)
			assert.Equal(t, tc.mobile, claims.Mobile)
			assert.Equal(t, tc.role, claims.Role)
			assert.Equal(t, defaultIssuer, claims.Issuer)
			assert.WithinDuration(t, time.Now().UTC().Add(AccessTokenTTL), claims.ExpiresAt.Time, 5*time.Second)
		})
	}
}

func TestValidateAccessToken_Failures(t *testing.T) {
	t.Setenv("JWT_SECRET", "unit-test-super-secret-jwt-key-32bytes!")

	userID := uuid.New()
	now := time.Now().UTC()

	// Build an already-expired token signed with the valid secret
	expiredClaims := AccessTokenClaims{
		UserID: userID.String(),
		Mobile: "09123456789",
		Role:   "student",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    defaultIssuer,
			IssuedAt:  jwt.NewNumericDate(now.Add(-30 * time.Minute)),
			NotBefore: jwt.NewNumericDate(now.Add(-30 * time.Minute)),
			ExpiresAt: jwt.NewNumericDate(now.Add(-15 * time.Minute)),
			ID:        uuid.NewString(),
		},
	}
	expiredTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, expiredClaims)
	expiredTokenStr, err := expiredTokenObj.SignedString(getJWTSecret())
	require.NoError(t, err)

	// Build a token signed with a different secret
	wrongSecretTokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, AccessTokenClaims{
		UserID: userID.String(),
		Mobile: "09123456789",
		Role:   "student",
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    defaultIssuer,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(15 * time.Minute)),
		},
	})
	wrongSecretTokenStr, err := wrongSecretTokenObj.SignedString([]byte("completely-different-secret-key"))
	require.NoError(t, err)

	tests := []struct {
		name  string
		token string
	}{
		{
			name:  "empty token string fails validation",
			token: "",
		},
		{
			name:  "malformed token string fails validation",
			token: "not.a.valid.jwt",
		},
		{
			name:  "expired token fails validation",
			token: expiredTokenStr,
		},
		{
			name:  "token signed with wrong secret fails validation",
			token: wrongSecretTokenStr,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			claims, err := ValidateAccessToken(tc.token)
			require.Error(t, err)
			assert.ErrorIs(t, err, ErrInvalidToken)
			assert.Nil(t, claims)
		})
	}
}
