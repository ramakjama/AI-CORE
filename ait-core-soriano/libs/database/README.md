# @ait-core/database

Prisma database schemas and clients for AIT-CORE Soriano Mediadores.

## Architecture

The system uses 40 specialized PostgreSQL databases for optimal performance, scalability, and separation of concerns:

### Core Business Databases (6)
1. **Policies** - Insurance policies, coverages, endorsements
2. **Claims** - Claims management, adjustments, settlements
3. **Customers** - CRM, contacts, relationships
4. **Finance** - Payments, invoices, commissions, accounting
5. **Documents** - Document storage, versioning, metadata
6. **Quotes** - Quote requests, calculations, comparisons

### Insurance Specialized Databases (12)
7. **Auto Insurance** - Vehicles, drivers, auto-specific data
8. **Home Insurance** - Properties, home-specific coverages
9. **Health Insurance** - Medical records, providers, health plans
10. **Life Insurance** - Beneficiaries, underwriting data
11. **Business Insurance** - Commercial policies, business assets
12. **Travel Insurance** - Travel plans, destinations
13. **Liability Insurance** - Liability coverages
14. **Marine Insurance** - Maritime assets, cargo
15. **Agricultural Insurance** - Crops, livestock
16. **Construction Insurance** - Construction projects
17. **Cyber Insurance** - Cyber risks, data breach coverage
18. **Pet Insurance** - Pets, veterinary coverage

### Marketing & Sales Databases (5)
19. **Campaigns** - Marketing campaigns, performance
20. **Leads** - Lead generation, scoring, nurturing
21. **Sales Pipeline** - Opportunities, forecasting
22. **Referrals** - Referral programs, partner tracking
23. **Loyalty** - Loyalty programs, rewards

### Analytics & Intelligence Databases (5)
24. **Analytics** - Data warehouse, aggregated metrics
25. **Reporting** - Report definitions, scheduled reports
26. **Actuarial** - Risk modeling, actuarial calculations
27. **Fraud Detection** - Fraud patterns, risk scores
28. **Predictive Models** - ML models, predictions

### Security & Compliance Databases (3)
29. **Auth** - Users, roles, permissions, sessions
30. **Audit** - Audit trails, compliance logs
31. **Compliance** - Regulatory requirements

### Infrastructure Databases (4)
32. **Notifications** - Notification queue, delivery tracking
33. **Email Queue** - Email templates, send queue
34. **File Storage** - File metadata, storage locations
35. **Cache** - Application cache, session storage

### Integration & Automation Databases (5)
36. **API Gateway** - API keys, rate limits, usage tracking
37. **Workflow** - Workflow definitions, executions
38. **Event Store** - Event sourcing, domain events
39. **Integration** - External system integrations
40. **Job Scheduler** - Scheduled jobs, cron definitions

## Installation

This package is part of the AIT-CORE monorepo and is automatically available to all workspace packages.

## Usage

### Import Database Clients

```typescript
import {
  policiesDb,
  claimsDb,
  customersDb,
  financeDb,
} from '@ait-core/database';

// Query policies
const policies = await policiesDb.policy.findMany({
  where: { status: 'ACTIVE' },
  include: { coverages: true },
});

// Create a claim
const claim = await claimsDb.claim.create({
  data: {
    claimNumber: 'CLM-12345',
    policyId: 'policy-uuid',
    type: 'ACCIDENT',
    status: 'SUBMITTED',
    amount: 5000,
    incidentDate: new Date(),
    description: 'Vehicle accident',
  },
});
```

### Connection Management

```typescript
import {
  connectAllDatabases,
  disconnectAllDatabases,
  checkAllDatabasesHealth,
} from '@ait-core/database';

// Connect to all databases
await connectAllDatabases();

// Check health
const health = await checkAllDatabasesHealth();
console.log(health);

// Graceful shutdown (automatic on SIGINT/SIGTERM)
await disconnectAllDatabases();
```

### Transaction Management

```typescript
import { connectionManager } from '@ait-core/database';

// Execute transaction across multiple databases
const result = await connectionManager.executeTransaction(
  ['policies', 'finance'],
  async ({ policies, finance }) => {
    // Create policy
    const policy = await policies.policy.create({
      data: { /* ... */ },
    });

    // Create payment
    const payment = await finance.payment.create({
      data: {
        policyId: policy.id,
        amount: policy.premium,
        /* ... */
      },
    });

    return { policy, payment };
  }
);
```

## Environment Variables

Configure database URLs in your `.env` file:

```bash
# Main database URL (fallback)
DATABASE_URL="postgresql://user:password@localhost:5432/ait_core"

# Specific database URLs (optional, will use main URL if not set)
DATABASE_URL_POLICIES="postgresql://user:password@localhost:5432/ait_policies"
DATABASE_URL_CLAIMS="postgresql://user:password@localhost:5432/ait_claims"
DATABASE_URL_CUSTOMERS="postgresql://user:password@localhost:5432/ait_customers"
# ... add all 40 databases
```

## Scripts

```bash
# Generate Prisma clients
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed databases
pnpm db:seed

# Open Prisma Studio
pnpm db:studio
```

## Best Practices

1. **Always use connection manager** for health checks and graceful shutdown
2. **Use specific database clients** instead of importing all at once
3. **Implement proper error handling** for database operations
4. **Use transactions** for multi-step operations
5. **Monitor connection pool metrics** in production
6. **Implement retry logic** for transient failures
7. **Use read replicas** for read-heavy operations (configure separately)

## Production Deployment

For production deployment:

1. **Database Replication**: Set up master-slave replication for read scalability
2. **Connection Pooling**: Use PgBouncer or similar for connection pooling
3. **Backup Strategy**: Implement automated backups for all databases
4. **Monitoring**: Set up monitoring and alerting for database health
5. **Migrations**: Use Prisma Migrate for schema changes
6. **Performance**: Index optimization and query performance monitoring

## License

PROPRIETARY - AIT-CORE Soriano Mediadores
