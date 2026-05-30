# Unspam

A mobile app that detects and intercepts spam calls using Twilio, protecting users from VoIP-based robocalls and spam.

## How It Works

1. User's phone forwards calls to their assigned Twilio number
2. Twilio receives the call and triggers a webhook to the Unspam backend
3. The backend queries the Twilio Lookup API to check if the number is VoIP
4. If VoIP is detected → call is sent to voicemail and logged
5. If clean → call is forwarded to the user's real number
6. User receives a push notification and can view the call log in the app

## Features

- VoIP number detection via Twilio Lookup API
- Automatic call interception and voicemail routing
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
| Telephony | Twilio Voice + Lookup API |
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
- Twilio account with a voice-enabled number
- Firebase project (for push notifications)

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
# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Database
DATABASE_URL=

# Firebase
FIREBASE_SERVICE_ACCOUNT_KEY=

# App
JWT_SECRET=
FORWARD_TO_NUMBER=
```

### Twilio Webhook Setup

Point your Twilio number's incoming call webhook to:

```
POST https://your-backend-url/webhook/call
```

### Call Forwarding (User Setup)

Users must enable call forwarding on their carrier to route calls through their assigned Twilio number. Instructions vary by carrier.

## Roadmap

- [x] VoIP detection (Twilio Lookup)
- [ ] Call frequency detection
- [ ] Geographic pattern analysis
- [ ] Carrier-based scoring
- [ ] Voicemail playback in-app
- [ ] Analytics and stats dashboard
- [ ] Custom block/allow lists

## Known Limitations

- **iOS call forwarding is manual** — users configure it in carrier settings; there is no programmatic way to enable it
- **CallKit blocks by list** — there is a short sync delay between detection and blocking for newly identified numbers
- **Twilio Lookup costs** ~$0.01 per lookup

## License

MIT
