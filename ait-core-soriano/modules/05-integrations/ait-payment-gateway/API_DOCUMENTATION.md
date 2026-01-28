# AIT Payment Gateway - API Documentation

Complete API reference for the Payment Gateway service.

## Base URL

```
http://localhost:3000
```

Production:
```
https://api.your-domain.com
```

## Authentication

Currently, the API uses API key authentication (to be implemented based on your needs).

Future implementations may include:
- Bearer tokens
- OAuth 2.0
- API keys with rate limiting

## Content Type

All requests and responses use:
```
Content-Type: application/json
```

---

## Payments API

### Create Payment

Create a new payment transaction.

**Endpoint:** `POST /payments`

**Request Body:**
```json
{
  "amount": {
    "amount": 100.50,
    "currency": "EUR"
  },
  "customer": {
    "id": "optional_customer_id",
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+34123456789",
    "address": {
      "line1": "123 Main St",
      "city": "Madrid",
      "postalCode": "28001",
      "country": "ES"
    }
  },
  "paymentMethod": "card",
  "description": "Insurance premium payment",
  "metadata": {
    "policyId": "POL-12345",
    "type": "premium"
  },
  "returnUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel",
  "preferredProvider": "stripe"
}
```

**Response:** `201 Created`
```json
{
  "statusCode": 201,
  "data": {
    "success": true,
    "transactionId": "pi_3NqF8B2eZvKYlo2C0xyz",
    "provider": "stripe",
    "status": "pending",
    "amount": {
      "amount": 100.50,
      "currency": "EUR"
    },
    "paymentMethod": "card",
    "message": "Payment intent created successfully",
    "metadata": {
      "clientSecret": "pi_3NqF8B2eZvKYlo2C0xyz_secret_abc",
      "customerId": "cus_xyz123"
    }
  },
  "fraudCheck": {
    "riskScore": 15,
    "passed": true
  }
}
```

**Error Response:** `403 Forbidden` (Fraud detected)
```json
{
  "statusCode": 403,
  "message": "Payment blocked by fraud detection",
  "riskScore": 85,
  "flags": [
    "Email address is blacklisted",
    "High transaction amount"
  ],
  "recommendations": [
    "Block transaction immediately",
    "Review customer account for suspicious activity"
  ]
}
```

---

### Get Payment Status

Retrieve the current status of a payment.

**Endpoint:** `GET /payments/:transactionId`

**Query Parameters:**
- `provider` (required): Payment provider (stripe, redsys, bizum)

**Example:**
```
GET /payments/pi_3NqF8B2eZvKYlo2C0xyz?provider=stripe
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "success": true,
    "transactionId": "pi_3NqF8B2eZvKYlo2C0xyz",
    "provider": "stripe",
    "status": "completed",
    "amount": {
      "amount": 100.50,
      "currency": "EUR"
    },
    "paymentMethod": "card",
    "metadata": {
      "customerId": "cus_xyz123"
    }
  }
}
```

---

### Refund Payment

Refund a completed payment (full or partial).

**Endpoint:** `POST /payments/refund`

**Request Body:**
```json
{
  "transactionId": "pi_3NqF8B2eZvKYlo2C0xyz",
  "provider": "stripe",
  "amount": {
    "amount": 50.00,
    "currency": "EUR"
  },
  "reason": "customer_request",
  "metadata": {
    "refundReason": "Customer not satisfied"
  }
}
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "success": true,
    "refundId": "re_3NqF8B2eZvKYlo2C0xyz",
    "transactionId": "pi_3NqF8B2eZvKYlo2C0xyz",
    "amount": {
      "amount": 50.00,
      "currency": "EUR"
    },
    "status": "refunded",
    "reason": "customer_request",
    "message": "Refund created successfully"
  }
}
```

---

### Get Payment Statistics

Retrieve payment statistics for a date range.

**Endpoint:** `GET /payments/stats/overview`

**Query Parameters:**
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)

**Example:**
```
GET /payments/stats/overview?startDate=2024-01-01&endDate=2024-01-31
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "totalPayments": 1250,
    "successfulPayments": 1180,
    "failedPayments": 70,
    "totalAmount": {
      "amount": 125000.50,
      "currency": "EUR"
    },
    "byProvider": {
      "stripe": {
        "count": 800,
        "amount": {
          "amount": 80000.00,
          "currency": "EUR"
        }
      },
      "redsys": {
        "count": 350,
        "amount": {
          "amount": 35000.50,
          "currency": "EUR"
        }
      },
      "bizum": {
        "count": 100,
        "amount": {
          "amount": 10000.00,
          "currency": "EUR"
        }
      }
    }
  }
}
```

---

## Subscriptions API

### Create Subscription

Create a recurring subscription.

**Endpoint:** `POST /payments/subscriptions`

**Request Body:**
```json
{
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+34123456789"
  },
  "plan": {
    "id": "plan_monthly_premium",
    "name": "Monthly Premium",
    "amount": {
      "amount": 29.99,
      "currency": "EUR"
    },
    "interval": "month",
    "intervalCount": 1,
    "trialDays": 14
  },
  "provider": "stripe",
  "paymentMethod": "card",
  "metadata": {
    "policyId": "POL-12345"
  }
}
```

