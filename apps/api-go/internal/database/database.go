package database

import (
	"fmt"

	"github.com/aalroudhan/unspam/internal/config"
	"github.com/aalroudhan/unspam/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Connect opens the Postgres connection and auto-migrates the schema.
func Connect(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Database.Host, cfg.Database.Port, cfg.Database.User,
		cfg.Database.Password, cfg.Database.Name,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("connect: %w", err)
	}

	// pgcrypto provides gen_random_uuid()
	db.Exec(`CREATE EXTENSION IF NOT EXISTS pgcrypto`)

	if err := db.AutoMigrate(&models.CallLog{}, &models.CommunityFlag{}, &models.User{}); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}

	return db, nil
}
