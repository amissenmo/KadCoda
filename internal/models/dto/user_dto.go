package dto

// UpdateProfileRequest defines the payload for PUT /api/v1/user/profile.
type UpdateProfileRequest struct {
	FullName  *string `json:"full_name" binding:"omitempty,min=2,max=150"`
	Email     *string `json:"email" binding:"omitempty,email,max=255"`
	Bio       *string `json:"bio" binding:"omitempty,max=1000"`
	AvatarURL *string `json:"avatar_url" binding:"omitempty,url,max=500"`
}

// ChangePasswordRequest defines the payload for PUT /api/v1/user/password.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required,min=6"`
	NewPassword     string `json:"new_password" binding:"required,min=8"`
}

// StudentDashboardStats represents aggregated metrics for GET /api/v1/user/dashboard.
type StudentDashboardStats struct {
	EnrolledCoursesCount   int64 `json:"enrolled_courses_count"`
	CompletedCoursesCount  int64 `json:"completed_courses_count"`
	InProgressCoursesCount int64 `json:"in_progress_courses_count"`
	CertificatesCount      int64 `json:"certificates_count"`
	ActiveTicketsCount     int64 `json:"active_tickets_count"`
	TotalLearningHours     int64 `json:"total_learning_hours"`
}

// AdminListFilter represents pagination and search filters for admin user and transaction lists.
type AdminListFilter struct {
	Search string `form:"search"`
	Status string `form:"status"`
	Role   string `form:"role"`
	Page   int    `form:"page,default=1" binding:"omitempty,min=1"`
	Limit  int    `form:"limit,default=20" binding:"omitempty,min=1,max=100"`
}

// MonthlyRevenueStat represents a single month's revenue and order aggregation for the Admin Dashboard.
type MonthlyRevenueStat struct {
	Month       string `json:"month"`
	TotalAmount int64  `json:"total_amount"`
	OrdersCount int64  `json:"orders_count"`
}

// PlatformMetricsResponse represents aggregated platform KPIs for GET /api/v1/admin/dashboard.
type PlatformMetricsResponse struct {
	TotalUsers        int64                `json:"total_users"`
	TotalCourses      int64                `json:"total_courses"`
	TotalEnrollments  int64                `json:"total_enrollments"`
	TotalArticles     int64                `json:"total_articles"`
	OpenTicketsCount  int64                `json:"open_tickets_count"`
	TotalRevenue      int64                `json:"total_revenue"`
	MonthlyStats      []MonthlyRevenueStat `json:"monthly_stats"`
}

// AdminUpdateUserRequest defines the payload for PUT /api/v1/admin/users/:id.
type AdminUpdateUserRequest struct {
	FullName         *string `json:"full_name"`
	Email            *string `json:"email"`
	Mobile           *string `json:"mobile"`
	Role             *string `json:"role"`
	Status           *string `json:"status"`
	Bio              *string `json:"bio"`
	Password         *string `json:"password"`
	IsVerified       *bool   `json:"is_verified"`
	HasSupportAccess *bool   `json:"has_support_access"`
}

// CreateDiscountRequest defines the payload for POST /api/v1/admin/discounts.
type CreateDiscountRequest struct {
	Code              string `json:"code" binding:"required,min=2,max=64"`
	Percent           int    `json:"percent" binding:"required,min=1,max=100"`
	MaxDiscountAmount int64  `json:"max_discount_amount" binding:"min=0"`
	MaxUses           int    `json:"max_uses" binding:"min=0"`
	ExpiresAt         string `json:"expires_at"`
	IsActive          *bool  `json:"is_active"`
}

// UpdateTicketStatusRequest defines the payload for PUT /api/v1/admin/support/tickets/:id/status.
type UpdateTicketStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=open pending answered closed"`
}
