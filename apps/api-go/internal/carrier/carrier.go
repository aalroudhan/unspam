package carrier

import "github.com/aalroudhan/unspam/internal/config"

// Info is the normalized carrier lookup result.
type Info struct {
	IsVoip         bool   `json:"isVoip"`
	IsNonFixedVoip bool   `json:"isNonFixedVoip"`
	IsSpoofed      bool   `json:"isSpoofed"`
	CarrierType    string `json:"carrierType"`
	CarrierName    string `json:"carrierName"`
}

// Lookup is the Adapter interface — every carrier provider implements this.
type Lookup interface {
	Lookup(phoneNumber string) (Info, error)
}

// New is the Factory Method: returns the Twilio adapter when interception mode
// is "twilio", otherwise the null adapter.
func New(cfg *config.Config) Lookup {
	if cfg.InterceptionMode == "twilio" {
		return NewTwilioAdapter(cfg)
	}
	return NewNullAdapter()
}
