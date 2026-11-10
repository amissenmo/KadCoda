package dto

import "github.com/google/uuid"

// CourseListFilter represents query parameters for listing and filtering published courses.
type CourseListFilter struct {
	Type   string `form:"type" binding:"omitempty,oneof=online offline"`
	Sort   string `form:"sort" binding:"omitempty,oneof=newest oldest popular price_asc price_desc"`
	Search string `form:"search"`
	Page   int    `form:"page,default=1" binding:"omitempty,min=1"`
	Limit  int    `form:"limit,default=12" binding:"omitempty,min=1,max=100"`
}

// CreateCourseRequest defines the payload for POST /api/v1/admin/courses.
type CreateCourseRequest struct {
	InstructorID    uuid.UUID `json:"instructor_id" binding:"required"`
	CategoryID      uuid.UUID `json:"category_id" binding:"required"`
	Title           string    `json:"title" binding:"required,min=3,max=255"`
	Slug            string    `json:"slug" binding:"required,min=3,max=255"`
	Description     string    `json:"description" binding:"required,min=10"`
	CourseType      string    `json:"course_type" binding:"required,oneof=online offline"`
	OriginalPrice   int64     `json:"original_price" binding:"min=0"`
	FinalPrice      int64     `json:"final_price" binding:"min=0"`
	TotalHours      int       `json:"total_hours" binding:"min=0"`
	Status          string    `json:"status" binding:"omitempty,oneof=draft published archived"`
	CoverURL        string    `json:"cover_url" binding:"omitempty,url"`
	PreviewVideoURL string    `json:"preview_video_url" binding:"omitempty,url"`
	Prerequisites   []string  `json:"prerequisites"`
	Highlights      []string  `json:"highlights"`
}

// AddChapterRequest defines the payload for POST /api/v1/admin/courses/:id/chapters.
type AddChapterRequest struct {
	Title     string `json:"title" binding:"required,min=2,max=255"`
	SortOrder int    `json:"sort_order" binding:"min=0"`
}

// AddEpisodeRequest defines the payload for POST /api/v1/admin/chapters/:id/episodes.
type AddEpisodeRequest struct {
	Title     string `json:"title" binding:"required,min=2,max=255"`
	Duration  string `json:"duration" binding:"required,min=1,max=50"`
	VideoURL  string `json:"video_url" binding:"required,url"`
	IsFree    bool   `json:"is_free"`
	SortOrder int    `json:"sort_order" binding:"min=0"`
}

// EnrolledCourseResponse represents an enrolled course item returned by GET /api/v1/user/courses.
type EnrolledCourseResponse struct {
	EnrollmentID    uuid.UUID `json:"enrollment_id"`
	CourseID        uuid.UUID `json:"course_id"`
	Title           string    `json:"title"`
	Slug            string    `json:"slug"`
	CourseType      string    `json:"course_type"`
	CoverURL        string    `json:"cover_url,omitempty"`
	TotalHours      int       `json:"total_hours"`
	InstructorName  string    `json:"instructor_name,omitempty"`
	LicenseKey      string    `json:"license_key,omitempty"`
	SpotplayerID    string    `json:"spotplayer_id,omitempty"`
	ProgressPercent int       `json:"progress_percent"`
	IsCompleted     bool      `json:"is_completed"`
	EnrolledAt      string    `json:"enrolled_at"`
}
