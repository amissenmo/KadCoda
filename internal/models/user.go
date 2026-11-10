package models

import (
	"time"

	"github.com/google/uuid"
)

// UserRole represents standard RBAC roles in KadCoda.
const (
	RoleStudent    = "student"
	RoleInstructor = "instructor"
	RoleAdmin      = "admin"
)

// UserStatus represents account lifecycle states.
const (
	UserStatusActive    = "active"
	UserStatusSuspended = "suspended"
	UserStatusBanned    = "banned"
)

// User represents a platform user (student, instructor, or administrator).
type User struct {
	ID               uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	Mobile           string    `gorm:"column:mobile;type:varchar(20);uniqueIndex:idx_users_mobile;not null" json:"mobile"`
	Email            *string   `gorm:"column:email;type:varchar(255);uniqueIndex:idx_users_email" json:"email,omitempty"`
	FullName         string    `gorm:"column:full_name;type:varchar(150);not null" json:"full_name"`
	PasswordHash     string    `gorm:"column:password_hash;type:varchar(255);not null" json:"-"`
	Role             string    `gorm:"column:role;type:varchar(30);default:'student';not null;index:idx_users_role" json:"role"`
	Status           string    `gorm:"column:status;type:varchar(30);default:'active';not null;index:idx_users_status" json:"status"`
	Bio              string    `gorm:"column:bio;type:text" json:"bio,omitempty"`
	AvatarURL        string    `gorm:"column:avatar_url;type:varchar(500)" json:"avatar_url,omitempty"`
	IsVerified       bool      `gorm:"column:is_verified;type:boolean;default:false;not null" json:"is_verified"`
	HasSupportAccess bool      `gorm:"column:has_support_access;type:boolean;default:true;not null" json:"has_support_access"`
	CreatedAt        time.Time `gorm:"column:created_at;type:timestamptz;autoCreateTime;not null" json:"created_at"`
	UpdatedAt        time.Time `gorm:"column:updated_at;type:timestamptz;autoUpdateTime;not null" json:"updated_at"`

	// Associations
	InstructedCourses []Course      `gorm:"foreignKey:InstructorID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"instructed_courses,omitempty"`
	Enrollments       []Enrollment  `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"enrollments,omitempty"`
	Orders            []Order       `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"orders,omitempty"`
	Tickets           []Ticket      `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"tickets,omitempty"`
	Articles          []Article     `gorm:"foreignKey:AuthorID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"articles,omitempty"`
	Certificates      []Certificate `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"certificates,omitempty"`
}

// TableName overrides the table name used by User to `users`.
func (User) TableName() string {
	return "users"
}
