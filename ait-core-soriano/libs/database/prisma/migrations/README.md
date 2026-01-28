# AIT-CORE Database Migrations

## Overview

This directory contains production-ready Prisma migrations for all 40 databases in the AIT-CORE insurance platform ecosystem.

## Database Architecture

The system uses a microservices-based multi-database architecture where each domain has its own dedicated PostgreSQL database for:

- **Data isolation**: Each domain is completely isolated
- **Scalability**: Independent scaling per database
- **Performance**: Optimized queries per domain
- **Security**: Granular access control
- **Compliance**: Domain-specific data retention

## Migration Structure

Each migration file follows the naming convention:
```
YYYYMMDDHHMMSS_init_dbXX_domain_name/migration.sql
```

### Database List

| DB# | Database Name | Domain | Tables | Description |
|-----|---------------|--------|--------|-------------|
| 01 | Policies | Core | 3 | Policy management, coverages, endorsements |
| 02 | Claims | Core | 3 | Claims processing, documents, adjustments |
| 03 | Customers | CRM | 4 | Customer data, addresses, contacts, notes |
| 04 | Finance | Finance | 3 | Payments, invoices, commissions |
| 05 | Agents | HR | 3 | Agent management, certifications, territories |
| 06 | Products | Catalog | 4 | Insurance products, coverages, rules, pricing |
| 07 | Quotes | Sales | 3 | Quote generation, items, history |
| 08 | Underwriting | Operations | 3 | Underwriting cases, documents, risk assessments |
| 09 | Reinsurance | Finance | 3 | Reinsurance contracts, cessions, claims |
| 10 | Documents | DMS | 3 | Document management, versions, signatures |
| 11 | Notifications | Communication | 3 | Notifications, templates, preferences |
| 12 | Tasks | Workflow | 3 | Task management, comments, attachments |
| 13 | Calendar | Scheduling | 3 | Events, attendees, reminders |
| 14 | Marketing | Marketing | 4 | Campaigns, messages, leads, activities |
| 15 | Analytics | BI | 3 | Events, sessions, metrics |
| 16 | Reporting | BI | 3 | Reports, executions, dashboards |
| 17 | Integrations | Integration | 4 | Integrations, logs, webhooks, deliveries |
| 18 | Compliance | Governance | 4 | Rules, checks, GDPR, retention policies |
| 19 | Workflows | Automation | 3 | Workflow definitions, instances, executions |
| 20 | Vehicles | Assets | 3 | Vehicle registry, inspections, modifications |
| 21 | Properties | Assets | 3 | Property registry, valuations, risks |
| 22 | Insurers | Partners | 3 | Insurer management, contacts, agreements |
| 23 | Actuarial | Analytics | 4 | Mortality tables, loss ratios, reserves, pricing models |
| 24 | Territories | Geography | 3 | Territories, risks, statistics |
| 25 | Pricing | Sales | 4 | Pricing rules, discounts, surcharges, calculations |
| 26 | Renewals | Operations | 3 | Renewal processes, reminders, quotes |
| 27 | Fraud Detection | Security | 4 | Fraud rules, alerts, investigations, blacklist |
| 28 | Performance | HR | 4 | KPIs, values, scorecards, goals |
| 29 | Authentication | Security | 7 | Users, sessions, permissions, roles, password resets |
| 30 | Audit Logs | Governance | 4 | Audit logs, system logs, API logs, security events |
| 31 | Beneficiaries | Core | 3 | Policy beneficiaries, changes, payouts |
| 32 | Medical Records | Health | 3 | Medical records, questionnaires, examinations |
| 33 | Training | HR | 4 | Training courses, sessions, enrollments, assessments |
| 34 | Complaints | Customer Service | 3 | Complaints, responses, escalations |
| 35 | Surveys | Customer Experience | 3 | Surveys, responses, analytics |
| 36 | Referrals | Marketing | 3 | Referral programs, referrals, rewards |
| 37 | Loyalty | Marketing | 4 | Loyalty programs, accounts, transactions, redemptions |
| 38 | Content Management | CMS | 4 | Pages, categories, media, translations |
| 39 | Email Templates | Communication | 4 | Email templates, campaigns, logs, unsubscribes |
| 40 | System Config | System | 5 | Settings, feature flags, API keys, scheduled jobs, executions |

## Migration Features

### Production-Ready Schema

All migrations include:

1. **Complete Table Definitions**
   - Primary keys with UUID generation
   - Appropriate data types (TEXT, INTEGER, DECIMAL, TIMESTAMP, JSONB, BOOLEAN)
   - NOT NULL constraints
   - DEFAULT values
   - Timestamp tracking (createdAt, updatedAt)

