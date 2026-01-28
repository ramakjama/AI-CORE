# Database Migration Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Prisma migrations to all 40 AIT-CORE databases.

## Prerequisites

1. **PostgreSQL 14+** installed and running
2. **Node.js 18+** and npm/pnpm installed
3. **Prisma CLI** installed (`npm install -g prisma`)
4. **Database credentials** with CREATE DATABASE and ALTER TABLE permissions
5. **Backup tools** (pg_dump, pg_restore) for production deployments

## Environment Setup

### Development Environment

```bash
# Set environment variables
export DB_HOST=localhost
export DB_PORT=5432
export DB_USER=postgres
export DB_PASSWORD=your_password
export NODE_ENV=development
```

### Staging Environment

```bash
# Set environment variables
export DB_HOST=staging-db.your-domain.com
export DB_PORT=5432
export DB_USER=ait_core_user
export DB_PASSWORD=your_secure_password
export NODE_ENV=staging
```

### Production Environment

```bash
# Set environment variables (use secrets management in production)
export DB_HOST=prod-db.your-domain.com
export DB_PORT=5432
export DB_USER=ait_core_user
export DB_PASSWORD=your_very_secure_password
export NODE_ENV=production
```

## Deployment Methods

### Method 1: Automated Deployment (Recommended)

Use the provided deployment script for all databases:

```bash
# Make script executable
chmod +x deploy-all-migrations.sh

# Deploy to development
./deploy-all-migrations.sh development

# Deploy to staging
./deploy-all-migrations.sh staging

# Deploy to production (with confirmations)
./deploy-all-migrations.sh production
```

The script will:
- Create databases if they don't exist
- Backup existing databases (production only)
- Run migrations sequentially
- Log all operations
- Provide a summary report

### Method 2: Manual Deployment (Single Database)

Deploy migrations to a specific database:

```bash
# Set DATABASE_URL for the target database
export DATABASE_URL="postgresql://user:password@localhost:5432/ait_core_db01_policies"

# Check migration status
npx prisma migrate status

# Deploy migrations
npx prisma migrate deploy

# Verify deployment
npx prisma migrate status
```

### Method 3: Database-by-Database Deployment

For controlled, incremental deployment:

```bash
# Core databases first (critical path)
export DATABASE_URL="postgresql://user:password@localhost:5432/ait_core_db01_policies"
npx prisma migrate deploy

export DATABASE_URL="postgresql://user:password@localhost:5432/ait_core_db02_claims"
npx prisma migrate deploy

export DATABASE_URL="postgresql://user:password@localhost:5432/ait_core_db03_customers"
npx prisma migrate deploy

# Continue with remaining databases...
```

## Pre-Deployment Checklist

### Development

- [ ] Local PostgreSQL is running
- [ ] Environment variables are set
- [ ] Prisma CLI is installed
- [ ] Test data backup (optional)

### Staging

- [ ] Staging database is accessible
- [ ] Database credentials are correct
- [ ] Database has sufficient storage space
- [ ] Monitoring tools are active
- [ ] Rollback plan is documented

### Production

- [ ] **CRITICAL**: Full database backups completed
- [ ] Maintenance window is scheduled
- [ ] Team is notified
- [ ] Rollback plan is tested
- [ ] Database credentials are secured
- [ ] Monitoring alerts are configured
- [ ] Health check endpoints are ready
- [ ] Migration tested on staging environment
- [ ] Change management approval obtained

## Step-by-Step Production Deployment

### 1. Pre-Deployment (1-2 hours before)

```bash
# 1.1 Verify database connectivity
for db in db01_policies db02_claims db03_customers; do
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d "ait_core_$db" -c "SELECT version();"
done

# 1.2 Check current migration status
for db in db01_policies db02_claims db03_customers; do
    export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/ait_core_$db"
    echo "Checking $db..."
    npx prisma migrate status
done

# 1.3 Create full backups
mkdir -p ./backups/$(date +%Y%m%d_%H%M%S)
for db in ait_core_db01_policies ait_core_db02_claims ait_core_db03_customers; do
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -F c -b -v -f "./backups/$(date +%Y%m%d_%H%M%S)/$db.backup" $db
done
```

### 2. Deployment Window

```bash
# 2.1 Enable maintenance mode (if applicable)
# Update your application to show maintenance page

# 2.2 Stop application servers
# Stop all services that connect to databases

# 2.3 Run migrations
./deploy-all-migrations.sh production

# 2.4 Verify migration success
# Check the log file for any errors

# 2.5 Verify table structures
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/ait_core_db01_policies"
npx prisma migrate status
```

### 3. Post-Deployment Verification

```bash
# 3.1 Verify tables exist
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d ait_core_db01_policies -c "\dt"

# 3.2 Verify indexes
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d ait_core_db01_policies -c "\di"

# 3.3 Check table row counts
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d ait_core_db01_policies -c "
SELECT schemaname, tablename, n_live_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;"

# 3.4 Start application servers
# Start services in order

# 3.5 Run smoke tests
# Test critical user flows

# 3.6 Disable maintenance mode
# Return application to normal operation
```

### 4. Monitoring (First 24 hours)

Monitor:
- Database CPU usage
- Query performance
- Connection pool utilization
- Error rates
- Application logs
- Database logs

## Database List

All 40 databases that will be created/migrated:

