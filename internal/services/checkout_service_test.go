package services

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"kadcoda-backend/internal/models"
	"kadcoda-backend/pkg/drm"
	"kadcoda-backend/pkg/payment"
)

// mockPaymentGateway is a localized test double implementing payment.Gateway.
type mockPaymentGateway struct {
	requestResult *payment.PaymentRequestResult
	requestErr    error
	verifyResult  *payment.PaymentVerifyResult
	verifyErr     error
}

func (m *mockPaymentGateway) RequestPayment(_ context.Context, _ int64, _, _ string) (*payment.PaymentRequestResult, error) {
	if m.requestErr != nil {
		return nil, m.requestErr
	}
	return m.requestResult, nil
}

func (m *mockPaymentGateway) VerifyPayment(_ context.Context, _ string, _ int64) (*payment.PaymentVerifyResult, error) {
	if m.verifyErr != nil {
		return nil, m.verifyErr
	}
	return m.verifyResult, nil
}

// mockSpotPlayerProvider is a localized test double implementing drm.LicenseProvider.
type mockSpotPlayerProvider struct {
	licenseResult *drm.LicenseResult
	licenseErr    error
}

func (m *mockSpotPlayerProvider) GenerateLicense(_ context.Context, _ uuid.UUID, _, _ string) (*drm.LicenseResult, error) {
	if m.licenseErr != nil {
		return nil, m.licenseErr
	}
	return m.licenseResult, nil
}

func TestCalculateFinalPrice_TableDriven(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name                   string
		originalAmount         int64
		percent                int
		maxDiscountAmount      int64
		expectedDiscountAmount int64
		expectedFinalPayable   int64
	}{
		{
			name:                   "normal percentage discount (20% off 2,000,000 Toman)",
			originalAmount:         2_000_000,
			percent:                20,
			maxDiscountAmount:      0,
			expectedDiscountAmount: 400_000,
			expectedFinalPayable:   1_600_000,
		},
		{
			name:                   "discount capped by max_discount_amount (30% of 5,000,000 capped at 500,000)",
			originalAmount:         5_000_000,
			percent:                30,
			maxDiscountAmount:      500_000,
			expectedDiscountAmount: 500_000,
			expectedFinalPayable:   4_500_000,
		},
		{
			name:                   "100% discount resulting in 0 payable",
			originalAmount:         1_500_000,
			percent:                100,
			maxDiscountAmount:      0,
			expectedDiscountAmount: 1_500_000,
			expectedFinalPayable:   0,
		},
		{
			name:                   "discount below max_discount_amount cap uses exact percentage",
			originalAmount:         1_000_000,
			percent:                15,
			maxDiscountAmount:      500_000,
			expectedDiscountAmount: 150_000,
			expectedFinalPayable:   850_000,
		},
		{
			name:                   "zero percent discount returns 0 discount and full original amount",
			originalAmount:         3_200_000,
			percent:                0,
			maxDiscountAmount:      0,
			expectedDiscountAmount: 0,
			expectedFinalPayable:   3_200_000,
		},
		{
			name:                   "percentage above 100 is safely clamped to 100% and 0 payable",
			originalAmount:         900_000,
			percent:                150,
			maxDiscountAmount:      0,
			expectedDiscountAmount: 900_000,
			expectedFinalPayable:   0,
		},
		{
			name:                   "zero or negative original amount returns 0 discount and 0 payable",
			originalAmount:         0,
			percent:                25,
			maxDiscountAmount:      100_000,
			expectedDiscountAmount: 0,
			expectedFinalPayable:   0,
		},
	}

	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			discountAmount, finalPayable := calculateFinalPrice(tc.originalAmount, tc.percent, tc.maxDiscountAmount)
			assert.Equal(t, tc.expectedDiscountAmount, discountAmount, "unexpected discount amount")
			assert.Equal(t, tc.expectedFinalPayable, finalPayable, "unexpected final payable amount")
		})
	}
}

func TestCalculateDiscountAmounts_WithDiscountModel(t *testing.T) {
	t.Parallel()

	discountAmt, payable := calculateDiscountAmounts(2_500_000, nil)
	assert.Equal(t, int64(0), discountAmt)
	assert.Equal(t, int64(2_500_000), payable)

	modelDiscount := &models.Discount{
		Code:              "NOROUZ30",
		Percent:           30,
		MaxDiscountAmount: 600_000,
		IsActive:          true,
	}
	discountAmt, payable = calculateDiscountAmounts(2_500_000, modelDiscount)
	assert.Equal(t, int64(600_000), discountAmt)
	assert.Equal(t, int64(1_900_000), payable)
}

func TestCheckoutService_DependencyInjectionWithMocks(t *testing.T) {
	t.Parallel()

	gw := &mockPaymentGateway{
		requestResult: &payment.PaymentRequestResult{
			Authority:  "A00000000000000000000000000123456789",
			PaymentURL: "https://sandbox.zarinpal.com/pg/StartPay/A00000000000000000000000000123456789",
		},
		verifyResult: &payment.PaymentVerifyResult{
			Verified: true,
			RefID:    "987654321",
		},
	}
	sp := &mockSpotPlayerProvider{
		licenseResult: &drm.LicenseResult{
			SpotplayerID: "sp-id-001",
			LicenseKey:   "sp-key-xyz",
		},
	}

	svc := NewCheckoutService(nil, gw, sp)
	require.NotNil(t, svc)

	reqRes, err := svc.gateway.RequestPayment(context.Background(), 1_600_000, "http://localhost:8080/api/v1/checkout/callback", "Test Order")
	require.NoError(t, err)
	assert.Equal(t, "A00000000000000000000000000123456789", reqRes.Authority)

	licRes, err := svc.spotplayer.GenerateLicense(context.Background(), uuid.New(), "09123456789", "کاربر تست")
	require.NoError(t, err)
	assert.Equal(t, "sp-key-xyz", licRes.LicenseKey)
}
