# AIT-CORE Backup System - Complete Index

## System Overview

A comprehensive, production-ready backup and disaster recovery system for the AIT-CORE platform. Includes automated backup scripts, restore procedures, S3 integration, monitoring, and complete disaster recovery planning.

**Created**: January 28, 2026
**Total Files**: 24
**Location**: `C:\Users\rsori\codex\ait-core-soriano\backup\`

---

## Quick Start

```bash
# 1. Run setup
./setup-backups.sh

# 2. Configure
cp backup.env.example backup.env
nano backup.env

# 3. Test
./backup-all.sh
./verify-backups.sh

# 4. Schedule
crontab -e  # See cron-schedule.example
```

---

## File Structure

### 📚 Documentation (4 files)

| File | Purpose | Use When |
|------|---------|----------|
| **README.md** | Main documentation and user guide | Getting started, understanding features |
| **disaster-recovery-plan.md** | Complete DR procedures and scenarios | Planning for disasters, conducting drills |
| **PRODUCTION-DEPLOYMENT-GUIDE.md** | Production deployment checklist | Deploying to production environment |
| **INDEX.md** | This file - complete system index | Finding specific files/features |

### 🔧 Backup Scripts (6 files)

| Script | Service | Frequency | Description |
|--------|---------|-----------|-------------|
| **backup-all.sh** | All Services | Daily | Master orchestrator - runs all backups |
| **backup-postgres.sh** | PostgreSQL | Every 6h | Database dumps with compression |
| **backup-redis.sh** | Redis | Every 4h | RDB snapshot backups |
| **backup-minio.sh** | MinIO/S3 | Daily | Object storage mirroring |
| **backup-elasticsearch.sh** | Elasticsearch | Daily | Snapshot-based backups |
| **backup-postgres.ps1** | PostgreSQL | Manual | Windows PowerShell version |

**Features:**
- ✅ Compression (gzip)
- ✅ MD5 checksums
- ✅ S3 upload
- ✅ Retention management
- ✅ Slack/email notifications
- ✅ Error handling
- ✅ Detailed logging

### 🔄 Restore Scripts (5 files)

| Script | Service | Purpose |
|--------|---------|---------|
| **restore-all.sh** | All Services | Complete disaster recovery |
| **restore-postgres.sh** | PostgreSQL | Database restoration |
| **restore-redis.sh** | Redis | Cache restoration |
| **restore-minio.sh** | MinIO | Object storage restoration |
| **restore-elasticsearch.sh** | Elasticsearch | Search index restoration |

**Features:**
- ✅ Safety pre-restore backups
- ✅ Integrity verification
- ✅ S3 download support
- ✅ Selective restoration
- ✅ Confirmation prompts
- ✅ Detailed logging

### 🔍 Verification & Testing (3 files)

| Script | Purpose | When to Run |
|--------|---------|-------------|
| **verify-backups.sh** | Verify backup integrity | Weekly (automated) |
| **test-restore.sh** | Test restoration in isolation | Monthly |
| **backup-stats.sh** | Generate statistics report | On-demand |

**Checks:**
- ✅ File existence and size
- ✅ MD5 checksum verification
- ✅ Archive integrity (gunzip -t)
- ✅ Disk space analysis
- ✅ Retention compliance
- ✅ Restore functionality

### ⚙️ Configuration Files (4 files)

| File | Purpose |
|------|---------|
| **backup.env.example** | Configuration template |
| **cron-schedule.example** | Cron job examples |
| **s3-lifecycle.json** | S3 lifecycle policy |
| **backup-scheduler.yml** | Docker scheduler config |

### 🚀 Setup & Utilities (2 files)

| Script | Purpose |
|--------|---------|
| **setup-backups.sh** | Interactive setup wizard |
| **backup-scheduler.yml** | Docker-based scheduler |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    AIT-CORE BACKUP SYSTEM                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │    MinIO     │  │Elasticsearch │
│   Backups    │  │   Backups    │  │   Backups    │  │   Backups    │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       └─────────────────┴─────────────────┴─────────────────┘
                                 │
                    ┌────────────▼───────────┐
                    │   backup-all.sh        │
                    │   (Orchestrator)       │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼───────────┐
                    │   Local Storage        │
                    │   /backup/             │
                    │   - Compression        │
                    │   - Checksums          │
                    │   - Retention          │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼───────────┐
                    │   AWS S3               │
                    │   - Encryption         │
                    │   - Versioning         │
                    │   - Lifecycle Policies │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼───────────┐
                    │   Monitoring           │
                    │   - Slack              │
                    │   - Email              │
                    │   - Logs               │
                    └────────────────────────┘
```

