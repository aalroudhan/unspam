# Unspam

A mobile app that detects and intercepts spam calls, protecting users from VoIP-based robocalls and spam.

## How It Works

Unspam supports two interception modes. Both ultimately log the call and notify the user.

### Mode A — Twilio (Full Network Interception)

Best for spoofed number detection and iOS users who want real-time interception.

1. User's phone forwards calls to their assigned Twilio number
2. Twilio receives the call and triggers a webhook to the Unspam backend
3. The backend queries the Twilio Lookup API to check carrier type, VoIP status, and STIR/SHAKEN spoofing data
4. If spam is detected → Twilio sends the call to voicemail and logs it
5. If clean → Twilio forwards the call to the user's real number
6. User receives a push notification and can view the call log in the app

### Mode B — Native (No Twilio Required)

Lower cost. Works well for VoIP and known spam detection without spoofing checks.

1. Incoming call arrives on the device
2. Android Call Screening API or iOS CallKit intercepts it before it rings
3. The app queries the backend with the caller number
4. Backend checks the number against a free carrier lookup API (e.g. numverify) and community block list
5. If spam is detected → call is silenced/rejected and logged
6. User receives a push notification and can view the call log in the app

## Features

- VoIP number detection (Twilio Lookup or numverify)
- Spoofed number detection via STIR/SHAKEN (Twilio mode only)
- Automatic call interception and voicemail/rejection routing
- Community-sourced block list — numbers flagged by multiple users raise score for everyone
- In-app log of all intercepted calls
- Push notifications on interception
- iOS CallKit integration (system-level call blocking)
- Android Call Screening API integration

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (iOS + Android) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Spam Scoring | Weighted scoring engine (local, no API cost) |
| Telephony — Mode A | Twilio Voice + Lookup API |
| Telephony — Mode B | numverify (free tier) + native device APIs |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| iOS Call Blocking | CallKit (`CXCallDirectoryExtension`) |
| Android Call Screening | Call Screening API |

## Project Structure

```
unspam/
├── app/                  # React Native mobile app
│   ├── src/
│   │   ├── screens/      # Call log, settings, auth screens
│   │   ├── components/   # Shared UI components
│   │   ├── services/     # API calls, FCM, CallKit bridge
│   │   └── navigation/   # App navigation
│   └── ios/              # iOS-specific (CallKit extension)
├── backend/              # Node.js API
│   ├── src/
│   │   ├── routes/       # Webhook and REST endpoints
│   │   ├── services/     # Twilio Lookup, call routing logic
│   │   └── models/       # Database models
│   └── migrations/       # PostgreSQL migrations
└── docs/                 # Additional documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- React Native CLI
- PostgreSQL
- Firebase project (for push notifications)
- **Mode A only:** Twilio account with a voice-enabled number
- **Mode B only:** numverify API key (free tier available)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your credentials
npm run migrate
npm run dev
```

### Mobile App Setup

```bash
cd app
npm install
npx pod-install        # iOS only
npm run ios            # or npm run android
```

### Environment Variables

```env
# Database
DATABASE_URL=

# Firebase
FIREBASE_SERVICE_ACCOUNT_KEY=

# App
JWT_SECRET=
INTERCEPTION_MODE=native   # "twilio" or "native"

# Mode A — Twilio (leave blank if using native mode)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
FORWARD_TO_NUMBER=

# Mode B — Native (leave blank if using Twilio mode)
NUMVERIFY_API_KEY=
```

### Mode A: Twilio Webhook Setup

Point your Twilio number's incoming call webhook to:

```
POST https://your-backend-url/webhook/call
```

Users must also enable call forwarding on their carrier to route calls through their Twilio number. Instructions vary by carrier.

### Mode B: Native Setup

No webhook or call forwarding needed. The app uses the device's native call screening APIs directly. Set `INTERCEPTION_MODE=native` in your `.env`.

## Roadmap

- [x] VoIP detection (Twilio Lookup)
- [ ] Call frequency detection
- [ ] Geographic pattern analysis
- [ ] Carrier-based scoring
- [ ] Voicemail playback in-app
- [ ] Analytics and stats dashboard
- [ ] Custom block/allow lists

## Known Limitations

- **Mode A — iOS call forwarding is manual** — users configure it in carrier settings; there is no programmatic way to enable it
- **Mode A — CallKit blocks by list** — there is a short sync delay between detection and blocking for newly identified numbers
- **Mode A — Twilio Lookup costs** ~$0.01 per lookup
- **Mode B — No spoofed number detection** — STIR/SHAKEN data requires a carrier-level API (Twilio or equivalent); numverify does not provide it
- **Mode B — Android only for real-time interception** — iOS CallKit on native mode blocks by pre-synced list, not in real-time

## License

MIT
