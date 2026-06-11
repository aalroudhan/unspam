package interception

import (
	"github.com/aalroudhan/unspam/internal/config"
	"github.com/aalroudhan/unspam/internal/models"
)

// SpamThreshold — calls scoring at or above this are intercepted.
const SpamThreshold = 0.6

// Result is the outcome of an interception decision.
type Result struct {
	Outcome models.CallOutcome
	TwiML   string
}

// Interceptor is the Strategy interface — swappable interception behaviour.
type Interceptor interface {
	Intercept(callerNumber string, spamScore float64) Result
}

// New is the Factory Method: Twilio strategy for full call interception,
// Native strategy for community-flags-only mode.
func New(cfg *config.Config) Interceptor {
	if cfg.InterceptionMode == "twilio" {
		return NewTwilioInterceptor(cfg)
	}
	return NewNativeInterceptor()
}
