package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"kadcoda-backend/internal/models"
	"kadcoda-backend/internal/models/dto"
	"kadcoda-backend/pkg/drm"
	"kadcoda-backend/pkg/payment"
)

const (
	OrderStatusCompleted = "completed"
)

var (
	ErrDiscountNotFound       = errors.New("discount code not found or inactive")
	ErrDiscountExpired        = errors.New("discount code has expired")
	ErrDiscountUsageExceeded  = errors.New("discount code usage limit has been reached")
	ErrAlreadyEnrolled        = errors.New("user is already enrolled in this course")
	ErrOrderNotFound          = errors.New("order not found for the given authority")
	ErrPaymentCancelled       = errors.New("payment was cancelled or failed at the banking gateway")
	ErrPaymentVerifyMismatch  = errors.New("payment verification failed with the banking gateway")
	ErrUserNotFoundInCheckout = errors.New("authenticated user record does not exist")
)

// CheckoutService orchestrates discount validation, order creation, Zarinpal payment verification, and SpotPlayer license provisioning.
type CheckoutService struct {
	db         *gorm.DB
	gateway    payment.Gateway
	spotplayer drm.LicenseProvider
}

// NewCheckoutService initializes a new CheckoutService.
func NewCheckoutService(db *gorm.DB, gateway payment.Gateway, spotplayer drm.LicenseProvider) *CheckoutService {
	return &CheckoutService{
		db:         db,
		gateway:    gateway,
		spotplayer: spotplayer,
	}
}

// ValidateDiscount checks coupon validity, expiration, and usage limits, and calculates int64 pricing for the target course.
func (s *CheckoutService) ValidateDiscount(ctx context.Context, code string, courseID uuid.UUID) (*dto.ValidateDiscountResponse, error) {
	var course models.Course
	if err := s.db.WithContext(ctx).First(&course, "id = ? AND status = ?", courseID, "published").Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCourseNotFound
		}
		return nil, fmt.Errorf("failed to fetch course for discount validation: %w", err)
	}

	discount, err := s.findAndVerifyDiscount(s.db.WithContext(ctx), code)
	if err != nil {
		return nil, err
	}

	baseAmount := course.FinalPrice
	if baseAmount <= 0 {
		baseAmount = course.OriginalPrice
	}

	discountAmount, finalPayable := calculateDiscountAmounts(baseAmount, discount)

	return &dto.ValidateDiscountResponse{
		Code:              discount.Code,
		Percent:           discount.Percent,
		CourseID:          course.ID,
		OriginalAmount:    baseAmount,
		DiscountAmount:    discountAmount,
		FinalPayable:      finalPayable,
		MaxDiscountAmount: discount.MaxDiscountAmount,
	}, nil
}

// InitiateCheckout computes final int64 pricing, creates a pending Order within a DB transaction, and requests a Zarinpal payment session.
func (s *CheckoutService) InitiateCheckout(ctx context.Context, userID, courseID uuid.UUID, discountCode string) (*dto.CheckoutPayResponse, error) {
	var response *dto.CheckoutPayResponse

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, "id = ?", userID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrUserNotFoundInCheckout
			}
			return fmt.Errorf("failed to verify user: %w", err)
		}

		var course models.Course
		if err := tx.First(&course, "id = ? AND status = ?", courseID, "published").Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrCourseNotFound
			}
			return fmt.Errorf("failed to load course: %w", err)
		}

		var existingEnrollment int64
		if err := tx.Model(&models.Enrollment{}).
			Where("user_id = ? AND course_id = ?", userID, courseID).
			Count(&existingEnrollment).Error; err != nil {
			return fmt.Errorf("failed to check existing enrollment: %w", err)
		}
		if existingEnrollment > 0 {
			return ErrAlreadyEnrolled
		}

		originalAmount := course.FinalPrice
		if originalAmount <= 0 {
			originalAmount = course.OriginalPrice
		}

		var discountAmount int64
		finalAmount := originalAmount
		var discountID *uuid.UUID

		if trimmedCode := strings.TrimSpace(discountCode); trimmedCode != "" {
			discount, err := s.findAndVerifyDiscount(tx, trimmedCode)
			if err != nil {
				return err
			}
			discountAmount, finalAmount = calculateDiscountAmounts(originalAmount, discount)
			discountID = &discount.ID
		}

		trackingCode, err := generateTrackingCode("KC")
		if err != nil {
			return fmt.Errorf("failed to generate tracking code: %w", err)
		}

		callbackURL := getCallbackURL()
		description := fmt.Sprintf("خرید دوره %s - کد پیگیری %s", course.Title, trackingCode)

		paymentReq, err := s.gateway.RequestPayment(ctx, finalAmount, callbackURL, description)
		if err != nil {
			return fmt.Errorf("failed to request payment from gateway: %w", err)
		}

		order := &models.Order{
			UserID:         userID,
			CourseID:       courseID,
			DiscountID:     discountID,
			TrackingCode:   trackingCode,
			OriginalAmount: originalAmount,
			DiscountAmount: discountAmount,
			FinalAmount:    finalAmount,
			PaymentMethod:  "online",
			Status:         models.OrderStatusPending,
			GatewayName:    "zarinpal",
			GatewayRefID:   paymentReq.Authority,
		}

		if err := tx.Create(order).Error; err != nil {
			return fmt.Errorf("failed to create pending order: %w", err)
		}

		response = &dto.CheckoutPayResponse{
			OrderID:        order.ID,
			TrackingCode:   order.TrackingCode,
			OriginalAmount: order.OriginalAmount,
			DiscountAmount: order.DiscountAmount,
			FinalAmount:    order.FinalAmount,
			Authority:      paymentReq.Authority,
			PaymentURL:     paymentReq.PaymentURL,
			Status:         order.Status,
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return response, nil
}

