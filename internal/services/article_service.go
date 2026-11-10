package services

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"kadcoda-backend/internal/models"
	"kadcoda-backend/internal/models/dto"
)

var (
	ErrArticleNotFound     = errors.New("article not found")
	ErrArticleSlugConflict = errors.New("an article with this slug already exists")
)

// PaginatedArticlesResult wraps paginated article items with pagination metadata.
type PaginatedArticlesResult struct {
	Items      []models.Article `json:"items"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	TotalItems int64            `json:"total_items"`
	TotalPages int              `json:"total_pages"`
}

// ArticleService encapsulates CMS operations for listing, reading, creating, and updating articles.
type ArticleService struct {
	db *gorm.DB
}

// NewArticleService constructs a new ArticleService instance.
func NewArticleService(db *gorm.DB) *ArticleService {
	return &ArticleService{db: db}
}

// ListArticles returns paginated published articles with category and author metadata.
func (s *ArticleService) ListArticles(ctx context.Context, filter dto.ArticleListFilter) (*PaginatedArticlesResult, error) {
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := s.db.WithContext(ctx).
		Model(&models.Article{}).
		Where("articles.status = ?", "published")

	if catSlug := strings.TrimSpace(filter.CategorySlug); catSlug != "" {
		query = query.Joins("JOIN categories ON categories.id = articles.category_id").
			Where("categories.slug = ?", catSlug)
	}

	if search := strings.TrimSpace(filter.Search); search != "" {
		likePattern := "%" + search + "%"
		query = query.Where("articles.title ILIKE ? OR articles.excerpt ILIKE ?", likePattern, likePattern)
	}

	var totalItems int64
	if err := query.Count(&totalItems).Error; err != nil {
		return nil, fmt.Errorf("failed to count articles: %w", err)
	}

	switch filter.Sort {
	case "oldest":
		query = query.Order("articles.created_at ASC")
	case "popular":
		query = query.Order("articles.views_count DESC, articles.created_at DESC")
	default:
		query = query.Order("articles.created_at DESC")
	}

	var articles []models.Article
	err := query.
		Preload("Category").
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "full_name", "avatar_url", "bio", "role")
		}).
		Offset(offset).
		Limit(limit).
		Find(&articles).Error
	if err != nil {
		return nil, fmt.Errorf("failed to fetch articles: %w", err)
	}

	totalPages := int((totalItems + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return &PaginatedArticlesResult{
		Items:      articles,
		Page:       page,
		Limit:      limit,
		TotalItems: totalItems,
		TotalPages: totalPages,
	}, nil
}

// GetArticleBySlug fetches an article by its unique slug and atomically increments its views_count.
func (s *ArticleService) GetArticleBySlug(ctx context.Context, slug string) (*models.Article, error) {
	slug = strings.TrimSpace(slug)
	if slug == "" {
		return nil, ErrArticleNotFound
	}

	var article models.Article
	err := s.db.WithContext(ctx).
		Preload("Category").
		Preload("Author", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "full_name", "avatar_url", "bio", "role")
		}).
		Where("slug = ?", slug).
		First(&article).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrArticleNotFound
		}
		return nil, fmt.Errorf("failed to load article by slug: %w", err)
	}

	_ = s.db.WithContext(ctx).
		Model(&models.Article{}).
		Where("id = ?", article.ID).
		UpdateColumn("views_count", gorm.Expr("views_count + ?", 1)).Error
	article.ViewsCount++

	return &article, nil
}

// CreateArticle creates a new CMS Article record.
func (s *ArticleService) CreateArticle(ctx context.Context, req dto.CreateArticleRequest) (*models.Article, error) {
	slug := strings.TrimSpace(req.Slug)

	var existing int64
	if err := s.db.WithContext(ctx).Model(&models.Article{}).Where("slug = ?", slug).Count(&existing).Error; err != nil {
		return nil, fmt.Errorf("failed to check article slug uniqueness: %w", err)
	}
	if existing > 0 {
		return nil, ErrArticleSlugConflict
	}

	var authorCount int64
	if err := s.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", req.AuthorID).Count(&authorCount).Error; err != nil || authorCount == 0 {
		return nil, ErrInvalidReferenceData
	}

	var categoryCount int64
	if err := s.db.WithContext(ctx).Model(&models.Category{}).Where("id = ?", req.CategoryID).Count(&categoryCount).Error; err != nil || categoryCount == 0 {
		return nil, ErrInvalidReferenceData
	}

	tagsJSON, err := marshalStringSliceJSON(req.Tags)
	if err != nil {
		return nil, err
	}

	status := strings.TrimSpace(req.Status)
	if status == "" {
		status = "published"
	}

	readTime := req.ReadTimeMinutes
	if readTime <= 0 {
		readTime = 5
	}

	article := &models.Article{
		AuthorID:        req.AuthorID,
		CategoryID:      req.CategoryID,
		Title:           strings.TrimSpace(req.Title),
		Slug:            slug,
		Excerpt:         strings.TrimSpace(req.Excerpt),
		ContentMarkdown: req.ContentMarkdown,
		CoverURL:        strings.TrimSpace(req.CoverURL),
		ReadTimeMinutes: readTime,
		Status:          status,
		Tags:            tagsJSON,
	}

	if err := s.db.WithContext(ctx).Create(article).Error; err != nil {
		return nil, fmt.Errorf("failed to create article: %w", err)
	}

	return article, nil
}

// UpdateArticle updates an existing CMS Article record by ID.
func (s *ArticleService) UpdateArticle(ctx context.Context, articleID uuid.UUID, req dto.UpdateArticleRequest) (*models.Article, error) {
	var article models.Article
	if err := s.db.WithContext(ctx).First(&article, "id = ?", articleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrArticleNotFound
		}
		return nil, fmt.Errorf("failed to load article for update: %w", err)
	}

	if req.Slug != nil {
		newSlug := strings.TrimSpace(*req.Slug)
		if newSlug != "" && newSlug != article.Slug {
			var slugCount int64
			if err := s.db.WithContext(ctx).
				Model(&models.Article{}).
				Where("slug = ? AND id <> ?", newSlug, article.ID).
				Count(&slugCount).Error; err != nil {
				return nil, fmt.Errorf("failed to verify article slug uniqueness: %w", err)
			}
			if slugCount > 0 {
				return nil, ErrArticleSlugConflict
			}
			article.Slug = newSlug
		}
	}

	if req.CategoryID != nil {
		article.CategoryID = *req.CategoryID
	}
	if req.Title != nil {
		article.Title = strings.TrimSpace(*req.Title)
	}
	if req.Excerpt != nil {
		article.Excerpt = strings.TrimSpace(*req.Excerpt)
	}
	if req.ContentMarkdown != nil {
		article.ContentMarkdown = *req.ContentMarkdown
	}
	if req.CoverURL != nil {
		article.CoverURL = strings.TrimSpace(*req.CoverURL)
	}
	if req.ReadTimeMinutes != nil && *req.ReadTimeMinutes > 0 {
		article.ReadTimeMinutes = *req.ReadTimeMinutes
	}
	if req.Status != nil {
		article.Status = strings.TrimSpace(*req.Status)
	}
	if req.Tags != nil {
		tagsJSON, err := marshalStringSliceJSON(req.Tags)
		if err != nil {
			return nil, err
		}
		article.Tags = tagsJSON
	}

	if err := s.db.WithContext(ctx).Save(&article).Error; err != nil {
		return nil, fmt.Errorf("failed to update article: %w", err)
	}

	return &article, nil
}
