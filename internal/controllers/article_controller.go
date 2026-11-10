package controllers

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"kadcoda-backend/internal/models/dto"
	"kadcoda-backend/internal/services"
	"kadcoda-backend/pkg/httputil"
)

// ArticleController handles public article browsing and admin CMS mutations.
type ArticleController struct {
	articleService *services.ArticleService
}

// NewArticleController constructs a new ArticleController instance.
func NewArticleController(articleService *services.ArticleService) *ArticleController {
	return &ArticleController{
		articleService: articleService,
	}
}

// ListArticles handles GET /api/v1/articles
func (ctrl *ArticleController) ListArticles(c *gin.Context) {
	var filter dto.ArticleListFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-query-params",
			"Invalid Query Parameters",
			"Supported query parameters: category, search, sort (newest|oldest|popular), page, limit.",
		)
		return
	}

	result, err := ctrl.articleService.ListArticles(c.Request.Context(), filter)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Fetch Articles",
			"An unexpected error occurred while retrieving articles.",
		)
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetArticleBySlug handles GET /api/v1/articles/:slug
func (ctrl *ArticleController) GetArticleBySlug(c *gin.Context) {
	slug := c.Param("slug")

	article, err := ctrl.articleService.GetArticleBySlug(c.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, services.ErrArticleNotFound) {
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/article-not-found",
				"Article Not Found",
				"No article matching the requested slug was found.",
			)
			return
		}

		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Load Article",
			"An error occurred while retrieving the article.",
		)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"article": article,
	})
}

// CreateArticle handles POST /api/v1/admin/articles
func (ctrl *ArticleController) CreateArticle(c *gin.Context) {
	var req dto.CreateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Article Payload",
			"Required fields: author_id, category_id, title, slug, content_markdown.",
		)
		return
	}

	article, err := ctrl.articleService.CreateArticle(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrArticleSlugConflict):
			httputil.AbortWithProblem(
				c,
				http.StatusConflict,
				"https://kadcoda.ir/probs/article-slug-conflict",
				"Duplicate Article Slug",
				"An article with the specified slug already exists.",
			)
		case errors.Is(err, services.ErrInvalidReferenceData):
			httputil.AbortWithProblem(
				c,
				http.StatusBadRequest,
				"https://kadcoda.ir/probs/invalid-reference",
				"Invalid Author or Category",
				"The specified author_id or category_id does not exist.",
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/internal-server-error",
				"Article Creation Failed",
				"Could not create the article record.",
			)
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "مقاله جدید با موفقیت منتشر شد",
		"article": article,
	})
}

// UpdateArticle handles PUT /api/v1/admin/articles/:id
func (ctrl *ArticleController) UpdateArticle(c *gin.Context) {
	articleID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-uuid",
			"Invalid Article ID",
			"The article ID parameter must be a valid UUID.",
		)
		return
	}

	var req dto.UpdateArticleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Article Update Payload",
			"One or more article fields failed validation.",
		)
		return
	}

	article, err := ctrl.articleService.UpdateArticle(c.Request.Context(), articleID, req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrArticleNotFound):
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/article-not-found",
				"Article Not Found",
				"The target article does not exist.",
			)
		case errors.Is(err, services.ErrArticleSlugConflict):
			httputil.AbortWithProblem(
				c,
				http.StatusConflict,
				"https://kadcoda.ir/probs/article-slug-conflict",
				"Duplicate Article Slug",
				"Another article is already using this slug.",
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/internal-server-error",
				"Article Update Failed",
				"An unexpected error occurred while updating the article.",
			)
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "مقاله با موفقیت بروزرسانی شد",
		"article": article,
	})
}