// ProcessCallback handles the Zarinpal callback, verifies payment, generates a SpotPlayer license, creates an Enrollment, and marks the Order as completed atomically.
func (s *CheckoutService) ProcessCallback(ctx context.Context, authority, status string) (*dto.PaymentCallbackResponse, error) {
	authority = strings.TrimSpace(authority)
	status = strings.ToUpper(strings.TrimSpace(status))

	var callbackResult *dto.PaymentCallbackResponse

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var order models.Order
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Preload("User").
			Preload("Course").
			Where("gateway_ref_id = ?", authority).
			First(&order).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrOrderNotFound
			}
			return fmt.Errorf("failed to lock order by authority: %w", err)
		}

		// Idempotency guard: if already completed, return existing enrollment
		if order.Status == OrderStatusCompleted || order.Status == models.OrderStatusPaid {
			var existingEnrollment models.Enrollment
			_ = tx.Where("user_id = ? AND course_id = ?", order.UserID, order.CourseID).First(&existingEnrollment).Error

			callbackResult = &dto.PaymentCallbackResponse{
				OrderID:      order.ID,
				TrackingCode: order.TrackingCode,
				Status:       order.Status,
				RefID:        order.GatewayRefID,
				FinalAmount:  order.FinalAmount,
				CourseID:     order.CourseID,
				EnrollmentID: existingEnrollment.ID,
				SpotplayerID: existingEnrollment.SpotplayerID,
				LicenseKey:   existingEnrollment.LicenseKey,
			}
			return nil
		}

		if status != "OK" {
			order.Status = models.OrderStatusFailed
			_ = tx.Save(&order).Error
			return ErrPaymentCancelled
		}

		verifyRes, err := s.gateway.VerifyPayment(ctx, authority, order.FinalAmount)
		if err != nil || !verifyRes.Verified {
			order.Status = models.OrderStatusFailed
			_ = tx.Save(&order).Error
			return ErrPaymentVerifyMismatch
		}

		studentMobile := "09000000000"
		studentName := "دانشجوی کدکدا"
		if order.User != nil {
			if order.User.Mobile != "" {
				studentMobile = order.User.Mobile
			}
			if order.User.FullName != "" {
				studentName = order.User.FullName
			}
		}

		licenseRes, err := s.spotplayer.GenerateLicense(ctx, order.CourseID, studentMobile, studentName)
		if err != nil {
			return fmt.Errorf("failed to generate SpotPlayer license: %w", err)
		}

		var enrollment models.Enrollment
		err = tx.Where("user_id = ? AND course_id = ?", order.UserID, order.CourseID).First(&enrollment).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			enrollment = models.Enrollment{
				UserID:          order.UserID,
				CourseID:        order.CourseID,
				LicenseKey:      licenseRes.LicenseKey,
				SpotplayerID:    licenseRes.SpotplayerID,
				ProgressPercent: 0,
				IsCompleted:     false,
			}
			if err := tx.Create(&enrollment).Error; err != nil {
				return fmt.Errorf("failed to create course enrollment: %w", err)
			}
		} else if err != nil {
			return fmt.Errorf("failed to query enrollment: %w", err)
		} else {
			enrollment.LicenseKey = licenseRes.LicenseKey
			enrollment.SpotplayerID = licenseRes.SpotplayerID
			if err := tx.Save(&enrollment).Error; err != nil {
				return fmt.Errorf("failed to update enrollment license: %w", err)
			}
		}

		now := time.Now().UTC()
		order.Status = OrderStatusCompleted
		order.GatewayRefID = verifyRes.RefID
		order.PaidAt = &now
		if err := tx.Save(&order).Error; err != nil {
			return fmt.Errorf("failed to update order status to completed: %w", err)
		}

		if order.DiscountID != nil {
			if err := tx.Model(&models.Discount{}).
				Where("id = ?", *order.DiscountID).
				UpdateColumn("used_count", gorm.Expr("used_count + ?", 1)).Error; err != nil {
				return fmt.Errorf("failed to increment discount usage count: %w", err)
			}
		}

		if err := tx.Model(&models.Course{}).
			Where("id = ?", order.CourseID).
			UpdateColumn("students_count", gorm.Expr("students_count + ?", 1)).Error; err != nil {
			return fmt.Errorf("failed to increment course students_count: %w", err)
		}

		callbackResult = &dto.PaymentCallbackResponse{
			OrderID:      order.ID,
			TrackingCode: order.TrackingCode,
			Status:       order.Status,
			RefID:        verifyRes.RefID,
			FinalAmount:  order.FinalAmount,
			CourseID:     order.CourseID,
			EnrollmentID: enrollment.ID,
			SpotplayerID: enrollment.SpotplayerID,
			LicenseKey:   enrollment.LicenseKey,
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return callbackResult, nil
}

