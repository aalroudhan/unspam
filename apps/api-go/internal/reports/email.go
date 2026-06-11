package reports

import (
	"fmt"
	"log"
	"net/smtp"

	"github.com/aalroudhan/unspam/internal/config"
)

// EmailSender sends complaint emails via Gmail SMTP.
type EmailSender struct {
	user string
	pass string
}

func NewEmailSender(cfg *config.Config) *EmailSender {
	return &EmailSender{user: cfg.Email.User, pass: cfg.Email.Pass}
}

// Send delivers a plaintext email. In test mode it redirects to the sender.
func (e *EmailSender) Send(to, subject, body string, testMode bool) error {
	recipient := to
	if testMode {
		recipient = e.user
		log.Printf("Test mode — redirecting to %s (intended: %s)", e.user, to)
	}

	msg := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n\r\n%s",
		e.user, recipient, subject, body)

	auth := smtp.PlainAuth("", e.user, e.pass, "smtp.gmail.com")
	if err := smtp.SendMail("smtp.gmail.com:587", auth, e.user, []string{recipient}, []byte(msg)); err != nil {
		return err
	}
	log.Printf("Sent complaint to %s", recipient)
	return nil
}
