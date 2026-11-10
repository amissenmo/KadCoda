package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// TicketStatus constants for support workflow management.
const (
	TicketStatusOpen     = "open"
	TicketStatusPending  = "pending"
	TicketStatusAnswered = "answered"
	TicketStatusClosed   = "closed"
)

// Ticket represents a support inquiry thread created by a User.
type Ticket struct {
	ID           uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	UserID       uuid.UUID  `gorm:"column:user_id;type:uuid;not null;index:idx_tickets_user_id" json:"user_id"`
	TrackingCode string     `gorm:"column:tracking_code;type:varchar(100);uniqueIndex:idx_tickets_tracking_code;not null" json:"tracking_code"`
	Subject      string     `gorm:"column:subject;type:varchar(255);not null" json:"subject"`
	Department   string     `gorm:"column:department;type:varchar(100);not null;index:idx_tickets_department" json:"department"`
	Priority     string     `gorm:"column:priority;type:varchar(30);default:'normal';not null" json:"priority"`
	Status       string     `gorm:"column:status;type:varchar(30);default:'open';not null;index:idx_tickets_status" json:"status"`
	LastReplyAt  *time.Time `gorm:"column:last_reply_at;type:timestamptz" json:"last_reply_at,omitempty"`
	CreatedAt    time.Time  `gorm:"column:created_at;type:timestamptz;autoCreateTime;not null" json:"created_at"`

	// Associations
	User     *User           `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	Messages []TicketMessage `gorm:"foreignKey:TicketID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"messages,omitempty"`
}

// TableName overrides the table name used by Ticket to `tickets`.
func (Ticket) TableName() string {
	return "tickets"
}

// TicketMessage represents an individual message or reply within a support Ticket.
type TicketMessage struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	TicketID    uuid.UUID      `gorm:"column:ticket_id;type:uuid;not null;index:idx_ticket_messages_ticket_id" json:"ticket_id"`
	SenderID    uuid.UUID      `gorm:"column:sender_id;type:uuid;not null;index:idx_ticket_messages_sender_id" json:"sender_id"`
	SenderType  string         `gorm:"column:sender_type;type:varchar(30);not null" json:"sender_type"`
	Message     string         `gorm:"column:message;type:text;not null" json:"message"`
	Attachments datatypes.JSON `gorm:"column:attachments;type:jsonb;default:'[]'" json:"attachments"`
	CreatedAt   time.Time      `gorm:"column:created_at;type:timestamptz;autoCreateTime;not null" json:"created_at"`

	// Associations
	Ticket *Ticket `gorm:"foreignKey:TicketID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"ticket,omitempty"`
	Sender *User   `gorm:"foreignKey:SenderID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"sender,omitempty"`
}

// TableName overrides the table name used by TicketMessage to `ticket_messages`.
func (TicketMessage) TableName() string {
	return "ticket_messages"
}
