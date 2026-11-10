package services

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"kadcoda-backend/internal/models"
	"kadcoda-backend/internal/models/dto"
)

var (
	ErrTicketNotFound = errors.New("support ticket not found")
	ErrTicketClosed   = errors.New("cannot reply to a closed support ticket")
	ErrTicketForbidden = errors.New("you do not have permission to access this ticket")
)

// PaginatedTicketsResult wraps paginated support tickets with pagination metadata.
type PaginatedTicketsResult struct {
	Items      []models.Ticket `json:"items"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalItems int64           `json:"total_items"`
	TotalPages int             `json:"total_pages"`
}

// SupportService encapsulates ticket creation, listing, message history, and reply workflows.
type SupportService struct {
	db *gorm.DB
}

// NewSupportService constructs a new SupportService instance.
func NewSupportService(db *gorm.DB) *SupportService {
	return &SupportService{db: db}
}

// CreateTicket opens a new support Ticket with an auto-generated tracking_code (e.g. TK-1042) and initial TicketMessage inside a DB transaction.
func (s *SupportService) CreateTicket(ctx context.Context, userID uuid.UUID, req dto.CreateTicketRequest) (*models.Ticket, error) {
	var createdTicket *models.Ticket

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		trackingCode, err := s.generateUniqueTicketCode(tx)
		if err != nil {
			return err
		}

		priority := strings.TrimSpace(req.Priority)
		if priority == "" {
			priority = "normal"
		}

		attachmentsJSON, err := marshalStringSliceJSON(req.Attachments)
		if err != nil {
			return err
		}

		now := time.Now().UTC()
		ticket := &models.Ticket{
			UserID:       userID,
			TrackingCode: trackingCode,
			Subject:      strings.TrimSpace(req.Subject),
			Department:   strings.TrimSpace(req.Department),
			Priority:     priority,
			Status:       models.TicketStatusOpen,
			LastReplyAt:  &now,
		}

		if err := tx.Create(ticket).Error; err != nil {
			return fmt.Errorf("failed to create ticket: %w", err)
		}

		initialMessage := models.TicketMessage{
			TicketID:    ticket.ID,
			SenderID:    userID,
			SenderType:  models.RoleStudent,
			Message:     strings.TrimSpace(req.Message),
			Attachments: attachmentsJSON,
		}

		if err := tx.Create(&initialMessage).Error; err != nil {
			return fmt.Errorf("failed to create initial ticket message: %w", err)
		}

		ticket.Messages = []models.TicketMessage{initialMessage}
		createdTicket = ticket
		return nil
	})

	if err != nil {
		return nil, err
	}

	return createdTicket, nil
}

// GetTickets returns paginated tickets. If userID is non-nil, scopes tickets to that student; if nil, returns all platform tickets for admin.
func (s *SupportService) GetTickets(ctx context.Context, userID *uuid.UUID, filter dto.TicketListFilter) (*PaginatedTicketsResult, error) {
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := s.db.WithContext(ctx).Model(&models.Ticket{})
	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	}
	if status := strings.TrimSpace(filter.Status); status != "" {
		query = query.Where("status = ?", status)
	}
	if department := strings.TrimSpace(filter.Department); department != "" {
		query = query.Where("department = ?", department)
	}

	var totalItems int64
	if err := query.Count(&totalItems).Error; err != nil {
		return nil, fmt.Errorf("failed to count tickets: %w", err)
	}

	var tickets []models.Ticket
	err := query.
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "full_name", "mobile", "avatar_url", "role")
		}).
		Order("COALESCE(last_reply_at, created_at) DESC").
		Offset(offset).
		Limit(limit).
		Find(&tickets).Error
	if err != nil {
		return nil, fmt.Errorf("failed to fetch tickets: %w", err)
	}

	totalPages := int((totalItems + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return &PaginatedTicketsResult{
		Items:      tickets,
		Page:       page,
		Limit:      limit,
		TotalItems: totalItems,
		TotalPages: totalPages,
	}, nil
}

// GetTicketMessages fetches a single Ticket and all of its ordered TicketMessages, enforcing ownership unless the caller is an admin.
func (s *SupportService) GetTicketMessages(ctx context.Context, ticketID, requesterID uuid.UUID, requesterRole string) (*models.Ticket, error) {
	var ticket models.Ticket
	err := s.db.WithContext(ctx).
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "full_name", "mobile", "avatar_url", "role")
		}).
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("ticket_messages.created_at ASC")
		}).
		Preload("Messages.Sender", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "full_name", "avatar_url", "role")
		}).
		First(&ticket, "id = ?", ticketID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTicketNotFound
		}
		return nil, fmt.Errorf("failed to load ticket messages: %w", err)
	}

	if strings.ToLower(requesterRole) != models.RoleAdmin && ticket.UserID != requesterID {
		return nil, ErrTicketForbidden
	}

	return &ticket, nil
}

// ReplyToTicket appends a new TicketMessage to an existing Ticket and updates the ticket's status and last_reply_at timestamp.
func (s *SupportService) ReplyToTicket(ctx context.Context, ticketID, senderID uuid.UUID, senderRole string, req dto.ReplyTicketRequest) (*models.TicketMessage, error) {
	var createdReply *models.TicketMessage

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var ticket models.Ticket
		if err := tx.First(&ticket, "id = ?", ticketID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTicketNotFound
			}
			return fmt.Errorf("failed to find ticket: %w", err)
		}

		isAdmin := strings.ToLower(senderRole) == models.RoleAdmin
		if !isAdmin && ticket.UserID != senderID {
			return ErrTicketForbidden
		}

		if ticket.Status == models.TicketStatusClosed {
			return ErrTicketClosed
		}

		attachmentsJSON, err := marshalStringSliceJSON(req.Attachments)
		if err != nil {
			return err
		}

		senderType := models.RoleStudent
		nextStatus := models.TicketStatusPending
		if isAdmin {
			senderType = models.RoleAdmin
			nextStatus = models.TicketStatusAnswered
		}

		reply := &models.TicketMessage{
			TicketID:    ticket.ID,
			SenderID:    senderID,
			SenderType:  senderType,
			Message:     strings.TrimSpace(req.Message),
			Attachments: attachmentsJSON,
		}

		if err := tx.Create(reply).Error; err != nil {
			return fmt.Errorf("failed to save ticket reply: %w", err)
		}

		now := time.Now().UTC()
		if err := tx.Model(&ticket).Updates(map[string]any{
			"status":        nextStatus,
			"last_reply_at": now,
		}).Error; err != nil {
			return fmt.Errorf("failed to update ticket status: %w", err)
		}

		createdReply = reply
		return nil
	})

	if err != nil {
		return nil, err
	}

	return createdReply, nil
}

func (s *SupportService) generateUniqueTicketCode(tx *gorm.DB) (string, error) {
	for attempt := 0; attempt < 5; attempt++ {
		n, err := rand.Int(rand.Reader, big.NewInt(90000))
		if err != nil {
			return "", fmt.Errorf("failed to generate ticket code: %w", err)
		}
		code := fmt.Sprintf("TK-%d", n.Int64()+1000)

		var count int64
		if err := tx.Model(&models.Ticket{}).Where("tracking_code = ?", code).Count(&count).Error; err == nil && count == 0 {
			return code, nil
		}
	}
	return fmt.Sprintf("TK-%d", time.Now().UTC().Unix()%100000), nil
}
