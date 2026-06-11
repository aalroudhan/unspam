package reports

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/aalroudhan/unspam/internal/models"
	"gorm.io/gorm"
)

var ErrNotFound = errors.New("no report found for carrier")

type carrierEntry struct {
	Name          string   `json:"name"`
	MatchPatterns []string `json:"match_patterns"`
	AbuseEmail    string   `json:"abuse_email"`
	AbuseURL      string   `json:"abuse_url"`
}

// Report is one carrier's grouped complaint summary.
type Report struct {
	Carrier     string   `json:"carrier"`
	AbuseEmail  *string  `json:"abuseEmail"`
	AbuseURL    *string  `json:"abuseUrl"`
	NumberCount int      `json:"numberCount"`
	Numbers     []string `json:"numbers"`
	Unmatched   bool     `json:"unmatched"`
}

// Service generates and sends carrier complaint reports.
type Service struct {
	db       *gorm.DB
	email    *EmailSender
	carriers []carrierEntry
}

func NewService(db *gorm.DB, email *EmailSender, carriersPath string) (*Service, error) {
	raw, err := os.ReadFile(carriersPath)
	if err != nil {
		return nil, fmt.Errorf("read carriers: %w", err)
	}
	var carriers []carrierEntry
	if err := json.Unmarshal(raw, &carriers); err != nil {
		return nil, fmt.Errorf("parse carriers: %w", err)
	}
	return &Service{db: db, email: email, carriers: carriers}, nil
}

func (s *Service) GenerateReports() ([]Report, error) {
	var logs []models.CallLog
	err := s.db.
		Where("outcome IN ?", []string{"blocked", "voicemail"}).
		Order(`"createdAt" DESC`).
		Find(&logs).Error
	if err != nil {
		return nil, err
	}

	type group struct {
		numbers map[string]struct{}
		entry   *carrierEntry
	}
	seen := map[string]struct{}{}
	byCarrier := map[string]*group{}
	var order []string

	for _, log := range logs {
		if _, ok := seen[log.CallerNumber]; ok {
			continue
		}
		seen[log.CallerNumber] = struct{}{}

		key := log.CarrierName
		if key == "" {
			key = log.CarrierType
		}
		if key == "" {
			key = "Unknown"
		}

		entry := s.matchCarrier(key)
		groupKey := key
		if entry != nil {
			groupKey = entry.Name
		}

		g, ok := byCarrier[groupKey]
		if !ok {
			g = &group{numbers: map[string]struct{}{}, entry: entry}
			byCarrier[groupKey] = g
			order = append(order, groupKey)
		}
		g.numbers[log.CallerNumber] = struct{}{}
	}

	reports := make([]Report, 0, len(byCarrier))
	for _, key := range order {
		g := byCarrier[key]
		numbers := make([]string, 0, len(g.numbers))
		for n := range g.numbers {
			numbers = append(numbers, n)
		}
		r := Report{
			Carrier:     key,
			NumberCount: len(numbers),
			Numbers:     numbers,
			Unmatched:   g.entry == nil,
		}
		if g.entry != nil {
			r.AbuseEmail = &g.entry.AbuseEmail
			r.AbuseURL = &g.entry.AbuseURL
		}
		reports = append(reports, r)
	}

	sort.Slice(reports, func(i, j int) bool {
		return reports[i].NumberCount > reports[j].NumberCount
	})
	return reports, nil
}

func (s *Service) SendReport(carrierName string, testMode bool) error {
	reports, err := s.GenerateReports()
	if err != nil {
		return err
	}

	var report *Report
	for i := range reports {
		if reports[i].Carrier == carrierName {
			report = &reports[i]
			break
		}
	}
	if report == nil {
		return ErrNotFound
	}
	if report.AbuseEmail == nil && !testMode {
		return fmt.Errorf("no abuse contact known for: %s", carrierName)
	}

	plural := ""
	if report.NumberCount != 1 {
		plural = "s"
	}
	subject := fmt.Sprintf("Robocall/spam complaint — %d number%s on your network", report.NumberCount, plural)

	to := ""
	if report.AbuseEmail != nil {
		to = *report.AbuseEmail
	}
	return s.email.Send(to, subject, s.buildBody(report), testMode)
}

func (s *Service) buildBody(report *Report) string {
	var sb strings.Builder
	for _, n := range report.Numbers {
		sb.WriteString("  • " + n + "\n")
	}
	return strings.Join([]string{
		"Hello,",
		"",
		"I am filing a formal complaint regarding phone numbers on your network that are being used to place unsolicited spam or robocall traffic.",
		"",
		fmt.Sprintf("Carrier identified : %s", report.Carrier),
		fmt.Sprintf("Numbers flagged    : %d", report.NumberCount),
		"",
		strings.TrimRight(sb.String(), "\n"),
		"",
		"These numbers were detected and blocked by an automated spam call screening system. Each number scored above the spam threshold based on VoIP carrier type, number reassignment signals, and/or community reports.",
		"",
		"I request that you:",
		"  1. Investigate the accounts associated with the numbers listed above.",
		"  2. Take action consistent with your acceptable-use policy and TRACED Act obligations.",
		"  3. Reply with a ticket or case number confirming receipt.",
		"",
		"Thank you.",
	}, "\n")
}

func (s *Service) matchCarrier(name string) *carrierEntry {
	lower := strings.ToLower(name)
	for i := range s.carriers {
		for _, p := range s.carriers[i].MatchPatterns {
			if strings.Contains(lower, strings.ToLower(p)) {
				return &s.carriers[i]
			}
		}
	}
	return nil
}
