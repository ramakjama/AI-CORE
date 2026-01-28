# @ait-core/softphone

VoIP Softphone library with Twilio integration for AIT-CORE.

## Features

- 📞 **Outbound Calls**: Make calls to any phone number
- 📲 **Inbound Calls**: Receive calls with notifications
- 🎤 **Audio Controls**: Mute/unmute, volume control
- 🔢 **DTMF Support**: Send keypad tones during calls
- 📊 **Call Quality Metrics**: Real-time quality monitoring (MOS, jitter, latency)
- 📹 **Recording**: Automatic call recording
- 📝 **Transcription**: Automatic call transcription
- 🔒 **Secure**: Encrypted communications via Twilio

## Installation

```bash
pnpm add @ait-core/softphone
```

## Usage

### Basic Setup

```typescript
import { TwilioSoftphone } from '@ait-core/softphone';

// Create softphone instance
const softphone = new TwilioSoftphone({
  accountSid: 'YOUR_ACCOUNT_SID',
  authToken: 'YOUR_AUTH_TOKEN',
  apiKey: 'YOUR_API_KEY',
  apiSecret: 'YOUR_API_SECRET',
  phoneNumber: '+34912345678', // Your Twilio number
});

// Get access token from your backend
const accessToken = await fetch('/api/twilio/token').then(r => r.json());

// Initialize
await softphone.initialize(accessToken);
```

### Making Calls

```typescript
// Make an outbound call
const call = await softphone.makeCall({
  to: '+34612345678',
  record: true,
  transcribe: false,
});

console.log('Call started:', call.id);
```

### Receiving Calls

```typescript
// Listen for incoming calls
softphone.on('call:incoming', (call) => {
  console.log('Incoming call from:', call.from);

  // Answer the call
  await softphone.answerCall();

  // Or reject it
  // softphone.rejectCall();
});
```

### Call Controls

```typescript
// Hang up
softphone.hangUp();

// Mute/unmute
softphone.setMuted(true);
softphone.setMuted(false);

// Send DTMF tones (keypad)
softphone.sendDigits('1234');
```

### Call Quality Monitoring

```typescript
// Get current call quality metrics
const quality = softphone.getCallQuality();

if (quality) {
  console.log('MOS Score:', quality.mos);
  console.log('Jitter:', quality.jitter, 'ms');
  console.log('Latency:', quality.latency, 'ms');
  console.log('Packet Loss:', quality.packetLoss, '%');
}
```

### Event Handlers

```typescript
softphone.on('call:connecting', (call) => {
  console.log('Call connecting...');
});

softphone.on('call:ringing', (call) => {
  console.log('Call ringing...');
});

softphone.on('call:answered', (call) => {
  console.log('Call answered!');
});

softphone.on('call:ended', (call) => {
  console.log('Call ended. Duration:', call.duration, 'seconds');
});

softphone.on('call:failed', (call, error) => {
  console.error('Call failed:', error.message);
});

softphone.on('device:ready', () => {
  console.log('Softphone ready!');
});

softphone.on('device:error', (error) => {
  console.error('Device error:', error);
});
```

### Cleanup

```typescript
// Destroy the softphone instance
softphone.destroy();
```

## Backend Integration

You need a backend endpoint to generate Twilio access tokens:

```typescript
// Example: Express.js endpoint
import twilio from 'twilio';

app.get('/api/twilio/token', (req, res) => {
  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const identity = req.user.id; // User identity

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID!,
    incomingAllow: true,
  });

  token.addGrant(voiceGrant);

  res.json({
    token: token.toJwt(),
    identity,
  });
});
```

## Configuration

### Twilio Setup

1. **Create Twilio Account**: [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. **Get Phone Number**: Buy a Twilio phone number
3. **Create TwiML App**: For call handling
4. **Get Credentials**:
   - Account SID
   - Auth Token
   - API Key
   - API Secret

### Environment Variables

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret
TWILIO_PHONE_NUMBER=+34912345678
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxx
```

## TypeScript Types

```typescript
interface TwilioConfig {
  accountSid: string;
  authToken: string;
  apiKey: string;
  apiSecret: string;
  phoneNumber: string;
}

interface CallOptions {
  to: string;
  from?: string;
  record?: boolean;
  transcribe?: boolean;
  timeout?: number;
}

interface Call {
  id: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
  status: CallStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordingUrl?: string;
  transcriptionUrl?: string;
}

type CallStatus =
  | 'connecting'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no-answer'
  | 'canceled';
```

## Browser Support

- Chrome/Edge 74+
- Firefox 66+
- Safari 12.1+
- Opera 62+

## Security

- All calls are encrypted with DTLS-SRTP
- Access tokens have configurable TTL
- Supports IP whitelisting
- Audit logging available

## Pricing (Twilio)

- **Outbound calls**: ~$0.01/min
- **Inbound calls**: ~$0.01/min
- **Phone number**: ~$1/month
- **Recording**: ~$0.0025/min
- **Transcription**: ~$0.05/min

## License

Proprietary - AIT-CORE

---

**Version**: 1.0.0
**Maintainer**: AIT-CORE Development Team
