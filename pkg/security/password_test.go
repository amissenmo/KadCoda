package security

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestHashPassword_And_CheckPasswordHash(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name          string
		password      string
		checkInput    string
		expectHashErr bool
		expectMatch   bool
	}{
		{
			name:          "valid standard password matches correctly",
			password:      "KadCoda@2026!Secure",
			checkInput:    "KadCoda@2026!Secure",
			expectHashErr: false,
			expectMatch:   true,
		},
		{
			name:          "incorrect password fails verification",
			password:      "KadCoda@2026!Secure",
			checkInput:    "WrongPassword123!",
			expectHashErr: false,
			expectMatch:   false,
		},
		{
			name:          "case sensitivity enforced on password verification",
			password:      "KadCodaSecret",
			checkInput:    "kadcodaSecret",
			expectHashErr: false,
			expectMatch:   false,
		},
		{
			name:          "persian and unicode characters supported",
			password:      "رمز_عبور_امن_۱۲۳۴",
			checkInput:    "رمز_عبور_امن_۱۲۳۴",
			expectHashErr: false,
			expectMatch:   true,
		},
		{
			name:          "empty password returns error on hash generation",
			password:      "",
			checkInput:    "",
			expectHashErr: true,
			expectMatch:   false,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			hash, err := HashPassword(tc.password)
			if tc.expectHashErr {
				require.Error(t, err)
				assert.Empty(t, hash)
				return
			}

			require.NoError(t, err)
			require.NotEmpty(t, hash)
			assert.True(t, strings.HasPrefix(hash, "$2a$") || strings.HasPrefix(hash, "$2b$"), "expected valid bcrypt prefix")

			cost, costErr := bcrypt.Cost([]byte(hash))
			require.NoError(t, costErr)
			assert.Equal(t, DefaultBcryptCost, cost)

			matched := CheckPasswordHash(tc.checkInput, hash)
			assert.Equal(t, tc.expectMatch, matched)
		})
	}
}
