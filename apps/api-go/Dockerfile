# ── Build stage ──────────────────────────────────────────────────────────────
FROM golang:1.25-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o unspam-api .

# ── Run stage ────────────────────────────────────────────────────────────────
FROM alpine:latest
WORKDIR /app

# ca-certificates needed for outbound HTTPS (Twilio) and SMTP TLS
RUN apk add --no-cache ca-certificates

COPY --from=builder /app/unspam-api .
COPY --from=builder /app/data ./data

EXPOSE 3000
CMD ["./unspam-api"]
