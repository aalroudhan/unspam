package carrier

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/aalroudhan/unspam/internal/config"
)

// TwilioAdapter implements Lookup using the Twilio Lookup v2 API.
type TwilioAdapter struct {
	cfg    *config.Config
	client *http.Client
}

func NewTwilioAdapter(cfg *config.Config) *TwilioAdapter {
	return &TwilioAdapter{cfg: cfg, client: &http.Client{Timeout: 10 * time.Second}}
}

type twilioResponse struct {
	LineTypeIntelligence *struct {
		Type        string `json:"type"`
		CarrierName string `json:"carrier_name"`
	} `json:"line_type_intelligence"`
	ReassignedNumber *struct {
		WasReassigned      bool   `json:"was_reassigned"`
		LastReassignedDate string `json:"last_reassigned_date"`
	} `json:"reassigned_number"`
}

func (a *TwilioAdapter) Lookup(phoneNumber string) (Info, error) {
	endpoint := fmt.Sprintf("https://lookups.twilio.com/v2/PhoneNumbers/%s", url.PathEscape(phoneNumber))
	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return Info{}, err
	}
	q := req.URL.Query()
	q.Set("Fields", "line_type_intelligence,reassigned_number")
	req.URL.RawQuery = q.Encode()
	req.SetBasicAuth(a.cfg.Twilio.AccountSID, a.cfg.Twilio.AuthToken)

	resp, err := a.client.Do(req)
	if err != nil {
		return Info{}, err
	}
	defer resp.Body.Close()

	var data twilioResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return Info{}, err
	}

	lineType := "unknown"
	carrierName := "Unknown"
	if data.LineTypeIntelligence != nil {
		if data.LineTypeIntelligence.Type != "" {
			lineType = data.LineTypeIntelligence.Type
		}
		if data.LineTypeIntelligence.CarrierName != "" {
			carrierName = data.LineTypeIntelligence.CarrierName
		}
	}

	isNonFixedVoip := lineType == "nonFixedVoip"
	isVoip := isNonFixedVoip || lineType == "fixedVoip"

	// A number reassigned within the last 90 days is high-risk — robocallers
	// acquire freshly released numbers. This is the best spoofing signal
	// available via Lookup (true STIR/SHAKEN only exists during live calls).
	isSpoofed := false
	if data.ReassignedNumber != nil && data.ReassignedNumber.WasReassigned && data.ReassignedNumber.LastReassignedDate != "" {
		if t, err := time.Parse("2006-01-02", data.ReassignedNumber.LastReassignedDate); err == nil {
			if time.Since(t) < 90*24*time.Hour {
				isSpoofed = true
			}
		}
	}

	return Info{
		IsVoip:         isVoip,
		IsNonFixedVoip: isNonFixedVoip,
		IsSpoofed:      isSpoofed,
		CarrierType:    lineType,
		CarrierName:    carrierName,
	}, nil
}