---

## Features Matrix

### Backup Features

| Feature | PostgreSQL | Redis | MinIO | Elasticsearch |
|---------|-----------|-------|-------|---------------|
| Automated | ✅ | ✅ | ✅ | ✅ |
| Compression | ✅ | ✅ | ✅ | ✅ |
| Checksums | ✅ | ✅ | ✅ | ✅ |
| S3 Upload | ✅ | ✅ | ✅ | ✅ |
| Retention | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ |
| Incremental | ❌ | ❌ | ✅ | ✅ |
| Point-in-Time | ✅* | ❌ | ✅* | ✅ |

*With additional WAL archiving configuration

### Restore Features

| Feature | Available |
|---------|-----------|
| Full System Restore | ✅ |
| Selective Restore | ✅ |
| Point-in-Time Recovery | ✅* |
| Safety Pre-backup | ✅ |
| Integrity Verification | ✅ |
| S3 Download | ✅ |
| Test Environment | ✅ |

### Monitoring & Reporting

| Feature | Available |
|---------|-----------|
| Backup Verification | ✅ |
| Statistics Reports | ✅ |
| Slack Notifications | ✅ |
| Email Alerts | ✅ |
| Automated Testing | ✅ |
| HTML Reports | ✅ |
| Log Aggregation | ✅ |

---

## Usage Patterns

### Daily Operations

```bash
# Check backup status
ls -lht /backup/postgres/ | head -5

# View recent logs
tail -50 /backup/cron.log

# Generate statistics
./backup-stats.sh
```

### Weekly Tasks

```bash
# Run verification
./verify-backups.sh

# Check S3 sync
aws s3 ls s3://your-bucket/postgres/ --recursive | tail -10

# Review disk space
df -h /backup
```

### Monthly Tasks

```bash
# Test restore
./test-restore.sh

# Review retention
find /backup -name "*.sql.gz" -mtime +30

# Update documentation
nano disaster-recovery-plan.md
```

### Emergency Restore

```bash
# Database corruption
./restore-postgres.sh

# Complete system failure
./restore-all.sh -a

# Specific service
./restore-redis.sh
./restore-minio.sh
```

---

## Disaster Recovery Scenarios

### Covered Scenarios

1. **Database Corruption** - RTO: 30-60 min
2. **Complete System Failure** - RTO: 2-4 hours
3. **Accidental Data Deletion** - RTO: 15-30 min
4. **Ransomware Attack** - RTO: 4-8 hours
5. **Cloud Provider Outage** - RTO: 30-60 min

See [disaster-recovery-plan.md](./disaster-recovery-plan.md) for detailed procedures.

---

## Configuration Options

### Environment Variables

**Required:**
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`
- `POSTGRES_PASSWORD`
- `REDIS_HOST`, `REDIS_PORT`
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
- `ES_HOST`, `ES_PORT`

**Optional:**
- `S3_BUCKET` - Remote backup storage
- `RETENTION_DAYS` - Backup retention (default: 30)
- `SLACK_WEBHOOK` - Notification webhook
- `SMTP_*` - Email configuration

### Scheduling Options

**Option 1: Cron** (Linux/Unix)
```bash
crontab -e
# See cron-schedule.example
```

**Option 2: Systemd Timers** (Linux)
```bash
systemctl enable ait-backup.timer
```

**Option 3: Docker Scheduler**
```bash
docker-compose -f backup-scheduler.yml up -d
```

**Option 4: Windows Task Scheduler**
```powershell
# Use backup-postgres.ps1
```

---

## Recovery Objectives

### RTO (Recovery Time Objective)

- **Critical Systems**: 1 hour
- **Standard Systems**: 4 hours
- **Non-Critical Systems**: 24 hours

### RPO (Recovery Point Objective)

- **Database**: 15 minutes (with WAL)
- **Object Storage**: 1 hour
- **Application Data**: 4 hours
- **Logs**: 24 hours

---

## Best Practices

### Security
- ✅ Encrypt credentials in backup.env
- ✅ Use IAM roles when possible
- ✅ Enable S3 encryption and versioning
- ✅ Rotate credentials quarterly
- ✅ Restrict backup directory permissions (750)
- ✅ Enable audit logging

### Reliability
- ✅ Test restores monthly
- ✅ Verify checksums automatically
- ✅ Maintain 3-2-1 backup rule (3 copies, 2 media, 1 offsite)
- ✅ Monitor backup age and size
- ✅ Document all procedures

### Performance
- ✅ Schedule during low-traffic periods
- ✅ Use compression to save space
- ✅ Implement parallel operations
- ✅ Monitor backup duration trends

---

## Maintenance Schedule

| Task | Frequency | Script/Command |
|------|-----------|----------------|
| Full Backup | Daily 2 AM | `backup-all.sh` |
| PostgreSQL | Every 6h | `backup-postgres.sh` |
| Redis | Every 4h | `backup-redis.sh` |
| Verification | Weekly | `verify-backups.sh` |
| Restore Test | Monthly | `test-restore.sh` |
| DR Drill | Quarterly | Follow DR plan |
| Doc Review | Quarterly | Update docs |

---

## Troubleshooting Guide

### Common Issues

**Disk Full**
```bash
df -h /backup
find /backup -name "*.sql.gz" -mtime +30 -delete
```

**S3 Upload Fails**
```bash
aws s3 ls
aws iam get-user
```

**Cron Not Running**
```bash
systemctl status cron
crontab -l
tail -f /var/log/syslog | grep CRON
```

**Backup Script Fails**
```bash
# Check logs
tail -50 /backup/postgres/backup.log

