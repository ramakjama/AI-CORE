# AIT Communications

Multi-channel communication service for AIT Core Soriano platform with Email (Resend), SMS (Twilio), and WhatsApp (Twilio Business API) integration.

## Features

### 📧 Email (Resend)
- **Transactional Emails**: Order confirmations, password resets, notifications
- **Marketing Campaigns**: Newsletters, promotions, announcements
- **Rich Templates**: MJML-based responsive email templates
- **Advanced Tracking**: Opens, clicks, bounces, unsubscribes
- **Attachments Support**: PDFs, images, documents
- **A/B Testing**: Compare campaign variants

### 📱 SMS (Twilio)
- **Transactional SMS**: OTP codes, payment reminders, alerts
- **Marketing SMS**: Campaigns, offers, updates
- **Link Shortening**: Automatic URL shortening to save characters
- **Segment Calculation**: Smart message splitting
- **Delivery Tracking**: Real-time status updates
- **Phone Validation**: E.164 format validation

### 💬 WhatsApp (Twilio Business API)
- **Template Messages**: Pre-approved WhatsApp templates
- **Rich Media**: Images, videos, PDFs, audio files
- **Interactive Buttons**: Quick replies, URL buttons, call buttons
- **List Messages**: Multiple choice options
- **Delivery Status**: Read receipts, delivery confirmations
- **Business Profile**: Verified business account

## Architecture

```
src/
├── interfaces/
│   ├── communication-provider.interface.ts    # Base provider interfaces
│   └── message.types.ts                       # Type definitions
├── providers/
│   ├── email/
│   │   └── resend/
│   │       ├── resend.provider.ts            # Resend implementation
│   │       └── email-tracker.ts              # Email tracking
│   ├── sms/
│   │   └── twilio/
│   │       ├── twilio-sms.provider.ts        # Twilio SMS implementation
│   │       └── link-shortener.ts             # URL shortening
│   └── whatsapp/
│       └── twilio/
│           └── twilio-whatsapp.provider.ts   # WhatsApp implementation
├── services/
│   ├── communication-orchestrator.service.ts  # Multi-channel orchestration
│   ├── template.service.ts                    # Template management
│   └── delivery-tracking.service.ts           # Analytics & tracking
├── controllers/
│   ├── email.controller.ts                    # Email API endpoints
│   ├── sms.controller.ts                      # SMS API endpoints
│   └── whatsapp.controller.ts                 # WhatsApp API endpoints
├── templates/
│   ├── email/                                 # MJML email templates
│   ├── sms/                                   # Handlebars SMS templates
│   └── whatsapp/                              # Handlebars WhatsApp templates
└── utils/
    ├── logger.ts                              # Winston logger
    └── rate-limiter.ts                        # Redis rate limiting
```

## Installation

```bash
cd modules/05-integrations/ait-communications
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
# Resend (Email)
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@sorianomediadores.com

# Twilio (SMS & WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+34123456789
TWILIO_WHATSAPP_NUMBER=whatsapp:+34123456789

# Rate Limits
EMAIL_RATE_LIMIT_PER_HOUR=100
SMS_RATE_LIMIT_PER_HOUR=50
WHATSAPP_RATE_LIMIT_PER_HOUR=50
```

## Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

## Usage

### Starting the Service

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

### Email API

**Send Email**
```bash
POST /api/email/send
Content-Type: application/json

{
  "to": "customer@example.com",
  "subject": "Welcome to Soriano Mediadores",
  "content": "Welcome message...",
  "html": "<h1>Welcome</h1>"
}
```

**Send Template Email**
```bash
POST /api/email/template
Content-Type: application/json

{
  "to": "customer@example.com",
  "templateId": "welcome",
  "data": {
    "name": "Juan García",
    "logo_url": "https://..."
  }
}
```

### SMS API

**Send SMS**
```bash
POST /api/sms/send
Content-Type: application/json

{
  "to": "+34987654321",
  "content": "Your OTP code is: 123456",
  "shortenLinks": true
}
```

**Send OTP Code**
```bash
POST /api/sms/otp
Content-Type: application/json

{
  "to": "+34987654321",
  "code": "123456",
  "expiresIn": 5
}
```

