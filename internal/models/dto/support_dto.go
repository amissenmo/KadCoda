package dto

// TicketListFilter represents query parameters for listing tickets.
type TicketListFilter struct {
	Status     string `form:"status" binding:"omitempty,oneof=open pending answered closed"`
	Department string `form:"department"`
	Page       int    `form:"page,default=1" binding:"omitempty,min=1"`
	Limit      int    `form:"limit,default=10" binding:"omitempty,min=1,max=100"`
}

// CreateTicketRequest defines the payload for POST /api/v1/support/tickets.
type CreateTicketRequest struct {
	Subject     string   `json:"subject" binding:"required,min=3,max=255"`
	Department  string   `json:"department" binding:"required,min=2,max=100"`
	Priority    string   `json:"priority" binding:"omitempty,oneof=low normal high urgent"`
	Message     string   `json:"message" binding:"required,min=5"`
	Attachments []string `json:"attachments"`
}

// ReplyTicketRequest defines the payload for POST /api/v1/support/tickets/:id/reply.
type ReplyTicketRequest struct {
	Message     string   `json:"message" binding:"required,min=1"`
	Attachments []string `json:"attachments"`
}
