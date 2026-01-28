# Quick Start Guide

Get started with AIT-CORE DevOps scripts in 5 minutes.

## Initial Setup

### 1. Run Setup Script

```bash
cd scripts
./setup.sh
```

This will:
- Make all scripts executable
- Create necessary directories
- Check dependencies
- Create .env.example file
- Setup sample migrations

### 2. Configure Environment

Edit `.env` file in project root:

```bash
# Minimum required configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ait_core
DB_USER=postgres
DB_PASSWORD=your_password

APP_URL=http://localhost:3000
API_URL=http://localhost:4000
```

### 3. Initialize Database

```bash
# Run migrations
./db-migrate.sh up

# Seed with initial data
./db-seed.sh development
```

### 4. Verify Installation

```bash
# Run health check
./health-check.sh
```

## Common Tasks

### Interactive Menu

For easy access to all operations:

```bash
./devops.sh
```

This provides an interactive menu for all DevOps tasks.

### Database Operations

```bash
# Create new migration
./db-migrate.sh create add_users_table

# Apply migrations
./db-migrate.sh up

# Check status
./db-migrate.sh status

# Rollback
./db-migrate.sh down
```

### Daily Operations

```bash
# Create backup
./backup.sh

# Check health
./health-check.sh --quick

# Analyze logs
./log-analyzer.sh --errors
```

### Deployment

```bash
# Deploy to staging
./deploy.sh staging

# Deploy to production
./deploy.sh production

# Rollback if needed
./rollback-deployment.sh staging
```

### Monitoring

```bash
# One-time health check
./health-check.sh

# Continuous monitoring
./monitor.sh --interval 60 --alert

# Analyze logs
./log-analyzer.sh
```

### Performance Testing

```bash
# Quick test
./performance-test.sh --quick

# Full test suite
./performance-test.sh

# Load test
./performance-test.sh --load
```

## Typical Workflow

### Development

```bash
# 1. Create migration
./db-migrate.sh create new_feature

# 2. Edit migration files
# migrations/YYYYMMDDHHMMSS_new_feature.up.sql
# migrations/YYYYMMDDHHMMSS_new_feature.down.sql

# 3. Apply migration
./db-migrate.sh up

# 4. Seed test data
./db-seed.sh development

# 5. Run health check
./health-check.sh --quick
```

### Before Deployment

```bash
# 1. Check migrations
./db-migrate.sh status

# 2. Create backup
./backup.sh

# 3. Run tests
npm test

# 4. Run performance test
./performance-test.sh --quick

# 5. Check logs
./log-analyzer.sh --errors
```

### Deployment

```bash
# 1. Deploy to staging
./deploy.sh staging

# 2. Verify staging
./health-check.sh

# 3. Deploy to production
./deploy.sh production

# 4. Monitor logs
./log-analyzer.sh --tail
```

### After Deployment

```bash
# 1. Health check
./health-check.sh

# 2. Monitor for issues
./monitor.sh --alert

# 3. Check logs for errors
./log-analyzer.sh --errors

# 4. Rollback if needed
./rollback-deployment.sh production
```

## Automation

### Setup Cron Jobs

```bash
crontab -e
```

Add:

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/ait-core-soriano && ./scripts/backup.sh --auto

# Health check every 5 minutes
*/5 * * * * cd /path/to/ait-core-soriano && ./scripts/health-check.sh --quick

# Daily log analysis
0 6 * * * cd /path/to/ait-core-soriano && ./scripts/log-analyzer.sh --export

# Weekly log cleanup
0 3 * * 0 cd /path/to/ait-core-soriano && ./scripts/log-analyzer.sh --cleanup
```

## Troubleshooting

### Scripts Not Executable

```bash
chmod +x scripts/*.sh
```

### Database Connection Failed

```bash
# Check environment variables
cat .env | grep DB_

# Test connection
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;"
```

### Missing Dependencies

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client redis-tools curl apache2-utils

# macOS
brew install postgresql redis curl
```

### Health Check Fails

```bash
# Detailed check
./health-check.sh --detailed

# Check logs
./log-analyzer.sh --errors
```

## Best Practices

### Daily
- ✅ Run health checks
- ✅ Review error logs
- ✅ Monitor disk space

### Weekly
- ✅ Analyze logs
- ✅ Review performance metrics
- ✅ Test backup restore

### Before Deployment
- ✅ Run migrations in staging
- ✅ Create backup
- ✅ Run tests
- ✅ Check health

### After Deployment
- ✅ Verify health
- ✅ Monitor logs
- ✅ Check performance

## Quick Reference

| Task | Command |
|------|---------|
| Setup | `./setup.sh` |
| Interactive Menu | `./devops.sh` |
| Migrate Up | `./db-migrate.sh up` |
| Migrate Down | `./db-migrate.sh down` |
| Backup | `./backup.sh` |
| Restore | `./restore.sh` |
| Deploy Staging | `./deploy.sh staging` |
| Deploy Production | `./deploy.sh production` |
| Health Check | `./health-check.sh` |
| Analyze Logs | `./log-analyzer.sh` |
| Performance Test | `./performance-test.sh --quick` |
| Monitor | `./monitor.sh --alert` |

## Getting Help

```bash
# Script help
./script-name.sh --help

# Read full documentation
less README.md

# Check script status
./health-check.sh --detailed
```

## Next Steps

1. ✅ Run `./setup.sh` to initialize
2. ✅ Configure `.env` file
3. ✅ Run `./db-migrate.sh up`
4. ✅ Run `./health-check.sh`
5. ✅ Try `./devops.sh` for interactive menu
6. ✅ Read full README.md for details
7. ✅ Setup cron jobs for automation
8. ✅ Configure notifications (Slack/Discord)

---

**Need help?** Check the full [README.md](./README.md) for detailed documentation.
