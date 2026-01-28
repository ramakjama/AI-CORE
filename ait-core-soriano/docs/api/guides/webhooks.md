# Webhooks Guide

This guide explains how to integrate webhooks into your application to receive real-time notifications about events in the AIT-CORE Soriano system.

## Table of Contents

1. [Overview](#overview)
2. [Webhook Events](#webhook-events)
3. [Setting Up Webhooks](#setting-up-webhooks)
4. [Webhook Payload](#webhook-payload)
5. [Security & Verification](#security--verification)
6. [Handling Webhooks](#handling-webhooks)
7. [Retry Logic](#retry-logic)
8. [Best Practices](#best-practices)
9. [Testing Webhooks](#testing-webhooks)

## Overview

Webhooks allow your application to receive real-time notifications when events occur in the AIT-CORE system. Instead of polling the API for changes, webhooks push updates to your server.

### How Webhooks Work

```
┌──────────────┐                        ┌──────────────┐
│  AIT-CORE    │                        │  Your App    │
│    API       │                        │   Server     │
└──────┬───────┘                        └──────┬───────┘
       │                                       │
       │  1. Event occurs                     │
       │     (e.g., policy created)           │
       │                                       │
       │  2. POST /your-webhook-url           │
       │─────────────────────────────────────>│
       │     Webhook payload + signature      │
       │                                       │
       │  3. Your app processes event         │
       │                                       │
       │  4. Return 200 OK                    │
       │<─────────────────────────────────────│
       │                                       │
       │  5. If error, retry with backoff     │
       │                                       │
```

### Benefits

- **Real-time updates**: Receive events immediately
- **Reduced API calls**: No need to poll for changes
- **Event-driven architecture**: Build reactive applications
- **Scalable**: Efficiently handle large volumes of events

## Webhook Events

### Available Events

#### User Events

| Event | Description | Payload |
|-------|-------------|---------|
| `user.created` | New user account created | User object |
| `user.updated` | User profile updated | User object with changes |
| `user.deleted` | User account deleted | User ID |
| `user.activated` | User account activated | User object |
| `user.deactivated` | User account deactivated | User object |
| `user.email_verified` | User email verified | User object |
| `user.password_changed` | User password changed | User ID |

#### Policy Events

| Event | Description | Payload |
|-------|-------------|---------|
| `policy.created` | Insurance policy created | Policy object |
| `policy.updated` | Insurance policy updated | Policy object with changes |
| `policy.deleted` | Insurance policy deleted | Policy ID |
| `policy.activated` | Insurance policy activated | Policy object |
| `policy.cancelled` | Insurance policy cancelled | Policy object |
| `policy.expired` | Insurance policy expired | Policy object |
| `policy.renewed` | Insurance policy renewed | Policy object |
| `policy.payment_due` | Payment due date approaching | Policy object + due date |

#### Quote Events

| Event | Description | Payload |
|-------|-------------|---------|
| `quote.created` | Quote generated | Quote object |
| `quote.updated` | Quote updated | Quote object with changes |
| `quote.accepted` | Quote accepted by customer | Quote object |
| `quote.rejected` | Quote rejected by customer | Quote object |
| `quote.expired` | Quote expired | Quote object |
| `quote.converted` | Quote converted to policy | Quote + Policy objects |

#### Claim Events

| Event | Description | Payload |
|-------|-------------|---------|
| `claim.submitted` | Claim submitted | Claim object |
| `claim.updated` | Claim updated | Claim object with changes |
| `claim.approved` | Claim approved | Claim object + approval details |
| `claim.rejected` | Claim rejected | Claim object + rejection reason |
| `claim.paid` | Claim payment processed | Claim object + payment details |
| `claim.closed` | Claim closed | Claim object |

#### Payment Events

| Event | Description | Payload |
|-------|-------------|---------|
| `payment.successful` | Payment processed successfully | Payment object |
| `payment.failed` | Payment failed | Payment object + error details |
| `payment.refunded` | Payment refunded | Payment object + refund details |
| `payment.pending` | Payment pending | Payment object |
| `payment.cancelled` | Payment cancelled | Payment object |

#### Document Events

| Event | Description | Payload |
|-------|-------------|---------|
| `document.uploaded` | Document uploaded | Document object |
| `document.updated` | Document updated | Document object |
| `document.deleted` | Document deleted | Document ID |
| `document.signed` | Document signed | Document object + signature |

#### Notification Events

| Event | Description | Payload |
|-------|-------------|---------|
| `notification.sent` | Notification sent | Notification object |
| `notification.delivered` | Notification delivered | Notification object |
| `notification.failed` | Notification failed | Notification object + error |

## Setting Up Webhooks

### Create a Webhook

**Endpoint**: `POST /api/v1/webhooks`

**Request**:
```bash
curl -X POST https://api.soriano.com/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/ait-core",
    "events": [
      "policy.created",
      "policy.updated",
      "claim.submitted"
    ],
    "description": "Production webhook for policy and claim events",
    "active": true
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "wh_123e4567e89b12d3a456426614174000",
    "url": "https://your-app.com/webhooks/ait-core",
    "events": [
      "policy.created",
      "policy.updated",
      "claim.submitted"
    ],
    "description": "Production webhook for policy and claim events",
    "active": true,
    "secret": "whsec_abc123def456ghi789jkl012mno345",
    "createdAt": "2024-01-28T12:00:00Z",
    "updatedAt": "2024-01-28T12:00:00Z"
  }
}
```

**Important**: Save the `secret` value - you'll need it to verify webhook signatures.

### List Webhooks

**Endpoint**: `GET /api/v1/webhooks`

**Request**:
```bash
curl -X GET https://api.soriano.com/api/v1/webhooks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Webhook

**Endpoint**: `PATCH /api/v1/webhooks/:id`

**Request**:
```bash
curl -X PATCH https://api.soriano.com/api/v1/webhooks/wh_123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "events": ["policy.created", "policy.updated", "policy.cancelled"],
    "active": true
  }'
```

### Delete Webhook

**Endpoint**: `DELETE /api/v1/webhooks/:id`

**Request**:
```bash
curl -X DELETE https://api.soriano.com/api/v1/webhooks/wh_123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Webhook Payload

### Standard Payload Structure

Every webhook delivery includes:

```json
{
  "id": "evt_123e4567e89b12d3a456426614174000",
  "type": "policy.created",
  "timestamp": "2024-01-28T12:00:00Z",
  "apiVersion": "v1",
  "data": {
    "object": {
      "id": "pol_789xyz",
      "type": "AUTO",
      "policyNumber": "POL-2024-001234",
      "customerId": "cus_456abc",
      "status": "ACTIVE",
      "premium": 1200.00,
      "currency": "EUR",
      "startDate": "2024-02-01",
      "endDate": "2025-02-01",
      "createdAt": "2024-01-28T12:00:00Z"
    },
    "previousAttributes": null
  },
  "metadata": {
    "userId": "usr_123",
    "source": "web_application",
    "ipAddress": "192.168.1.100"
  }
}
```

### Payload Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique event ID |
| `type` | string | Event type (e.g., "policy.created") |
| `timestamp` | string | ISO 8601 timestamp when event occurred |
| `apiVersion` | string | API version that triggered the event |
| `data.object` | object | The affected resource |
| `data.previousAttributes` | object | Previous values for updated fields (null for create events) |
| `metadata` | object | Additional context about the event |

### Event-Specific Payloads

#### policy.created

```json
{
  "id": "evt_001",
  "type": "policy.created",
  "timestamp": "2024-01-28T12:00:00Z",
  "apiVersion": "v1",
  "data": {
    "object": {
      "id": "pol_789xyz",
      "type": "AUTO",
      "policyNumber": "POL-2024-001234",
      "customerId": "cus_456abc",
      "status": "ACTIVE",
      "premium": 1200.00,
      "currency": "EUR",
      "startDate": "2024-02-01",
      "endDate": "2025-02-01",
      "coverages": [
        {
          "type": "LIABILITY",
          "limit": 1000000,
          "deductible": 500
        }
      ]
    }
  }
}
```

#### policy.updated

```json
{
  "id": "evt_002",
  "type": "policy.updated",
  "timestamp": "2024-01-28T13:00:00Z",
  "apiVersion": "v1",
  "data": {
    "object": {
      "id": "pol_789xyz",
      "status": "CANCELLED",
      "cancelledAt": "2024-01-28T13:00:00Z",
      "cancellationReason": "Customer request"
    },
    "previousAttributes": {
      "status": "ACTIVE",
      "cancelledAt": null,
      "cancellationReason": null
    }
  }
}
```

#### claim.submitted

```json
{
  "id": "evt_003",
  "type": "claim.submitted",
  "timestamp": "2024-01-28T14:00:00Z",
  "apiVersion": "v1",
  "data": {
    "object": {
      "id": "clm_abc123",
      "policyId": "pol_789xyz",
      "customerId": "cus_456abc",
      "type": "ACCIDENT",
      "amount": 5000.00,
      "currency": "EUR",
      "status": "SUBMITTED",
      "description": "Vehicle accident on highway",
      "incidentDate": "2024-01-27",
      "submittedAt": "2024-01-28T14:00:00Z"
    }
  }
}
```

#### payment.successful

```json
{
  "id": "evt_004",
  "type": "payment.successful",
  "timestamp": "2024-01-28T15:00:00Z",
  "apiVersion": "v1",
  "data": {
    "object": {
      "id": "pay_xyz789",
      "policyId": "pol_789xyz",
      "customerId": "cus_456abc",
      "amount": 1200.00,
      "currency": "EUR",
      "status": "COMPLETED",
      "method": "CREDIT_CARD",
      "transactionId": "txn_abc123",
      "processedAt": "2024-01-28T15:00:00Z"
    }
  }
}
```

## Security & Verification

### Signature Verification

Every webhook request includes a signature in the `X-Webhook-Signature` header. Verify this signature to ensure the request came from AIT-CORE.

#### Signature Format

```
X-Webhook-Signature: t=1640000000,v1=5257a869e7ecebeda32affa62cdca3fa51cad7e77a0e56ff536d0ce8e108d8bd
```

Where:
- `t` = Unix timestamp when the signature was created
- `v1` = HMAC-SHA256 signature of the payload

#### Verification Algorithm

1. Extract the timestamp (`t`) and signature (`v1`) from the header
2. Concatenate: `timestamp.payload_body`
3. Compute HMAC-SHA256 using your webhook secret
4. Compare computed signature with received signature (use constant-time comparison)
5. Check timestamp is within 5 minutes to prevent replay attacks

#### Implementation Examples

##### Node.js/JavaScript

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  // Parse signature header
  const parts = signature.split(',').reduce((acc, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts.t;
  const receivedSignature = parts.v1;

  // Check timestamp (prevent replay attacks)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) { // 5 minutes
    throw new Error('Webhook timestamp is too old');
  }

  // Compute signature
  const signedPayload = `${timestamp}.${payload}`;
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Compare signatures (constant-time comparison)
  if (!crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(receivedSignature)
  )) {
    throw new Error('Invalid webhook signature');
  }

  return true;
}

// Express.js example
app.post('/webhooks/ait-core', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body.toString();

  try {
    verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET);

    // Signature valid - process webhook
    const event = JSON.parse(payload);
    handleWebhookEvent(event);

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Webhook verification failed:', error);
    res.status(400).send('Invalid signature');
  }
});
```

##### Python

```python
import hmac
import hashlib
import time

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    # Parse signature header
    parts = dict(part.split('=') for part in signature.split(','))
    timestamp = parts['t']
    received_signature = parts['v1']

    # Check timestamp (prevent replay attacks)
    current_time = int(time.time())
    if abs(current_time - int(timestamp)) > 300:  # 5 minutes
        raise ValueError('Webhook timestamp is too old')

    # Compute signature
    signed_payload = f'{timestamp}.{payload.decode()}'
    computed_signature = hmac.new(
        secret.encode(),
        signed_payload.encode(),
        hashlib.sha256
    ).hexdigest()

    # Compare signatures (constant-time comparison)
    if not hmac.compare_digest(computed_signature, received_signature):
        raise ValueError('Invalid webhook signature')

    return True

# Flask example
@app.route('/webhooks/ait-core', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.get_data()

    try:
        verify_webhook_signature(payload, signature, os.environ['WEBHOOK_SECRET'])

        # Signature valid - process webhook
        event = json.loads(payload)
        handle_webhook_event(event)

        return 'Webhook received', 200
    except Exception as e:
        print(f'Webhook verification failed: {e}')
        return 'Invalid signature', 400
```

##### PHP

```php
<?php
function verifyWebhookSignature($payload, $signature, $secret) {
    // Parse signature header
    $parts = [];
    foreach (explode(',', $signature) as $part) {
        list($key, $value) = explode('=', $part);
        $parts[$key] = $value;
    }

    $timestamp = $parts['t'];
    $receivedSignature = $parts['v1'];

    // Check timestamp (prevent replay attacks)
    $currentTime = time();
    if (abs($currentTime - $timestamp) > 300) { // 5 minutes
        throw new Exception('Webhook timestamp is too old');
    }

    // Compute signature
    $signedPayload = $timestamp . '.' . $payload;
    $computedSignature = hash_hmac('sha256', $signedPayload, $secret);

    // Compare signatures (constant-time comparison)
    if (!hash_equals($computedSignature, $receivedSignature)) {
        throw new Exception('Invalid webhook signature');
    }

    return true;
}

// Usage
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'];
$secret = getenv('WEBHOOK_SECRET');

try {
    verifyWebhookSignature($payload, $signature, $secret);

    // Signature valid - process webhook
    $event = json_decode($payload, true);
    handleWebhookEvent($event);

    http_response_code(200);
    echo 'Webhook received';
} catch (Exception $e) {
    error_log('Webhook verification failed: ' . $e->getMessage());
    http_response_code(400);
    echo 'Invalid signature';
}
?>
```

### Additional Security Measures

1. **HTTPS Only**: Webhook URLs must use HTTPS
2. **IP Whitelisting**: Optionally whitelist AIT-CORE IP addresses
3. **Timeout**: Your endpoint should respond within 5 seconds
4. **Idempotency**: Process each event only once using the event ID

### AIT-CORE IP Addresses

Webhooks are sent from these IP addresses:

```
Production:
- 185.100.10.10
- 185.100.10.11
- 185.100.10.12

Staging:
- 185.100.20.10
- 185.100.20.11
```

## Handling Webhooks

### Webhook Endpoint Requirements

Your webhook endpoint must:
1. Accept POST requests
2. Return 2xx status code (200-299) on success
3. Respond within 5 seconds
4. Handle duplicate events idempotently
5. Verify webhook signature

### Best Practices

#### 1. Respond Quickly

Process webhooks asynchronously to respond quickly:

```javascript
app.post('/webhooks/ait-core', async (req, res) => {
  // Verify signature
  verifyWebhookSignature(req.body, req.headers['x-webhook-signature']);

  // Respond immediately
  res.status(200).send('Received');

  // Process asynchronously
  processWebhookAsync(req.body).catch(err => {
    console.error('Error processing webhook:', err);
  });
});

async function processWebhookAsync(event) {
  // Add to queue or process in background
  await queue.add('webhook', event);
}
```

#### 2. Handle Idempotency

Use the event ID to prevent duplicate processing:

```javascript
const processedEvents = new Set();

function handleWebhookEvent(event) {
  // Check if already processed
  if (processedEvents.has(event.id)) {
    console.log('Event already processed:', event.id);
    return;
  }

  // Process event
  processEvent(event);

  // Mark as processed
  processedEvents.add(event.id);

  // Clean up old events (keep last 1000)
  if (processedEvents.size > 1000) {
    const oldEvents = Array.from(processedEvents).slice(0, 100);
    oldEvents.forEach(id => processedEvents.delete(id));
  }
}
```

#### 3. Handle Events by Type

```javascript
function handleWebhookEvent(event) {
  switch (event.type) {
    case 'policy.created':
      handlePolicyCreated(event.data.object);
      break;

    case 'policy.updated':
      handlePolicyUpdated(event.data.object, event.data.previousAttributes);
      break;

    case 'claim.submitted':
      handleClaimSubmitted(event.data.object);
      break;

    case 'payment.successful':
      handlePaymentSuccessful(event.data.object);
      break;

    default:
      console.log('Unhandled event type:', event.type);
  }
}
```

## Retry Logic

### Automatic Retries

If your endpoint returns a non-2xx status code or times out, AIT-CORE will retry the webhook delivery:

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 5 seconds |
| 3 | 30 seconds |
| 4 | 5 minutes |
| 5 | 30 minutes |
| 6 | 1 hour |
| 7 | 6 hours |
| 8 | 24 hours |

After 8 failed attempts, the webhook will be marked as failed and no further retries will be attempted.

### Monitoring Failed Webhooks

**Endpoint**: `GET /api/v1/webhooks/:id/deliveries`

```bash
curl -X GET "https://api.soriano.com/api/v1/webhooks/wh_123/deliveries?status=failed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "del_abc123",
      "webhookId": "wh_123",
      "eventId": "evt_456",
      "eventType": "policy.created",
      "status": "failed",
      "attempts": 8,
      "lastAttempt": "2024-01-28T20:00:00Z",
      "lastError": "Connection timeout after 5000ms",
      "nextRetry": null
    }
  ]
}
```

### Manual Retry

Retry a failed webhook delivery:

**Endpoint**: `POST /api/v1/webhooks/:id/deliveries/:deliveryId/retry`

```bash
curl -X POST https://api.soriano.com/api/v1/webhooks/wh_123/deliveries/del_abc123/retry \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing Webhooks

### Test Event

Send a test event to your webhook:

**Endpoint**: `POST /api/v1/webhooks/:id/test`

```bash
curl -X POST https://api.soriano.com/api/v1/webhooks/wh_123/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "policy.created"
  }'
```

### Local Testing with ngrok

For local development, use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start your local server
node server.js

# Create tunnel
ngrok http 3000

# Use the ngrok URL as your webhook URL
# Example: https://abc123.ngrok.io/webhooks/ait-core
```

### Webhook Testing Tools

- **RequestBin**: https://requestbin.com
- **Webhook.site**: https://webhook.site
- **ngrok**: https://ngrok.com

## Webhook Logs

View webhook delivery logs:

**Endpoint**: `GET /api/v1/webhooks/:id/logs`

```bash
curl -X GET "https://api.soriano.com/api/v1/webhooks/wh_123/logs?limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "log_abc123",
      "eventId": "evt_456",
      "eventType": "policy.created",
      "status": "success",
      "statusCode": 200,
      "duration": 245,
      "timestamp": "2024-01-28T12:00:00Z",
      "request": {
        "url": "https://your-app.com/webhooks/ait-core",
        "method": "POST",
        "headers": {...},
        "body": {...}
      },
      "response": {
        "statusCode": 200,
        "body": "Webhook received"
      }
    }
  ]
}
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook is active: `GET /api/v1/webhooks/:id`
2. Verify URL is accessible from the internet
3. Check firewall and security groups
4. Ensure endpoint returns 2xx status code
5. Verify signature verification is correct

### Signature Verification Failing

1. Use raw request body (don't parse JSON first)
2. Check you're using the correct secret
3. Verify timestamp is recent (within 5 minutes)
4. Ensure no proxy is modifying the request

### High Latency

1. Respond with 200 OK immediately
2. Process webhook asynchronously
3. Use a queue for background processing
4. Optimize database queries

## Next Steps

- [Authentication Guide](./authentication.md)
- [Error Handling Guide](./error-handling.md)
- [Best Practices](./best-practices.md)
- [API Reference](../openapi/openapi.yaml)

---

**Last Updated**: January 28, 2026
