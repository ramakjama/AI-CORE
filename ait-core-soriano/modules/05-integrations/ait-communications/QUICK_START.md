# Quick Start Guide - AIT Communications

Get up and running with AIT Communications in 5 minutes.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Resend API key
- Twilio Account (optional for SMS/WhatsApp)

## Installation

### 1. Install Dependencies

```bash
cd modules/05-integrations/ait-communications
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required
DATABASE_URL="postgresql://user:password@localhost:5432/ait_communications"
REDIS_HOST=localhost
RESEND_API_KEY=re_your_api_key_here

# Optional (for SMS/WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+34123456789
TWILIO_WHATSAPP_NUMBER=whatsapp:+34123456789
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### 4. Start Services

**Option A: Docker (Recommended)**
```bash
docker-compose up -d
```

**Option B: Local Development**
```bash
# Start PostgreSQL and Redis first
npm run dev
```

### 5. Verify Installation

```bash
curl http://localhost:3020/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ait-communications",
  "providers": {
    "EMAIL": { "available": true }
  }
}
```

## Send Your First Email

### Using cURL

```bash
curl -X POST http://localhost:3020/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "content": "Hello from AIT Communications!"
  }'
```

### Using TypeScript

```typescript
import axios from 'axios';

const response = await axios.post('http://localhost:3020/api/email/send', {
  to: 'test@example.com',
  subject: 'Test Email',
  content: 'Hello from AIT Communications!'
});

console.log(response.data);
// {
//   success: true,
//   messageId: 'msg_abc123',
//   status: 'SENT'
// }
```

### Using Templates

```bash
curl -X POST http://localhost:3020/api/email/template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "customer@example.com",
    "templateId": "welcome",
    "data": {
      "name": "Juan García",
      "logo_url": "https://sorianomediadores.com/logo.png"
    }
  }'
```

## Send Your First SMS

```bash
curl -X POST http://localhost:3020/api/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+34987654321",
    "content": "Your verification code is: 123456"
  }'
```

## Send Your First WhatsApp Message

```bash
curl -X POST http://localhost:3020/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+34987654321",
    "content": "Hello from Soriano Mediadores!"
  }'
```

## Common Use Cases

### 1. Send OTP Code (2FA)

```typescript
await axios.post('http://localhost:3020/api/sms/otp', {
  to: '+34987654321',
  code: '123456',
  expiresIn: 5
});
```

### 2. Send Policy Confirmation

```typescript
await axios.post('http://localhost:3020/api/email/template', {
  to: 'customer@example.com',
  templateId: 'policy-issued',
  data: {
    customer_name: 'Juan García',
    policy_number: 'POL-12345',
    policy_type: 'Auto',
    start_date: '2026-02-01',
    end_date: '2027-02-01',
    premium: 1500.00
  }
});
```

### 3. Send Claim Update via WhatsApp

```typescript
await axios.post('http://localhost:3020/api/whatsapp/template', {
  to: '+34987654321',
  templateId: 'claim-update',
  data: {
    customer_name: 'Juan García',
    claim_number: 'CLM-12345',
    claim_status: 'Approved',
    approved_amount: 2500.00
  }
});
```

### 4. Multi-Channel Notification

```typescript
import { CommunicationOrchestrator } from '@ait-core/communications';

const orchestrator = new CommunicationOrchestrator();
await orchestrator.initialize();

// Send to email, SMS, and WhatsApp
const results = await orchestrator.sendMultiChannel(
  ['EMAIL', 'SMS', 'WHATSAPP'],
  {
    to: 'customer@example.com',
    subject: 'Important Update',
    content: 'Your policy has been renewed',
    templateId: 'policy-renewal',
    templateData: { policyNumber: 'POL-12345' }
  }
);
```

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test resend.provider.test.ts

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Monitoring

### Health Check

```bash
curl http://localhost:3020/health
```

### Metrics (Prometheus)

```bash
curl http://localhost:3020:9090/metrics
```

## Troubleshooting

### Email not sending

**Check:**
1. Resend API key is correct
2. Sender email is verified in Resend
3. Check logs: `docker logs ait-communications`

**Solution:**
```bash
# Verify Resend API key
curl https://api.resend.com/domains \
  -H "Authorization: Bearer re_your_api_key"
```

### SMS not delivering

**Check:**
1. Twilio credentials are correct
2. Phone number is in E.164 format (+34987654321)
3. Check Twilio console for errors

**Solution:**
```bash
# Test Twilio credentials
curl -X GET "https://api.twilio.com/2010-04-01/Accounts.json" \
  -u "ACxxxxx:your_auth_token"
```

### Database connection error

**Check:**
1. PostgreSQL is running
2. DATABASE_URL is correct
3. Database exists

**Solution:**
```bash
# Create database
createdb ait_communications

# Test connection
psql $DATABASE_URL
```

### Redis connection error

**Check:**
1. Redis is running
2. REDIS_HOST and REDIS_PORT are correct

**Solution:**
```bash
# Start Redis
redis-server

# Test connection
redis-cli ping
# PONG
```

## Next Steps

1. **Read the Documentation**
   - [README.md](./README.md) - Complete guide
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
   - [TEMPLATE_GUIDE.md](./TEMPLATE_GUIDE.md) - Template development

2. **Create Custom Templates**
   - Add templates in `src/templates/`
   - Register in database
   - Test with preview endpoint

3. **Integrate with Your App**
   - Import CommunicationOrchestrator
   - Configure providers
   - Send messages from your business logic

4. **Deploy to Production**
   - Update environment variables
   - Run migrations
   - Deploy with Docker
   - Configure webhooks

## Support

- Documentation: See [README.md](./README.md)
- Issues: Open a GitHub issue
- Email: support@ait-core.com

## Example Project Structure

```
your-app/
├── src/
│   ├── services/
│   │   └── notification.service.ts
│   └── controllers/
│       └── user.controller.ts
└── ...

// notification.service.ts
import { CommunicationOrchestrator } from '@ait-core/communications';

export class NotificationService {
  private comms: CommunicationOrchestrator;

  constructor() {
    this.comms = new CommunicationOrchestrator();
    await this.comms.initialize();
  }

  async sendWelcomeEmail(user: User) {
    return this.comms.sendMessage({
      to: user.email,
      channel: 'EMAIL',
      templateId: 'welcome',
      templateData: { name: user.name }
    });
  }

  async send2FACode(user: User, code: string) {
    return this.comms.sendMessage({
      to: user.phone,
      channel: 'SMS',
      content: `Your code is: ${code}`,
      priority: 'HIGH'
    });
  }
}
```

---

**You're all set! Start sending messages now! 🚀**
