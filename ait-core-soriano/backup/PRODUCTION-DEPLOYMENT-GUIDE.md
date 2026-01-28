# AIT-CORE Production Backup/DR Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the backup and disaster recovery system in a production environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [Scheduling](#scheduling)
6. [Monitoring](#monitoring)
7. [Maintenance](#maintenance)

## Prerequisites

### System Requirements

- **OS**: Linux (Ubuntu 20.04+, RHEL 8+, or similar)
- **Disk Space**: Minimum 500GB for local backups (2TB recommended)
- **Memory**: 4GB RAM minimum
- **Network**: Stable internet connection for S3 sync

### Software Requirements

```bash
# Database tools
- postgresql-client (v15+)
- redis-tools (v7+)

# Cloud tools
- aws-cli (v2.x)
- mc (MinIO client)

# System tools
- bash (v4.0+)
- curl
- gzip/gunzip
- tar
- md5sum
```

### Access Requirements

- PostgreSQL credentials (read access minimum)
- Redis access (if password protected)
- MinIO/S3 credentials
- AWS S3 bucket (for remote backups)
- Elasticsearch API access
- Optional: Slack webhook for notifications

## Initial Setup

### Step 1: Clone and Prepare

```bash
# Navigate to project directory
cd /path/to/ait-core-soriano

# Verify backup directory exists
ls -la backup/

# Make scripts executable
chmod +x backup/*.sh

# Run automated setup
sudo bash backup/setup-backups.sh
```

The setup script will:
- ✅ Create backup directories
- ✅ Check for required tools
- ✅ Install missing dependencies
- ✅ Create configuration template
- ✅ Test database connectivity
- ✅ Optionally setup cron jobs

### Step 2: Install Missing Dependencies

If setup script reports missing tools:

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y \
    postgresql-client \
    redis-tools \
    awscli \
    curl \
    gzip \
    tar
```

**RHEL/CentOS:**
```bash
sudo yum install -y \
    postgresql \
    redis \
    awscli \
    curl \
    gzip \
    tar
```

**MinIO Client:**
```bash
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
sudo mv mc /usr/local/bin/
mc --version
```

## Configuration

### Step 3: Configure Environment

```bash
# Copy template
cp backup/backup.env.example backup/backup.env

# Edit configuration
nano backup/backup.env
```

**Required Configuration:**

```bash
# ===== Database Configuration =====
DB_HOST=localhost                    # PostgreSQL host
DB_PORT=5432                         # PostgreSQL port
DB_USER=aitcore                      # Database user
DB_NAME=soriano_core                 # Database name
POSTGRES_PASSWORD=your_secure_password  # CHANGE THIS!

# ===== Redis Configuration =====
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                      # Leave empty if no auth

# ===== MinIO Configuration =====
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=aitcore
MINIO_SECRET_KEY=your_secure_secret  # CHANGE THIS!

# ===== Elasticsearch =====
ES_HOST=localhost
ES_PORT=9200

# ===== Backup Settings =====
BACKUP_ROOT=/backup                  # Local backup directory
RETENTION_DAYS=30                    # Keep backups for 30 days
```

**Optional S3 Configuration:**

```bash
# ===== S3 Remote Backup =====
S3_BUCKET=your-backup-bucket-name
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_DEFAULT_REGION=us-east-1
```

**Optional Notifications:**

```bash
# ===== Slack Notifications =====
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# ===== Email Notifications =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
NOTIFICATION_EMAIL=admin@yourcompany.com
```

### Step 4: Create Backup Directories

```bash
# Create local backup structure
sudo mkdir -p /backup/{postgres,redis,minio,elasticsearch,logs}

# Set permissions
sudo chown -R $(whoami):$(whoami) /backup
chmod 750 /backup
```

### Step 5: Configure AWS S3 (Optional but Recommended)

```bash
# Configure AWS CLI
aws configure
# Enter: Access Key ID
# Enter: Secret Access Key
# Enter: Default region (e.g., us-east-1)
# Enter: Default output format (json)

# Create S3 bucket
aws s3 mb s3://your-backup-bucket-name --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
    --bucket your-backup-bucket-name \
    --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
    --bucket your-backup-bucket-name \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'

# Apply lifecycle policy
aws s3api put-bucket-lifecycle-configuration \
    --bucket your-backup-bucket-name \
    --lifecycle-configuration file://backup/s3-lifecycle.json

# Verify bucket setup
aws s3 ls s3://your-backup-bucket-name/
```

## Testing

### Step 6: Test Individual Backups

**Test PostgreSQL Backup:**
```bash
# Source environment
source backup/backup.env

# Run backup
cd backup
./backup-postgres.sh

# Verify backup created
ls -lh /backup/postgres/

# Check logs
tail -50 /backup/postgres/backup.log
```

**Test Redis Backup:**
```bash
./backup-redis.sh
ls -lh /backup/redis/
```

**Test MinIO Backup:**
```bash
./backup-minio.sh
ls -lh /backup/minio/
```

**Test Elasticsearch Backup:**
```bash
./backup-elasticsearch.sh
ls -lh /backup/elasticsearch/
```

### Step 7: Test Full System Backup

```bash
# Run full backup
./backup-all.sh

# Check master log
cat /backup/master_backup_*.log

# Verify all backups created
du -sh /backup/*/

# Check S3 upload (if configured)
aws s3 ls s3://your-backup-bucket-name/ --recursive
```

### Step 8: Test Backup Verification

```bash
# Run verification script
./verify-backups.sh

# Review verification report
cat /backup/verification_report_*.txt
```

### Step 9: Test Restore (CRITICAL!)

```bash
# Test restore in isolated environment
./test-restore.sh

# Review test results
cat /backup/test-restore_*.log
```

⚠️ **IMPORTANT**: Always test restores before going to production!

## Scheduling

### Step 10: Setup Automated Backups

**Option A: Cron (Recommended for Linux)**

```bash
# Edit crontab
crontab -e

# Add these lines (adjust paths):
SHELL=/bin/bash
BACKUP_ENV=/path/to/ait-core-soriano/backup/backup.env

# Daily full backup at 2:00 AM
0 2 * * * source $BACKUP_ENV && /path/to/backup/backup-all.sh >> /backup/cron.log 2>&1

# PostgreSQL every 6 hours
0 */6 * * * source $BACKUP_ENV && /path/to/backup/backup-postgres.sh >> /backup/postgres-cron.log 2>&1

# Redis every 4 hours
0 */4 * * * source $BACKUP_ENV && /path/to/backup/backup-redis.sh >> /backup/redis-cron.log 2>&1

# MinIO daily at 3:00 AM
0 3 * * * source $BACKUP_ENV && /path/to/backup/backup-minio.sh >> /backup/minio-cron.log 2>&1

# Elasticsearch daily at 4:00 AM
0 4 * * * source $BACKUP_ENV && /path/to/backup/backup-elasticsearch.sh >> /backup/es-cron.log 2>&1

# Weekly verification on Sundays at 1:00 AM
0 1 * * 0 source $BACKUP_ENV && /path/to/backup/verify-backups.sh >> /backup/verify.log 2>&1

# Monthly log cleanup
0 5 1 * * find /backup -name "*.log" -mtime +90 -delete
```

**Verify cron setup:**
```bash
# List cron jobs
crontab -l

# Check cron service is running
sudo systemctl status cron

# Monitor cron logs
tail -f /var/log/syslog | grep CRON
```

**Option B: Docker Container Scheduler**

```bash
# Use the provided scheduler
docker-compose -f backup/backup-scheduler.yml up -d

# Check logs
docker logs -f ait-backup-scheduler
```

**Option C: Systemd Timers**

Create systemd service and timer:

```bash
# Service file
sudo tee /etc/systemd/system/ait-backup.service <<EOF
[Unit]
Description=AIT-CORE Full Backup
After=network.target

[Service]
Type=oneshot
User=root
Environment=BACKUP_ENV=/path/to/backup/backup.env
ExecStart=/bin/bash -c 'source $BACKUP_ENV && /path/to/backup/backup-all.sh'

[Install]
WantedBy=multi-user.target
EOF

# Timer file
sudo tee /etc/systemd/system/ait-backup.timer <<EOF
[Unit]
Description=AIT-CORE Daily Backup Timer

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable ait-backup.timer
sudo systemctl start ait-backup.timer

# Check status
sudo systemctl list-timers --all | grep ait-backup
```

## Monitoring

### Step 11: Setup Monitoring

**Backup Status Dashboard:**

```bash
# Generate statistics report
./backup-stats.sh

# View in browser
firefox /backup/backup_stats_*.html
```

**Log Monitoring:**

```bash
# Monitor backup logs in real-time
tail -f /backup/postgres/backup.log
tail -f /backup/cron.log

# Check for errors
grep -i error /backup/*.log
grep -i failed /backup/*.log
```

**Slack Notifications:**

If configured, you'll receive notifications for:
- ✅ Successful backups
- ❌ Failed backups
- ⚠️ Size anomalies
- 📊 Weekly verification reports

**Email Alerts:**

Configure email notifications for critical events:

```bash
# Add to backup.env
NOTIFICATION_EMAIL=admin@yourcompany.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Monitoring Metrics:**

Set up monitoring for:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Backup Age | >24 hours | Alert |
| Disk Space | >80% | Alert |
| Backup Size Change | >30% | Investigate |
| S3 Sync Failures | Any failure | Alert |
| Restore Test | Monthly | Required |

### Step 12: Setup Alerts

**Example: Monitoring with Prometheus + Grafana**

```yaml
# prometheus-backup-exporter.yml
scrape_configs:
  - job_name: 'backup_metrics'
    static_configs:
      - targets: ['localhost:9100']
    metrics_path: '/metrics'
```

**Example: Custom Alert Script**

```bash
#!/bin/bash
# /usr/local/bin/check-backups.sh

BACKUP_AGE=$(find /backup/postgres -name "postgres_*.sql.gz" -mmin -360 | wc -l)

if [ $BACKUP_AGE -eq 0 ]; then
    echo "CRITICAL: No PostgreSQL backup in last 6 hours"
    curl -X POST $SLACK_WEBHOOK -d '{"text":"🚨 Backup Alert: No PostgreSQL backup in 6 hours"}'
    exit 1
fi

echo "OK: Backups are current"
exit 0
```

## Maintenance

### Regular Maintenance Tasks

**Daily:**
- ✅ Check cron logs for errors
- ✅ Verify latest backup completed
- ✅ Monitor disk space

**Weekly:**
- ✅ Review verification reports
- ✅ Check S3 sync status
- ✅ Review backup sizes for anomalies

**Monthly:**
- ✅ Test database restore
- ✅ Review retention policies
- ✅ Update documentation
- ✅ Security audit

**Quarterly:**
- ✅ Full DR drill
- ✅ Update disaster recovery plan
- ✅ Review and update RTO/RPO objectives
- ✅ Security review and credential rotation

### Troubleshooting Common Issues

**Issue: Backup Fails with "Disk Full"**

```bash
# Check disk space
df -h /backup

# Clean old backups manually
find /backup -name "*.sql.gz" -mtime +30 -delete

# Adjust retention
export RETENTION_DAYS=14
./backup-all.sh
```

**Issue: S3 Upload Fails**

```bash
# Test AWS credentials
aws s3 ls

# Check bucket exists
aws s3 ls s3://your-backup-bucket-name/

# Verify network connectivity
curl -I https://s3.amazonaws.com

# Check IAM permissions
aws iam get-user
```

**Issue: PostgreSQL Connection Timeout**

```bash
# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check firewall
sudo ufw status
sudo netstat -tlnp | grep 5432

# Verify credentials
echo $POSTGRES_PASSWORD
```

**Issue: Cron Jobs Not Running**

```bash
# Check cron service
sudo systemctl status cron

# Verify cron jobs
crontab -l

# Check cron logs
grep CRON /var/log/syslog

# Test script manually
source backup/backup.env && ./backup/backup-all.sh
```

## Security Best Practices

### 1. Credential Management

```bash
# Store credentials securely
chmod 600 backup/backup.env

# Use environment variables
export POSTGRES_PASSWORD=$(aws secretsmanager get-secret-value --secret-id db-password --query SecretString --output text)

# Rotate credentials quarterly
./scripts/rotate-backup-credentials.sh
```

### 2. Encryption

```bash
# Encrypt backups before upload
gpg --encrypt --recipient admin@company.com backup.sql.gz

# Use encrypted S3 bucket
aws s3api put-bucket-encryption --bucket backup-bucket \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

### 3. Access Control

```bash
# Restrict backup directory
chmod 750 /backup
chown backupuser:backupgroup /backup

# Use IAM roles instead of keys (EC2/ECS)
aws configure set aws_access_key_id ""
# Attach IAM role with S3 backup permissions
```

### 4. Audit Logging

```bash
# Enable audit logging
aws s3api put-bucket-logging --bucket backup-bucket \
  --bucket-logging-status file://logging-config.json

# Monitor access logs
aws s3 ls s3://backup-bucket-logs/
```

## Disaster Recovery Drills

### Monthly DR Test Checklist

- [ ] Verify all backups are current
- [ ] Test PostgreSQL restore to isolated environment
- [ ] Verify data integrity post-restore
- [ ] Test Redis restore
- [ ] Check MinIO/S3 sync
- [ ] Review restore time (RTO)
- [ ] Document any issues
- [ ] Update DR plan if needed

### Quarterly Full DR Drill

- [ ] Simulate complete system failure
- [ ] Provision new infrastructure
- [ ] Download all backups from S3
- [ ] Restore all services
- [ ] Verify application functionality
- [ ] Test user workflows
- [ ] Measure total recovery time
- [ ] Team debrief and lessons learned
- [ ] Update documentation

## Support and Resources

### Documentation
- [Main README](./README.md)
- [Disaster Recovery Plan](./disaster-recovery-plan.md)
- [Cron Schedule Examples](./cron-schedule.example)

### Useful Commands

```bash
# Quick backup status
ls -lht /backup/postgres/ | head -5

# Check last backup time
stat -c %y /backup/postgres/latest.sql.gz

# Generate statistics report
./backup-stats.sh

# Test restore (dry-run)
./test-restore.sh

# Verify all backups
./verify-backups.sh

# Manual backup
./backup-all.sh

# Restore from backup
./restore-all.sh -a
```

### Getting Help

1. Check logs: `/backup/*.log`
2. Review documentation: `./backup/README.md`
3. Run verification: `./verify-backups.sh`
4. Contact DevOps team
5. Create incident ticket

## Production Checklist

Before going live, ensure:

- [x] All dependencies installed
- [x] Configuration file created and secured
- [x] Test backup completed successfully
- [x] Test restore completed successfully
- [x] S3 bucket configured with encryption and versioning
- [x] Cron jobs scheduled
- [x] Monitoring and alerts configured
- [x] Slack/email notifications working
- [x] Disaster recovery plan reviewed
- [x] Team trained on procedures
- [x] Documentation updated
- [x] First DR drill scheduled

## Conclusion

Your AIT-CORE backup and disaster recovery system is now fully deployed and operational. Regular testing and maintenance are crucial for ensuring data safety and business continuity.

**Remember:**
- Test your backups regularly
- Update documentation as systems change
- Conduct quarterly DR drills
- Monitor and respond to alerts promptly
- Review and improve procedures continuously

For questions or issues, refer to the documentation or contact the DevOps team.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-28
**Next Review**: 2026-04-28
