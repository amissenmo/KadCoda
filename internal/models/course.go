package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// CategoryType constants for distinguishing course and article taxonomies.
const (
	CategoryTypeCourse  = "course"
	CategoryTypeArticle = "article"
)

// Category represents a taxonomy classification for courses or articles.
type Category struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	Title        string    `gorm:"column:title;type:varchar(150);not null" json:"title"`
	Slug         string    `gorm:"column:slug;type:varchar(150);uniqueIndex:idx_categories_slug;not null" json:"slug"`
	CategoryType string    `gorm:"column:category_type;type:varchar(30);not null;index:idx_categories_type" json:"category_type"`
	CreatedAt    time.Time `gorm:"column:created_at;type:timestamptz;autoCreateTime;not null" json:"created_at"`

	// Associations
	Courses  []Course  `gorm:"foreignKey:CategoryID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"courses,omitempty"`
	Articles []Article `gorm:"foreignKey:CategoryID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"articles,omitempty"`
}

// TableName overrides the table name used by Category to `categories`.
func (Category) TableName() string {
	return "categories"
}

// Course represents an educational course offered on KadCoda.
type Course struct {
	ID              uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	InstructorID    uuid.UUID      `gorm:"column:instructor_id;type:uuid;not null;index:idx_courses_instructor_id" json:"instructor_id"`
	CategoryID      uuid.UUID      `gorm:"column:category_id;type:uuid;not null;index:idx_courses_category_id" json:"category_id"`
	Title           string         `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Slug            string         `gorm:"column:slug;type:varchar(255);uniqueIndex:idx_courses_slug;not null" json:"slug"`
	Description     string         `gorm:"column:description;type:text;not null" json:"description"`
	CourseType      string         `gorm:"column:course_type;type:varchar(30);default:'offline';not null;index:idx_courses_type" json:"course_type"`
	OriginalPrice   int64          `gorm:"column:original_price;type:bigint;default:0;not null" json:"original_price"`
	FinalPrice      int64          `gorm:"column:final_price;type:bigint;default:0;not null" json:"final_price"`
	TotalHours      int            `gorm:"column:total_hours;type:integer;default:0;not null" json:"total_hours"`
	StudentsCount   int            `gorm:"column:students_count;type:integer;default:0;not null" json:"students_count"`
	Status          string         `gorm:"column:status;type:varchar(30);default:'draft';not null;index:idx_courses_status" json:"status"`
	CoverURL        string         `gorm:"column:cover_url;type:varchar(500)" json:"cover_url,omitempty"`
	PreviewVideoURL string         `gorm:"column:preview_video_url;type:varchar(500)" json:"preview_video_url,omitempty"`
	Prerequisites   datatypes.JSON `gorm:"column:prerequisites;type:jsonb;default:'[]'" json:"prerequisites"`
	Highlights      datatypes.JSON `gorm:"column:highlights;type:jsonb;default:'[]'" json:"highlights"`
	CreatedAt       time.Time      `gorm:"column:created_at;type:timestamptz;autoCreateTime;not null" json:"created_at"`
	UpdatedAt       time.Time      `gorm:"column:updated_at;type:timestamptz;autoUpdateTime;not null" json:"updated_at"`

	// Associations
	Instructor   *User         `gorm:"foreignKey:InstructorID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"instructor,omitempty"`
	Category     *Category     `gorm:"foreignKey:CategoryID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"category,omitempty"`
	Chapters     []Chapter     `gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"chapters,omitempty"`
	Episodes     []Episode     `gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"episodes,omitempty"`
	Enrollments  []Enrollment  `gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"enrollments,omitempty"`
	Certificates []Certificate `gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"certificates,omitempty"`
}

// TableName overrides the table name used by Course to `courses`.
func (Course) TableName() string {
	return "courses"
}

// Chapter represents a syllabus section grouping episodes within a Course.
type Chapter struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	CourseID  uuid.UUID `gorm:"column:course_id;type:uuid;not null;index:idx_chapters_course_id" json:"course_id"`
	Title     string    `gorm:"column:title;type:varchar(255);not null" json:"title"`
	SortOrder int       `gorm:"column:sort_order;type:integer;default:0;not null" json:"sort_order"`
	CreatedAt time.Time `gorm:"column:created_at;type:timestamptz;autoCreateTime;not null" json:"created_at"`

	// Associations
	Course   *Course   `gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"course,omitempty"`
	Episodes []Episode `gorm:"foreignKey:ChapterID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"episodes,omitempty"`
}

// TableName overrides the table name used by Chapter to `chapters`.
func (Chapter) TableName() string {
	return "chapters"
}

// Episode represents an individual video lesson inside a Chapter.
type Episode struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	CourseID  *uuid.UUID `gorm:"column:course_id;type:uuid;index:idx_episodes_course_id" json:"course_id,omitempty"`
	ChapterID uuid.UUID  `gorm:"column:chapter_id;type:uuid;not null;index:idx_episodes_chapter_id" json:"chapter_id"`
	Title     string     `gorm:"column:title;type:varchar(255);not null" json:"title"`
	Duration  string     `gorm:"column:duration;type:varchar(50);not null" json:"duration"`
	VideoURL  string     `gorm:"column:video_url;type:varchar(500)" json:"video_url,omitempty"`
	IsFree    bool       `gorm:"column:is_free;type:boolean;default:false;not null" json:"is_free"`
	SortOrder int        `gorm:"column:sort_order;type:integer;default:0;not null" json:"sort_order"`
	CreatedAt time.Time  `gorm:"column:created_at;type:timestamptz;autoCreateTime;not null" json:"created_at"`

	// Associations
	Course  *Course  `gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"course,omitempty"`
	Chapter *Chapter `gorm:"foreignKey:ChapterID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"chapter,omitempty"`
}

// TableName overrides the table name used by Episode to `episodes`.
func (Episode) TableName() string {
	return "episodes"
}

// Enrollment represents a student's active registration and license in a Course.
type Enrollment struct {
	ID              uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	UserID          uuid.UUID `gorm:"column:user_id;type:uuid;not null;uniqueIndex:idx_enrollments_user_course;index:idx_enrollments_user_id" json:"user_id"`
	CourseID        uuid.UUID `gorm:"column:course_id;type:uuid;not null;uniqueIndex:idx_enrollments_user_course;index:idx_enrollments_course_id" json:"course_id"`
	LicenseKey      string    `gorm:"column:license_key;type:text" json:"license_key,omitempty"`
	SpotplayerID    string    `gorm:"column:spotplayer_id;type:varchar(150)" json:"spotplayer_id,omitempty"`
	ProgressPercent int       `gorm:"column:progress_percent;type:integer;default:0;not null" json:"progress_percent"`
	IsCompleted     bool      `gorm:"column:is_completed;type:boolean;default:false;not null" json:"is_completed"`
	EnrolledAt      time.Time `gorm:"column:enrolled_at;type:timestamptz;autoCreateTime;not null" json:"enrolled_at"`

	// Associations
	User   *User   `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	Course *Course `gorm:"foreignKey:CourseID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"course,omitempty"`
}

// TableName overrides the table name used by Enrollment to `enrollments`.
func (Enrollment) TableName() string {
	return "enrollments"
}
