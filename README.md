# Unspam

A spam call detection system that scores incoming phone numbers using carrier data, spoofing signals, and community flags. Exposes a web UI and REST API. Runs entirely in Docker.

## How It Works

Unspam supports two interception modes.

### Mode A — Twilio

Best for spoofed number detection. Requires a Twilio account.

1. User forwards their carrier calls to their Twilio number
2. Twilio hits the `/webhook/call` endpoint on an incoming call
3. Backend runs a Twilio Lookup to get carrier type, VoIP status, and STIR/SHAKEN reassignment data
4. Scoring engine produces a 0–1 spam score
5. If score ≥ 0.6 → call is sent to voicemail and logged
6. If score < 0.6 → call is forwarded to the user's real number

### Mode B — Native

No Twilio required. Lower cost. No spoofed number detection.

1. App or device queries `/webhook/check` before a call rings
2. Backend calls IPQualityScore to determine carrier type and VoIP status
3. Scoring engine produces a spam score
4. Result is returned — device blocks or allows the call

## Scoring

Each incoming number passes through a chain of handlers. Each handler that fires adds to the total spam score. A score ≥ 60% triggers interception.

| Handler | Fires when | Score added |
|---|---|---|
| Non-Fixed VoIP | Number has no registered physical address (TextNow, Google Voice) | +40% |
| Fixed VoIP | Number is VoIP but has a registered address (Vonage, magicJack) | +20% |
| Spoofing | Number was reassigned to a new subscriber within 90 days (Twilio mode only) | +50% |
| Community Blocklist | Number has been flagged by 5+ users | +30% |
| High-Risk Carrier | Number is on a prepaid or non-fixed VoIP carrier | +20% |

## Tech Stack

| Layer | Technology |
|---|---|
| API | NestJS + TypeScript |
| Scorer | Python + FastAPI |
| Database | PostgreSQL |
| Web UI | HTML/CSS/JS served by nginx |
| Carrier Lookup — Mode A | Twilio Lookup v2 |
| Carrier Lookup — Mode B | IPQualityScore (free tier: 200 req/month) |
| Infrastructure | Docker + Docker Compose |

## Project Structure

```
unspam/
├── apps/
│   ├── api/                          # NestJS backend
│   │   └── src/
│   │       ├── calls/                # Call log + community flags
│   │       ├── carrier/              # Adapter pattern: Twilio / IPQS
│   │       ├── interception/         # Strategy pattern: Twilio / Native
│   │       ├── scorer/               # HTTP client to scorer service
│   │       ├── webhook/              # Facade: orchestrates all subsystems
│   │       ├── notifications/        # Observer: push notification handler
│   │       ├── database/             # Seed data (50 known spam numbers)
│   │       └── common/               # Global filter, interceptor, pipes
│   ├── scorer/                       # Python FastAPI scoring service
│   │   └── handlers/                 # Chain of Responsibility: VoIP → Blocklist → Carrier
│   └── web/                          # Static web frontend
├── docker-compose.yml
└── .env.example
```

## Design Patterns

| Pattern | Where |
|---|---|
| Repository | `CallsRepository`, `CommunityFlagsRepository` — separates DB access from business logic |
| Adapter | `TwilioAdapter`, `IpQualityScoreAdapter` behind `ICarrierLookup` |
| Strategy | `TwilioInterceptor`, `NativeInterceptor` behind `ICallInterceptor` |
| Factory Method | `useFactory` selects the right adapter/strategy at runtime based on `INTERCEPTION_MODE` |
| Facade | `WebhookService` — single entry point over carrier lookup, scoring, interception, logging |
| Observer | `EventEmitter2` decouples call interception from push notifications |
| Chain of Responsibility | Python scorer: each rule is a handler that passes context down the chain |

---

## Local Development

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine + Compose (Linux)
- Git

### Run locally

```bash
git clone https://github.com/aalroudhan/unspam.git
cd unspam
cp .env.example .env   # fill in credentials (see Environment Variables below)
docker compose up --build
```

| Service | URL |
|---|---|
| Web UI | http://localhost:8080 |
| API | http://localhost:3000 |
| API docs (Swagger) | http://localhost:3000/docs |
| Scorer | http://localhost:8000/docs |

---

## Deployment

### Server requirements

Any Linux server with at least:

- 1 vCPU, 1 GB RAM (2 GB recommended)
- Ubuntu 22.04 LTS (or any Debian-based distro)
- Ports 80, 443, and 3000 open in the firewall

Popular options: DigitalOcean Droplet ($6/mo), AWS EC2 t3.micro, Hetzner CX11.

---

### Step 1 — Install Git

```bash
sudo apt update
sudo apt install -y git
git --version
```

---

### Step 2 — Install Docker

```bash
# Add Docker's official GPG key and repository
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow running Docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

---

### Step 3 — Clone the repo

```bash
git clone https://github.com/aalroudhan/unspam.git
cd unspam
```

---

### Step 4 — Configure environment

```bash
cp .env.example .env
nano .env   # or use vim / any editor
```

Fill in the values (see [Environment Variables](#environment-variables) below).

---

### Step 5 — Build and start

```bash
docker compose up --build -d
```

The `-d` flag runs everything in the background. All four containers will start: `postgres`, `scorer`, `api`, `web`.

Check they are running:

```bash
docker compose ps
```

Check the API logs:

```bash
docker compose logs api
```

---

### Step 6 — (Optional) Set up a domain with HTTPS

Install nginx and certbot:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create an nginx config at `/etc/nginx/sites-available/unspam`:

```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
    }

    location /api/ {
        rewrite ^/api(/.*)$ $1 break;
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable it and get a certificate:

```bash
sudo ln -s /etc/nginx/sites-available/unspam /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com
```

---

### Step 7 — (Mode A only) Point Twilio webhook to your server

In the Twilio console, set your phone number's incoming call webhook to:

```
POST https://yourdomain.com/api/webhook/call
```

Or using your server's IP directly (no domain required):

```
POST http://YOUR_SERVER_IP:3000/webhook/call
```

---

### Updating a deployment

```bash
git pull
docker compose up --build -d
```

Only the changed containers are rebuilt. The database volume is preserved.

---

## Environment Variables

Create a `.env` file in the project root. Never commit this file.

```env
# App
JWT_SECRET=change_this_to_a_random_string
INTERCEPTION_MODE=native   # "twilio" or "native"

# Database (leave as-is for Docker)
DB_HOST=postgres
DB_PORT=5432
DB_NAME=unspam
DB_USER=postgres
DB_PASSWORD=postgres

# Scorer (leave as-is for Docker)
SCORER_URL=http://scorer:8000

# Mode A — Twilio
# Sign up at twilio.com — Account SID and Auth Token are on the dashboard
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=       # the Twilio number that receives forwarded calls
FORWARD_TO_NUMBER=         # your real phone number

# Mode B — IPQualityScore
# Free tier (200 req/month): https://www.ipqualityscore.com/create-account
IPQS_API_KEY=
```

---

## Roadmap

- [x] VoIP detection (fixed and non-fixed)
- [x] Spoofed number detection (number reassignment, Twilio mode)
- [x] Community-sourced blocklist with seed data
- [x] Chain of Responsibility scoring engine
- [x] Web UI with decision breakdown
- [ ] Call frequency detection
- [ ] Geographic pattern analysis
- [ ] Voicemail playback in-app
- [ ] Custom block/allow lists per user
- [ ] Mobile app (React Native, iOS + Android)

## License

MIT
