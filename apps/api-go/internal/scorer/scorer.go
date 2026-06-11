package scorer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/aalroudhan/unspam/internal/config"
)

// Request mirrors the payload the Python scorer expects.
type Request struct {
	CallerNumber   string `json:"callerNumber"`
	IsVoip         bool   `json:"isVoip"`
	IsNonFixedVoip bool   `json:"isNonFixedVoip"`
	IsSpoofed      bool   `json:"isSpoofed"`
	CarrierType    string `json:"carrierType"`
	CommunityFlags int    `json:"communityFlags"`
}

// Response is the scorer result.
type Response struct {
	Score   float64  `json:"score"`
	Reasons []string `json:"reasons"`
}

// Client calls the Python FastAPI scorer over HTTP.
type Client struct {
	url    string
	client *http.Client
}

func NewClient(cfg *config.Config) *Client {
	return &Client{url: cfg.ScorerURL, client: &http.Client{Timeout: 10 * time.Second}}
}

func (c *Client) Score(req Request) (*Response, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, err
	}

	resp, err := c.client.Post(c.url+"/score", "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("scorer returned status %d", resp.StatusCode)
	}

	var out Response
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, err
	}
	return &out, nil
}
