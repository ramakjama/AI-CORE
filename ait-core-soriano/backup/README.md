# AIT-CORE Backup and Disaster Recovery System

Complete backup/restore solution for the AIT-CORE platform with automated scripts, S3 sync, and disaster recovery procedures.

## Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Backup Scripts](#backup-scripts)
- [Restore Procedures](#restore-procedures)
- [Scheduling](#scheduling)
- [Configuration](#configuration)
- [Disaster Recovery](#disaster-recovery)
- [Monitoring](#monitoring)

## Overview

This backup system provides comprehensive data protection for all AIT-CORE services:

- **PostgreSQL**: Full database backups with point-in-time recovery
- **Redis**: RDB snapshot backups
- **MinIO/S3**: Object storage replication
- **Elasticsearch**: Snapshot-based backups
- **Automated Scheduling**: Cron-based backup automation
- **S3 Integration**: Remote backup storage with lifecycle management
- **Verification**: Automated backup integrity checks
- **Disaster Recovery**: Complete system restoration procedures

### Key Features

✅ **Automated Backups**: Scheduled backups with configurable retention
✅ **Multi-Tier Storage**: Local + S3 with intelligent lifecycle policies
✅ **Compression**: All backups compressed to save space
✅ **Checksums**: MD5 verification for data integrity
✅ **Notifications**: Slack/email alerts for backup status
✅ **Verification**: Automated backup testing and validation
✅ **Recovery Plans**: Detailed disaster recovery procedures
✅ **Cross-Platform**: Linux/Unix scripts + Windows PowerShell versions

## Quick Start

### 1. Initial Setup

```bash
# Clone or navigate to the project
cd /path/to/ait-core-soriano

# Copy configuration template
cp backup/backup.env.example backup/backup.env

# Edit configuration with your settings
nano backup/backup.env

# Make scripts executable
chmod +x backup/*.sh
```

### 2. Configure Environment

Edit `backup/backup.env`:

```bash
# Database credentials
DB_HOST=localhost
DB_USER=aitcore
POSTGRES_PASSWORD=your_password

# S3 backup destination (optional)
S3_BUCKET=your-backup-bucket
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Backup retention
RETENTION_DAYS=30

# Notifications (optional)
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Test Backup

```bash
# Source environment variables
source backup/backup.env

# Run a test backup
cd backup
./backup-all.sh
```

### 4. Verify Backup

```bash
# Check backup files
ls -lh /backup/postgres/
ls -lh /backup/redis/
ls -lh /backup/minio/

# Run verification script
./verify-backups.sh
```

## Backup Scripts

### Master Backup Script

**`backup-all.sh`** - Orchestrates all backup operations

```bash
# Run full system backup
./backup-all.sh

# Output:
# - Backs up PostgreSQL, Redis, MinIO, Elasticsearch
# - Creates master log file
# - Sends notifications
# - Returns exit code 0 on success
```

### PostgreSQL Backup

**`backup-postgres.sh`** - Database backup with compression

```bash
# Basic usage
./backup-postgres.sh

# Features:
# - pg_dump with compression (gzip)
# - MD5 checksum generation
# - S3 upload (if configured)
# - Automatic cleanup of old backups
# - Connection health check
```

**Windows version:** `backup-postgres.ps1`

```powershell
.\backup-postgres.ps1 -BackupDir "C:\backup\postgres" -RetentionDays 30
```

### Redis Backup

**`backup-redis.sh`** - Redis snapshot backup

```bash
# Basic usage
./backup-redis.sh

# Features:
# - Triggers BGSAVE for non-blocking backup
# - Waits for completion
# - Copies and compresses RDB file
# - Uploads to S3
```

### MinIO/S3 Backup

**`backup-minio.sh`** - Object storage backup

```bash
# Basic usage
./backup-minio.sh

# Features:
# - Mirrors all buckets
# - Creates compressed tarballs
# - Backs up MinIO configuration
# - Syncs to external S3
```

### Elasticsearch Backup

**`backup-elasticsearch.sh`** - Search index snapshots

```bash
# Basic usage
./backup-elasticsearch.sh

# Features:
# - Creates snapshots via API
# - Verifies snapshot completion
# - Exports metadata
# - Uploads to S3
```

### Backup Verification

**`verify-backups.sh`** - Tests backup integrity

```bash
# Run verification
./verify-backups.sh

# Checks:
# - File existence and size
# - Checksum verification
# - Archive integrity (gunzip -t)
# - Disk space analysis
# - Retention compliance
```

## Restore Procedures

### PostgreSQL Restore

**`restore-postgres.sh`** - Database restoration

```bash
# Restore from latest backup
./restore-postgres.sh

# Restore from specific backup
./restore-postgres.sh /backup/postgres/postgres_soriano_core_20260128_120000.sql.gz

# Restore from S3
S3_BUCKET=my-backup-bucket ./restore-postgres.sh postgres_soriano_core_20260128_120000.sql.gz

# Features:
# - Pre-restore safety backup
# - Terminates existing connections
# - Verifies restoration
# - Runs ANALYZE for statistics
```

### Redis Restore

**`restore-redis.sh`** - Redis data restoration

```bash
# Restore from latest backup
./restore-redis.sh

# Restore from specific backup
./restore-redis.sh /backup/redis/redis_20260128_120000.rdb.gz
```

### Complete System Restore

**`restore-all.sh`** - Full disaster recovery

```bash
# Restore all services
./restore-all.sh -a

# Restore specific services
./restore-all.sh -p -r  # PostgreSQL and Redis only

# Options:
#   -p  Restore PostgreSQL
#   -r  Restore Redis
#   -m  Restore MinIO
#   -e  Restore Elasticsearch
#   -a  Restore all (default)
```

### Disaster Recovery Procedure

For complete disaster recovery, see [disaster-recovery-plan.md](./disaster-recovery-plan.md).

**Quick recovery steps:**

1. **Provision infrastructure**
   ```bash
   # Deploy new servers or cloud instances
   # Install Docker and dependencies
   ```

2. **Download backups**
   ```bash
   aws s3 sync s3://ait-backup/ /backup/
   ```

3. **Restore services**
   ```bash
   ./restore-all.sh -a
   ```

4. **Verify and test**
   ```bash
   docker-compose ps
   curl http://localhost:3000/health
   ```

**Estimated RTO**: 2-4 hours for complete system recovery

## Scheduling

### Cron Setup

```bash
# Install cron jobs
crontab -e

# Add these lines (adjust paths):
# Daily full backup at 2 AM
0 2 * * * source /path/to/backup/backup.env && /path/to/backup/backup-all.sh

# PostgreSQL every 6 hours
0 */6 * * * source /path/to/backup/backup.env && /path/to/backup/backup-postgres.sh

# Redis every 4 hours
0 */4 * * * source /path/to/backup/backup.env && /path/to/backup/backup-redis.sh

# Weekly verification on Sundays
0 1 * * 0 source /path/to/backup/backup.env && /path/to/backup/verify-backups.sh
```

See [cron-schedule.example](./cron-schedule.example) for complete schedule.

### Windows Task Scheduler

```powershell
# Create scheduled task for daily backup
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-File C:\path\to\backup\backup-postgres.ps1"

$trigger = New-ScheduledTaskTrigger -Daily -At 2am

Register-ScheduledTask -Action $action -Trigger $trigger `
    -TaskName "AIT-CORE PostgreSQL Backup" `
    -Description "Daily PostgreSQL backup"
```

### Docker Cron Container

```yaml
# Add to docker-compose.yml
services:
  backup-scheduler:
    image: crazymax/swarm-cronjob:latest
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./backup:/backup
    environment:
      - "TZ=UTC"
    deploy:
      placement:
        constraints:
          - node.role == manager
    command: |
      schedule: "0 2 * * *"
      command: /backup/backup-all.sh
```

## Configuration

### Environment Variables

All configuration is managed via `backup.env`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=aitcore
DB_NAME=soriano_core
POSTGRES_PASSWORD=secret

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MinIO Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=aitcore
MINIO_SECRET_KEY=secret

# Elasticsearch Configuration
ES_HOST=localhost
ES_PORT=9200

# S3 Remote Backup
S3_BUCKET=ait-backup-bucket
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=us-east-1

# Backup Settings
BACKUP_ROOT=/backup
RETENTION_DAYS=30

# Notifications
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK
SMTP_HOST=smtp.gmail.com
NOTIFICATION_EMAIL=admin@example.com
```

### S3 Configuration

#### AWS S3 Setup

```bash
# Install AWS CLI
pip install awscli

# Configure credentials
aws configure
# Enter: Access Key, Secret Key, Region

# Create backup bucket
aws s3 mb s3://ait-backup-bucket --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket ait-backup-bucket \
    --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
    --bucket ait-backup-bucket \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'

# Set lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
    --bucket ait-backup-bucket \
    --lifecycle-configuration file://s3-lifecycle.json
```

**s3-lifecycle.json:**
```json
{
  "Rules": [
    {
      "Id": "ArchiveOldBackups",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

#### MinIO Client Setup

```bash
# Install MinIO client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/

# Configure MinIO alias
mc alias set local http://localhost:9000 aitcore aitcore2024

# Test connection
mc admin info local
```

### Notification Setup

#### Slack Notifications

1. Create Slack incoming webhook:
   - Go to https://api.slack.com/apps
   - Create new app
   - Add "Incoming Webhooks" feature
   - Copy webhook URL

2. Add to `backup.env`:
   ```bash
   SLACK_WEBHOOK=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
   ```

#### Email Notifications

Configure SMTP settings in `backup.env`:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-specific-password
NOTIFICATION_EMAIL=admin@example.com
```

## Disaster Recovery

### Recovery Objectives

- **RTO (Recovery Time Objective)**: 2-4 hours for complete system
- **RPO (Recovery Point Objective)**: 15 minutes for critical data

### Recovery Scenarios

Full disaster recovery documentation: [disaster-recovery-plan.md](./disaster-recovery-plan.md)

#### Scenario 1: Database Corruption
```bash
./restore-postgres.sh
# RTO: 30-60 minutes
```

#### Scenario 2: Complete System Failure
```bash
./restore-all.sh -a
# RTO: 2-4 hours
```

#### Scenario 3: Accidental Data Deletion
```bash
# Restore to temporary database
createdb temp_restore
./restore-postgres.sh /backup/postgres/postgres_backup_20260128.sql.gz
# Extract specific data
```

#### Scenario 4: Ransomware Attack
```bash
# Isolate system
# Restore from clean backup
./verify-backups.sh  # Verify integrity
./restore-all.sh -a  # Full restore
```

### Testing Schedule

| Test Type | Frequency | Purpose |
|-----------|-----------|---------|
| Backup Verification | Weekly | Ensure backups are valid |
| Database Restore | Monthly | Test restoration procedure |
| Full DR Drill | Quarterly | Complete disaster recovery |
| Security Audit | Quarterly | Review access and encryption |

## Monitoring

### Backup Status

```bash
# View recent backups
ls -lht /backup/postgres/ | head -10

# Check backup logs
tail -100 /backup/postgres/backup.log

# S3 backup status
aws s3 ls s3://ait-backup-bucket/postgres/ --recursive | tail -10
```

### Health Checks

```bash
# Run verification
./verify-backups.sh

# Check disk space
df -h /backup

# Check service connectivity
pg_isready -h localhost -p 5432
redis-cli ping
curl http://localhost:9200/_cluster/health
```

### Alerts Configuration

Monitoring alerts should trigger on:

- ❌ Backup failure
- ⚠️ Backup size anomaly (>30% change)
- ⚠️ Missing scheduled backup
- ❌ Restore test failure
- ⚠️ Disk space >80%
- ❌ S3 sync failure
- ⚠️ Checksum mismatch

## Troubleshooting

### Common Issues

#### 1. pg_dump: Permission Denied
```bash
# Solution: Check POSTGRES_PASSWORD is set
echo $POSTGRES_PASSWORD

# Or set inline
POSTGRES_PASSWORD=your_password ./backup-postgres.sh
```

#### 2. S3 Upload Fails
```bash
# Check AWS credentials
aws s3 ls s3://your-bucket/

# Test connection
aws s3 ls --debug
```

#### 3. Disk Space Full
```bash
# Check space
df -h /backup

# Manual cleanup
find /backup -name "*.sql.gz" -mtime +30 -delete

# Adjust retention
export RETENTION_DAYS=7
./backup-all.sh
```

#### 4. Backup Takes Too Long
```bash
# Use parallel compression
export PIGZ_THREADS=4
pg_dump ... | pigz > backup.sql.gz

# Exclude large tables
pg_dump --exclude-table=large_logs_table ...
```

#### 5. Restore Fails with Errors
```bash
# Ignore errors and continue
gunzip -c backup.sql.gz | psql ... --set ON_ERROR_STOP=off

# Restore without drops
pg_restore --no-owner --no-acl ...
```

### Logs

All scripts log to their respective directories:

- Master log: `/backup/master_backup_TIMESTAMP.log`
- PostgreSQL: `/backup/postgres/backup.log`
- Redis: `/backup/redis/backup.log`
- MinIO: `/backup/minio/backup.log`
- Elasticsearch: `/backup/elasticsearch/backup.log`

## Best Practices

### Security
- ✅ Encrypt backups at rest and in transit
- ✅ Use IAM roles instead of access keys when possible
- ✅ Rotate credentials regularly
- ✅ Enable MFA for S3 bucket deletion
- ✅ Audit backup access logs

### Performance
- ✅ Schedule backups during low-traffic periods
- ✅ Use compression to reduce storage
- ✅ Implement incremental backups for large datasets
- ✅ Monitor backup duration trends

### Reliability
- ✅ Test restores regularly (monthly minimum)
- ✅ Verify checksums automatically
- ✅ Maintain multiple backup copies (3-2-1 rule)
- ✅ Document all procedures
- ✅ Keep runbooks updated

### Compliance
- ✅ Comply with data retention regulations
- ✅ Implement secure deletion for expired backups
- ✅ Maintain audit trails
- ✅ Document data sovereignty requirements

## Support

### Documentation
- [Disaster Recovery Plan](./disaster-recovery-plan.md)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [Redis Persistence](https://redis.io/topics/persistence)
- [Elasticsearch Snapshots](https://www.elastic.co/guide/en/elasticsearch/reference/current/snapshot-restore.html)

### Getting Help
- Create an issue in the repository
- Contact DevOps team
- Review backup logs for error messages
- Check system monitoring dashboards

## License

Part of the AIT-CORE Soriano project.

---

**Last Updated**: 2026-01-28
**Version**: 1.0
**Maintained By**: DevOps Team
