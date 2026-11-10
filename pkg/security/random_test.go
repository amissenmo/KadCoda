package security

import (
	"regexp"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var sixDigitNumericRegex = regexp.MustCompile(`^\d{6}$`)

func TestGenerateOTP(t *testing.T) {
	t.Parallel()

	const iterations = 100
	for i := 0; i < iterations; i++ {
		otp, err := GenerateOTP()
		require.NoError(t, err)
		assert.Len(t, otp, 6, "OTP must be strictly 6 characters long")
		assert.Regexp(t, sixDigitNumericRegex, otp, "OTP must consist strictly of 6 numeric digits")
		assert.NotEqual(t, "0", string(otp[0]), "OTP must be in range 100000-999999")
	}
}

func TestGenerateRefreshToken_And_ProofToken(t *testing.T) {
	t.Parallel()

	refresh1, err := GenerateRefreshToken()
	require.NoError(t, err)
	require.NotEmpty(t, refresh1)

	refresh2, err := GenerateRefreshToken()
	require.NoError(t, err)
	require.NotEmpty(t, refresh2)
	assert.NotEqual(t, refresh1, refresh2, "consecutive refresh tokens must be unique")

	proof1, err := GenerateVerifiedProofToken()
	require.NoError(t, err)
	require.NotEmpty(t, proof1)

	proof2, err := GenerateVerifiedProofToken()
	require.NoError(t, err)
	require.NotEmpty(t, proof2)
	assert.NotEqual(t, proof1, proof2, "consecutive proof tokens must be unique")
}
