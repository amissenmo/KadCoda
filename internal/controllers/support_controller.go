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

// SupportController handles student and admin support ticket endpoints.
type SupportController struct {
	supportService *services.SupportService
}

// NewSupportController constructs a new SupportController instance.
func NewSupportController(supportService *services.SupportService) *SupportController {
	return &SupportController{
		supportService: supportService,
	}
}

// CreateTicket handles POST /api/v1/support/tickets
func (ctrl *SupportController) CreateTicket(c *gin.Context) {
	userID, ok := extractAuthenticatedUserUUID(c)
	if !ok {
		return
	}

	var req dto.CreateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Ticket Payload",
			"Valid 'subject', 'department', and 'message' fields are required.",
		)
		return
	}

	ticket, err := ctrl.supportService.CreateTicket(c.Request.Context(), userID, req)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Ticket Creation Failed",
			"An unexpected error occurred while creating your support ticket.",
		)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "تیکت پشتیبانی با موفقیت ثبت شد",
		"ticket":  ticket,
	})
}

// GetUserTickets handles GET /api/v1/support/tickets
func (ctrl *SupportController) GetUserTickets(c *gin.Context) {
	userID, ok := extractAuthenticatedUserUUID(c)
	if !ok {
		return
	}

	var filter dto.TicketListFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-query-params",
			"Invalid Query Parameters",
			"Invalid filter parameters provided for support tickets.",
		)
		return
	}

	result, err := ctrl.supportService.GetTickets(c.Request.Context(), &userID, filter)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Fetch Tickets",
			"An error occurred while loading your support tickets.",
		)
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetAdminTickets handles GET /api/v1/admin/support/tickets
func (ctrl *SupportController) GetAdminTickets(c *gin.Context) {
	var filter dto.TicketListFilter
	if err := c.ShouldBindQuery(&filter); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-query-params",
			"Invalid Query Parameters",
			"Invalid filter parameters provided for admin support tickets.",
		)
		return
	}

	result, err := ctrl.supportService.GetTickets(c.Request.Context(), nil, filter)
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusInternalServerError,
			"https://kadcoda.ir/probs/internal-server-error",
			"Failed to Fetch Platform Tickets",
			"An error occurred while loading support tickets.",
		)
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetTicketMessages handles GET /api/v1/support/tickets/:id
func (ctrl *SupportController) GetTicketMessages(c *gin.Context) {
	userID, ok := extractAuthenticatedUserUUID(c)
	if !ok {
		return
	}

	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-uuid",
			"Invalid Ticket ID",
			"The ticket ID parameter must be a valid UUID.",
		)
		return
	}

	role, _ := c.Get(middleware.ContextUserRoleKey)
	roleStr, _ := role.(string)

	ticket, err := ctrl.supportService.GetTicketMessages(c.Request.Context(), ticketID, userID, roleStr)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrTicketNotFound):
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/ticket-not-found",
				"Ticket Not Found",
				"No support ticket matching the requested ID was found.",
			)
		case errors.Is(err, services.ErrTicketForbidden):
			httputil.AbortWithProblem(
				c,
				http.StatusForbidden,
				"https://kadcoda.ir/probs/forbidden",
				"Forbidden",
				"You do not have permission to view this support ticket.",
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/internal-server-error",
				"Failed to Load Ticket Messages",
				"An unexpected error occurred while retrieving ticket messages.",
			)
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ticket": ticket,
	})
}

// ReplyToTicket handles POST /api/v1/support/tickets/:id/reply
func (ctrl *SupportController) ReplyToTicket(c *gin.Context) {
	userID, ok := extractAuthenticatedUserUUID(c)
	if !ok {
		return
	}

	ticketID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-uuid",
			"Invalid Ticket ID",
			"The ticket ID parameter must be a valid UUID.",
		)
		return
	}

	var req dto.ReplyTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		httputil.AbortWithProblem(
			c,
			http.StatusBadRequest,
			"https://kadcoda.ir/probs/invalid-request",
			"Invalid Reply Payload",
			"A non-empty 'message' field is required to reply to a ticket.",
		)
		return
	}

	role, _ := c.Get(middleware.ContextUserRoleKey)
	roleStr, _ := role.(string)

	reply, err := ctrl.supportService.ReplyToTicket(c.Request.Context(), ticketID, userID, roleStr, req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrTicketNotFound):
			httputil.AbortWithProblem(
				c,
				http.StatusNotFound,
				"https://kadcoda.ir/probs/ticket-not-found",
				"Ticket Not Found",
				"No support ticket matching the requested ID was found.",
			)
		case errors.Is(err, services.ErrTicketForbidden):
			httputil.AbortWithProblem(
				c,
				http.StatusForbidden,
				"https://kadcoda.ir/probs/forbidden",
				"Forbidden",
				"You do not have permission to reply to this support ticket.",
			)
		case errors.Is(err, services.ErrTicketClosed):
			httputil.AbortWithProblem(
				c,
				http.StatusConflict,
				"https://kadcoda.ir/probs/ticket-closed",
				"Ticket Closed",
				"این تیکت بسته شده است و امکان ارسال پاسخ جدید وجود ندارد.",
			)
		default:
			httputil.AbortWithProblem(
				c,
				http.StatusInternalServerError,
				"https://kadcoda.ir/probs/internal-server-error",
				"Reply Submission Failed",
				"An unexpected error occurred while submitting your reply.",
			)
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "پاسخ شما با موفقیت ثبت شد",
		"reply":   reply,
	})
}
