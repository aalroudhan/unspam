package carrier

// NullAdapter is used in native mode when no carrier lookup API is configured.
type NullAdapter struct{}

func NewNullAdapter() *NullAdapter {
	return &NullAdapter{}
}

func (a *NullAdapter) Lookup(_ string) (Info, error) {
	return Info{
		IsVoip:         false,
		IsNonFixedVoip: false,
		IsSpoofed:      false,
		CarrierType:    "unknown",
		CarrierName:    "Unknown",
	}, nil
}
