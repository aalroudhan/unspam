package models

import "time"

// CallOutcome mirrors the TypeScript enum.
type CallOutcome string

const (
	OutcomeBlocked   CallOutcome = "blocked"
	OutcomeVoicemail CallOutcome = "voicemail"
	OutcomeAllowed   CallOutcome = "allowed"
)

// InterceptionMode mirrors the TypeScript enum.
type InterceptionMode string

const (
	ModeTwilio InterceptionMode = "twilio"
	ModeNative InterceptionMode = "native"
)

// CallLog is one record per processed call.
type CallLog struct {
	ID          string      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CallerNumber string     `gorm:"column:callerNumber" json:"callerNumber"`
	SpamScore   float64     `gorm:"column:spamScore" json:"spamScore"`
	Outcome     CallOutcome `gorm:"type:varchar" json:"outcome"`
	Mode        InterceptionMode `gorm:"type:varchar" json:"mode"`
	CarrierType string      `gorm:"column:carrierType" json:"carrierType"`
	CarrierName string      `gorm:"column:carrierName" json:"carrierName"`
	IsVoip      bool        `gorm:"column:isVoip" json:"isVoip"`
	IsSpoofed   bool        `gorm:"column:isSpoofed" json:"isSpoofed"`
	CreatedAt   time.Time   `gorm:"column:createdAt;autoCreateTime" json:"createdAt"`
}

func (CallLog) TableName() string { return "call_logs" }

// CommunityFlag tracks how many times a number has been flagged.
type CommunityFlag struct {
	CallerNumber string    `gorm:"column:callerNumber;primaryKey" json:"callerNumber"`
	FlagCount    int       `gorm:"column:flagCount;default:0" json:"flagCount"`
	UpdatedAt    time.Time `gorm:"column:updatedAt;autoUpdateTime" json:"updatedAt"`
}

func (CommunityFlag) TableName() string { return "community_flags" }

// User is an authenticated account.
type User struct {
	ID           string    `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex" json:"email"`
	PasswordHash string    `gorm:"column:passwordHash" json:"-"`
	CreatedAt    time.Time `gorm:"column:createdAt;autoCreateTime" json:"createdAt"`
}

func (User) TableName() string { return "users" }
