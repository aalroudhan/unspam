package repository

import (
	"time"

	"github.com/aalroudhan/unspam/internal/models"
	"gorm.io/gorm"
)

// CallsRepository isolates all CallLog DB access (Repository pattern).
type CallsRepository struct {
	db *gorm.DB
}

func NewCallsRepository(db *gorm.DB) *CallsRepository {
	return &CallsRepository{db: db}
}

func (r *CallsRepository) Save(log *models.CallLog) error {
	return r.db.Create(log).Error
}

// FindPaginated returns a page of call logs and the total count, optionally
// filtered by outcome.
func (r *CallsRepository) FindPaginated(page, limit int, outcome string) ([]models.CallLog, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}

	var logs []models.CallLog
	var total int64

	q := r.db.Model(&models.CallLog{})
	if outcome != "" {
		q = q.Where("outcome = ?", outcome)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := q.Order(`"createdAt" DESC`).
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&logs).Error

	return logs, total, err
}

// DailyStat is one bucket of the 7-day trend.
type DailyStat struct {
	Date    time.Time `json:"date"`
	Total   int       `json:"total"`
	Blocked int       `json:"blocked"`
}

// Stats is the aggregated dashboard payload.
type Stats struct {
	Total       int64       `json:"total"`
	Blocked     int64       `json:"blocked"`
	Today       int64       `json:"today"`
	BlockedRate int         `json:"blockedRate"`
	DailyStats  []DailyStat `json:"dailyStats"`
}

func (r *CallsRepository) GetStats() (*Stats, error) {
	var total, blocked, today int64

	if err := r.db.Model(&models.CallLog{}).Count(&total).Error; err != nil {
		return nil, err
	}
	if err := r.db.Model(&models.CallLog{}).
		Where("outcome IN ?", []string{"blocked", "voicemail"}).
		Count(&blocked).Error; err != nil {
		return nil, err
	}

	todayStart := time.Now().Truncate(24 * time.Hour)
	if err := r.db.Model(&models.CallLog{}).
		Where(`"createdAt" >= ?`, todayStart).
		Count(&today).Error; err != nil {
		return nil, err
	}

	sevenDaysAgo := time.Now().AddDate(0, 0, -6).Truncate(24 * time.Hour)

	type row struct {
		Day     time.Time
		Total   int
		Blocked int
	}
	var rows []row
	err := r.db.Model(&models.CallLog{}).
		Select(`DATE_TRUNC('day', "createdAt") AS day, COUNT(*) AS total, SUM(CASE WHEN outcome IN ('blocked','voicemail') THEN 1 ELSE 0 END) AS blocked`).
		Where(`"createdAt" >= ?`, sevenDaysAgo).
		Group("day").
		Order("day ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	daily := make([]DailyStat, len(rows))
	for i, rw := range rows {
		daily[i] = DailyStat{Date: rw.Day, Total: rw.Total, Blocked: rw.Blocked}
	}

	rate := 0
	if total > 0 {
		rate = int(float64(blocked) / float64(total) * 100)
	}

	return &Stats{
		Total:       total,
		Blocked:     blocked,
		Today:       today,
		BlockedRate: rate,
		DailyStats:  daily,
	}, nil
}