### WhatsApp API

**Send WhatsApp Message**
```bash
POST /api/whatsapp/send
Content-Type: application/json

{
  "to": "+34987654321",
  "content": "Hello from Soriano Mediadores!"
}
```

**Send Media**
```bash
POST /api/whatsapp/media
Content-Type: application/json

{
  "to": "+34987654321",
  "mediaUrl": "https://example.com/policy.pdf",
  "mediaType": "document",
  "caption": "Your policy document"
}
```

**Send Interactive Message**
```bash
POST /api/whatsapp/interactive
Content-Type: application/json

{
  "to": "+34987654321",
  "content": "Do you want to renew your policy?",
  "buttons": [
    { "type": "reply", "title": "Yes", "payload": "renew_yes" },
    { "type": "reply", "title": "No", "payload": "renew_no" }
  ]
}
```

## Templates

### Email Templates (MJML)

Located in `src/templates/email/`:
- `welcome.mjml` - Welcome email
- `policy-issued.mjml` - Policy issued notification
- `payment-receipt.mjml` - Payment confirmation
- `claim-update.mjml` - Claim status update

### SMS Templates (Handlebars)

Located in `src/templates/sms/`:
- `otp-code.hbs` - OTP verification code
- `payment-reminder.hbs` - Payment reminder
- `policy-expiring.hbs` - Policy expiration warning

### WhatsApp Templates (Handlebars)

Located in `src/templates/whatsapp/`:
- `claim-update.hbs` - Claim status update
- `appointment-reminder.hbs` - Appointment reminder
- `policy-renewal.hbs` - Policy renewal notification

### Template Variables

All templates support these Handlebars helpers:

```handlebars
{{currency amount 'EUR'}}           # Format: 1.234,56 €
{{date start_date}}                 # Format: 25/01/2026
{{date start_date 'long'}}          # Format: 25 de enero de 2026
{{upper text}}                      # UPPERCASE
{{lower text}}                      # lowercase
{{truncate text 50}}                # Truncate to 50 chars
{{url '/dashboard'}}                # Full URL: https://sorianomediadores.com/dashboard
```

## Multi-Channel Campaigns

### Create Campaign

```typescript
import { CommunicationOrchestrator } from '@ait-core/communications';

const orchestrator = new CommunicationOrchestrator();
await orchestrator.initialize();

// Send multi-channel message
const results = await orchestrator.sendMultiChannel(
  ['EMAIL', 'SMS', 'WHATSAPP'],
  {
    to: 'customer@example.com',
    content: 'Important update about your policy',
    templateId: 'policy-update',
    templateData: { policyNumber: '12345' }
  }
);
```

### A/B Testing

```typescript
await orchestrator.sendABTestCampaign(
  'campaign-id',
  'Variant A: Save 20% on renewals',
  'Variant B: Renew now and get 20% off',
  50 // 50/50 split
);
```

## Tracking & Analytics

### Email Tracking

- **Opens**: Tracked via 1x1 pixel
- **Clicks**: Tracked via redirect URLs
- **Bounces**: Handled via webhooks
- **Unsubscribes**: One-click unsubscribe

### Delivery Analytics

```typescript
import { DeliveryTrackingService } from '@ait-core/communications';

const tracking = new DeliveryTrackingService();

// Get channel analytics
const analytics = await tracking.getChannelAnalytics(
  'EMAIL',
  startDate,
  endDate
);

console.log(analytics);
// {
//   sent: 1000,
//   delivered: 980,
//   failed: 20,
//   bounced: 10,
//   opened: 450,
//   clicked: 120
// }

// Get delivery rate
const deliveryRate = await tracking.getDeliveryRate('EMAIL', startDate, endDate);
// 98%

// Get open rate
const openRate = await tracking.getOpenRate(startDate, endDate);
// 45.9%
```

## GDPR Compliance

### Consent Management

```typescript
// Record consent
await prisma.consentRecord.create({
  data: {
    email: 'customer@example.com',
    consentType: 'MARKETING',
    granted: true,
    source: 'WEB_FORM',
    ipAddress: '192.168.1.1'
  }
});

// Check consent before sending
const consent = await prisma.consentRecord.findFirst({
  where: {
    email: 'customer@example.com',
    consentType: 'MARKETING',
    granted: true
  }
});
```