2. **Optimized Indexes**
   - Primary key indexes (automatic)
   - Foreign key indexes
   - Query optimization indexes
   - Composite indexes where needed
   - Unique constraints

3. **Foreign Key Relationships**
   - CASCADE delete for child records
   - SET NULL for optional references
   - Referential integrity enforcement

4. **Advanced Features**
   - JSONB columns for flexible metadata
   - Array columns for multi-value fields
   - Decimal precision for financial data
   - Timestamp with timezone (TIMESTAMP(3))

## Running Migrations

### Initial Setup

```bash
# Set database URL for each database
export DATABASE_URL="postgresql://user:password@localhost:5432/ait_core_db01_policies"

# Run migration
npx prisma migrate deploy
```

### For All Databases

You'll need to run migrations for each of the 40 databases:

```bash
# DB-01: Policies
export DATABASE_URL="postgresql://user:password@localhost:5432/ait_core_db01_policies"
npx prisma migrate deploy --schema=./prisma/schema.db01.prisma

# DB-02: Claims
export DATABASE_URL="postgresql://user:password@localhost:5432/ait_core_db02_claims"
npx prisma migrate deploy --schema=./prisma/schema.db02.prisma

# ... repeat for all 40 databases
```

### Automated Deployment

Use the provided deployment script:

```bash
./scripts/migrate-all-databases.sh
```

## Schema Evolution

### Adding New Columns

```sql
-- Example migration
ALTER TABLE "policies" ADD COLUMN "newField" TEXT;
CREATE INDEX "policies_newField_idx" ON "policies"("newField");
```

### Modifying Columns

```sql
-- Example migration
ALTER TABLE "policies" ALTER COLUMN "status" TYPE VARCHAR(50);
```

### Adding Relationships

```sql
-- Example migration
ALTER TABLE "child_table"
  ADD CONSTRAINT "child_table_parentId_fkey"
  FOREIGN KEY ("parentId")
  REFERENCES "parent_table"("id")
  ON DELETE CASCADE;
```

## Best Practices

1. **Never Edit Existing Migrations**: Always create new migrations for changes
2. **Test Migrations**: Test on development/staging before production
3. **Backup Data**: Always backup before running migrations in production
4. **Monitor Performance**: Check query performance after adding indexes
5. **Version Control**: Keep migrations in version control
6. **Documentation**: Document complex migrations

## Index Strategy

### Primary Indexes
- UUID primary keys on all tables
- Automatic B-tree indexes

### Foreign Key Indexes
- All foreign key columns indexed for JOIN performance
- Composite indexes for multi-column foreign keys

### Query Optimization Indexes
- Status fields (for filtering active/inactive records)
- Date fields (for time-based queries)
- Email/identity fields (for lookups)
- Type/category fields (for grouping)

### Unique Indexes
- Business keys (policyNumber, claimNumber, etc.)
- Email addresses
- Natural unique identifiers

## Performance Considerations

### JSONB Usage
- Used for flexible metadata storage
- Indexed with GIN indexes when needed
- Avoids schema changes for volatile data

### Decimal Precision
- Financial amounts: DECIMAL(10,2) - up to 99,999,999.99
- Large amounts: DECIMAL(12,2) - up to 9,999,999,999.99
- Percentages: DECIMAL(5,2) - up to 100.00
- Rates: DECIMAL(5,4) - up to 9.9999

### Timestamp Precision
- TIMESTAMP(3) for millisecond precision
- All timestamps include timezone information
- Automatic timestamp tracking with @updatedAt

## Security Considerations

1. **Sensitive Data**: Medical records, passwords encrypted at application level
2. **Audit Trail**: All modifications tracked in audit logs
3. **Soft Deletes**: Consider soft deletes for critical data
4. **Data Retention**: Compliance with GDPR and regulations

## Rollback Strategy

To rollback migrations:

```bash
# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Or manually rollback SQL
psql -U user -d database -c "DROP TABLE table_name CASCADE;"
```

## Monitoring

Monitor migration execution:

1. Check migration status: `npx prisma migrate status`
2. Monitor database logs
3. Check table sizes: `SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema');`
4. Monitor index usage

## Support

For issues or questions:
- Review Prisma documentation: https://www.prisma.io/docs
- Check PostgreSQL documentation: https://www.postgresql.org/docs
- Contact: tech@ait-core.com

---

**Generated**: 2026-01-28
**Version**: 1.0.0
**Prisma Version**: 5.x
**PostgreSQL Version**: 14+
