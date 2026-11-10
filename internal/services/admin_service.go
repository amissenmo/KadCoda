package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"kadcoda-backend/internal/models"
	"kadcoda-backend/internal/models/dto"
	"kadcoda-backend/pkg/security"
)

// PaginatedUsersResult wraps paginated user records for the Admin panel.
type PaginatedUsersResult struct {
	Items      []models.User `json:"items"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalItems int64         `json:"total_items"`
	TotalPages int           `json:"total_pages"`
}

// PaginatedTransactionsResult wraps paginated financial orders and aggregate revenue for the Admin panel and Financial Reports.
type PaginatedTransactionsResult struct {
	Items        []models.Order `json:"items"`
	Page         int            `json:"page"`
	Limit        int            `json:"limit"`
	TotalItems   int64          `json:"total_items"`
	TotalPages   int            `json:"total_pages"`
	TotalAmount  int64          `json:"total_amount"`
	TotalRevenue int64          `json:"total_revenue"`
}

// AdminService encapsulates platform-wide analytics, user management, and financial transaction reporting.
type AdminService struct {
	db *gorm.DB
}

// NewAdminService constructs a new AdminService instance.
func NewAdminService(db *gorm.DB) *AdminService {
	return &AdminService{db: db}
}

// GetPlatformMetrics aggregates platform-wide KPIs (total users, courses, revenue, open tickets, and monthly revenue breakdown).
func (s *AdminService) GetPlatformMetrics(ctx context.Context) (*dto.PlatformMetricsResponse, error) {
	metrics := &dto.PlatformMetricsResponse{
		MonthlyStats: make([]dto.MonthlyRevenueStat, 0),
	}

	if err := s.db.WithContext(ctx).Model(&models.User{}).Count(&metrics.TotalUsers).Error; err != nil {
		return nil, fmt.Errorf("failed to count total users: %w", err)
	}

	if err := s.db.WithContext(ctx).Model(&models.Course{}).Count(&metrics.TotalCourses).Error; err != nil {
		return nil, fmt.Errorf("failed to count total courses: %w", err)
	}

	if err := s.db.WithContext(ctx).Model(&models.Enrollment{}).Count(&metrics.TotalEnrollments).Error; err != nil {
		return nil, fmt.Errorf("failed to count total enrollments: %w", err)
	}

	if err := s.db.WithContext(ctx).Model(&models.Article{}).Count(&metrics.TotalArticles).Error; err != nil {
		return nil, fmt.Errorf("failed to count total articles: %w", err)
	}

	if err := s.db.WithContext(ctx).
		Model(&models.Ticket{}).
		Where("status IN ?", []string{models.TicketStatusOpen, models.TicketStatusPending}).
		Count(&metrics.OpenTicketsCount).Error; err != nil {
		return nil, fmt.Errorf("failed to count open support tickets: %w", err)
	}

	paidStatuses := []string{OrderStatusCompleted, models.OrderStatusPaid}
	if err := s.db.WithContext(ctx).
		Model(&models.Order{}).
		Select("COALESCE(SUM(final_amount), 0)").
		Where("status IN ?", paidStatuses).
		Scan(&metrics.TotalRevenue).Error; err != nil {
		return nil, fmt.Errorf("failed to aggregate total revenue: %w", err)
	}

	var monthlyStats []dto.MonthlyRevenueStat
	_ = s.db.WithContext(ctx).
		Model(&models.Order{}).
		Select("TO_CHAR(DATE_TRUNC('month', COALESCE(paid_at, created_at)), 'YYYY-MM') AS month, COALESCE(SUM(final_amount), 0) AS total_amount, COUNT(id) AS orders_count").
		Where("status IN ?", paidStatuses).
		Group("DATE_TRUNC('month', COALESCE(paid_at, created_at))").
		Order("DATE_TRUNC('month', COALESCE(paid_at, created_at)) DESC").
		Limit(12).
		Scan(&monthlyStats).Error

	if monthlyStats != nil {
		metrics.MonthlyStats = monthlyStats
	}

	return metrics, nil
}

// ListUsers returns a paginated list of platform users with optional search, role, and status filters.
func (s *AdminService) ListUsers(ctx context.Context, filter dto.AdminListFilter) (*PaginatedUsersResult, error) {
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := s.db.WithContext(ctx).Model(&models.User{})

	if role := strings.TrimSpace(filter.Role); role != "" {
		query = query.Where("role = ?", role)
	}
	if status := strings.TrimSpace(filter.Status); status != "" {
		query = query.Where("status = ?", status)
	}
	if search := strings.TrimSpace(filter.Search); search != "" {
		likePattern := "%" + search + "%"
		query = query.Where("full_name ILIKE ? OR mobile ILIKE ? OR email ILIKE ?", likePattern, likePattern, likePattern)
	}

	var totalItems int64
	if err := query.Count(&totalItems).Error; err != nil {
		return nil, fmt.Errorf("failed to count users: %w", err)
	}

	var users []models.User
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("failed to list users: %w", err)
	}

	totalPages := int((totalItems + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return &PaginatedUsersResult{
		Items:      users,
		Page:       page,
		Limit:      limit,
		TotalItems: totalItems,
		TotalPages: totalPages,
	}, nil
}

// UpdateUser updates an existing user's administrative fields (role, status, password, bio, etc.).
func (s *AdminService) UpdateUser(ctx context.Context, userID uuid.UUID, req dto.AdminUpdateUserRequest) (*models.User, error) {
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to find user: %w", err)
	}

	if req.FullName != nil && strings.TrimSpace(*req.FullName) != "" {
		user.FullName = strings.TrimSpace(*req.FullName)
	}
	if req.Mobile != nil && strings.TrimSpace(*req.Mobile) != "" {
		user.Mobile = strings.TrimSpace(*req.Mobile)
	}
	if req.Email != nil {
		trimmed := strings.ToLower(strings.TrimSpace(*req.Email))
		if trimmed == "" {
			user.Email = nil
		} else {
			user.Email = &trimmed
		}
	}
	if req.Role != nil && strings.TrimSpace(*req.Role) != "" {
		role := strings.TrimSpace(*req.Role)
		if role == "teacher" {
			role = models.RoleInstructor
		}
		user.Role = role
	}
	if req.Status != nil && strings.TrimSpace(*req.Status) != "" {
		status := strings.TrimSpace(*req.Status)
		if status == "inactive" {
			status = models.UserStatusSuspended
		}
		user.Status = status
	}
	if req.Bio != nil {
		user.Bio = strings.TrimSpace(*req.Bio)
	}
	if req.IsVerified != nil {
		user.IsVerified = *req.IsVerified
	}
	if req.HasSupportAccess != nil {
		user.HasSupportAccess = *req.HasSupportAccess
	}
	if req.Password != nil && strings.TrimSpace(*req.Password) != "" {
		hashed, err := security.HashPassword(strings.TrimSpace(*req.Password))
		if err != nil {
			return nil, fmt.Errorf("failed to hash new password: %w", err)
		}
		user.PasswordHash = hashed
	}

	if err := s.db.WithContext(ctx).Save(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to save updated user: %w", err)
	}

	return &user, nil
}

// ListTransactions returns a paginated list of financial Order records with user, course, and discount associations plus aggregate revenue.
func (s *AdminService) ListTransactions(ctx context.Context, filter dto.AdminListFilter) (*PaginatedTransactionsResult, error) {
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 || limit > 500 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := s.db.WithContext(ctx).Model(&models.Order{})

	if status := strings.TrimSpace(filter.Status); status != "" {
		query = query.Where("status = ?", status)
	}
	if search := strings.TrimSpace(filter.Search); search != "" {
		likePattern := "%" + search + "%"
		query = query.Where("tracking_code ILIKE ? OR gateway_ref_id ILIKE ?", likePattern, likePattern)
	}

	var totalItems int64
	if err := query.Count(&totalItems).Error; err != nil {
		return nil, fmt.Errorf("failed to count transactions: %w", err)
	}

	paidStatuses := []string{OrderStatusCompleted, models.OrderStatusPaid}
	var totalRevenue int64
	sumQuery := s.db.WithContext(ctx).Model(&models.Order{}).Where("status IN ?", paidStatuses)
	if search := strings.TrimSpace(filter.Search); search != "" {
		likePattern := "%" + search + "%"
		sumQuery = sumQuery.Where("tracking_code ILIKE ? OR gateway_ref_id ILIKE ?", likePattern, likePattern)
	}
	if err := sumQuery.Select("COALESCE(SUM(final_amount), 0)").Scan(&totalRevenue).Error; err != nil {
		return nil, fmt.Errorf("failed to calculate total revenue: %w", err)
	}

	var orders []models.Order
	err := query.
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "full_name", "mobile", "email")
		}).
		Preload("Course", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "title", "slug", "course_type")
		}).
		Preload("Discount").
		Order("created_at DESC").
		Offset(offset).
		Limit(limit).
		Find(&orders).Error
	if err != nil {
		return nil, fmt.Errorf("failed to list transactions: %w", err)
	}

	totalPages := int((totalItems + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return &PaginatedTransactionsResult{
		Items:        orders,
		Page:         page,
		Limit:        limit,
		TotalItems:   totalItems,
		TotalPages:   totalPages,
		TotalAmount:  totalRevenue,
		TotalRevenue: totalRevenue,
	}, nil
}

// GetFinancialReport returns a comprehensive transaction report and total_revenue (in int64) for official printing/PDF export.
func (s *AdminService) GetFinancialReport(ctx context.Context, filter dto.AdminListFilter) (*PaginatedTransactionsResult, error) {
	if filter.Limit <= 0 || filter.Limit > 500 {
		filter.Limit = 200
	}
	return s.ListTransactions(ctx, filter)
}

// ListDiscounts returns all promotional discount codes ordered by newest first.
func (s *AdminService) ListDiscounts(ctx context.Context) ([]models.Discount, error) {
	var discounts []models.Discount
	if err := s.db.WithContext(ctx).Order("created_at DESC").Find(&discounts).Error; err != nil {
		return nil, fmt.Errorf("failed to list discounts: %w", err)
	}
	return discounts, nil
}

// CreateDiscount creates a new promotional Discount code.
func (s *AdminService) CreateDiscount(ctx context.Context, req dto.CreateDiscountRequest) (*models.Discount, error) {
	code := strings.ToUpper(strings.TrimSpace(req.Code))

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	var expiresAt *time.Time
	if strings.TrimSpace(req.ExpiresAt) != "" {
		if parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(req.ExpiresAt)); err == nil {
			expiresAt = &parsed
		} else if parsedDate, errDate := time.Parse("2006-01-02", strings.TrimSpace(req.ExpiresAt)); errDate == nil {
			expiresAt = &parsedDate
		}
	}

	discount := &models.Discount{
		Code:              code,
		Percent:           req.Percent,
		MaxDiscountAmount: req.MaxDiscountAmount,
		MaxUses:           req.MaxUses,
		ExpiresAt:         expiresAt,
		IsActive:          isActive,
	}

	if err := s.db.WithContext(ctx).Create(discount).Error; err != nil {
		return nil, fmt.Errorf("failed to create discount: %w", err)
	}

	return discount, nil
}

// UpdateTicketStatus updates the status of a support ticket.
func (s *AdminService) UpdateTicketStatus(ctx context.Context, ticketID uuid.UUID, status string) (*models.Ticket, error) {
	var ticket models.Ticket
	if err := s.db.WithContext(ctx).First(&ticket, "id = ?", ticketID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTicketNotFound
		}
		return nil, fmt.Errorf("failed to find ticket: %w", err)
	}

	ticket.Status = status
	if err := s.db.WithContext(ctx).Save(&ticket).Error; err != nil {
		return nil, fmt.Errorf("failed to update ticket status: %w", err)
	}

	return &ticket, nil
}
