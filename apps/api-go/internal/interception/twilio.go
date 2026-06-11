package interception

import (
	"fmt"

	"github.com/aalroudhan/unspam/internal/config"
	"github.com/aalroudhan/unspam/internal/models"
)

// TwilioInterceptor returns TwiML to route the live call — voicemail for spam,
// forward to the user otherwise.
type TwilioInterceptor struct {
	cfg *config.Config
}

func NewTwilioInterceptor(cfg *config.Config) *TwilioInterceptor {
	return &TwilioInterceptor{cfg: cfg}
}

func (i *TwilioInterceptor) Intercept(_ string, spamScore float64) Result {
	if spamScore >= SpamThreshold {
		return Result{
			Outcome: models.OutcomeVoicemail,
			TwiML:   `<Response><Say>This call has been flagged as potential spam.</Say><Record/></Response>`,
		}
	}
	return Result{
		Outcome: models.OutcomeAllowed,
		TwiML:   fmt.Sprintf(`<Response><Dial>%s</Dial></Response>`, i.cfg.Twilio.ForwardTo),
	}
}
