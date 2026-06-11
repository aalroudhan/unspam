package interception

import "github.com/aalroudhan/unspam/internal/models"

// NativeInterceptor blocks or allows based on score — no telephony provider.
type NativeInterceptor struct{}

func NewNativeInterceptor() *NativeInterceptor {
	return &NativeInterceptor{}
}

func (i *NativeInterceptor) Intercept(_ string, spamScore float64) Result {
	if spamScore >= SpamThreshold {
		return Result{Outcome: models.OutcomeBlocked}
	}
	return Result{Outcome: models.OutcomeAllowed}
}