1. `ait_core_db01_policies` - Policy management
2. `ait_core_db02_claims` - Claims processing
3. `ait_core_db03_customers` - Customer data (CRM)
4. `ait_core_db04_finance` - Financial operations
5. `ait_core_db05_agents` - Agent management
6. `ait_core_db06_products` - Product catalog
7. `ait_core_db07_quotes` - Quote generation
8. `ait_core_db08_underwriting` - Underwriting operations
9. `ait_core_db09_reinsurance` - Reinsurance management
10. `ait_core_db10_documents` - Document management
11. `ait_core_db11_notifications` - Notification system
12. `ait_core_db12_tasks` - Task management
13. `ait_core_db13_calendar` - Calendar and scheduling
14. `ait_core_db14_marketing` - Marketing campaigns
15. `ait_core_db15_analytics` - Analytics data
16. `ait_core_db16_reporting` - Reports and dashboards
17. `ait_core_db17_integrations` - External integrations
18. `ait_core_db18_compliance` - Compliance management
19. `ait_core_db19_workflows` - Workflow automation
20. `ait_core_db20_vehicles` - Vehicle registry
21. `ait_core_db21_properties` - Property registry
22. `ait_core_db22_insurers` - Insurer partners
23. `ait_core_db23_actuarial` - Actuarial data
24. `ait_core_db24_territories` - Territory management
25. `ait_core_db25_pricing` - Pricing engine
26. `ait_core_db26_renewals` - Policy renewals
27. `ait_core_db27_fraud_detection` - Fraud detection
28. `ait_core_db28_performance` - Performance metrics
29. `ait_core_db29_authentication` - User authentication
30. `ait_core_db30_audit_logs` - Audit logging
31. `ait_core_db31_beneficiaries` - Beneficiary management
32. `ait_core_db32_medical_records` - Medical records
33. `ait_core_db33_training` - Training management
34. `ait_core_db34_complaints` - Complaint tracking
35. `ait_core_db35_surveys` - Customer surveys
36. `ait_core_db36_referrals` - Referral programs
37. `ait_core_db37_loyalty` - Loyalty programs
38. `ait_core_db38_content_management` - CMS
39. `ait_core_db39_email_templates` - Email templates
40. `ait_core_db40_system_config` - System configuration

## Rollback Procedures

### Immediate Rollback (< 5 minutes after deployment)

```bash
# 1. Stop application servers immediately
# 2. Restore from backup
BACKUP_DIR="./backups/20260128_083000"  # Use your backup timestamp
for db in ait_core_db01_policies ait_core_db02_claims; do
    PGPASSWORD=$DB_PASSWORD pg_restore -h $DB_HOST -U $DB_USER -d $db -c "$BACKUP_DIR/$db.backup"
done

# 3. Verify restoration
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d ait_core_db01_policies -c "SELECT COUNT(*) FROM policies;"

# 4. Restart application with previous version
```

### Partial Rollback (Specific tables)

```bash
# Restore specific tables from backup
pg_restore -h $DB_HOST -U $DB_USER -d ait_core_db01_policies -t policies "$BACKUP_DIR/ait_core_db01_policies.backup"
```

### Forward Fix (Preferred for minor issues)

```bash
# Create a new migration to fix the issue
npx prisma migrate dev --name fix_issue_description

# Deploy the fix
npx prisma migrate deploy
```

## Troubleshooting

### Common Issues

#### 1. Connection Timeout

```bash
# Increase timeout
export PGCONNECT_TIMEOUT=30
```

#### 2. Permission Denied

```bash
# Grant necessary permissions
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ait_core_db01_policies TO ait_core_user;"
```

#### 3. Migration Already Applied

```bash
# Reset migration history (CAUTION: Development only)
npx prisma migrate resolve --rolled-back "20260128000001_init_db01_policies"
```

#### 4. Lock Wait Timeout

```bash
# Check for blocking queries
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d ait_core_db01_policies -c "
SELECT pid, usename, query, state
FROM pg_stat_activity
WHERE state = 'active' AND query NOT LIKE '%pg_stat_activity%';"

# Terminate blocking queries if safe
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d ait_core_db01_policies -c "SELECT pg_terminate_backend(PID);"
```

## Performance Optimization

### Post-Migration Optimization

```sql
-- Analyze all tables for query planner
ANALYZE;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Reindex if needed
REINDEX DATABASE ait_core_db01_policies;
```

### Monitor Index Usage

```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Security Considerations

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate passwords** after deployment
4. **Audit access logs** regularly
5. **Encrypt backups** before storage
6. **Use SSL/TLS** for database connections
7. **Implement row-level security** where appropriate

## Support and Escalation

### Level 1: Check Logs
- Review migration log file
- Check PostgreSQL logs
- Review application logs

### Level 2: Verify Environment
- Database connectivity
- Credentials
- Network access

### Level 3: Database Analysis
- Query current schema
- Check migration status
- Review table structures

### Level 4: Emergency Rollback
- Execute rollback procedures
- Notify stakeholders
- Document incident

## Maintenance

### Regular Tasks

- **Daily**: Monitor database size and performance
- **Weekly**: Review slow queries and optimize indexes
- **Monthly**: Vacuum and analyze tables
- **Quarterly**: Review and archive old data

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
**Contact**: tech@ait-core.com
