package httputil

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ProblemContentType is the standard MIME type for RFC 7807 Problem Details.
const ProblemContentType = "application/problem+json; charset=utf-8"

// ProblemDetails represents an RFC 7807 Problem Details for HTTP APIs response payload.
type ProblemDetails struct {
	Type     string            `json:"type"`
	Title    string            `json:"title"`
	Status   int               `json:"status"`
	Detail   string            `json:"detail,omitempty"`
	Instance string            `json:"instance,omitempty"`
	Errors   map[string]string `json:"errors,omitempty"`
}

// NewProblemDetails constructs a standardized RFC 7807 ProblemDetails struct.
func NewProblemDetails(status int, problemType, title, detail, instance string) ProblemDetails {
	if problemType == "" {
		problemType = "about:blank"
	}
	if title == "" {
		title = http.StatusText(status)
	}
	return ProblemDetails{
		Type:     problemType,
		Title:    title,
		Status:   status,
		Detail:   detail,
		Instance: instance,
	}
}

// AbortWithProblem writes an RFC 7807 ProblemDetails JSON response with application/problem+json content type and aborts the Gin context.
func AbortWithProblem(c *gin.Context, status int, problemType, title, detail string) {
	instance := ""
	if c.Request != nil && c.Request.URL != nil {
		instance = c.Request.URL.RequestURI()
	}

	problem := NewProblemDetails(status, problemType, title, detail, instance)
	c.Header("Content-Type", ProblemContentType)
	c.AbortWithStatusJSON(status, problem)
}

// AbortWithValidationProblem writes an RFC 7807 ProblemDetails response including field-level validation errors.
func AbortWithValidationProblem(c *gin.Context, detail string, fieldErrors map[string]string) {
	instance := ""
	if c.Request != nil && c.Request.URL != nil {
		instance = c.Request.URL.RequestURI()
	}

	problem := NewProblemDetails(
		http.StatusUnprocessableEntity,
		"https://kadcoda.ir/probs/validation-error",
		"Validation Failed",
		detail,
		instance,
	)
	problem.Errors = fieldErrors

	c.Header("Content-Type", ProblemContentType)
	c.AbortWithStatusJSON(http.StatusUnprocessableEntity, problem)
}