# Test manually
source backup/backup.env
./backup-postgres.sh
```

---

## Performance Metrics

### Expected Backup Times

| Service | Database Size | Backup Time | Compressed Size |
|---------|--------------|-------------|-----------------|
| PostgreSQL | 10GB | ~5-10 min | ~2GB |
| PostgreSQL | 100GB | ~30-60 min | ~15GB |
| Redis | 1GB | ~1-2 min | ~200MB |
| MinIO | 50GB | ~10-20 min | ~10GB |
| Elasticsearch | 20GB | ~5-10 min | ~4GB |

### Storage Requirements

**Local Storage**: 2x largest database size + 30 days retention
**S3 Storage**: 3x largest database size + 90 days retention

Example for 100GB database:
- Local: ~400GB (200GB current + 200GB retention)
- S3: ~600GB (200GB current + 400GB historical)

---

## Support Resources

### Documentation
- [README.md](./README.md) - Main user guide
- [disaster-recovery-plan.md](./disaster-recovery-plan.md) - DR procedures
- [PRODUCTION-DEPLOYMENT-GUIDE.md](./PRODUCTION-DEPLOYMENT-GUIDE.md) - Deployment guide

### External Resources
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [Redis Persistence](https://redis.io/topics/persistence)
- [AWS S3 Lifecycle](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [Elasticsearch Snapshots](https://www.elastic.co/guide/en/elasticsearch/reference/current/snapshot-restore.html)

### Getting Help
1. Check script logs in `/backup/*.log`
2. Review this index and main README
3. Run verification: `./verify-backups.sh`
4. Test manually: `source backup.env && ./backup-all.sh`
5. Contact DevOps team

---

## Changelog

### Version 1.0 (2026-01-28)
- ✅ Initial system creation
- ✅ PostgreSQL backup/restore
- ✅ Redis backup/restore
- ✅ MinIO backup/restore
- ✅ Elasticsearch backup/restore
- ✅ S3 integration
- ✅ Automated verification
- ✅ Complete documentation
- ✅ Disaster recovery planning
- ✅ Windows PowerShell support
- ✅ Docker scheduler support

---

## Quick Reference Commands

```bash
# Backup
./backup-all.sh              # Full system backup
./backup-postgres.sh         # PostgreSQL only
./backup-redis.sh            # Redis only

# Restore
./restore-all.sh -a          # Restore everything
./restore-postgres.sh        # PostgreSQL only
./restore-redis.sh           # Redis only

# Verification
./verify-backups.sh          # Check integrity
./test-restore.sh            # Test restore

# Monitoring
./backup-stats.sh            # Statistics report
tail -f /backup/cron.log     # Watch logs

# S3
aws s3 ls s3://bucket/       # List backups
aws s3 sync s3://bucket/ /backup/  # Download all

# Setup
./setup-backups.sh           # Interactive setup
chmod +x *.sh                # Make executable
```

---

## System Requirements Summary

**Minimum:**
- Linux/Unix OS
- 500GB disk space
- 4GB RAM
- PostgreSQL client tools
- Redis tools
- AWS CLI
- MinIO client

**Recommended:**
- 2TB disk space
- 8GB RAM
- S3 bucket with versioning
- Monitoring integration
- Backup network connectivity

---

## License

Part of the AIT-CORE Soriano project.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-28
**Maintained By**: DevOps Team
**Next Review**: 2026-04-28

---

## File Listing

Total files in backup system: **24**

**Scripts**: 16
**Documentation**: 4
**Configuration**: 4

For detailed information on any file, refer to the sections above or see README.md.
