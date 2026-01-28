# Quick Start Guide - AIT-CORE Database Migrations

## TL;DR - Get Started in 5 Minutes

```bash
# 1. Set your database password
export DB_PASSWORD=your_secure_password

# 2. Run all migrations
chmod +x deploy-all-migrations.sh
./deploy-all-migrations.sh development

# 3. Verify deployment
export DATABASE_URL="postgresql://postgres:$DB_PASSWORD@localhost:5432/ait_core_db01_policies"
npx prisma migrate status
```

Done! All 40 databases are now created and migrated.

---

## What You Get

This migration package creates **40 production-ready PostgreSQL databases** with:

- **130+ tables** across all domains
- **300+ optimized indexes** for query performance
- **100+ foreign key relationships** for data integrity
- Complete insurance platform architecture
- GDPR compliance features
- Audit logging system
- Security and authentication
- Marketing and analytics
- Financial operations

## Prerequisites

1. PostgreSQL 14+ installed
2. Node.js 18+ with npm/pnpm
3. Prisma CLI: `npm install -g prisma`
4. Database credentials with admin privileges

## 3 Ways to Deploy

### Option 1: Automated (Recommended)

Deploy all 40 databases at once:

```bash
./deploy-all-migrations.sh development
```

### Option 2: Single Database

Deploy one database at a time:

```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/ait_core_db01_policies"
npx prisma migrate deploy
```

### Option 3: Docker Compose

Using Docker (coming soon):

```bash
docker-compose up -d postgres
npm run migrate:all
```

## What Gets Created

### Core Insurance (10 databases)
- Policies, Claims, Customers
- Finance, Agents, Products
- Quotes, Underwriting, Reinsurance, Documents

### Operations (10 databases)
- Notifications, Tasks, Calendar
- Marketing, Analytics, Reporting
- Integrations, Compliance, Workflows, Vehicles

### Advanced Features (10 databases)
- Properties, Insurers, Actuarial
- Territories, Pricing, Renewals
- Fraud Detection, Performance, Auth, Audit

### Extended Features (10 databases)
- Beneficiaries, Medical Records, Training
- Complaints, Surveys, Referrals
- Loyalty, CMS, Email Templates, System Config

## Directory Structure

```
migrations/
├── 20260128000001_init_db01_policies/migration.sql
├── 20260128000002_init_db02_claims/migration.sql
├── ... (38 more migration directories)
├── 20260128000040_init_db40_system_config/migration.sql
├── migration_lock.toml
├── README.md (detailed architecture)
├── DEPLOYMENT_GUIDE.md (step-by-step instructions)
├── MIGRATION_OVERVIEW.md (complete reference)
├── QUICK_START.md (this file)
└── deploy-all-migrations.sh (automation script)
```

## Verification

After deployment, verify everything is working:

```bash
# Check databases exist
psql -U postgres -l | grep ait_core

# Check tables in DB-01
psql -U postgres -d ait_core_db01_policies -c "\dt"

# Check migration status
export DATABASE_URL="postgresql://postgres:pass@localhost:5432/ait_core_db01_policies"
npx prisma migrate status
```

Expected output: "Database schema is up to date!"

## Common Commands

```bash
# View migration status
npx prisma migrate status

# List all tables
psql -U postgres -d ait_core_db01_policies -c "\dt"

# List all indexes
psql -U postgres -d ait_core_db01_policies -c "\di"

# Show table structure
psql -U postgres -d ait_core_db01_policies -c "\d policies"

# Count records (after adding data)
psql -U postgres -d ait_core_db01_policies -c "SELECT COUNT(*) FROM policies;"
```

## Next Steps

1. **Review Documentation**
   - Read `README.md` for architecture overview
   - Check `DEPLOYMENT_GUIDE.md` for production deployment

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Connect Your Application**
   ```typescript
   import { PrismaClient } from '@prisma/client'
   const prisma = new PrismaClient()
   ```

4. **Add Sample Data** (optional)
   ```bash
   npm run seed
   ```

## Quick Troubleshooting

### Can't connect to database?
```bash
# Test connection
psql -U postgres -h localhost -p 5432
```

### Permission denied?
```bash
# Grant privileges
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ait_core_db01_policies TO your_user;"
```

### Migration already applied?
```bash
# Check status
npx prisma migrate status
```

### Need to rollback?
```bash
# See DEPLOYMENT_GUIDE.md for rollback procedures
```

## Key Features

### Production-Ready
- UUID primary keys
- Optimized indexes
- Foreign key constraints
- Timestamp tracking
- Audit trails

### Scalable Architecture
- 40 separate databases
- Domain isolation
- Independent scaling
- Microservices ready

### Enterprise Features
- GDPR compliance
- Audit logging
- Security controls
- Performance monitoring
- Fraud detection

## Performance Tips

1. **Connection Pooling**: Use PgBouncer or Prisma connection pooling
2. **Read Replicas**: Set up for read-heavy operations
3. **Monitoring**: Use pg_stat_statements for query analysis
4. **Vacuuming**: Schedule regular VACUUM ANALYZE
5. **Backups**: Automated daily backups with pg_dump

## Database Sizes (Estimated)

| Stage | All 40 DBs | Notes |
|-------|-----------|-------|
| Empty | ~50 MB | Just schema |
| 1K records | ~200 MB | Small business |
| 10K records | ~2 GB | Medium business |
| 100K records | ~20 GB | Large business |
| 1M records | ~200 GB | Enterprise |

## Support

- **Documentation**: See README.md and DEPLOYMENT_GUIDE.md
- **Issues**: tech@ait-core.com
- **Prisma Docs**: https://www.prisma.io/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs

## Cheat Sheet

```bash
# Quick deployment
export DB_PASSWORD=yourpass && ./deploy-all-migrations.sh development

# Check one database
export DATABASE_URL="postgresql://postgres:pass@localhost:5432/ait_core_db01_policies"
npx prisma migrate status

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (GUI)
npx prisma studio

# Backup one database
pg_dump -U postgres ait_core_db01_policies > backup.sql

# Restore one database
psql -U postgres ait_core_db01_policies < backup.sql
```

## FAQ

**Q: Do I need all 40 databases?**
A: Start with core databases (01-10) and add others as needed.

**Q: Can I use MySQL instead of PostgreSQL?**
A: These migrations are PostgreSQL-specific. MySQL requires different SQL.

**Q: How do I update the schema later?**
A: Create new migrations with `npx prisma migrate dev --name change_description`

**Q: Is this production-ready?**
A: Yes! Includes all best practices for production deployment.

**Q: Can I run this on Docker?**
A: Yes! Works with any PostgreSQL 14+ installation.

---

**Ready to deploy?** Run `./deploy-all-migrations.sh development` now!

**Need help?** Check DEPLOYMENT_GUIDE.md for detailed instructions.

**Version**: 1.0.0 | **Date**: 2026-01-28 | **Status**: Production Ready ✓
