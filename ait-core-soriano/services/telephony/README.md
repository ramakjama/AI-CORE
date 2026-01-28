# Telephony Service

Virtual PBX (Private Branch Exchange) service with Twilio integration.

## Features

### ✅ Core Telephony
- 📞 **Inbound/Outbound Calls**: Handle incoming and outgoing calls
- 🔊 **IVR System**: Interactive Voice Response with menu navigation
- 📋 **Call Queues**: Queue management with agent distribution
- 🎙️ **Call Recording**: Automatic call recording
- 📊 **Call History**: Complete call logs and analytics
- 🔢 **DTMF Support**: Touch-tone input handling

### ✅ IVR Features
- Multi-level menu navigation
- Spanish voice (Polly.Lucia)
- Configurable routing rules
- Hold music for queued calls
- Timeout and retry handling

### ✅ Call Queue Features
- Redis-based queue management
- Position tracking
- Estimated wait time
- Agent distribution (round-robin)
- Queue statistics

## Setup

### Prerequisites

1. **Twilio Account**: [Sign up](https://www.twilio.com/try-twilio)
2. **Twilio Phone Number**: Buy a number
3. **TwiML App**: Create for call handling
4. **Redis**: For queue management
5. **PostgreSQL**: For call history

### Environment Variables

Create `.env` file:

```bash
# Server
PORT=3020

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret
TWILIO_PHONE_NUMBER=+34912345678
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxx

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=ait_core

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Twilio Configuration

1. **Configure TwiML App**:
   - Voice URL: `https://your-domain.com/api/calls/incoming`
   - Status Callback: `https://your-domain.com/api/webhooks/call-status`

2. **Configure Phone Number**:
   - Voice: TwiML App (select your app)
   - Status Callback: `https://your-domain.com/api/webhooks/call-status`

3. **Configure Recording**:
   - Recording Status Callback: `https://your-domain.com/api/webhooks/recording-status`

## Installation

```bash
cd services/telephony
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t ait-core/telephony .
docker run -p 3020:3020 --env-file .env ait-core/telephony
```

## API Endpoints

### Token Generation

**POST** `/api/token`

Generate Twilio access token for client.

```json
{
  "identity": "user-123"
}
```

Response:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGci...",
  "identity": "user-123"
}
```

### Call History

**GET** `/api/calls/history?userId=user-123&limit=50`

Get call history.

Response:
```json
{
  "calls": [
    {
      "sid": "CAxxxx",
      "from": "+34612345678",
      "to": "+34912345678",
      "status": "completed",
      "direction": "inbound",
      "duration": "120",
      "startTime": "2026-01-28T10:00:00Z",
      "endTime": "2026-01-28T10:02:00Z",
      "price": "-0.02",
      "priceUnit": "USD"
    }
  ]
}
```

### Get Recording

**GET** `/api/recordings/:recordingSid`

Get call recording URL.

Response:
```json
{
  "url": "https://api.twilio.com/2010-04-01/Accounts/.../Recordings/RExxxx.mp3"
}
```

### Queue Status

**GET** `/api/queues/:queueId`

Get call queue status.

Response:
```json
{
  "id": "general-queue",
  "name": "general-queue",
  "currentSize": 3,
  "maxSize": 100,
  "averageWaitTime": 180,
  "calls": [
    {
      "callSid": "CAxxxx",
      "from": "+34612345678",
      "queuedAt": "2026-01-28T10:00:00Z",
      "position": 1,
      "estimatedWaitTime": 60
    }
  ]
}
```

## Webhooks

### Call Status Webhook

**POST** `/api/webhooks/call-status`

Receives call status updates from Twilio.

### Recording Status Webhook

**POST** `/api/webhooks/recording-status`

Receives recording status updates from Twilio.

## IVR Menu Structure

```
Main Menu
├─ 1 → Seguros de vida
├─ 2 → Seguros de salud
├─ 3 → Seguros de hogar
├─ 4 → Seguros de automóvil
└─ 9 → Hablar con agente (enqueue)
```

## Customization

### Add IVR Option

Edit `src/ivr.service.ts`:

```typescript
case '5':
  twiml.say({ voice: 'Polly.Lucia', language: 'es-ES' },
    'Nueva opción');
  twiml.dial('+34912345682');
  break;
```

### Configure Queue

Edit `src/call-queue.service.ts` to change:
- Queue size limits
- Wait time calculations
- Agent distribution logic

### Change Voice

Available Spanish voices:
- `Polly.Lucia` (Female, Spain)
- `Polly.Enrique` (Male, Spain)
- `Polly.Conchita` (Female, Spain)
- `Polly.Mia` (Female, Mexico)

## Architecture

```
┌─────────────────────┐
│   Twilio Cloud      │
│  (Phone Network)    │
└──────────┬──────────┘
           │
           │ SIP/WebRTC
           │
┌──────────▼──────────┐
│ Telephony Service   │
│  - IVR System       │
│  - Call Queues      │
│  - Recording        │
└──────────┬──────────┘
           │
           ├─ Redis (Queues)
           ├─ PostgreSQL (History)
           └─ API Clients
```

## Pricing (Twilio)

- Phone number: ~$1/month
- Inbound calls: ~$0.0085/min
- Outbound calls: ~$0.01/min
- Recording: ~$0.0025/min
- Transcription: ~$0.05/min

## License

Proprietary - AIT-CORE

---

**Version**: 1.0.0
**Maintainer**: AIT-CORE Development Team