### Unsubscribe Management

```typescript
// Handle unsubscribe
await emailProvider.handleUnsubscribe('customer@example.com');

// Check unsubscribe status
const isUnsubscribed = await tracker.isUnsubscribed('customer@example.com');
```

## Rate Limiting

Rate limits are enforced per channel:
- Email: 100/hour (configurable)
- SMS: 50/hour (configurable)
- WhatsApp: 50/hour (configurable)

```typescript
import { RateLimiter } from '@ait-core/communications';

const limiter = new RateLimiter();

// Check remaining quota
const remaining = await limiter.getRemaining('EMAIL');
console.log(`${remaining} emails remaining this hour`);
```

## Integration with Other Modules

### ait-crm
```typescript
// Send marketing campaign to CRM contacts
const contacts = await crmService.getContacts({ segment: 'VIP' });

for (const contact of contacts) {
  await orchestrator.sendMessage({
    to: contact.email,
    channel: 'EMAIL',
    templateId: 'vip-offer',
    templateData: { name: contact.name }
  });
}
```

### ait-policy-manager
```typescript
// Send policy issued notification
await orchestrator.sendMultiChannel(['EMAIL', 'WHATSAPP'], {
  to: policy.customerEmail,
  templateId: 'policy-issued',
  templateData: {
    policyNumber: policy.number,
    startDate: policy.startDate,
    premium: policy.premium
  }
});
```

### ait-claim-processor
```typescript
// Send claim status update
await orchestrator.sendMessage({
  to: claim.customerPhone,
  channel: 'WHATSAPP',
  templateId: 'claim-update',
  templateData: {
    claimNumber: claim.number,
    status: claim.status,
    approvedAmount: claim.approvedAmount
  }
});
```

### ait-authenticator
```typescript
// Send 2FA code
await orchestrator.sendMessage({
  to: user.phone,
  channel: 'SMS',
  content: `Your verification code is: ${otpCode}. Valid for 5 minutes.`,
  priority: 'HIGH'
});
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

Target: 70%+ coverage across:
- Providers (Email, SMS, WhatsApp)
- Services (Orchestrator, Templates, Tracking)
- Controllers (API endpoints)
- Utilities (Logger, Rate Limiter)

## Monitoring

### Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "service": "ait-communications",
  "providers": {
    "EMAIL": { "available": true, "lastCheck": "2026-01-28T10:00:00Z" },
    "SMS": { "available": true, "lastCheck": "2026-01-28T10:00:00Z" },
    "WHATSAPP": { "available": true, "lastCheck": "2026-01-28T10:00:00Z" }
  }
}
```

### Metrics

Prometheus metrics available at `:9090/metrics`:
- `communications_sent_total{channel}`
- `communications_delivered_total{channel}`
- `communications_failed_total{channel}`
- `communications_opened_total` (email only)
- `communications_clicked_total` (email only)

## Troubleshooting

### Email not sending
1. Check Resend API key
2. Verify sender domain is verified in Resend
3. Check rate limits
4. Review logs for errors

### SMS not delivering
1. Verify Twilio credentials
2. Check phone number format (E.164)
3. Ensure phone number is not on DND list
4. Review Twilio console for errors

### WhatsApp not working
1. Verify WhatsApp Business API is approved
2. Check template approval status
3. Ensure recipient has opted in
4. Review 24-hour session window

## Production Deployment

```bash
# Build
npm run build

# Run migrations
npm run prisma:migrate

# Start service
npm start
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=3020
DATABASE_URL=postgresql://...
REDIS_HOST=redis.production.com
RESEND_API_KEY=re_live_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

## License

MIT

## Support

For support, contact the AIT Core team or open an issue in the repository.

---

**Built with:**
- Resend (Email)
- Twilio (SMS & WhatsApp)
- Handlebars (Templates)
- MJML (Email Templates)
- Prisma (Database ORM)
- Express (API Server)
- Redis (Rate Limiting)
