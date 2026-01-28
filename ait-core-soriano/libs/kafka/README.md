# @ait-core/kafka

Kafka event streaming library for AIT-CORE Soriano Mediadores.

## Features

- **Producer**: Send messages and domain events to Kafka
- **Consumer**: Consume messages with automatic retries and error handling
- **Event Bus**: High-level abstraction for publish-subscribe patterns
- **Event Schemas**: Zod-based event validation
- **Type Safety**: Full TypeScript support with type inference
- **Connection Management**: Automatic connection handling and graceful shutdown
- **Transaction Support**: Transactional message sending

## Installation

This package is part of the AIT-CORE monorepo and is automatically available to all workspace packages.

## Usage

### Producer - Sending Events

```typescript
import { getProducer } from '@ait-core/kafka';

const producer = getProducer();
await producer.connect();

// Send a single message
await producer.send('policy.created', {
  key: 'policy-123',
  value: JSON.stringify({ policyNumber: 'POL-12345', customerId: 'customer-456' }),
});

// Send a domain event
await producer.sendEvent({
  id: 'event-uuid',
  type: 'policy.created',
  aggregateId: 'policy-123',
  aggregateType: 'Policy',
  version: 1,
  data: { policyNumber: 'POL-12345', customerId: 'customer-456' },
  metadata: { userId: 'user-789' },
  timestamp: new Date(),
});

await producer.disconnect();
```

### Consumer - Receiving Events

```typescript
import { createConsumer } from '@ait-core/kafka';

const consumer = createConsumer({
  groupId: 'policy-service',
  topics: ['policy.created', 'policy.updated'],
});

await consumer.connect();

// Register handlers
consumer.on('policy.created', async (message, context) => {
  const event = consumer.parseDomainEvent(message);
  console.log('Policy created:', event.data);
});

consumer.on('policy.updated', async (message, context) => {
  const event = consumer.parseDomainEvent(message);
  console.log('Policy updated:', event.data);
});

// Start consuming
await consumer.run();
```

### Event Bus - High-Level API

```typescript
import { initializeEventBus } from '@ait-core/kafka';

const eventBus = await initializeEventBus();

// Publish an event
await eventBus.publish(
  'policy.created',
  'policy-123',
  'Policy',
  {
    policyNumber: 'POL-12345',
    customerId: 'customer-456',
    premium: 1200,
  },
  { userId: 'user-789' }
);

// Subscribe to events
await eventBus.subscribe(
  'claims-service',
  ['policy.created', 'policy.cancelled'],
  async (event, context) => {
    console.log(`Received ${event.type}:`, event.data);
    // Process event
  }
);

// Shutdown
await eventBus.shutdown();
```

### Event Validation

```typescript
import {
  policyCreatedEventSchema,
  validateEvent,
  validateEventSafe,
} from '@ait-core/kafka';

// Strict validation (throws on error)
const policyData = validateEvent(policyCreatedEventSchema, eventData);

// Safe validation (returns result object)
const result = validateEventSafe(policyCreatedEventSchema, eventData);
if (result.success) {
  console.log('Valid event:', result.data);
} else {
  console.error('Invalid event:', result.error);
}
```

### Batch Processing

```typescript
const consumer = createConsumer({
  groupId: 'analytics-service',
  topics: ['analytics.event'],
});

await consumer.connect();

await consumer.runBatch(async ({ batch, resolveOffset, heartbeat }) => {
  for (const message of batch.messages) {
    // Process message
    await processAnalyticsEvent(message);

    // Commit offset
    resolveOffset(message.offset);

    // Send heartbeat
    await heartbeat();
  }
});
```

### Transaction Support

```typescript
const producer = getProducer();
await producer.connect();

await producer.sendTransaction(async (transaction) => {
  // Send multiple messages in a transaction
  await transaction.send({
    topic: 'policy.created',
    messages: [{ key: 'policy-1', value: '...' }],
  });

  await transaction.send({
    topic: 'payment.initiated',
    messages: [{ key: 'payment-1', value: '...' }],
  });

  // Both messages will be committed atomically
});
```

## Event Topics

The library uses predefined topics from `@ait-core/shared`:

### Policy Events
- `policy.created`
- `policy.updated`
- `policy.cancelled`
- `policy.renewed`

### Claim Events
- `claim.submitted`
- `claim.approved`
- `claim.rejected`
- `claim.paid`

### Payment Events
- `payment.initiated`
- `payment.completed`
- `payment.failed`

### Customer Events
- `customer.created`
- `customer.updated`

### Notification Events
- `notification.send`
- `email.send`
- `sms.send`

### Analytics Events
- `analytics.event`
- `audit.log`

## Configuration

Set environment variables:

```bash
# Kafka brokers
KAFKA_BROKERS=localhost:9092,localhost:9093

# Client ID
KAFKA_CLIENT_ID=ait-core

# SSL (optional)
KAFKA_SSL_ENABLED=true

# SASL Authentication (optional)
KAFKA_SASL_MECHANISM=plain
KAFKA_SASL_USERNAME=your-username
KAFKA_SASL_PASSWORD=your-password
```

## Best Practices

1. **Always use event schemas** for validation
2. **Handle errors gracefully** in consumers
3. **Use correlation IDs** for distributed tracing
4. **Implement idempotency** in event handlers
5. **Monitor lag** and consumer health
6. **Use dead letter queues** for failed messages
7. **Batch operations** when processing high volumes
8. **Commit offsets** only after successful processing

## Error Handling

```typescript
consumer.on('policy.created', async (message, context) => {
  try {
    const event = consumer.parseDomainEvent(message);
    await processPolicy(event.data);
  } catch (error) {
    logger.error('Failed to process policy event', { error });

    // Send to dead letter queue
    await producer.send('dlq.policy.created', {
      key: message.key?.toString(),
      value: message.value?.toString(),
      headers: {
        ...message.headers,
        error: error.message,
        failedAt: new Date().toISOString(),
      },
    });

    // Don't throw - message will be committed
  }
});
```

## License

PROPRIETARY - AIT-CORE Soriano Mediadores
