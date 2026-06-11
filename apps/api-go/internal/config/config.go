package config

import (
	"os"
	"strconv"
)

// Config holds all runtime configuration, loaded from environment.
type Config struct {
	Port            string
	Database        DatabaseConfig
	InterceptionMode string
	Twilio          TwilioConfig
	ScorerURL       string
	Email           EmailConfig
	JWTSecret       string
}

type DatabaseConfig struct {
	Host     string
	Port     int
	Name     string
	User     string
	Password string
}

type TwilioConfig struct {
	AccountSID  string
	AuthToken   string
	PhoneNumber string
	ForwardTo   string
}

type EmailConfig struct {
	User string
	Pass string
}

// Load reads configuration from environment variables, applying defaults.
func Load() *Config {
	return &Config{
		Port: getEnv("PORT", "3000"),
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnvInt("DB_PORT", 5432),
			Name:     getEnv("DB_NAME", "unspam"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
		},
		InterceptionMode: getEnv("INTERCEPTION_MODE", "native"),
		Twilio: TwilioConfig{
			AccountSID:  os.Getenv("TWILIO_ACCOUNT_SID"),
			AuthToken:   os.Getenv("TWILIO_AUTH_TOKEN"),
			PhoneNumber: os.Getenv("TWILIO_PHONE_NUMBER"),
			ForwardTo:   os.Getenv("FORWARD_TO_NUMBER"),
		},
		ScorerURL: getEnv("SCORER_URL", "http://scorer:8000"),
		Email: EmailConfig{
			User: os.Getenv("EMAIL_USER"),
			Pass: os.Getenv("EMAIL_PASS"),
		},
		JWTSecret: getEnv("JWT_SECRET", "changeme"),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}
