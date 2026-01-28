# Scripts Index

Complete list of all DevOps scripts in the AIT-CORE platform.

## Core Scripts

### 🗄️ Database Management

| Script | Description | Usage |
|--------|-------------|-------|
| `db-migrate.sh` | Manage database migrations | `./db-migrate.sh [up\|down\|status\|create]` |
| `db-seed.sh` | Seed database with initial data | `./db-seed.sh [environment]` |

### 🚀 Deployment

| Script | Description | Usage |
|--------|-------------|-------|
| `deploy.sh` | Deploy to staging/production | `./deploy.sh [staging\|production]` |
| `rollback-deployment.sh` | Rollback failed deployment | `./rollback-deployment.sh [environment]` |

### 💾 Backup & Restore

| Script | Description | Usage |
|--------|-------------|-------|
| `backup.sh` | Create comprehensive backups | `./backup.sh [--db-only\|--files-only]` |
| `restore.sh` | Restore from backups | `./restore.sh [timestamp]` |

### 🏥 Monitoring & Health

| Script | Description | Usage |
|--------|-------------|-------|
| `health-check.sh` | System health monitoring | `./health-check.sh [--quick\|--detailed]` |
| `monitor.sh` | Continuous monitoring | `./monitor.sh [--interval N] [--alert]` |

### 📊 Log Analysis

| Script | Description | Usage |
|--------|-------------|-------|
| `log-analyzer.sh` | Analyze application logs | `./log-analyzer.sh [--errors\|--stats\|--tail]` |

### ⚡ Performance Testing

| Script | Description | Usage |
|--------|-------------|-------|
| `performance-test.sh` | Load and stress testing | `./performance-test.sh [--quick\|--load\|--stress]` |

## Utility Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `setup.sh` | Initial environment setup | `./setup.sh` |
| `devops.sh` | Interactive DevOps menu | `./devops.sh` |

## Documentation

| File | Description |
|------|-------------|
| `README.md` | Complete documentation |
| `QUICK_START.md` | Quick start guide |
| `INDEX.md` | This file |

## Script Categories

### By Frequency of Use

**Daily:**
- `health-check.sh` - Monitor system health
- `log-analyzer.sh` - Check logs for errors
- `backup.sh --auto` - Automated backups

**Weekly:**
- `performance-test.sh --quick` - Performance baseline
- `log-analyzer.sh --cleanup` - Clean old logs
- Test restore procedures

**As Needed:**
- `db-migrate.sh` - When schema changes
- `deploy.sh` - For deployments
- `restore.sh` - For recovery
- `rollback-deployment.sh` - When deployment fails

**One-time:**
- `setup.sh` - Initial setup only

### By Risk Level

**Low Risk (Safe to run anytime):**
- ✅ `health-check.sh`
- ✅ `log-analyzer.sh`
- ✅ `db-migrate.sh status`
- ✅ `backup.sh --list`
- ✅ `performance-test.sh --quick`

**Medium Risk (Test in staging first):**
- ⚠️ `db-migrate.sh up`
- ⚠️ `db-seed.sh`
- ⚠️ `deploy.sh staging`
- ⚠️ `backup.sh`

**High Risk (Requires confirmation):**
- 🔴 `deploy.sh production`
- 🔴 `db-migrate.sh down`
- 🔴 `restore.sh`
- 🔴 `rollback-deployment.sh production`
- 🔴 `performance-test.sh --stress`

### By Environment

**Development:**
```bash
./setup.sh                    # Initialize
./db-migrate.sh up           # Migrate
./db-seed.sh development     # Seed data
./health-check.sh            # Verify
```

**Staging:**
```bash
./backup.sh                  # Backup before changes
./db-migrate.sh up          # Migrate
./deploy.sh staging         # Deploy
./health-check.sh           # Verify
./performance-test.sh --load # Test performance
```

**Production:**
```bash
./backup.sh                     # Critical: backup first
./deploy.sh production          # Deploy with all checks
./monitor.sh --alert            # Monitor continuously
./log-analyzer.sh --export      # Daily log analysis
```

