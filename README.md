# Unspam

A spam call detection system that scores incoming phone numbers using carrier data, spoofing signals, and community flags. Exposes a web UI and GraphQL API. Runs entirely in Docker.

## How It Works

Unspam supports two interception modes.

### Mode A — Twilio (Recommended)

Full carrier lookup including VoIP detection and spoofing signals.

1. User forwards their carrier calls to their Twilio number
2. Twilio hits the `/webhook/call` endpoint on an incoming call
3. Backend runs a Twilio Lookup to get carrier type, VoIP status, and STIR/SHAKEN reassignment data
4. Scoring engine produces a 0–1 spam score
5. If score ≥ 0.6 → call is sent to voicemail and logged
6. If score < 0.6 → call is forwarded to the user's real number

### Mode B — Native

No Twilio required. Carrier lookup is unavailable — scoring relies on community flags only.

1. App or device queries `/webhook/check` before a call rings
2. Scoring engine scores based on community flags
3. Result is returned — device blocks or allows the call

---

## Scoring

Each incoming number passes through a chain of handlers. Each handler that fires adds to the total spam score. A score ≥ 60% triggers interception.

| Handler | Fires when | Score added |
|---|---|---|
| Non-Fixed VoIP | Number has no registered physical address (TextNow, Google Voice) | +40% |
| Fixed VoIP | Number is VoIP registered to a physical address (Vonage, magicJack) | +20% |
| Spoofing | Number was reassigned to a new subscriber within 90 days (Twilio mode only) | +50% |
| Community Blocklist | Number has been flagged by 5+ users | +30% |
| High-Risk Carrier | Prepaid or non-fixed VoIP carrier type | +20% |

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | NestJS + TypeScript, GraphQL via Apollo Server |
| Scorer | Python + FastAPI |
| Database | PostgreSQL |
| Web UI | HTML/CSS/JS served by nginx, talks to the API via GraphQL |
| Carrier Lookup | Twilio Lookup v2 |
| Infrastructure | Docker + Docker Compose |

