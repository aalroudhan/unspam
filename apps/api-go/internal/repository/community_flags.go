package repository

import (
	"github.com/aalroudhan/unspam/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// CommunityFlagsRepository isolates all CommunityFlag DB access.
type CommunityFlagsRepository struct {
	db *gorm.DB
}

func NewCommunityFlagsRepository(db *gorm.DB) *CommunityFlagsRepository {
	return &CommunityFlagsRepository{db: db}
}

func (r *CommunityFlagsRepository) GetCount(callerNumber string) (int, error) {
	var flag models.CommunityFlag
	err := r.db.Where(`"callerNumber" = ?`, callerNumber).First(&flag).Error
	if err == gorm.ErrRecordNotFound {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	return flag.FlagCount, nil
}

// Increment upserts the flag count atomically.
func (r *CommunityFlagsRepository) Increment(callerNumber string) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "callerNumber"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"flagCount": gorm.Expr(`community_flags."flagCount" + 1`),
			"updatedAt": gorm.Expr("NOW()"),
		}),
	}).Create(&models.CommunityFlag{CallerNumber: callerNumber, FlagCount: 1}).Error
}

// Seed inserts a flag row only if it doesn't already exist.
func (r *CommunityFlagsRepository) Seed(callerNumber string, flagCount int) error {
	var existing models.CommunityFlag
	err := r.db.Where(`"callerNumber" = ?`, callerNumber).First(&existing).Error
	if err == nil {
		return nil // already exists
	}
	if err != gorm.ErrRecordNotFound {
		return err
	}
	return r.db.Create(&models.CommunityFlag{CallerNumber: callerNumber, FlagCount: flagCount}).Error
}
