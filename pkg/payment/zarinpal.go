package payment

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strings"
)

var (
	ErrGatewayRequestFailed      = errors.New("payment gateway request failed")
	ErrPaymentVerificationFailed = errors.New("payment verification failed at gateway")
)

// PaymentRequestResult holds the gateway authority token and redirect URL.
type PaymentRequestResult struct {
	Authority  string `json:"authority"`
	PaymentURL string `json:"payment_url"`
}

// PaymentVerifyResult holds the verified reference ID from the banking gateway.
type PaymentVerifyResult struct {
	RefID    string `json:"ref_id"`
	CardPan  string `json:"card_pan,omitempty"`
	Fee      int64  `json:"fee,omitempty"`
	Verified bool   `json:"verified"`
}

// Gateway defines the contract for an online payment gateway provider.
type Gateway interface {
	RequestPayment(ctx context.Context, amount int64, callbackURL, description string) (*PaymentRequestResult, error)
	VerifyPayment(ctx context.Context, authority string, amount int64) (*PaymentVerifyResult, error)
}

// ZarinpalGateway implements the Gateway interface with a simulated Zarinpal v4 adapter for development.
type ZarinpalGateway struct {
	merchantID string
	sandbox    bool
	baseWebURL string
}

// NewZarinpalGateway initializes a Zarinpal payment gateway adapter.
func NewZarinpalGateway() *ZarinpalGateway {
	merchantID := os.Getenv("ZARINPAL_MERCHANT_ID")
	if merchantID == "" {
		merchantID = "00000000-0000-0000-0000-000000000000"
	}

	sandbox := os.Getenv("APP_ENV") != "production"
	baseWebURL := "https://sandbox.zarinpal.com/pg/StartPay"
	if !sandbox {
		baseWebURL = "https://www.zarinpal.com/pg/StartPay"
	}

	return &ZarinpalGateway{
		merchantID: merchantID,
		sandbox:    sandbox,
		baseWebURL: baseWebURL,
	}
}

// RequestPayment initiates a payment session and returns a 36-character Zarinpal Authority and redirect URL.
func (z *ZarinpalGateway) RequestPayment(ctx context.Context, amount int64, callbackURL, description string) (*PaymentRequestResult, error) {
	if amount < 0 {
		return nil, fmt.Errorf("%w: amount cannot be negative", ErrGatewayRequestFailed)
	}

	authority, err := generateAuthorityCode()
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrGatewayRequestFailed, err)
	}

	paymentURL := fmt.Sprintf("%s/%s", z.baseWebURL, authority)

	return &PaymentRequestResult{
		Authority:  authority,
		PaymentURL: paymentURL,
	}, nil
}

// VerifyPayment verifies a Zarinpal transaction authority and returns a deterministic or random RefID.
func (z *ZarinpalGateway) VerifyPayment(ctx context.Context, authority string, amount int64) (*PaymentVerifyResult, error) {
	authority = strings.TrimSpace(authority)
	if authority == "" || !strings.HasPrefix(authority, "A") {
		return nil, ErrPaymentVerificationFailed
	}

	refSuffix, err := randomNumericCode(8)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrPaymentVerificationFailed, err)
	}

	return &PaymentVerifyResult{
		RefID:    fmt.Sprintf("ZP-%s", refSuffix),
		CardPan:  "6037-99**-****-1234",
		Fee:      0,
		Verified: true,
	}, nil
}

func generateAuthorityCode() (string, error) {
	raw := make([]byte, 16)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return "A000" + strings.ToUpper(hex.EncodeToString(raw)), nil
}

func randomNumericCode(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	var sb strings.Builder
	for _, b := range bytes {
		sb.WriteByte('0' + (b % 10))
	}
	return sb.String(), nil
}
