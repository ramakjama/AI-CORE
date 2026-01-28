# AIT Payment Gateway

Multi-provider payment gateway supporting **Stripe**, **Redsys**, and **Bizum** with automatic failover, fraud detection, and comprehensive reconciliation.

## Features

### Multi-Provider Support
- **Stripe**: International payments, subscriptions, and advanced features
- **Redsys**: Spanish TPV Virtual with SHA-256 signature
- **Bizum**: Spanish mobile payments (P2P and e-commerce)

### Core Capabilities
- ✅ One-time payments
- ✅ Recurring subscriptions
- ✅ Refund management
- ✅ Customer management
- ✅ Automatic provider failover
- ✅ Payment reconciliation
- ✅ Fraud detection (basic)
- ✅ Webhook handling
- ✅ Transaction logging
- ✅ Comprehensive API documentation

### Advanced Features
- **Automatic Failover**: Seamlessly switch between providers on failure
- **Fraud Detection**: Real-time risk scoring with customizable rules
- **Reconciliation**: Automated daily reconciliation with discrepancy detection
- **Multi-Currency**: Support for EUR, USD, and GBP
- **Webhook Security**: Signature verification for all providers

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file based on `.env.example`:

```env
# Application
NODE_ENV=development
PORT=3000

# Payment Gateway
PAYMENT_ENABLE_FAILOVER=true
PAYMENT_MAX_RETRIES=3

# Stripe
STRIPE_ENABLED=true
STRIPE_PRIORITY=1
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Redsys
REDSYS_ENABLED=true
REDSYS_PRIORITY=2
REDSYS_MERCHANT_CODE=999008881
REDSYS_TERMINAL=1
REDSYS_SECRET_KEY=sq7HjrUOBfKmC576ILgskD5srU870gJ7
REDSYS_TEST_MODE=true

# Bizum
BIZUM_ENABLED=true
BIZUM_PRIORITY=3
BIZUM_MERCHANT_ID=merchant_xxx
BIZUM_API_KEY=api_key_xxx
BIZUM_API_SECRET=api_secret_xxx
BIZUM_TEST_MODE=true

# Fraud Detection
FRAUD_MAX_RISK_SCORE=70
```

## Usage

### Start the Service

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### API Documentation

Once running, access Swagger documentation at:
```
http://localhost:3000/api/docs
```

## API Examples

### Create a Payment

```typescript
POST /payments
{
  "amount": {
    "amount": 100.50,
    "currency": "EUR"
  },
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+34123456789"
  },
  "description": "Insurance premium payment",
  "preferredProvider": "stripe",
  "returnUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

**Response:**
```json
{
  "statusCode": 201,
  "data": {
    "success": true,
    "transactionId": "pi_xxx",
    "provider": "stripe",
    "status": "pending",
    "amount": {
      "amount": 100.50,
      "currency": "EUR"
    },
    "metadata": {
      "clientSecret": "pi_xxx_secret_xxx"
    }
  },
  "fraudCheck": {
    "riskScore": 15,
    "passed": true
  }
}
```

### Get Payment Status

```typescript
GET /payments/:transactionId?provider=stripe
```

### Refund a Payment

```typescript
POST /payments/refund
{
  "transactionId": "pi_xxx",
  "provider": "stripe",
  "amount": {
    "amount": 50.00,
    "currency": "EUR"
  },
  "reason": "customer_request"
}
```

### Create a Subscription

```typescript
POST /payments/subscriptions
{
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe"
  },
  "plan": {
    "id": "plan_monthly",
    "name": "Monthly Premium",
    "amount": {
      "amount": 29.99,
      "currency": "EUR"
    },
    "interval": "month",
    "intervalCount": 1
  },
  "provider": "stripe",
  "trialDays": 14
}
```

### Cancel a Subscription

```typescript
POST /payments/subscriptions/cancel
{
  "subscriptionId": "sub_xxx",
  "provider": "stripe",
  "immediate": false
}
```

### Health Check

```typescript
GET /payments/health/check
```

**Response:**
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
      "healthy": true,
      "message": "Bizum API is accessible"
    }
  }
}
```

## Webhooks

### Webhook Endpoints

Each provider has its own webhook endpoint:

- **Stripe**: `POST /webhooks/stripe`
- **Redsys**: `POST /webhooks/redsys`
- **Bizum**: `POST /webhooks/bizum`

### Configure Webhooks

#### Stripe
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/webhooks/stripe`
3. Select events: `payment_intent.*`, `charge.refunded`, `customer.subscription.*`
4. Copy webhook secret to `.env`

#### Redsys
Configure in merchant settings:
- Notification URL: `https://your-domain.com/webhooks/redsys`

#### Bizum
Configure in API settings:
- Webhook URL: `https://your-domain.com/webhooks/bizum`

## Provider Failover

The payment gateway automatically attempts alternative providers on failure:

```typescript
// Priority order (configurable via environment variables)
1. Stripe (priority: 1)
2. Redsys (priority: 2)
3. Bizum (priority: 3)

// If Stripe fails, automatically tries Redsys
// If Redsys fails, automatically tries Bizum
// Returns aggregated result
```

Disable failover:
```env
PAYMENT_ENABLE_FAILOVER=false
```

## Fraud Detection

### Features
- Email blacklisting
- IP blacklisting
- High-value transaction detection
- Velocity checks (rapid transactions)
- Failed attempt tracking
- Suspicious pattern detection
- Time-based anomaly detection

### Risk Scoring
- **0-30**: Low risk - Standard processing
- **30-50**: Medium risk - Enhanced monitoring
- **50-70**: High risk - Additional verification recommended
- **70+**: Critical risk - Transaction blocked

### Example: Custom Fraud Rules

