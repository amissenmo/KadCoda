package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"

	"kadcoda-backend/internal/models"
	"kadcoda-backend/internal/models/dto"
)

var (
	ErrCourseNotFound       = errors.New("course not found")
	ErrCourseSlugConflict   = errors.New("a course with this slug already exists")
	ErrChapterNotFound      = errors.New("chapter not found")
	ErrInvalidReferenceData = errors.New("referenced instructor or category does not exist")
)

// PaginatedCoursesResult wraps paginated course catalog items with pagination metadata.
type PaginatedCoursesResult struct {
	Items      []models.Course `json:"items"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalItems int64           `json:"total_items"`
	TotalPages int             `json:"total_pages"`
}

// CourseService encapsulates business logic for the course catalog, syllabus management, and student enrollments.
type CourseService struct {
	db *gorm.DB
}

// NewCourseService initializes a new CourseService.
func NewCourseService(db *gorm.DB) *CourseService {
	return &CourseService{db: db}
}

// ListCourses fetches paginated, published courses with optional type, search, and sort filters.
func (s *CourseService) ListCourses(ctx context.Context, filter dto.CourseListFilter) (*PaginatedCoursesResult, error) {
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 || limit > 100 {
		limit = 12
	}
	offset := (page - 1) * limit

	query := s.db.WithContext(ctx).
		Model(&models.Course{}).
		Where("status = ?", "published")

	if courseType := strings.TrimSpace(filter.Type); courseType != "" {
		query = query.Where("course_type = ?", courseType)
	}

	if search := strings.TrimSpace(filter.Search); search != "" {
		likePattern := "%" + search + "%"
		query = query.Where("title ILIKE ? OR description ILIKE ?", likePattern, likePattern)
	}

	var totalItems int64
	if err := query.Count(&totalItems).Error; err != nil {
		return nil, fmt.Errorf("failed to count courses: %w", err)
	}

	switch filter.Sort {
	case "price_asc":
		query = query.Order("final_price ASC, created_at DESC")
	case "price_desc":
		query = query.Order("final_price DESC, created_at DESC")
	case "oldest":
		query = query.Order("created_at ASC")
	case "popular":
		query = query.Order("students_count DESC, created_at DESC")
	default: // "newest" or empty
		query = query.Order("created_at DESC")
	}

	var courses []models.Course
	err := query.
		Preload("Category").
		Preload("Instructor", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "full_name", "avatar_url", "bio", "role")
		}).
		Offset(offset).
		Limit(limit).
		Find(&courses).Error
	if err != nil {
		return nil, fmt.Errorf("failed to query courses: %w", err)
	}

	totalPages := int((totalItems + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return &PaginatedCoursesResult{
		Items:      courses,
		Page:       page,
		Limit:      limit,
		TotalItems: totalItems,
		TotalPages: totalPages,
	}, nil
}

// GetCourseBySlug retrieves a single course with preloaded Instructor, Category, Chapters, and Episodes ordered by sort_order.
func (s *CourseService) GetCourseBySlug(ctx context.Context, slug string) (*models.Course, error) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return nil, ErrCourseNotFound
	}

	var course models.Course
	err := s.db.WithContext(ctx).
		Preload("Category").
		Preload("Instructor", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "full_name", "avatar_url", "bio", "role")
		}).
		Preload("Chapters", func(db *gorm.DB) *gorm.DB {
			return db.Order("chapters.sort_order ASC, chapters.created_at ASC")
		}).
		Preload("Chapters.Episodes", func(db *gorm.DB) *gorm.DB {
			return db.Order("episodes.sort_order ASC, episodes.created_at ASC")
		}).
		Where("slug = ?", slug).
		First(&course).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCourseNotFound
		}
		return nil, fmt.Errorf("failed to fetch course by slug: %w", err)
	}

	return &course, nil
}

// CreateCourse creates a new Course record for administrators.
func (s *CourseService) CreateCourse(ctx context.Context, req dto.CreateCourseRequest) (*models.Course, error) {
	slug := strings.TrimSpace(req.Slug)

	var existingCount int64
	if err := s.db.WithContext(ctx).Model(&models.Course{}).Where("slug = ?", slug).Count(&existingCount).Error; err != nil {
		return nil, fmt.Errorf("failed to check course slug uniqueness: %w", err)
	}
	if existingCount > 0 {
		return nil, ErrCourseSlugConflict
	}

	var instructorCount int64
	if err := s.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", req.InstructorID).Count(&instructorCount).Error; err != nil || instructorCount == 0 {
		return nil, ErrInvalidReferenceData
	}

	var categoryCount int64
	if err := s.db.WithContext(ctx).Model(&models.Category{}).Where("id = ?", req.CategoryID).Count(&categoryCount).Error; err != nil || categoryCount == 0 {
		return nil, ErrInvalidReferenceData
	}

	prerequisitesJSON, err := marshalStringSliceJSON(req.Prerequisites)
	if err != nil {
		return nil, err
	}

	highlightsJSON, err := marshalStringSliceJSON(req.Highlights)
	if err != nil {
		return nil, err
	}

	status := strings.TrimSpace(req.Status)
	if status == "" {
		status = "published"
	}

	finalPrice := req.FinalPrice
	if finalPrice == 0 && req.OriginalPrice > 0 {
		finalPrice = req.OriginalPrice
	}

	course := &models.Course{
		InstructorID:    req.InstructorID,
		CategoryID:      req.CategoryID,
		Title:           strings.TrimSpace(req.Title),
		Slug:            slug,
		Description:     strings.TrimSpace(req.Description),
		CourseType:      req.CourseType,
		OriginalPrice:   req.OriginalPrice,
		FinalPrice:      finalPrice,
		TotalHours:      req.TotalHours,
		Status:          status,
		CoverURL:        strings.TrimSpace(req.CoverURL),
		PreviewVideoURL: strings.TrimSpace(req.PreviewVideoURL),
		Prerequisites:   prerequisitesJSON,
		Highlights:      highlightsJSON,
	}

	if err := s.db.WithContext(ctx).Create(course).Error; err != nil {
		return nil, fmt.Errorf("failed to create course: %w", err)
	}

	return course, nil
}

// AddChapter appends a new syllabus Chapter to an existing Course.
func (s *CourseService) AddChapter(ctx context.Context, courseID uuid.UUID, req dto.AddChapterRequest) (*models.Chapter, error) {
	var courseExists int64
	if err := s.db.WithContext(ctx).Model(&models.Course{}).Where("id = ?", courseID).Count(&courseExists).Error; err != nil {
		return nil, fmt.Errorf("failed to verify course existence: %w", err)
	}
	if courseExists == 0 {
		return nil, ErrCourseNotFound
	}

	chapter := &models.Chapter{
		CourseID:  courseID,
		Title:     strings.TrimSpace(req.Title),
		SortOrder: req.SortOrder,
	}

	if err := s.db.WithContext(ctx).Create(chapter).Error; err != nil {
		return nil, fmt.Errorf("failed to create chapter: %w", err)
	}

	return chapter, nil
}

// AddEpisode appends a new video Episode to an existing Chapter.
func (s *CourseService) AddEpisode(ctx context.Context, chapterID uuid.UUID, req dto.AddEpisodeRequest) (*models.Episode, error) {
	var chapter models.Chapter
	if err := s.db.WithContext(ctx).First(&chapter, "id = ?", chapterID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrChapterNotFound
		}
		return nil, fmt.Errorf("failed to verify chapter existence: %w", err)
	}

	courseID := chapter.CourseID
	episode := &models.Episode{
		CourseID:  &courseID,
		ChapterID: chapter.ID,
		Title:     strings.TrimSpace(req.Title),
		Duration:  strings.TrimSpace(req.Duration),
		VideoURL:  strings.TrimSpace(req.VideoURL),
		IsFree:    req.IsFree,
		SortOrder: req.SortOrder,
	}

	if err := s.db.WithContext(ctx).Create(episode).Error; err != nil {
		return nil, fmt.Errorf("failed to create episode: %w", err)
	}

	return episode, nil
}

// GetEnrolledCourses returns all courses in which the authenticated student is enrolled, including SpotPlayer license keys and progress.
func (s *CourseService) GetEnrolledCourses(ctx context.Context, userID uuid.UUID) ([]dto.EnrolledCourseResponse, error) {
	var enrollments []models.Enrollment
	err := s.db.WithContext(ctx).
		Preload("Course").
		Preload("Course.Instructor", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "full_name")
		}).
		Where("user_id = ?", userID).
		Order("enrolled_at DESC").
		Find(&enrollments).Error
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user enrollments: %w", err)
	}

	results := make([]dto.EnrolledCourseResponse, 0, len(enrollments))
	for _, enrollment := range enrollments {
		item := dto.EnrolledCourseResponse{
			EnrollmentID:    enrollment.ID,
			CourseID:        enrollment.CourseID,
			LicenseKey:      enrollment.LicenseKey,
			SpotplayerID:    enrollment.SpotplayerID,
			ProgressPercent: enrollment.ProgressPercent,
			IsCompleted:     enrollment.IsCompleted,
			EnrolledAt:      enrollment.EnrolledAt.UTC().Format(time.RFC3339),
		}

		if enrollment.Course != nil {
			item.Title = enrollment.Course.Title
			item.Slug = enrollment.Course.Slug
			item.CourseType = enrollment.Course.CourseType
			item.CoverURL = enrollment.Course.CoverURL
			item.TotalHours = enrollment.Course.TotalHours
			if enrollment.Course.Instructor != nil {
				item.InstructorName = enrollment.Course.Instructor.FullName
			}
		}

		results = append(results, item)
	}

	return results, nil
}

func marshalStringSliceJSON(items []string) (datatypes.JSON, error) {
	if len(items) == 0 {
		return datatypes.JSON([]byte("[]")), nil
	}
	raw, err := json.Marshal(items)
	if err != nil {
		return nil, fmt.Errorf("failed to serialize JSON array: %w", err)
	}
	return datatypes.JSON(raw), nil
}
