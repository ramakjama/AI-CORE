# AIT Communications API Documentation

Complete API reference for the AIT Communications module.

## Base URL

```
http://localhost:3020/api
```

## Authentication

All API endpoints require authentication via JWT token:

```
Authorization: Bearer <token>
```

---

## Email Endpoints

### Send Email

Send a single email message.

**Endpoint:** `POST /email/send`

**Request Body:**
```json
{
  "to": "customer@example.com",
  "from": "noreply@sorianomediadores.com",
  "subject": "Welcome to Soriano Mediadores",
  "content": "Plain text content",
  "html": "<h1>HTML content</h1>",
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "replyTo": "support@sorianomediadores.com",
  "attachments": [
    {
      "filename": "policy.pdf",
      "path": "/path/to/file.pdf",
      "contentType": "application/pdf"
    }
  ],
  "priority": "HIGH",
  "metadata": {
    "customField": "value"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_abc123",
  "providerId": "resend_xyz789",
  "status": "SENT",
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

### Send Template Email

Send an email using a predefined template.

**Endpoint:** `POST /email/template`

**Request Body:**
```json
{
  "to": "customer@example.com",
  "templateId": "welcome",
  "subject": "Welcome!",
  "data": {
    "name": "Juan García",
    "logo_url": "https://sorianomediadores.com/logo.png"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_def456",
  "status": "SENT",
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

### Track Email Open

Track when an email is opened (via pixel).

**Endpoint:** `GET /email/track/open/:messageId`

**Response:** 1x1 transparent GIF image

---

### Track Email Click

Track when a link in an email is clicked.

**Endpoint:** `GET /email/track/click/:messageId?url=<url>`

**Response:** Redirect to original URL

---

### Unsubscribe

Handle email unsubscribe requests.

**Endpoint:** `POST /email/unsubscribe`

**Request Body:**
```json
{
  "email": "customer@example.com",
  "reason": "TOO_FREQUENT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully unsubscribed"
}
```

---

## SMS Endpoints

### Send SMS

Send a single SMS message.

**Endpoint:** `POST /sms/send`

**Request Body:**
```json
{
  "to": "+34987654321",
  "content": "Your verification code is: 123456",
  "shortenLinks": true,
  "maxSegments": 2,
  "priority": "HIGH"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "SM123abc",
  "providerId": "twilio_xyz",
  "status": "SENT",
  "timestamp": "2026-01-28T10:00:00Z",
  "metadata": {
    "segments": 1,
    "price": "0.05",
    "priceUnit": "EUR"
  }
}
```

---

### Send Template SMS

Send an SMS using a template.

**Endpoint:** `POST /sms/template`

**Request Body:**
```json
{
  "to": "+34987654321",
  "templateId": "payment-reminder",
  "data": {
    "customer_name": "Juan García",
    "amount": 150.00,
    "due_date": "2026-02-01"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "SM456def",
  "status": "SENT",
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

### Send OTP Code

Send a one-time password via SMS.

**Endpoint:** `POST /sms/otp`

**Request Body:**
```json
{
  "to": "+34987654321",
  "code": "123456",
  "expiresIn": 5
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "SM789ghi",
  "status": "SENT",
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

### Validate Phone Number

Validate a phone number format.

**Endpoint:** `POST /sms/validate`

**Request Body:**
```json
{
  "phoneNumber": "+34987654321"
}
```

**Response:**
```json
{
  "phoneNumber": "+34987654321",
  "valid": true,
  "carrier": "Vodafone",
  "countryCode": "ES"
}
```

---

## WhatsApp Endpoints

### Send WhatsApp Message

Send a basic WhatsApp message.

**Endpoint:** `POST /whatsapp/send`

**Request Body:**
```json
{
  "to": "+34987654321",
  "content": "Hello from Soriano Mediadores! Your policy has been renewed."
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "wamid.123abc",
  "providerId": "twilio_wa_xyz",
  "status": "SENT",
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

### Send WhatsApp Template

Send a pre-approved WhatsApp template message.

**Endpoint:** `POST /whatsapp/template`

**Request Body:**
```json
{
  "to": "+34987654321",
  "templateName": "claim_update",
  "language": "es",
  "components": [
    {
      "type": "body",
      "parameters": [
        { "type": "text", "text": "Juan García" },
        { "type": "text", "text": "CLM-12345" },
        { "type": "text", "text": "Approved" }
      ]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "wamid.456def",
  "status": "SENT",
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

### Send WhatsApp Media

Send media (image, video, document, audio) via WhatsApp.

**Endpoint:** `POST /whatsapp/media`

**Request Body:**
```json
{
  "to": "+34987654321",
  "mediaUrl": "https://sorianomediadores.com/docs/policy-12345.pdf",
  "mediaType": "document",
  "caption": "Your policy document is ready"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "wamid.789ghi",
  "status": "SENT",
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

### Send Interactive WhatsApp Message

Send a message with interactive buttons or list.

**Endpoint:** `POST /whatsapp/interactive`

**Request Body:**
```json
{
  "to": "+34987654321",
  "content": "Would you like to renew your policy?",
  "buttons": [
    {
      "type": "reply",
      "title": "Yes, renew",
      "payload": "renew_yes"
    },
    {
      "type": "reply",
      "title": "No thanks",
      "payload": "renew_no"
    },
    {
      "type": "url",
      "title": "More info",
      "url": "https://sorianomediadores.com/renewal"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "wamid.abc123",
  "status": "SENT",
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

## Webhook Endpoints

### Twilio SMS Status Webhook

Receive SMS delivery status updates from Twilio.

**Endpoint:** `POST /webhooks/twilio/sms/:messageId`

**Request Body (from Twilio):**
```json
{
  "MessageSid": "SM123abc",
  "MessageStatus": "delivered",
  "ErrorCode": null,
  "ErrorMessage": null
}
```

**Response:**
```
OK
```

---

### Twilio WhatsApp Status Webhook

Receive WhatsApp message status updates from Twilio.

**Endpoint:** `POST /webhooks/twilio/whatsapp/:messageId`

**Request Body (from Twilio):**
```json
{
  "MessageSid": "wamid.123abc",
  "MessageStatus": "delivered",
  "ErrorCode": null
}
```

**Response:**
```
OK
```

---

### WhatsApp Incoming Message Webhook

Receive incoming WhatsApp messages from customers.

**Endpoint:** `POST /webhooks/twilio/whatsapp/incoming`

**Request Body (from Twilio):**
```json
{
  "From": "whatsapp:+34987654321",
  "To": "whatsapp:+34123456789",
  "Body": "I need help with my claim",
  "MediaUrl0": "https://api.twilio.com/media/ME123",
  "MediaContentType0": "image/jpeg"
}
```

**Response:**
```
OK
```

---

## Health & Status Endpoints

### Health Check

Check service health and provider status.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "service": "ait-communications",
  "providers": {
    "EMAIL": {
      "available": true,
      "lastCheck": "2026-01-28T10:00:00Z"
    },
    "SMS": {
      "available": true,
      "lastCheck": "2026-01-28T10:00:00Z"
    },
    "WHATSAPP": {
      "available": true,
      "lastCheck": "2026-01-28T10:00:00Z"
    }
  },
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid phone number format: 123456"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Authentication required"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded for EMAIL: 101/100 per hour"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to send message",
  "details": "Provider error message"
}
```

---

## Rate Limits

| Channel  | Limit        | Window |
|----------|--------------|--------|
| Email    | 100 messages | 1 hour |
| SMS      | 50 messages  | 1 hour |
| WhatsApp | 50 messages  | 1 hour |

Rate limits are configurable via environment variables.

---

## Status Codes

Communication statuses follow this lifecycle:

1. **PENDING** - Message queued for sending
2. **QUEUED** - Message accepted by provider
3. **SENT** - Message sent to recipient
4. **DELIVERED** - Message delivered to recipient
5. **OPENED** - Email opened (email only)
6. **CLICKED** - Link clicked (email only)
7. **FAILED** - Delivery failed
8. **BOUNCED** - Email bounced (email only)
9. **REJECTED** - Message rejected by provider

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:3020/api',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Send email
const response = await client.post('/email/send', {
  to: 'customer@example.com',
  subject: 'Welcome',
  content: 'Welcome to Soriano Mediadores!'
});

console.log(response.data.messageId);
```

### cURL

```bash
# Send SMS
curl -X POST http://localhost:3020/api/sms/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+34987654321",
    "content": "Your code is: 123456"
  }'
```

### Python

```python
import requests

url = 'http://localhost:3020/api/whatsapp/send'
headers = {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
}
data = {
    'to': '+34987654321',
    'content': 'Hello from Soriano Mediadores!'
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

---

## Postman Collection

Import the Postman collection for easy API testing:

```json
{
  "info": {
    "name": "AIT Communications API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Email",
      "item": [
        {
          "name": "Send Email",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/email/send",
            "body": {
              "mode": "raw",
              "raw": "{\"to\":\"test@example.com\",\"subject\":\"Test\",\"content\":\"Test\"}"
            }
          }
        }
      ]
    }
  ]
}
```

---

For more information, see the [README.md](./README.md) and [TEMPLATE_GUIDE.md](./TEMPLATE_GUIDE.md).
