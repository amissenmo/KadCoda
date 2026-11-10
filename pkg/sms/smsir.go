package sms

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

const (
	// SmsIrVerifyEndpoint is the official sms.ir verification REST endpoint.
	SmsIrVerifyEndpoint = "https://api.sms.ir/v1/send/verify"

	// SmsIrClientTimeout enforces a strict 5-second timeout to prevent blocking goroutines.
	SmsIrClientTimeout = 5 * time.Second

	// TemplateIDRegister is the approved sms.ir template for registration OTPs (کد تایید ثبتنام).
	TemplateIDRegister = 940317
	// TemplateIDLogin is the approved sms.ir template for fast login OTPs (کد یکبار مصرف برای ورود سریع).
	TemplateIDLogin = 178439
	// TemplateIDResetPassword is the approved sms.ir template for password reset OTPs (تغییر رمز عبور).
	TemplateIDResetPassword = 932203

	TemplateTypeRegister      = "register"
	TemplateTypeLogin         = "login"
	TemplateTypeResetPassword = "reset_password"
)

// Provider defines the contract for dispatching OTP verification messages via SMS.
type Provider interface {
	SendOTP(ctx context.Context, mobile, code string, templateType string) error
}

type smsIrParameter struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

type smsIrVerifyPayload struct {
	Mobile     string           `json:"mobile"`
	TemplateID int              `json:"templateId"`
	Parameters []smsIrParameter `json:"parameters"`
}

type smsIrProvider struct {
	httpClient *http.Client
	apiKey     string
	endpoint   string
}

// NewSmsIrProvider initializes a new sms.ir verification SMS provider with a strict 5-second HTTP timeout.
func NewSmsIrProvider(apiKey string) Provider {
	return &smsIrProvider{
		httpClient: &http.Client{
			Timeout: SmsIrClientTimeout,
		},
		apiKey:   strings.TrimSpace(apiKey),
		endpoint: SmsIrVerifyEndpoint,
	}
}

// resolveTemplateID maps the logical templateType to the approved sms.ir templateId.
func resolveTemplateID(templateType string) int {
	switch strings.ToLower(strings.TrimSpace(templateType)) {
	case TemplateTypeRegister:
		return TemplateIDRegister
	case TemplateTypeLogin:
		return TemplateIDLogin
	case TemplateTypeResetPassword:
		return TemplateIDResetPassword
	default:
		return TemplateIDRegister
	}
}

// SendOTP dispatches a verification OTP code to the recipient mobile number via sms.ir.
func (p *smsIrProvider) SendOTP(ctx context.Context, mobile, code string, templateType string) error {
	if p.apiKey == "" {
		return fmt.Errorf("sms.ir API key is not configured")
	}

	reqCtx, cancel := context.WithTimeout(ctx, SmsIrClientTimeout)
	defer cancel()

	payload := smsIrVerifyPayload{
		Mobile:     strings.TrimSpace(mobile),
		TemplateID: resolveTemplateID(templateType),
		Parameters: []smsIrParameter{
			{
				Name:  "Code",
				Value: strings.TrimSpace(code),
			},
		},
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal sms.ir verify payload: %w", err)
	}

	req, err := http.NewRequestWithContext(reqCtx, http.MethodPost, p.endpoint, bytes.NewReader(bodyBytes))
	if err != nil {
		return fmt.Errorf("failed to construct sms.ir HTTP request: %w", err)
	}

	req.Header.Set("X-API-KEY", p.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/plain")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("sms.ir HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf(
			"sms.ir returned non-200 status code %d: %s",
			resp.StatusCode,
			strings.TrimSpace(string(respBody)),
		)
	}

	return nil
}
