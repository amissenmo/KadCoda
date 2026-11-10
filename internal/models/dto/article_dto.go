package dto

import "github.com/google/uuid"

// ArticleListFilter represents query parameters for listing published articles.
type ArticleListFilter struct {
	CategorySlug string `form:"category"`
	Search       string `form:"search"`
	Sort         string `form:"sort" binding:"omitempty,oneof=newest oldest popular"`
	Page         int    `form:"page,default=1" binding:"omitempty,min=1"`
	Limit        int    `form:"limit,default=10" binding:"omitempty,min=1,max=100"`
}

// CreateArticleRequest defines the payload for POST /api/v1/admin/articles.
type CreateArticleRequest struct {
	AuthorID        uuid.UUID `json:"author_id" binding:"required"`
	CategoryID      uuid.UUID `json:"category_id" binding:"required"`
	Title           string    `json:"title" binding:"required,min=3,max=255"`
	Slug            string    `json:"slug" binding:"required,min=3,max=255"`
	Excerpt         string    `json:"excerpt"`
	ContentMarkdown string    `json:"content_markdown" binding:"required,min=10"`
	CoverURL        string    `json:"cover_url" binding:"omitempty,url"`
	ReadTimeMinutes int       `json:"read_time_minutes" binding:"min=1"`
	Status          string    `json:"status" binding:"omitempty,oneof=draft published archived"`
	Tags            []string  `json:"tags"`
}

// UpdateArticleRequest defines the payload for PUT /api/v1/admin/articles/:id.
type UpdateArticleRequest struct {
	CategoryID      *uuid.UUID `json:"category_id"`
	Title           *string    `json:"title" binding:"omitempty,min=3,max=255"`
	Slug            *string    `json:"slug" binding:"omitempty,min=3,max=255"`
	Excerpt         *string    `json:"excerpt"`
	ContentMarkdown *string    `json:"content_markdown" binding:"omitempty,min=10"`
	CoverURL        *string    `json:"cover_url" binding:"omitempty,url"`
	ReadTimeMinutes *int       `json:"read_time_minutes" binding:"omitempty,min=1"`
	Status          *string    `json:"status" binding:"omitempty,oneof=draft published archived"`
	Tags            []string   `json:"tags"`
}
