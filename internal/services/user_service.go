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
	"kadcoda-backend/pkg/security"
)

var (
	ErrUserNotFound          = errors.New("user not found")
	ErrEmailAlreadyInUse     = errors.New("email address is already in use by another account")
	ErrInvalidCurrentPass    = errors.New("current password is incorrect")
)

// UserService encapsulates student dashboard aggregations and user profile operations.
type UserService struct {
	db *gorm.DB
}

// NewUserService constructs a new UserService instance.
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

// GetStudentDashboardStats computes enrolled courses, completed courses, certificates, and active tickets counts for a student.
func (s *UserService) GetStudentDashboardStats(ctx context.Context, userID uuid.UUID) (*dto.StudentDashboardStats, error) {
	stats := &dto.StudentDashboardStats{}

	if err := s.db.WithContext(ctx).
		Model(&models.Enrollment{}).
		Where("user_id = ?", userID).
		Count(&stats.EnrolledCoursesCount).Error; err != nil {
		return nil, fmt.Errorf("failed to count enrolled courses: %w", err)
	}

	if err := s.db.WithContext(ctx).
		Model(&models.Enrollment{}).
		Where("user_id = ? AND is_completed = ?", userID, true).
		Count(&stats.CompletedCoursesCount).Error; err != nil {
		return nil, fmt.Errorf("failed to count completed courses: %w", err)
	}

	stats.InProgressCoursesCount = stats.EnrolledCoursesCount - stats.CompletedCoursesCount
	if stats.InProgressCoursesCount < 0 {
		stats.InProgressCoursesCount = 0
	}

	if err := s.db.WithContext(ctx).
		Model(&models.Certificate{}).
		Where("user_id = ?", userID).
		Count(&stats.CertificatesCount).Error; err != nil {
		return nil, fmt.Errorf("failed to count user certificates: %w", err)
	}

	if err := s.db.WithContext(ctx).
		Model(&models.Ticket{}).
		Where("user_id = ? AND status IN ?", userID, []string{
			models.TicketStatusOpen,
			models.TicketStatusPending,
			models.TicketStatusAnswered,
		}).
		Count(&stats.ActiveTicketsCount).Error; err != nil {
		return nil, fmt.Errorf("failed to count active support tickets: %w", err)
	}

	var totalHours int64
	_ = s.db.WithContext(ctx).
		Table("enrollments").
		Select("COALESCE(SUM(courses.total_hours), 0)").
		Joins("JOIN courses ON courses.id = enrollments.course_id").
		Where("enrollments.user_id = ?", userID).
		Scan(&totalHours).Error
	stats.TotalLearningHours = totalHours

	return stats, nil
}

// GetProfile retrieves the authenticated user's profile record.
func (s *UserService) GetProfile(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to load user profile: %w", err)
	}
	return &user, nil
}

// UpdateProfile updates mutable profile fields (full_name, email, bio, avatar_url) for the authenticated user.
func (s *UserService) UpdateProfile(ctx context.Context, userID uuid.UUID, req dto.UpdateProfileRequest) (*models.User, error) {
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to load user for profile update: %w", err)
	}

	if req.Email != nil {
		trimmedEmail := strings.ToLower(strings.TrimSpace(*req.Email))
		if trimmedEmail == "" {
			user.Email = nil
		} else {
			var emailCount int64
			if err := s.db.WithContext(ctx).
				Model(&models.User{}).
				Where("LOWER(email) = ? AND id <> ?", trimmedEmail, user.ID).
				Count(&emailCount).Error; err != nil {
				return nil, fmt.Errorf("failed to check email uniqueness: %w", err)
			}
			if emailCount > 0 {
				return nil, ErrEmailAlreadyInUse
			}
			user.Email = &trimmedEmail
		}
	}

	if req.FullName != nil {
		if name := strings.TrimSpace(*req.FullName); name != "" {
			user.FullName = name
		}
	}
	if req.Bio != nil {
		user.Bio = strings.TrimSpace(*req.Bio)
	}
	if req.AvatarURL != nil {
		user.AvatarURL = strings.TrimSpace(*req.AvatarURL)
	}

	if err := s.db.WithContext(ctx).Save(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to save updated profile: %w", err)
	}

	return &user, nil
}

// ChangePassword verifies the current password and updates the user's password hash.
func (s *UserService) ChangePassword(ctx context.Context, userID uuid.UUID, req dto.ChangePasswordRequest) error {
	var user models.User
	if err := s.db.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return fmt.Errorf("failed to load user for password change: %w", err)
	}

	if !security.CheckPasswordHash(req.CurrentPassword, user.PasswordHash) {
		return ErrInvalidCurrentPass
	}

	newHash, err := security.HashPassword(req.NewPassword)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	if err := s.db.WithContext(ctx).Model(&user).Update("password_hash", newHash).Error; err != nil {
		return fmt.Errorf("failed to update password hash: %w", err)
	}

	return nil
}
