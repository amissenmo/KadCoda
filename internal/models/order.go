package models

import (
	"time"

	"github.com/google/uuid"
)

// OrderStatus constants for tracking financial transaction lifecycles.
const (
	OrderStatusPending  = "pending"
	OrderStatusPaid     = "paid"
	OrderStatusFailed   = "failed"
	OrderStatusRefunded = "refunded"
)

// Discount represents a promotional coupon code applicable to course purchases.
type Discount struct {
	ID                uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	Code              string     `gorm:"column:code;type:varchar(64);uniqueIndex:idx_discounts_code;not null" json:"code"`
	Percent           int        `gorm:"column:percent;type:integer;not null" json:"percent"`
	MaxDiscountAmount int64      `gorm:"column:max_discount_amount;type:bigint;default:0;not null" json:"max_discount_amount"`
	MaxUses           int        `gorm:"column:max_uses;type:integer;default:0;not null" json:"max_uses"`
	UsedCount         int        `gorm:"column:used_count;type:integer;default:0;not null" json:"used_count"`
	ExpiresAt         *time.Time `gorm:"column:expires_at;type:timestamptz;index:idx_discounts_expires_at" json:"expires_at,omitempty"`
	IsActive          bool       `gorm:"column:is_active;type:boolean;default:true;not null" json:"is_active"`
	CreatedAt         time.Time  `gorm:"column:created_at;type:timestamptz;autoCreateTime;not null" json:"created_at"`

	// Associations
	Orders []Order `gorm:"foreignKey:DiscountID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"orders,omitempty"`
}

// TableName overrides the table name used by Discount to `discounts`.
func (Discount) TableName() string {
	return "discounts"
}

// Order represents a financial checkout transaction for a Course.
type Order struct {
	ID             uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	UserID         uuid.UUID  `gorm:"column:user_id;type:uuid;not null;index:idx_orders_user_id" json:"user_id"`
	CourseID       uuid.UUID  `gorm:"column:course_id;type:uuid;not null;index:idx_orders_course_id" json:"course_id"`
	DiscountID     *uuid.UUID `gorm:"column:discount_id;type:uuid;index:idx_orders_discount_id" json:"discount_id,omitempty"`
	TrackingCode   string     `gorm:"column:tracking_code;type:varchar(100);uniqueIndex:idx_orders_tracking_code;not null" json:"tracking_code"`
	OriginalAmount int64      `gorm:"column:original_amount;type:bigint;not null" json:"original_amount"`
	DiscountAmount int64      `gorm:"column:discount_amount;type:bigint;default:0;not null" json:"discount_amount"`
	FinalAmount    int64      `gorm:"column:final_amount;type:bigint;not null" json:"final_amount"`
	PaymentMethod  string     `gorm:"column:payment_method;type:varchar(50);default:'online';not null" json:"payment_method"`
	Status         string     `gorm:"column:status;type:varchar(30);default:'pending';not null;index:idx_orders_status" json:"status"`
	GatewayName    string     `gorm:"column:gateway_name;type:varchar(50)" json:"gateway_name,omitempty"`
	GatewayRefID   string     `gorm:"column:gateway_ref_id;type:varchar(150);index:idx_orders_gateway_ref_id" json:"gateway_ref_id,omitempty"`
	PaidAt         *time.Time `gorm:"column:paid_at;type:timestamptz" json:"paid_at,omitempty"`
	CreatedAt      time.Time  `gorm:"column:created_at;type:timestamptz;autoCreateTime;not null" json:"created_at"`

	// Associations
	User     *User     `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"user,omitempty"`
	Course   *Course   `gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"course,omitempty"`
	Discount *Discount `gorm:"foreignKey:DiscountID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"discount,omitempty"`
}

// TableName overrides the table name used by Order to `orders`.
func (Order) TableName() string {
	return "orders"
}
