package webhook

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// RegisterRoutes wires the Twilio voice webhook as a plain REST route. Unlike
// the rest of the API (GraphQL-only), this stays REST because Twilio POSTs
// form-encoded call data and requires a TwiML/XML response in return — a
// format GraphQL can't represent.
func (s *Service) RegisterRoutes(router gin.IRouter) {
	router.POST("/webhook/call", s.handleTwilioCall)
}

func (s *Service) handleTwilioCall(c *gin.Context) {
	from := c.PostForm("From")

	result, err := s.HandleIncomingCall(from)
	if err != nil {
		log.Printf("webhook: handle incoming call: %v", err)
		c.Header("Content-Type", "text/xml")
		c.String(http.StatusOK, `<Response><Say>An error occurred. Goodbye.</Say></Response>`)
		return
	}

	c.Header("Content-Type", "text/xml")
	c.String(http.StatusOK, result.TwiML)
}
