package webhook

import (
	"github.com/aalroudhan/unspam/internal/carrier"
	"github.com/aalroudhan/unspam/internal/config"
	"github.com/aalroudhan/unspam/internal/interception"
	"github.com/aalroudhan/unspam/internal/models"
	"github.com/aalroudhan/unspam/internal/repository"
	"github.com/aalroudhan/unspam/internal/scorer"
)

// Service is the Facade: the single entry point that hides carrier lookup,
// scoring, interception, and logging behind one method.
type Service struct {
	calls       *repository.CallsRepository
	flags       *repository.CommunityFlagsRepository
	carrier     carrier.Lookup
	interceptor interception.Interceptor
	scorer      *scorer.Client
	cfg         *config.Config
}

func NewService(
	calls *repository.CallsRepository,
	flags *repository.CommunityFlagsRepository,
	carrierLookup carrier.Lookup,
	interceptor interception.Interceptor,
	scorerClient *scorer.Client,
	cfg *config.Config,
) *Service {
	return &Service{
		calls:       calls,
		flags:       flags,
		carrier:     carrierLookup,
		interceptor: interceptor,
		scorer:      scorerClient,
		cfg:         cfg,
	}
}

// Result is the full response for an incoming call check.
type Result struct {
	Outcome        string       `json:"outcome"`
	Score          float64      `json:"score"`
	Reasons        []string     `json:"reasons"`
	Carrier        carrier.Info `json:"carrier"`
	CommunityFlags int          `json:"communityFlags"`
	TwiML          string       `json:"twiml,omitempty"`
}

func (s *Service) HandleIncomingCall(callerNumber string) (*Result, error) {
	carrierInfo, err := s.carrier.Lookup(callerNumber)
	if err != nil {
		return nil, err
	}

	flagCount, err := s.flags.GetCount(callerNumber)
	if err != nil {
		return nil, err
	}

	scoreResp, err := s.scorer.Score(scorer.Request{
		CallerNumber:   callerNumber,
		IsVoip:         carrierInfo.IsVoip,
		IsNonFixedVoip: carrierInfo.IsNonFixedVoip,
		IsSpoofed:      carrierInfo.IsSpoofed,
		CarrierType:    carrierInfo.CarrierType,
		CommunityFlags: flagCount,
	})
	if err != nil {
		return nil, err
	}

	decision := s.interceptor.Intercept(callerNumber, scoreResp.Score)

	mode := models.ModeNative
	if s.cfg.InterceptionMode == "twilio" {
		mode = models.ModeTwilio
	}

	log := &models.CallLog{
		CallerNumber: callerNumber,
		SpamScore:    scoreResp.Score,
		Outcome:      decision.Outcome,
		Mode:         mode,
		CarrierType:  carrierInfo.CarrierType,
		CarrierName:  carrierInfo.CarrierName,
		IsVoip:       carrierInfo.IsVoip,
		IsSpoofed:    carrierInfo.IsSpoofed,
	}
	if err := s.calls.Save(log); err != nil {
		return nil, err
	}

	reasons := scoreResp.Reasons
	if reasons == nil {
		reasons = []string{}
	}

	return &Result{
		Outcome:        string(decision.Outcome),
		Score:          scoreResp.Score,
		Reasons:        reasons,
		Carrier:        carrierInfo,
		CommunityFlags: flagCount,
		TwiML:          decision.TwiML,
	}, nil
}