```typescript
// Transaction is automatically checked for fraud before processing
const fraudCheck = await fraudDetectionService.checkPayment({
  customer: { email: 'user@example.com', name: 'User' },
  amount: { amount: 500, currency: 'EUR' },
  ipAddress: '192.168.1.1',
  timestamp: new Date()
});

if (!fraudCheck.passed) {
  // Transaction blocked
  console.log('Risk score:', fraudCheck.riskScore);
  console.log('Flags:', fraudCheck.flags);
  console.log('Recommendations:', fraudCheck.recommendations);
}
```

## Payment Reconciliation

### Automatic Daily Reconciliation

Runs every day at midnight to:
- Compare local records with provider data
- Detect discrepancies (status, amount, missing transactions)
- Generate reconciliation reports
- Send alerts for critical issues

### Manual Reconciliation

```typescript
// Reconcile specific provider
const report = await reconciliationService.reconcileProvider(
  PaymentProvider.STRIPE,
  startDate,
  endDate
);

// Reconcile all providers
const reports = await reconciliationService.reconcileAll(
  startDate,
  endDate
);
```

### Get Statistics

```typescript
GET /payments/stats/overview?startDate=2024-01-01&endDate=2024-01-31
```

**Response:**
```json
{
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
      "amount": { "amount": 80000, "currency": "EUR" }
    },
    "redsys": {
      "count": 350,
      "amount": { "amount": 35000, "currency": "EUR" }
    },
    "bizum": {
      "count": 100,
      "amount": { "amount": 10000, "currency": "EUR" }
    }
  }
}
```

## Integration Examples

### With AIT Policy Manager

```typescript
import { PaymentOrchestratorService } from '@ait-core/payment-gateway';

// Pay insurance premium
async function payPremium(policyId: string, amount: number) {
  const paymentResult = await paymentOrchestrator.createPayment({
    amount: { amount, currency: Currency.EUR },
    customer: policy.customer,
    description: `Premium payment for policy ${policyId}`,
    metadata: { policyId, type: 'premium' }
  });

  if (paymentResult.success) {
    await policyManager.recordPremiumPayment(policyId, paymentResult.transactionId);
  }
}
```

### With AIT Claim Processor

```typescript
// Pay claim settlement
async function payClaim(claimId: string, amount: number) {
  const paymentResult = await paymentOrchestrator.createPayment({
    amount: { amount, currency: Currency.EUR },
    customer: claim.customer,
    description: `Claim settlement ${claimId}`,
    metadata: { claimId, type: 'settlement' }
  });

  if (paymentResult.success) {
    await claimProcessor.recordSettlement(claimId, paymentResult.transactionId);
  }
}
```

## Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Test Coverage
- **60+ comprehensive tests**
- Providers: Stripe, Redsys, Bizum
- Services: Orchestrator, Reconciliation, Fraud Detection
- Controllers: Payment, Webhook

## Architecture

```
src/
├── interfaces/
│   ├── payment-provider.interface.ts  # Provider abstraction
│   └── payment.types.ts               # Type definitions
├── providers/
│   ├── stripe/
│   │   └── stripe.provider.ts         # Stripe implementation
│   ├── redsys/
│   │   └── redsys.provider.ts         # Redsys implementation
│   └── bizum/
│       └── bizum.provider.ts          # Bizum implementation
├── services/
│   ├── payment-orchestrator.service.ts      # Multi-provider orchestration
│   ├── payment-reconciliation.service.ts    # Reconciliation & reporting
│   └── fraud-detection.service.ts           # Fraud detection
├── controllers/
│   └── payment.controller.ts          # REST API endpoints
├── webhooks/
│   └── webhook.controller.ts          # Webhook handlers
├── dto/
│   └── payment.dto.ts                 # Request/Response DTOs
└── payment-gateway.module.ts          # Module definition
```

## Security

### Best Practices
✅ Webhook signature verification
✅ Environment variable configuration
✅ Request validation with class-validator
✅ Rate limiting (recommended via middleware)
✅ HTTPS only in production
✅ PCI DSS compliance considerations

### Important Notes
- **Never log** sensitive card data
- **Always use** webhook signatures
- **Store** API keys securely (use vault in production)
- **Validate** all user input
- **Monitor** for suspicious activity

## Deployment

### Environment Variables Checklist
- [ ] All provider API keys configured
- [ ] Webhook secrets set
- [ ] Fraud detection thresholds configured
- [ ] Database connection (if using persistent storage)
- [ ] CORS origins restricted to allowed domains
- [ ] NODE_ENV set to 'production'

### Production Considerations
- Use a proper database (PostgreSQL, MongoDB) for transaction logs
- Implement rate limiting
- Set up monitoring and alerting
- Configure proper logging (Winston, Pino)
- Use a queue system (Bull, RabbitMQ) for webhook processing
- Implement circuit breakers for provider calls
- Set up backup payment providers

## Troubleshooting

### Common Issues

**Payment fails with all providers**
- Check API keys and secrets
- Verify providers are enabled in `.env`
- Check network connectivity
- Review logs for specific errors

**Webhook signature verification fails**
- Ensure webhook secret matches provider configuration
- Check that raw body is preserved
- Verify webhook URL is correct

**Fraud detection blocking valid payments**
- Adjust `FRAUD_MAX_RISK_SCORE` threshold
- Review and customize fraud rules
- Whitelist trusted customers/IPs

## Contributing

When adding a new payment provider:

1. Create provider class implementing `IPaymentProvider`
2. Add provider to `PaymentOrchestratorService`
3. Add webhook endpoint in `WebhookController`
4. Add environment variables
5. Write comprehensive tests
6. Update documentation

## License

MIT License - AIT Core Team

## Support

For issues or questions:
- Open an issue on GitHub
- Contact: dev@ait-core.com

---

**Built with ❤️ for the insurance industry**
