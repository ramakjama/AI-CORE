# AIT-CORE DevOps Scripts

Comprehensive collection of production-ready DevOps scripts for database management, deployment, monitoring, and performance testing.

## Table of Contents

- [Database Management](#database-management)
- [Deployment](#deployment)
- [Backup & Restore](#backup--restore)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Log Analysis](#log-analysis)
- [Performance Testing](#performance-testing)
- [Configuration](#configuration)
- [Best Practices](#best-practices)

---

## Database Management

### db-migrate.sh

Database migration management with version control and rollback support.

**Usage:**
```bash
# Apply pending migrations
./db-migrate.sh up

# Rollback last migration
./db-migrate.sh down

# Rollback last 3 migrations
./db-migrate.sh down 3

# Check migration status
./db-migrate.sh status

# Create new migration
./db-migrate.sh create add_users_table
```

**Features:**
- Automatic migration table initialization
- Checksum verification for integrity
- Execution time tracking
- Safe rollback mechanism
- Migration history tracking

**Migration Files:**
- Located in `migrations/` directory
- Format: `{timestamp}_{name}.{up|down}.sql`
- Example: `20260128143000_create_users.up.sql`

### db-seed.sh

Database seeding with environment-specific data.

**Usage:**
```bash
# Initialize seed structure
./db-seed.sh --init

# Seed development database
./db-seed.sh development

# Seed production (requires confirmation)
./db-seed.sh production

# Seed test database
./db-seed.sh test
```

**Features:**
- Environment-specific seeds (development, staging, production, test)
- Common seeds shared across environments
- Production safety checks
- Idempotent operations (safe to run multiple times)

**Directory Structure:**
```
seeds/
├── common/           # Shared across all environments
├── development/      # Development-only data
├── staging/          # Staging environment data
├── production/       # Production initial data
└── test/             # Test fixtures
```

---

## Deployment

### deploy.sh

Full-featured deployment script with multiple deployment strategies.

**Usage:**
```bash
# Deploy to staging
./deploy.sh staging

# Deploy to production
./deploy.sh production

# Deploy without backup
./deploy.sh staging --no-backup

# Deploy without tests
./deploy.sh staging --skip-tests

# Deploy without migrations
./deploy.sh staging --skip-migrations
```

**Features:**
- Pre-deployment validation checks
- Automated testing
- Database migrations
- Backup creation before deployment
- Multiple deployment methods (Docker, PM2, Remote)
- Health checks after deployment
- Slack/Discord notifications
- Detailed deployment logging

**Deployment Methods:**
1. **Docker**: Uses docker-compose for containerized deployments
2. **PM2**: Node.js process manager for direct deployments
3. **Remote**: SSH deployment to remote servers

### rollback-deployment.sh

Quick rollback to previous deployment.

**Usage:**
```bash
# Rollback staging
./rollback-deployment.sh staging

# Rollback production (requires confirmation)
./rollback-deployment.sh production
```

**Features:**
- Automatic backup restoration
- Optional database rollback
- Docker or PM2 rollback support
- Safety confirmations

---

## Backup & Restore

### backup.sh

Comprehensive backup solution for database, files, and configurations.

**Usage:**
```bash
# Full backup
./backup.sh

# Database only
./backup.sh --db-only

# Files only
./backup.sh --files-only

# Automated backup (no interactive output)
./backup.sh --auto

# List available backups
./backup.sh --list
```

**Features:**
- Database backup with compression
- Application files backup
- Configuration files backup
- Metadata and checksums for integrity
- Automatic cleanup of old backups
- S3 upload support (if configured)
- Backup verification
- Retention policy management

**Configuration:**
```bash
# Environment variables
BACKUP_DIR=/path/to/backups
BACKUP_RETENTION_DAYS=30
MAX_BACKUPS=10
BACKUP_S3_BUCKET=my-backup-bucket
```

### restore.sh

Restore from backups with integrity verification.

**Usage:**
```bash
# List available backups
./restore.sh

# Full restore
./restore.sh 20260128_143000

# Database only
./restore.sh 20260128_143000 --db-only

# Files only
./restore.sh 20260128_143000 --files-only
```

**Features:**
- Backup integrity verification
- Selective restoration (database, files, or both)
- Current state backup before restore
- S3 download support
- Dependency reinstallation
- Safety confirmations

---

## Monitoring & Health Checks

### health-check.sh

Comprehensive health monitoring for all system components.

**Usage:**
```bash
# Standard health check
./health-check.sh

# Quick check (basic services only)
./health-check.sh --quick

# Detailed check (all metrics)
./health-check.sh --detailed

# Services only (port checks)
./health-check.sh --services-only
```

**Checks:**
- HTTP endpoints (Web app, API)
- Database connectivity and stats
- Redis connectivity and stats
- Docker containers status
- Disk space usage
- Memory usage
- CPU load
- Application logs for errors
- SSL certificate expiration (detailed mode)

**Exit Codes:**
- `0`: All checks passed
- `1`: One or more checks failed

### monitor.sh

Continuous monitoring with alerting.

**Usage:**
```bash
# Start monitoring (60s interval)
./monitor.sh

# Custom interval (30s)
./monitor.sh --interval 30

# With alerts enabled
./monitor.sh --interval 60 --alert
```

**Features:**
- Continuous health checking
- Configurable check interval
- Slack/Discord notifications
- Email alerts (if sendmail configured)
- Automatic failure detection

---

## Log Analysis

### log-analyzer.sh

Advanced log analysis and insights.

**Usage:**
```bash
# Show dashboard
./log-analyzer.sh

# Error analysis only
./log-analyzer.sh --errors

# Statistics only
./log-analyzer.sh --stats

# Real-time tail
./log-analyzer.sh --tail

# Export analysis report
./log-analyzer.sh --export

# Analyze last 1 hour
./log-analyzer.sh --errors --1h

# Analyze last 7 days
./log-analyzer.sh --stats --7d

# Clean up old logs
./log-analyzer.sh --cleanup
```

**Features:**
- Error level distribution
- Top error messages
- Errors by hour analysis
- HTTP status code distribution
- Response time analysis
- Most active endpoints
- Slow request detection
- Database query analysis
- Log file statistics
- Real-time log tailing
- Export to text report
- Automatic log cleanup and compression

**Time Ranges:**
- `--1h`: Last 1 hour
- `--24h`: Last 24 hours (default)
- `--7d`: Last 7 days

---

## Performance Testing

### performance-test.sh

Load testing and performance benchmarking.

**Usage:**
```bash
# Full test suite
./performance-test.sh

# Quick response time test
./performance-test.sh --quick

# Load testing
./performance-test.sh --load

# Stress testing
./performance-test.sh --stress

# Generate HTML report
./performance-test.sh --report
```

**Features:**
- Response time testing
- Load testing with Apache Bench (ab)
- Load testing with wrk
- Stress testing with gradual load increase
- Database performance testing
- API endpoint benchmarking
- Memory usage monitoring
- HTML report generation

**Test Types:**

1. **Quick Test**: Basic response time for key endpoints
2. **Load Test**: Sustained load with ab/wrk
3. **Stress Test**: Gradually increasing load until failure
4. **Benchmark**: Detailed metrics per endpoint
5. **Database Test**: Connection and query performance

**Dependencies:**
- `curl`: HTTP requests
- `ab` (Apache Bench): Load testing
- `wrk`: Advanced load testing
- `psql`: Database testing
- `bc`: Calculations

**Install Dependencies:**
```bash
# Ubuntu/Debian
sudo apt-get install apache2-utils wrk postgresql-client bc

# macOS
brew install wrk postgresql
```

---

## Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ait_core
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
APP_NAME=ait-core

# Deployment
DEPLOY_USER=deploy
DEPLOY_HOST=your-server.com
DEPLOY_PATH=/var/www/ait-core
PM2_APP_NAME=ait-core

# Backup
BACKUP_DIR=/path/to/backups
BACKUP_RETENTION_DAYS=30
MAX_BACKUPS=10
BACKUP_S3_BUCKET=my-backup-bucket

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK
ALERT_EMAIL=admin@example.com

# Logging
LOG_DIR=/path/to/logs
LOG_RETENTION_DAYS=30

# Performance
SLOW_REQUEST_MS=1000
```

### Environment-Specific Configuration

Create separate files for each environment:
- `.env.development`
- `.env.staging`
- `.env.production`

Scripts will automatically load the appropriate file based on the environment parameter.

---

## Best Practices

### Database Migrations

1. **Always test migrations** in development before production
2. **Keep migrations small** and focused on single changes
3. **Write rollback scripts** for every migration
4. **Backup before migrations** in production
5. **Review migration status** regularly

### Deployments

1. **Deploy to staging first** before production
2. **Run full test suite** before deployment
3. **Create backups** before every production deployment
4. **Monitor logs** after deployment
5. **Have rollback plan** ready
6. **Deploy during low-traffic** periods
7. **Notify team** before production deployments

### Backups

1. **Automate regular backups** (daily recommended)
2. **Test restore procedures** regularly
3. **Store backups off-site** (S3, etc.)
4. **Verify backup integrity** with checksums
5. **Keep multiple backup versions**
6. **Document restore procedures**

### Monitoring

1. **Run health checks** regularly (via cron)
2. **Set up alerting** for critical failures
3. **Monitor resource usage** (disk, memory, CPU)
4. **Track error rates** in logs
5. **Review performance metrics** weekly
6. **Set up dashboards** for key metrics

### Log Management

1. **Implement log rotation** to prevent disk full
2. **Set retention policies** for compliance
3. **Analyze logs regularly** for patterns
4. **Set up alerts** for critical errors
5. **Compress old logs** to save space
6. **Use structured logging** (JSON) for better analysis

### Performance Testing

1. **Establish baseline metrics** for comparison
2. **Test regularly** (weekly or before releases)
3. **Monitor trends** over time
4. **Test under realistic load** conditions
5. **Identify bottlenecks** early
6. **Optimize based on data**, not assumptions

---

## Automation with Cron

Add to crontab (`crontab -e`):

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/project && ./scripts/backup.sh --auto

# Health check every 5 minutes
*/5 * * * * cd /path/to/project && ./scripts/health-check.sh --quick

# Log analysis daily at 6 AM
0 6 * * * cd /path/to/project && ./scripts/log-analyzer.sh --export

# Log cleanup weekly on Sunday
0 3 * * 0 cd /path/to/project && ./scripts/log-analyzer.sh --cleanup

# Weekly performance test on Sunday at 4 AM
0 4 * * 0 cd /path/to/project && ./scripts/performance-test.sh --quick
```

---

## Troubleshooting

### Script Permissions

Make scripts executable:
```bash
chmod +x scripts/*.sh
```

### Database Connection Issues

Check environment variables:
```bash
echo $DB_HOST $DB_PORT $DB_NAME $DB_USER
```

Test connection:
```bash
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;"
```

### Missing Dependencies

Install required tools:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql-client redis-tools curl apache2-utils wrk bc

# macOS
brew install postgresql redis curl wrk
```

### Permission Denied

Ensure user has necessary permissions:
- Database access
- File system write permissions
- Docker access (if using Docker)
- SSH access (for remote deployments)

---

## Support

For issues or questions:
- Check script help: `./script-name.sh --help`
- Review logs in `logs/` directory
- Check environment configuration
- Verify dependencies are installed

---

## Contributing

When adding new scripts:
1. Follow existing naming conventions
2. Include comprehensive error handling
3. Add usage documentation
4. Use consistent logging format
5. Test in all target environments
6. Update this README

---

## License

Copyright © 2026 AIT-CORE. All rights reserved.
