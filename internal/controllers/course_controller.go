package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kadcoda-backend/internal/models/dto"
	"kadcoda-backend/internal/services"
	"kadcoda-backend/pkg/httputil"
	"kadcoda-backend/pkg/middleware"
)

// CourseController handles public catalog queries, admin course/syllabus management, and student enrollments.
type CourseController struct {
	courseService *services.CourseService
}

// NewCourseController constructs a new CourseController instance.
func NewCourseController(courseService *services.CourseService) *CourseController {
	return &CourseController{
		courseService: courseService,
	}
}

// ListCourses handles GET /api/v1/courses
func (ctrl *CourseController) ListCourses(c *gin.Context) {
	var filter dto.CourseListFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-query-params",
			"Invalid Query Parameters",
			"Supported query parameters: type (online|offline), sort (newest|oldest|popular|price_asc|price_desc), page, limit.",
		)
		return
	}

	result, err := ctrl.courseService.ListCourses(c.Request.Context(), filter)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Fetch Courses",
			"An unexpected error occurred while retrieving the course catalog.",
		)
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetCourseBySlug handles GET /api/v1/courses/:slug
func (ctrl *CourseController) GetCourseBySlug(c *gin.Context) {
	slug := c.Param("slug")

	course, err := ctrl.courseService.GetCourseBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, services.ErrCourseNotFound) {
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/course-not-found",
				"Course Not Found",
				"No course matching the requested slug was found.",
			)
			return
		}

		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Fetch Course Details",
			"An unexpected error occurred while loading the course details.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"course": course,
	})
}

// CreateCourse handles POST /api/v1/admin/courses
func (ctrl *CourseController) CreateCourse(c *gin.Context) {
	var req dto.CreateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Course Payload",
			"Please provide valid course fields (title, slug, description, course_type, instructor_id, category_id).",
		)
		return
	}

	course, err := ctrl.courseService.CreateCourse(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrCourseSlugConflict):
			httputil.AbortWithProblem(
				c,
				http.StatusConflict,
				"https://kadcoda.ir/probs/course-slug-conflict",
				"Duplicate Course Slug",
				"A course with the specified slug already exists.",
			)
		case errors.Is(err, services.ErrInvalidReferenceData):
			httputil.AbortWithProblem(
				c,
				http.StatusBadRequest,
				"https://kadcoda.ir/probs/invalid-reference",
				"Invalid Instructor or Category",
				"The specified instructor_id or category_id does not exist.",
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/internal-server-error",
				"Course Creation Failed",
				"Could not create the course record.",
			)
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "دوره جدید با موفقیت ایجاد شد",
		"course":  course,
	})
}

// AddChapter handles POST /api/v1/admin/courses/:id/chapters
func (ctrl *CourseController) AddChapter(c *gin.Context) {
	courseID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-uuid",
			"Invalid Course ID",
			"The course ID parameter must be a valid UUID.",
		)
		return
	}

	var req dto.AddChapterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Chapter Payload",
			"A valid chapter title and non-negative sort_order are required.",
		)
		return
	}

	chapter, err := ctrl.courseService.AddChapter(c.Request.Context(), courseID, req)
	if err != nil {
		if errors.Is(err, services.ErrCourseNotFound) {
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/course-not-found",
				"Course Not Found",
				"Cannot add chapter because the target course does not exist.",
			)
			return
		}

		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Chapter Creation Failed",
			"An error occurred while adding the chapter.",
		)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "سرفصل با موفقیت اضافه شد",
		"chapter": chapter,
	})
}

// AddEpisode handles POST /api/v1/admin/chapters/:id/episodes
func (ctrl *CourseController) AddEpisode(c *gin.Context) {
	chapterID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-uuid",
			"Invalid Chapter ID",
			"The chapter ID parameter must be a valid UUID.",
		)
		return
	}

	var req dto.AddEpisodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Episode Payload",
			"Valid title, duration, video_url, and sort_order fields are required.",
		)
		return
	}

	episode, err := ctrl.courseService.AddEpisode(c.Request.Context(), chapterID, req)
	if err != nil {
		if errors.Is(err, services.ErrChapterNotFound) {
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/chapter-not-found",
				"Chapter Not Found",
				"Cannot add episode because the target chapter does not exist.",
			)
			return
		}

		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Episode Creation Failed",
			"An error occurred while adding the episode.",
		)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "جلسه جدید با موفقیت اضافه شد",
		"episode": episode,
	})
}

// GetUserCourses handles GET /api/v1/user/courses
func (ctrl *CourseController) GetUserCourses(c *gin.Context) {
	rawUserID, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		httputil.AbortWithProblem(
			c,
			http.StatusUnauthorized,
			"https://kadcoda.ir/probs/unauthorized",
			"Unauthorized",
			"Authenticated user context is missing.",
		)
		return
	}

	userIDStr, ok := rawUserID.(string)
	if !ok {
		httputil.AbortWithProblem(
			c,
			http.StatusUnauthorized,
			"https://kadcoda.ir/probs/unauthorized",
			"Invalid User Context",
			"Unable to read authenticated user identifier.",
		)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusUnauthorized,
			"https://kadcoda.ir/probs/invalid-user-id",
			"Invalid User Identifier",
			"The user ID in token claims is not a valid UUID.",
		)
		return
	}

	courses, err := ctrl.courseService.GetEnrolledCourses(c.Request.Context(), userID)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Fetch Enrolled Courses",
			"An error occurred while retrieving your enrolled courses.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"items": courses,
		"total": len(courses),
	})
}