> An experimental Go + React rewrite (`apps/api-go`, `apps/web-react`) is also in the repo and runs side-by-side via `docker-compose.go.yml` — see [Go + React Rewrite](#go--react-rewrite-experimental).

## Project Structure

```
unspam/
├── apps/
│   ├── api/                          # NestJS backend
│   │   └── src/
│   │       ├── calls/                # Call log + community flags
│   │       ├── carrier/              # Adapter pattern: Twilio / Null
│   │       ├── interception/         # Strategy pattern: Twilio / Native
│   │       ├── scorer/               # HTTP client to scorer service
│   │       ├── webhook/              # Facade: orchestrates all subsystems
│   │       ├── reports/              # Carrier complaint report generation + email
│   │       ├── notifications/        # Observer: push notification handler
│   │       ├── database/             # Seed data (50 known spam numbers)
│   │       └── common/               # Global filter, interceptor, pipes
│   ├── scorer/                       # Python FastAPI scoring service
│   │   └── handlers/                 # Chain of Responsibility: VoIP → Blocklist → Carrier
│   ├── web/                          # Static web frontend (GraphQL via fetch)
│   ├── api-go/                       # Experimental Go (Gin) rewrite of the API — GraphQL only
│   └── web-react/                    # Experimental React (Vite) rewrite of the web UI — Apollo Client
├── docker-compose.yml
├── docker-compose.go.yml             # Go + React stack (alternate ports, see below)
├── .env.example
└── README.md
```

## Design Patterns

| Pattern | Where |
|---|---|
| Repository | `CallsRepository`, `CommunityFlagsRepository` — separates DB access from business logic |
| Adapter | `TwilioAdapter`, `NullCarrierAdapter` behind `ICarrierLookup` |
| Strategy | `TwilioInterceptor`, `NativeInterceptor` behind `ICallInterceptor` |
| Factory Method | `useFactory` selects the right adapter/strategy at runtime based on `INTERCEPTION_MODE` |
| Facade | `WebhookService` — single entry point over carrier lookup, scoring, interception, logging |
| Observer | `EventEmitter2` decouples call interception from push notifications |
| Chain of Responsibility | Python scorer: each rule is a handler that passes context down the chain |

---

## GraphQL API

The API is GraphQL-only — there is a single `/graphql` endpoint instead of separate REST resource routes, and both web frontends (`apps/web` and `apps/web-react`) talk to it exclusively via GraphQL.

| Backend | Endpoint | GraphiQL |
|---|---|---|
| NestJS (`apps/api`) | `POST http://localhost:3000/graphql` | enabled when `NODE_ENV` is not `production` |
| Go (`apps/api-go`) | `POST http://localhost:3001/graphql` | always enabled |

Open the endpoint URL in a browser to use GraphiQL and explore the schema interactively.

Key operations:

- `query callStats` / `query callLog(page, limit, outcome)` — dashboard stats and call history
- `mutation flagNumber(callerNumber)` — community blocklist flagging (requires auth)
- `query reports` / `mutation sendReport(carrier, testMode)` — carrier complaint reports (requires auth)
- `mutation register(email, password)` / `mutation login(email, password)` / `query me` — auth, returns a JWT used as a `Bearer` token
- `mutation checkNumber(callerNumber)` — score a number (used by Mode B / native interception)

> **Note:** The Twilio voice webhook (`POST /webhook/call`) is the one exception to "everything is GraphQL" on both backends. Twilio POSTs form-encoded call data and requires a TwiML/XML response, which GraphQL can't represent — so this single route stays a plain REST endpoint on both `apps/api` and `apps/api-go`. Every other operation (calls, stats, flags, reports, auth, native number checks) goes through `/graphql`.

---

## Local Development

### Mac / Linux

Install Git and Docker, then:

```bash
git clone https://github.com/aalroudhan/unspam.git
cd unspam
cp .env.example .env
# Edit .env with your credentials — see Environment Variables below
docker compose up --build
```

| Service | URL |
|---|---|
| Web UI | http://localhost:8080 |
| API / GraphiQL | http://localhost:3000/graphql |
| Scorer | http://localhost:8000/docs |

---

### Windows (WSL)

Docker Engine runs inside WSL — no Docker Desktop license required.

#### Step 1 — Enable WSL2

Open PowerShell as Administrator and run:

```powershell
wsl --install
```

Restart your machine when prompted. This installs WSL2 with Ubuntu by default.

If you already have WSL but not Ubuntu, install it:

```powershell
wsl --install -d Ubuntu
```

#### Step 2 — Install Docker Engine inside WSL

Open your Ubuntu terminal (search **Ubuntu** in the Start menu) and run:

```bash
# Add Docker's repository
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
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

#### Step 3 — Install Git

```bash
sudo apt install -y git
```

#### Step 4 — Clone the repo

```bash
git clone https://github.com/aalroudhan/unspam.git
cd unspam
```

#### Step 5 — Create the .env file

```bash
cp .env.example .env
nano .env
```

Fill in your credentials. See [Environment Variables](#environment-variables) below for what each value means and where to get it.

Save and exit: `Ctrl+X` → `Y` → `Enter`.

#### Step 6 — Start Docker and launch the project

WSL does not start Docker automatically. You need to start it each session:

```bash
sudo service docker start
docker compose up --build -d
```

Check everything is running:

```bash
docker compose ps
```

Open your browser and go to **http://localhost:8080**.

#### Starting the project in future sessions

Each time you open a new WSL terminal:

```bash
sudo service docker start
cd unspam
docker compose up -d
```

#### Stopping the project

```bash
docker compose down
```

---

## Go + React Rewrite (Experimental)

`apps/api-go` (Go + Gin + GraphQL) and `apps/web-react` (React + Vite + Apollo Client) are an in-progress rewrite of the API and web UI. They run side-by-side with the main stack, on different ports, via a separate compose file:

```bash
docker compose -f docker-compose.go.yml up --build -d
```

| Service | URL |
|---|---|
| Web UI | http://localhost:8081 |
| API / GraphiQL | http://localhost:3001/graphql |
| Postgres | localhost:5433 |
| Scorer | http://localhost:8002/docs |

It reads the same `.env` file as the main stack.

### Building outside Docker

- **`apps/api-go`** requires **Go 1.25+**. The `go.mod` `go` directive is `1.25` (pulled in by the `graphql-go`/`graphql-go-handler` dependency tree). With `GOTOOLCHAIN=auto` (the Go default), `go build ./...` downloads the matching toolchain automatically — no manual install needed.
- **`apps/web-react`** is a standard Vite + React app:

  ```bash
  cd apps/web-react
  npm install
  npm run dev      # local dev server
  npm run build    # production build
  ```

  Set `VITE_API_URL` (defaults to `/api`) if the GraphQL endpoint isn't reachable at the default proxy path.

---

## Environment Variables

Create a `.env` file in the project root by copying the example:

```bash
cp .env.example .env
```

Then fill in each value. The file is gitignored and will never be committed.

```env
# ── App ──────────────────────────────────────────────────────────────────────

# Set to a long random string — used to sign tokens
JWT_SECRET=change_this_to_a_long_random_string

# "twilio" uses Twilio Lookup for carrier data (recommended)
# "native" skips carrier lookup — community flags only
INTERCEPTION_MODE=twilio

# ── Database ─────────────────────────────────────────────────────────────────
# Leave these as-is when running via Docker Compose

DB_HOST=postgres
DB_PORT=5432
DB_NAME=unspam
DB_USER=postgres
DB_PASSWORD=postgres

# ── Scorer ───────────────────────────────────────────────────────────────────
# Leave as-is when running via Docker Compose

SCORER_URL=http://scorer:8000

# ── Twilio ───────────────────────────────────────────────────────────────────
# Sign up at twilio.com (free trial available)
# Account SID and Auth Token are on the Twilio Console dashboard

TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Only required for Mode A (full call interception via call forwarding):
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx   # the Twilio number that receives forwarded calls
FORWARD_TO_NUMBER=+1xxxxxxxxxx    # your real phone number (clean calls forwarded here)

# ── Email ────────────────────────────────────────────────────────────────────
# Used to send carrier complaint reports from the web UI
# Gmail setup:
#   1. Enable 2-Step Verification: myaccount.google.com → Security
#   2. Search "App passwords" → generate one for Mail
#   3. Use that 16-character password below (spaces are fine)

EMAIL_USER=your@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
```

### Getting your Twilio credentials

1. Sign up at **twilio.com** — no credit card required for trial
2. On the Console dashboard you will see:
   - **Account SID** — starts with `AC`
   - **Auth Token** — click the eye icon to reveal it
3. Copy both into your `.env`

### Getting your Gmail app password

1. Go to **myaccount.google.com**
2. Click **Security** in the left sidebar
3. Under *How you sign in to Google*, enable **2-Step Verification** if not already on
4. Search **"App passwords"** in the search bar at the top of the page
5. Generate one → select **Mail** → copy the 16-character password into `EMAIL_PASS`

---

## Deployment

### Server requirements

Any Linux server with at least:

- 1 vCPU, 1 GB RAM (2 GB recommended)
- Ubuntu 22.04 LTS (or any Debian-based distro)
- Ports **80**, **443**, and **3000** open in the firewall

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
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
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

### Step 4 — Create and fill in the .env file

```bash
cp .env.example .env
nano .env
```

Fill in at minimum:

| Variable | Where to get it |
|---|---|
| `JWT_SECRET` | Any long random string — e.g. `openssl rand -hex 32` |
| `TWILIO_ACCOUNT_SID` | Twilio Console dashboard |
| `TWILIO_AUTH_TOKEN` | Twilio Console dashboard |
| `EMAIL_USER` | Your Gmail address |
| `EMAIL_PASS` | Gmail app password (see above) |

Leave `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, and `SCORER_URL` as-is — Docker Compose handles those automatically.

Save and exit (`Ctrl+X` → `Y` in nano).

---

### Step 5 — Build and start

```bash
docker compose up --build -d
```

The `-d` flag runs everything in the background. Four containers start: `postgres`, `scorer`, `api`, `web`.

Check they are all running:

```bash
docker compose ps
```

Check the API started cleanly:

```bash
docker compose logs api
```

---

### Step 6 — (Optional) Domain and HTTPS

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

In the Twilio console go to **Phone Numbers → Manage → your number → Voice & Fax**.

Set **A call comes in** → Webhook:

```
POST https://yourdomain.com/api/webhook/call
```

Or if you don't have a domain, use your server's IP directly:

```
POST http://YOUR_SERVER_IP:3000/webhook/call
```

Then dial this from your phone to forward calls through Twilio (replace the number with your Twilio number):

```
**21*+1xxxxxxxxxx#
```

---

### Updating a deployment

```bash
git pull
docker compose up --build -d
```

Only changed containers are rebuilt. The database volume is preserved between updates.

---

## Roadmap

- [x] VoIP detection (fixed and non-fixed)
- [x] Spoofed number detection via number reassignment (Twilio mode)
- [x] Community-sourced blocklist with 50 pre-seeded numbers
- [x] Chain of Responsibility scoring engine
- [x] Web UI with per-handler decision breakdown
- [x] Carrier complaint report generation with direct email sending
- [ ] Call frequency detection
- [ ] Geographic pattern analysis
- [ ] Voicemail playback in-app
- [ ] Custom block/allow lists per user
- [ ] Mobile app (React Native, iOS + Android)

## License

MIT