**Response:** `201 Created`
```json
{
  "statusCode": 201,
  "data": {
    "id": "sub_1NqF8B2eZvKYlo2C",
    "provider": "stripe",
    "customerId": "cus_xyz123",
    "planId": "price_1NqF8B2eZvKYlo2C",
    "status": "trialing",
    "currentPeriodStart": "2024-01-15T10:00:00.000Z",
    "currentPeriodEnd": "2024-02-15T10:00:00.000Z",
    "trialStart": "2024-01-15T10:00:00.000Z",
    "trialEnd": "2024-01-29T10:00:00.000Z",
    "metadata": {
      "policyId": "POL-12345"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### Get Subscription

Retrieve subscription details.

**Endpoint:** `GET /payments/subscriptions/:subscriptionId`

**Query Parameters:**
- `provider` (required): Payment provider

**Example:**
```
GET /payments/subscriptions/sub_1NqF8B2eZvKYlo2C?provider=stripe
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "id": "sub_1NqF8B2eZvKYlo2C",
    "provider": "stripe",
    "customerId": "cus_xyz123",
    "planId": "price_1NqF8B2eZvKYlo2C",
    "status": "active",
    "currentPeriodStart": "2024-02-15T10:00:00.000Z",
    "currentPeriodEnd": "2024-03-15T10:00:00.000Z",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-02-15T10:00:00.000Z"
  }
}
```

---

### Cancel Subscription

Cancel a subscription (immediate or at period end).

**Endpoint:** `POST /payments/subscriptions/cancel`

**Request Body:**
```json
{
  "subscriptionId": "sub_1NqF8B2eZvKYlo2C",
  "provider": "stripe",
  "immediate": false
}
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "id": "sub_1NqF8B2eZvKYlo2C",
    "provider": "stripe",
    "status": "active",
    "cancelAt": "2024-03-15T10:00:00.000Z",
    "canceledAt": "2024-02-20T10:00:00.000Z"
  }
}
```

---

## Health & Monitoring

### Health Check

Check health status of all payment providers.

**Endpoint:** `GET /payments/health/check`

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "stripe": {
      "healthy": true,
      "message": "Stripe API is accessible"
    },
    "redsys": {
      "healthy": true,
      "message": "Redsys provider configured correctly"
    },
    "bizum": {
      "healthy": false,
      "message": "Connection timeout"
    }
  }
}
```

---

## Webhooks

### Stripe Webhook

Receives Stripe webhook events.

**Endpoint:** `POST /webhooks/stripe`

**Headers:**
- `stripe-signature`: Stripe signature for verification

**Request Body:** Raw Stripe event JSON

**Response:** `200 OK`
```json
{
  "received": true
}
```

---

### Redsys Webhook

Receives Redsys webhook notifications.

**Endpoint:** `POST /webhooks/redsys`

**Request Body:**
```json
{
  "Ds_SignatureVersion": "HMAC_SHA256_V1",
  "Ds_MerchantParameters": "base64_encoded_params",
  "Ds_Signature": "signature_hash"
}
```

**Response:** `200 OK`
```json
{
  "received": true
}
```

---

### Bizum Webhook

Receives Bizum webhook events.

**Endpoint:** `POST /webhooks/bizum`

**Headers:**
- `x-signature`: Bizum signature for verification

**Request Body:** Bizum event JSON

**Response:** `200 OK`
```json
{
  "received": true
}
```

---

## Data Types

### Currency

Supported currencies:
- `EUR` - Euro
- `USD` - US Dollar
- `GBP` - British Pound

### Payment Status

- `pending` - Payment initiated
- `processing` - Payment being processed
- `completed` - Payment successful
- `failed` - Payment failed
- `cancelled` - Payment cancelled
- `refunded` - Payment refunded
- `partially_refunded` - Partial refund applied

### Payment Provider

- `stripe` - Stripe
- `redsys` - Redsys TPV
- `bizum` - Bizum

### Payment Method

- `card` - Credit/Debit card
- `bank_transfer` - Bank transfer
- `direct_debit` - Direct debit
- `mobile_payment` - Mobile payment (Bizum)
- `wallet` - Digital wallet

### Refund Reason

- `customer_request` - Customer requested
- `duplicate` - Duplicate transaction
- `fraudulent` - Fraudulent transaction
- `error` - Error or mistake
- `other` - Other reason

### Subscription Status

- `active` - Subscription active
- `past_due` - Payment past due
- `unpaid` - Unpaid
- `cancelled` - Cancelled
- `incomplete` - Incomplete setup
- `incomplete_expired` - Setup expired
- `trialing` - In trial period

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid data |
| 403 | Forbidden - Fraud detection block |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Detailed error message"
}
```

---

## Rate Limits

(To be implemented)

Recommended limits:
- 100 requests per minute per IP
- 1000 requests per hour per API key

---

## Changelog

### Version 1.0.0 (2024-01-28)
- Initial release
- Stripe, Redsys, Bizum support
- Automatic failover
- Fraud detection
- Payment reconciliation
- Comprehensive API

---

## Support

For API support:
- Email: api-support@ait-core.com
- Documentation: https://docs.ait-core.com
- Status: https://status.ait-core.com
