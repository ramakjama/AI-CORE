# AIT-CORE Disaster Recovery Plan

## Table of Contents
1. [Overview](#overview)
2. [Recovery Objectives](#recovery-objectives)
3. [Backup Strategy](#backup-strategy)
4. [Recovery Procedures](#recovery-procedures)
5. [Emergency Contacts](#emergency-contacts)
6. [Testing Schedule](#testing-schedule)

## Overview

This document outlines the disaster recovery (DR) plan for the AIT-CORE system. It provides procedures for recovering from various failure scenarios to minimize downtime and data loss.

### System Components
- **PostgreSQL**: Primary relational database
- **Redis**: Cache and session storage
- **MinIO**: Object storage (S3-compatible)
- **Elasticsearch**: Search engine and logging
- **Kafka/Zookeeper**: Message bus
- **Application Services**: API, Web, and Mobile applications

## Recovery Objectives

### RTO (Recovery Time Objective)
- **Critical Systems**: 1 hour
- **Standard Systems**: 4 hours
- **Non-Critical Systems**: 24 hours

### RPO (Recovery Point Objective)
- **Database**: 15 minutes (via WAL archiving)
- **Object Storage**: 1 hour
- **Application Data**: 4 hours
- **Logs**: 24 hours

## Backup Strategy

### Backup Types

#### 1. Continuous Backups
- **PostgreSQL WAL Archiving**: Real-time transaction log streaming
- **Redis AOF**: Append-only file with fsync every second
- **MinIO Versioning**: Object versioning enabled on critical buckets

#### 2. Scheduled Backups

##### PostgreSQL
- **Frequency**: Every 6 hours
- **Method**: pg_dump with compression
- **Retention**: 30 days local, 90 days S3
- **Location**: `/backup/postgres/` and `s3://ait-backup/postgres/`

##### Redis
- **Frequency**: Every 4 hours
- **Method**: BGSAVE + RDB snapshot
- **Retention**: 30 days local, 90 days S3
- **Location**: `/backup/redis/` and `s3://ait-backup/redis/`

##### MinIO
- **Frequency**: Daily at 3:00 AM
- **Method**: mc mirror to S3
- **Retention**: 30 days local, 90 days S3
- **Location**: `/backup/minio/` and `s3://ait-backup/minio/`

##### Elasticsearch
- **Frequency**: Daily at 4:00 AM
- **Method**: Snapshot API
- **Retention**: 14 days local, 30 days S3
- **Location**: `/backup/elasticsearch/` and `s3://ait-backup/elasticsearch/`

#### 3. Full System Backup
- **Frequency**: Daily at 2:00 AM
- **Method**: Coordinated backup of all services
- **Retention**: 30 days

### Backup Storage

#### Primary Storage
- **Location**: Local server `/backup`
- **Capacity**: 2TB SSD
- **Monitoring**: Alert when >80% full

#### Secondary Storage (S3)
- **Provider**: AWS S3
- **Bucket**: `ait-backup`
- **Storage Class**: Standard-IA (Infrequent Access)
- **Versioning**: Enabled
- **Encryption**: AES-256 server-side encryption
- **Lifecycle**: Transition to Glacier after 90 days

#### Geographic Distribution
- **Primary Site**: Main data center
- **DR Site**: AWS us-east-1
- **Cross-Region Replication**: Enabled to us-west-2

## Recovery Procedures

### Scenario 1: Database Corruption

#### Symptoms
- Query errors, data inconsistencies
- PostgreSQL crashes or fails to start

#### Recovery Steps

1. **Assess the damage**
   ```bash
   # Check PostgreSQL logs
   docker logs ait-postgres

   # Check database status
   psql -U aitcore -d soriano_core -c "SELECT version();"
   ```

2. **Stop all services**
   ```bash
   cd /path/to/ait-core-soriano
   docker-compose down
   ```

3. **Restore from backup**
   ```bash
   cd backup

   # Restore from latest backup
   ./restore-postgres.sh

   # Or restore from specific backup
   ./restore-postgres.sh /backup/postgres/postgres_soriano_core_20260128_120000.sql.gz
   ```

4. **Verify restore**
   ```bash
   # Check table count and data
   psql -U aitcore -d soriano_core -c "SELECT COUNT(*) FROM information_schema.tables;"
   ```

5. **Restart services**
   ```bash
   docker-compose up -d
   ```

6. **Verify application functionality**
   - Test critical API endpoints
   - Check user authentication
   - Verify data integrity

**Estimated Recovery Time**: 30-60 minutes

### Scenario 2: Complete System Failure

#### Symptoms
- All services down
- Hardware failure
- Data center outage

#### Recovery Steps

1. **Provision new infrastructure**
   - Deploy new servers or cloud instances
   - Install Docker and dependencies
   - Configure networking and security groups

2. **Clone repository**
   ```bash
   git clone https://github.com/your-org/ait-core-soriano.git
   cd ait-core-soriano
   ```

3. **Download backups from S3**
   ```bash
   # Configure AWS credentials
   aws configure

   # Download latest backups
   aws s3 sync s3://ait-backup/postgres/ /backup/postgres/
   aws s3 sync s3://ait-backup/redis/ /backup/redis/
   aws s3 sync s3://ait-backup/minio/ /backup/minio/
   aws s3 sync s3://ait-backup/elasticsearch/ /backup/elasticsearch/
   ```

4. **Restore all services**
   ```bash
   cd backup
   ./restore-all.sh -a
   ```

5. **Update DNS records**
   - Point domain to new IP addresses
   - Update load balancer configuration

6. **Verify system health**
   ```bash
   # Check all services
   docker-compose ps

   # Run health checks
   curl http://localhost:3000/health
   curl http://localhost:4000/api/health
   ```

7. **Monitor system**
   - Check Grafana dashboards
   - Review error logs
   - Test user workflows

**Estimated Recovery Time**: 2-4 hours

### Scenario 3: Data Loss (Accidental Deletion)

#### Symptoms
- User reports missing data
- Records deleted accidentally
- Tables dropped

#### Recovery Steps

1. **Determine the scope**
   ```bash
   # Check audit logs
   psql -U aitcore -d soriano_core -c "SELECT * FROM audit_log WHERE action='DELETE' ORDER BY timestamp DESC LIMIT 100;"
   ```

2. **Find appropriate backup**
   ```bash
   # List available backups
   ls -lh /backup/postgres/

   # Or from S3
   aws s3 ls s3://ait-backup/postgres/
   ```

3. **Restore to temporary database**
   ```bash
   # Create temporary database
   createdb -U aitcore temp_restore

   # Restore specific backup
   gunzip -c /backup/postgres/postgres_soriano_core_20260128_080000.sql.gz | \
     psql -U aitcore -d temp_restore
   ```

4. **Extract and restore specific data**
   ```bash
   # Export specific data
   psql -U aitcore -d temp_restore -c "COPY (SELECT * FROM deleted_table WHERE ...) TO STDOUT" | \
     psql -U aitcore -d soriano_core -c "COPY deleted_table FROM STDIN"
   ```

5. **Verify data restoration**
   - Check record counts
   - Verify data integrity
   - Test application functionality

6. **Clean up**
   ```bash
   dropdb -U aitcore temp_restore
   ```

**Estimated Recovery Time**: 15-30 minutes

### Scenario 4: Ransomware Attack

#### Symptoms
- Files encrypted
- Ransom demand
- Unusual network activity

#### Recovery Steps

1. **IMMEDIATE ACTIONS**
   ```bash
   # Disconnect from network
   ifconfig eth0 down

   # Stop all services
   docker-compose down

   # Take snapshot of compromised system for forensics
   dd if=/dev/sda of=/external/forensic-image.dd
   ```

2. **Assess damage**
   - Identify encrypted files
   - Check backup integrity
   - Review security logs

3. **Isolate and contain**
   - Disconnect affected systems
   - Change all passwords
   - Revoke API keys and tokens

4. **Restore from clean backups**
   ```bash
   # Verify backup integrity
   ./verify-backups.sh

   # Restore from backup taken before infection
   ./restore-all.sh -a
   ```

5. **Harden security**
   - Update all software
   - Apply security patches
   - Review firewall rules
   - Enable 2FA for all accounts

6. **Monitor for reinfection**
   - Deploy IDS/IPS
   - Enable enhanced logging
   - Schedule security audit

**Estimated Recovery Time**: 4-8 hours

### Scenario 5: Cloud Provider Outage

#### Symptoms
- Unable to access cloud resources
- S3 unavailable
- DNS resolution failures

#### Recovery Steps

1. **Activate DR site**
   ```bash
   # Switch to secondary region
   export AWS_DEFAULT_REGION=us-west-2
   ```

2. **Update DNS**
   ```bash
   # Point to DR infrastructure
   aws route53 change-resource-record-sets --hosted-zone-id Z123456 \
     --change-batch file://dns-failover.json
   ```

3. **Verify DR site status**
   ```bash
   # Check replication lag
   aws rds describe-db-instances --db-instance-identifier ait-dr

   # Verify data consistency
   ./verify-backups.sh
   ```

4. **Redirect traffic**
   - Update load balancer
   - Enable CDN failover
   - Notify users if necessary

5. **Monitor recovery**
   - Watch for primary region recovery
   - Plan failback procedure

**Estimated Recovery Time**: 30-60 minutes

## Backup Verification

### Weekly Verification
Every Sunday at 1:00 AM:
```bash
./verify-backups.sh
```

### Monthly DR Test
First Monday of each month:
1. Restore to test environment
2. Verify all services functional
3. Run integration tests
4. Document results

### Quarterly Full DR Drill
Complete disaster recovery simulation:
1. Simulate major failure
2. Full system restore
3. Performance testing
4. Documentation update
5. Team debrief

## Monitoring and Alerts

### Backup Monitoring
- **Success/Failure**: Slack notification per backup job
- **Size Anomalies**: Alert if backup size changes >30%
- **Missing Backups**: Alert if backup not completed in expected timeframe
- **Disk Space**: Alert at 80% and 90% capacity

### S3 Monitoring
- **Replication Lag**: Alert if >15 minutes
- **Failed Uploads**: Immediate alert
- **Lifecycle Policy**: Monthly review

## Security

### Backup Encryption
- All backups encrypted at rest (AES-256)
- Transport encryption (TLS 1.3)
- Encrypted credentials using AWS Secrets Manager

### Access Control
- Backup scripts run as dedicated service account
- S3 bucket policies with least privilege
- MFA required for backup deletion
- Audit logging enabled

### Key Management
- Regular key rotation (90 days)
- Encrypted key storage
- Key backup to secure location

## Emergency Contacts

### Technical Team
- **DevOps Lead**: [Name] - [Phone] - [Email]
- **Database Administrator**: [Name] - [Phone] - [Email]
- **Security Officer**: [Name] - [Phone] - [Email]
- **CTO**: [Name] - [Phone] - [Email]

### Vendors
- **Cloud Provider Support**: [AWS Premium Support] - [Case URL]
- **Database Vendor**: [PostgreSQL Support] - [Contract ID]
- **Security Vendor**: [Contact Information]

### External Services
- **DNS Provider**: [Provider] - [Support URL]
- **CDN Provider**: [Provider] - [Support URL]

## Documentation

### Runbooks
- [PostgreSQL Backup/Restore](./runbooks/postgres.md)
- [Redis Backup/Restore](./runbooks/redis.md)
- [MinIO Backup/Restore](./runbooks/minio.md)
- [Elasticsearch Backup/Restore](./runbooks/elasticsearch.md)

### Change Log
- **2026-01-28**: Initial DR plan created
- Update this log with all changes to DR procedures

## Testing Schedule

| Test Type | Frequency | Last Completed | Next Scheduled |
|-----------|-----------|----------------|----------------|
| Backup Verification | Weekly | - | Every Sunday |
| Database Restore | Monthly | - | First Monday |
| Full DR Drill | Quarterly | - | End of Q1 2026 |
| Security Audit | Quarterly | - | End of Q1 2026 |
| Plan Review | Annually | - | January 2027 |

## Appendix

### A. Backup Script Reference
- `backup-all.sh`: Master backup orchestration
- `backup-postgres.sh`: PostgreSQL backup
- `backup-redis.sh`: Redis backup
- `backup-minio.sh`: MinIO/S3 backup
- `backup-elasticsearch.sh`: Elasticsearch backup

### B. Restore Script Reference
- `restore-all.sh`: Master restore orchestration
- `restore-postgres.sh`: PostgreSQL restore
- `restore-redis.sh`: Redis restore
- `restore-minio.sh`: MinIO/S3 restore
- `restore-elasticsearch.sh`: Elasticsearch restore

### C. Configuration Files
- `backup.env`: Environment configuration
- `cron-schedule.example`: Cron job examples
- `docker-compose.yml`: Service definitions

### D. Useful Commands

#### Check Backup Status
```bash
ls -lh /backup/postgres/ | tail -5
aws s3 ls s3://ait-backup/postgres/ --recursive | tail -5
```

#### Manual Backup
```bash
./backup-all.sh
```

#### Test Restore (Dry Run)
```bash
# Restore to test environment
export DB_HOST=test-db.internal
export DB_NAME=test_restore
./restore-postgres.sh
```

#### Check Service Health
```bash
docker-compose ps
curl http://localhost:3000/health
psql -U aitcore -c "SELECT version();"
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-28
**Next Review**: 2026-04-28
