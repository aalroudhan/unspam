package main

import (
	"encoding/csv"
	"log"
	"os"
	"path/filepath"
	"strconv"

	"github.com/aalroudhan/unspam/internal/auth"
	"github.com/aalroudhan/unspam/internal/carrier"
	"github.com/aalroudhan/unspam/internal/config"
	"github.com/aalroudhan/unspam/internal/database"
	graphqlapi "github.com/aalroudhan/unspam/internal/graphql"
	"github.com/aalroudhan/unspam/internal/interception"
	"github.com/aalroudhan/unspam/internal/reports"
	"github.com/aalroudhan/unspam/internal/repository"
	"github.com/aalroudhan/unspam/internal/scorer"
	"github.com/aalroudhan/unspam/internal/webhook"
	"github.com/gin-gonic/gin"
	gqlhandler "github.com/graphql-go/handler"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("database: %v", err)
	}

	// Repositories
	callsRepo := repository.NewCallsRepository(db)
	flagsRepo := repository.NewCommunityFlagsRepository(db)
	usersRepo := repository.NewUserRepository(db)

	// Seed community flags from CSV (idempotent)
	seedFlags(flagsRepo)

	// Adapters + strategies via factory methods
	carrierLookup := carrier.New(cfg)
	interceptor := interception.New(cfg)
	scorerClient := scorer.NewClient(cfg)

	// Services
	webhookSvc := webhook.NewService(callsRepo, flagsRepo, carrierLookup, interceptor, scorerClient, cfg)
	authSvc := auth.NewService(usersRepo, cfg)
	emailSender := reports.NewEmailSender(cfg)

	carriersPath := dataPath("carriers.json")
	reportsSvc, err := reports.NewService(db, emailSender, carriersPath)
	if err != nil {
		log.Fatalf("reports: %v", err)
	}

	// GraphQL schema over the same services/repositories.
	schema, err := graphqlapi.NewSchema(callsRepo, flagsRepo, authSvc, reportsSvc, webhookSvc)
	if err != nil {
		log.Fatalf("graphql schema: %v", err)
	}

	gqlH := gqlhandler.New(&gqlhandler.Config{
		Schema:   &schema,
		Pretty:   true,
		GraphiQL: true,
	})

	// HTTP — GraphQL is the only application API. AuthContextMiddleware attaches
	// the user ID from a Bearer token (if any) so per-resolver auth can enforce it.
	router := gin.Default()
	router.Use(corsMiddleware())
	router.Any("/graphql", graphqlapi.AuthContextMiddleware(cfg.JWTSecret), gin.WrapH(gqlH))

	// Twilio voice webhook stays REST — Twilio requires a TwiML/XML response.
	webhookSvc.RegisterRoutes(router)

	log.Printf("Unspam API (Go) listening on :%s (GraphQL at /graphql, Twilio webhook at /webhook/call)", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin,Content-Type,Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func dataPath(name string) string {
	// Allow override for container vs local
	if dir := os.Getenv("DATA_DIR"); dir != "" {
		return filepath.Join(dir, name)
	}
	return filepath.Join("data", name)
}

func seedFlags(repo *repository.CommunityFlagsRepository) {
	f, err := os.Open(dataPath("spam-numbers.csv"))
	if err != nil {
		log.Printf("seed: skipping (no CSV: %v)", err)
		return
	}
	defer f.Close()

	rows, err := csv.NewReader(f).ReadAll()
	if err != nil || len(rows) < 2 {
		return
	}

	// header: number,flagCount
	header := rows[0]
	numIdx, countIdx := -1, -1
	for i, h := range header {
		switch h {
		case "number":
			numIdx = i
		case "flagCount":
			countIdx = i
		}
	}
	if numIdx < 0 || countIdx < 0 {
		return
	}

	inserted := 0
	for _, row := range rows[1:] {
		if len(row) <= numIdx || len(row) <= countIdx {
			continue
		}
		count, _ := strconv.Atoi(row[countIdx])
		if err := repo.Seed(row[numIdx], count); err == nil {
			inserted++
		}
	}
	log.Printf("seed: processed %d spam numbers", inserted)
}
