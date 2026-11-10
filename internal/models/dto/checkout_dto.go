package dto

import "github.com/google/uuid"

// ValidateDiscountRequest defines the payload for POST /api/v1/checkout/validate-discount.
type ValidateDiscountRequest struct {
	Code     string    `json:"code" binding:"required,min=2,max=64"`
	CourseID uuid.UUID `json:"course_id" binding:"required"`
}

// ValidateDiscountResponse represents the calculated pricing breakdown after applying a coupon.
type ValidateDiscountResponse struct {
	Code              string    `json:"code"`
	Percent           int       `json:"percent"`
	CourseID          uuid.UUID `json:"course_id"`
	OriginalAmount    int64     `json:"original_amount"`
	DiscountAmount    int64     `json:"discount_amount"`
	FinalPayable      int64     `json:"final_payable"`
	MaxDiscountAmount int64     `json:"max_discount_amount,omitempty"`
}

// CheckoutPayRequest defines the payload for POST /api/v1/checkout/pay.
type CheckoutPayRequest struct {
	CourseID     uuid.UUID `json:"course_id" binding:"required"`
	DiscountCode string    `json:"discount_code" binding:"omitempty,max=64"`
}

// CheckoutPayResponse represents the payment initiation response with the Zarinpal gateway redirect URL.
type CheckoutPayResponse struct {
	OrderID        uuid.UUID `json:"order_id"`
	TrackingCode   string    `json:"tracking_code"`
	OriginalAmount int64     `json:"original_amount"`
	DiscountAmount int64     `json:"discount_amount"`
	FinalAmount    int64     `json:"final_amount"`
	Authority      string    `json:"authority"`
	PaymentURL     string    `json:"payment_url"`
	Status         string    `json:"status"`
}

// PaymentCallbackQuery represents the query parameters sent by Zarinpal to GET /api/v1/checkout/callback.
type PaymentCallbackQuery struct {
	Authority string `form:"Authority" binding:"required"`
	Status    string `form:"Status" binding:"required"`
}

// PaymentCallbackResponse represents the completed transaction and SpotPlayer license details.
type PaymentCallbackResponse struct {
	OrderID      uuid.UUID `json:"order_id"`
	TrackingCode string    `json:"tracking_code"`
	Status       string    `json:"status"`
	RefID        string    `json:"ref_id"`
	FinalAmount  int64     `json:"final_amount"`
	CourseID     uuid.UUID `json:"course_id"`
	EnrollmentID uuid.UUID `json:"enrollment_id"`
	SpotplayerID string    `json:"spotplayer_id"`
	LicenseKey   string    `json:"license_key"`
}