func (s *CheckoutService) findAndVerifyDiscount(db *gorm.DB, code string) (*models.Discount, error) {
	normalized := strings.ToUpper(strings.TrimSpace(code))
	if normalized == "" {
		return nil, ErrDiscountNotFound
	}

	var discount models.Discount
	if err := db.Where("UPPER(code) = ? AND is_active = ?", normalized, true).First(&discount).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrDiscountNotFound
		}
		return nil, fmt.Errorf("failed to query discount code: %w", err)
	}

	now := time.Now().UTC()
	if discount.ExpiresAt != nil && now.After(*discount.ExpiresAt) {
		return nil, ErrDiscountExpired
	}

	if discount.MaxUses > 0 && discount.UsedCount >= discount.MaxUses {
		return nil, ErrDiscountUsageExceeded
	}

	return &discount, nil
}

// calculateFinalPrice computes the integer discount amount and final payable amount in Tomans.
// It handles percentage calculation, optional max_discount_amount caps, and prevents negative payables.
func calculateFinalPrice(originalAmount int64, percent int, maxDiscountAmount int64) (discountAmount int64, finalPayable int64) {
	if originalAmount <= 0 || percent <= 0 {
		return 0, maxInt64(originalAmount, 0)
	}

	pct := int64(percent)
	if pct > 100 {
		pct = 100
	}

	discountAmount = (originalAmount * pct) / 100
	if maxDiscountAmount > 0 && discountAmount > maxDiscountAmount {
		discountAmount = maxDiscountAmount
	}

	if discountAmount > originalAmount {
		discountAmount = originalAmount
	}

	finalPayable = originalAmount - discountAmount
	return discountAmount, finalPayable
}

func calculateDiscountAmounts(baseAmount int64, discount *models.Discount) (discountAmount int64, finalPayable int64) {
	if discount == nil {
		return calculateFinalPrice(baseAmount, 0, 0)
	}
	return calculateFinalPrice(baseAmount, discount.Percent, discount.MaxDiscountAmount)
}

func maxInt64(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}

func generateTrackingCode(prefix string) (string, error) {
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return fmt.Sprintf("%s-%d-%s", prefix, time.Now().UTC().Unix(), strings.ToUpper(hex.EncodeToString(b))), nil
}

func getCallbackURL() string {
	if cb := os.Getenv("ZARINPAL_CALLBACK_URL"); cb != "" {
		return cb
	}
	return "http://localhost:8080/api/v1/checkout/callback"
}