## Script Dependencies

```
setup.sh
  └─ Creates directories and .env

db-migrate.sh
  ├─ Requires: psql, database access
  └─ Creates: migrations table

db-seed.sh
  ├─ Requires: psql, database access
  └─ Uses: seed files in seeds/

deploy.sh
  ├─ Requires: db-migrate.sh, backup.sh
  ├─ Optional: docker, pm2, ssh
  └─ Calls: health-check.sh

backup.sh
  ├─ Requires: pg_dump, tar, gzip
  └─ Optional: aws cli (for S3)

restore.sh
  ├─ Requires: psql, tar, gzip
  └─ Optional: aws cli (for S3)

health-check.sh
  ├─ Requires: curl, psql
  └─ Optional: redis-cli, docker

monitor.sh
  ├─ Requires: health-check.sh
  └─ Optional: curl (for webhooks)

log-analyzer.sh
  ├─ Requires: grep, awk, find
  └─ Optional: gzip

performance-test.sh
  ├─ Requires: curl
  └─ Optional: ab, wrk, psql

devops.sh
  └─ Wrapper for all other scripts
```

## File Locations

```
ait-core-soriano/
├── scripts/                    # All scripts here
│   ├── db-migrate.sh
│   ├── db-seed.sh
│   ├── deploy.sh
│   ├── rollback-deployment.sh
│   ├── backup.sh
│   ├── restore.sh
│   ├── health-check.sh
│   ├── monitor.sh
│   ├── log-analyzer.sh
│   ├── performance-test.sh
│   ├── setup.sh
│   ├── devops.sh
│   ├── README.md
│   ├── QUICK_START.md
│   └── INDEX.md
├── migrations/                 # Database migrations
├── seeds/                      # Seed data
│   ├── common/
│   ├── development/
│   ├── staging/
│   ├── production/
│   └── test/
├── backups/                    # Backup storage
│   ├── database/
│   ├── files/
│   └── logs/
├── logs/                       # Application logs
├── performance-results/        # Performance test results
└── .env                        # Environment config
```

## Quick Command Reference

```bash
# Setup
./setup.sh

# Interactive Menu
./devops.sh

# Database
./db-migrate.sh up
./db-migrate.sh down
./db-migrate.sh status
./db-migrate.sh create migration_name
./db-seed.sh development

# Backup/Restore
./backup.sh
./backup.sh --list
./restore.sh timestamp

# Deploy
./deploy.sh staging
./deploy.sh production
./rollback-deployment.sh staging

# Monitor
./health-check.sh
./health-check.sh --quick
./health-check.sh --detailed
./monitor.sh --alert

# Logs
./log-analyzer.sh
./log-analyzer.sh --errors
./log-analyzer.sh --tail
./log-analyzer.sh --cleanup

# Performance
./performance-test.sh --quick
./performance-test.sh --load
./performance-test.sh --stress
```

## Exit Codes

All scripts follow standard exit codes:

- `0` - Success
- `1` - General error
- `2` - Missing dependencies
- `3` - Configuration error
- `4` - Connection error
- `5` - Permission error

## Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
- name: Run migrations
  run: ./scripts/db-migrate.sh up

- name: Deploy
  run: ./scripts/deploy.sh staging

- name: Health check
  run: ./scripts/health-check.sh --quick
```

### Monitoring Integration

```bash
# Check health and send to monitoring
./health-check.sh --quick && \
  curl -X POST "https://monitoring.example.com/api/status" \
  -d '{"status": "healthy"}'
```

### Automated Backups

```bash
# Cron job for daily backups with S3 upload
0 2 * * * cd /path/to/project && \
  ./scripts/backup.sh --auto && \
  ./scripts/log-analyzer.sh --export
```

## Support

For detailed information on any script, run:

```bash
./script-name.sh --help
```

For full documentation, see [README.md](./README.md)

For quick start, see [QUICK_START.md](./QUICK_START.md)

---

Last updated: 2026-01-28
