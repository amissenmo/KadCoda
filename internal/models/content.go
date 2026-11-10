package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// Article represents an educational blog post or technical article on KadCoda.
type Article struct {
	ID              uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	AuthorID        uuid.UUID      `gorm:"column:author_id;type:uuid;not null;index:idx_articles_author_id" json:"author_id"`
	CategoryID      uuid.UUID      `gorm:"column:category_id;type:uuid;not null;index:idx_articles_category_id" json:"category_id"`
	Title           string         `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Slug            string         `gorm:"column:slug;type:varchar(255);uniqueIndex:idx_articles_slug;not null" json:"slug"`
	Excerpt         string         `gorm:"column:excerpt;type:text" json:"excerpt,omitempty"`
	ContentMarkdown string         `gorm:"column:content_markdown;type:text;not null" json:"content_markdown"`
	CoverURL        string         `gorm:"column:cover_url;type:varchar(500)" json:"cover_url,omitempty"`
	ReadTimeMinutes int            `gorm:"column:read_time_minutes;type:integer;default:5;not null" json:"read_time_minutes"`
	ViewsCount      int            `gorm:"column:views_count;type:integer;default:0;not null" json:"views_count"`
	Status          string         `gorm:"column:status;type:varchar(30);default:'draft';not null;index:idx_articles_status" json:"status"`
	Tags            datatypes.JSON `gorm:"column:tags;type:jsonb;default:'[]'" json:"tags"`
	CreatedAt       time.Time      `gorm:"column:created_at;type:timestamptz;autoCreateTime;not null" json:"created_at"`
	UpdatedAt       time.Time      `gorm:"column:updated_at;type:timestamptz;autoUpdateTime;not null" json:"updated_at"`

	// Associations
	Author   *User     `gorm:"foreignKey:AuthorID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"author,omitempty"`
	Category *Category `gorm:"foreignKey:CategoryID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"category,omitempty"`
}

// TableName overrides the table name used by Article to `articles`.
func (Article) TableName() string {
	return "articles"
}

// Certificate represents a verifiable course completion credential issued to a student.
type Certificate struct {
	ID               uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	UserID           uuid.UUID `gorm:"column:user_id;type:uuid;not null;index:idx_certificates_user_id" json:"user_id"`
	CourseID         uuid.UUID `gorm:"column:course_id;type:uuid;not null;index:idx_certificates_course_id" json:"course_id"`
	CredentialID     string    `gorm:"column:credential_id;type:varchar(100);uniqueIndex:idx_certificates_credential_id;not null" json:"credential_id"`
	IssueDate        time.Time `gorm:"column:issue_date;type:timestamptz;not null" json:"issue_date"`
	PDFURL           string    `gorm:"column:pdf_url;type:varchar(500)" json:"pdf_url,omitempty"`
	VerificationHash string    `gorm:"column:verification_hash;type:varchar(255);uniqueIndex:idx_certificates_verification_hash;not null" json:"verification_hash"`
	CreatedAt        time.Time `gorm:"column:created_at;type:timestamptz;autoCreateTime;not null" json:"created_at"`

	// Associations
	User   *User   `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	Course *Course `gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"course,omitempty"`
}

// TableName overrides the table name used by Certificate to `certificates`.
func (Certificate) TableName() string {
	return "certificates"
}
