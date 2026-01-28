# AIT-CORE Backup System - Quick Start Guide

## 5-Minute Setup

### 1. Initial Setup (1 minute)

```bash
cd /path/to/ait-core-soriano/backup

# Make scripts executable
chmod +x *.sh

# Run automated setup
./setup-backups.sh
```

### 2. Configure (2 minutes)

```bash
# Copy and edit configuration
cp backup.env.example backup.env
nano backup.env
```

**Minimum required settings:**
```bash
POSTGRES_PASSWORD=your_database_password
MINIO_SECRET_KEY=your_minio_secret
```

### 3. Test (1 minute)

```bash
# Source configuration
source backup.env

# Run test backup
./backup-all.sh

# Verify it worked
ls -lh /backup/postgres/
```

### 4. Schedule (1 minute)

```bash
# Edit crontab
crontab -e

# Add this line (adjust path):
0 2 * * * source /path/to/backup/backup.env && /path/to/backup/backup-all.sh
```

Done! Your backups are now automated.

---

## Essential Commands

```bash
# Backup Everything
./backup-all.sh

# Restore Everything
./restore-all.sh -a

# Verify Backups
./verify-backups.sh

# View Status
ls -lht /backup/*/
```

---

## What You Get

✅ **Automated Backups** for:
- PostgreSQL (every 6 hours)
- Redis (every 4 hours)
- MinIO/S3 (daily)
- Elasticsearch (daily)

✅ **Features**:
- Compression (saves 80% space)
- S3 sync (optional)
- Email/Slack alerts (optional)
- 30-day retention
- Automatic verification

✅ **Complete DR System**:
- Full restore procedures
- Tested recovery scripts
- Detailed documentation

---

## Next Steps

1. **Configure S3** (optional but recommended)
   ```bash
   # Edit backup.env
   S3_BUCKET=your-backup-bucket
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   ```

2. **Setup Notifications** (optional)
   ```bash
   # Edit backup.env
   SLACK_WEBHOOK=https://hooks.slack.com/services/...
   ```

3. **Test Restore** (important!)
   ```bash
   ./test-restore.sh
   ```

4. **Review DR Plan**
   ```bash
   less disaster-recovery-plan.md
   ```

---

## Troubleshooting

**Backup fails?**
```bash
# Check logs
tail -50 /backup/postgres/backup.log

# Test database connection
psql -h localhost -U aitcore -d soriano_core -c "SELECT 1"
```

**Need help?**
- See: [README.md](./README.md) for full documentation
- See: [INDEX.md](./INDEX.md) for complete file reference
- Check logs in `/backup/*.log`

---

## File Reference

**Key Files:**
- `backup-all.sh` - Run all backups
- `restore-all.sh` - Restore everything
- `verify-backups.sh` - Check backup health
- `backup.env` - Your configuration
- `README.md` - Full documentation
- `disaster-recovery-plan.md` - DR procedures

**Total System Size:** ~190KB (scripts + docs)
**Backup Storage Required:** 2x your largest database

---

## Production Checklist

Before going live:
- [ ] Configuration file created
- [ ] Test backup completed
- [ ] Test restore completed
- [ ] Cron jobs scheduled
- [ ] S3 configured (recommended)
- [ ] Notifications setup (recommended)
- [ ] Team trained on restore procedures

---

## Support

**Documentation:**
- Quick Start: This file
- Complete Guide: [README.md](./README.md)
- Production Deploy: [PRODUCTION-DEPLOYMENT-GUIDE.md](./PRODUCTION-DEPLOYMENT-GUIDE.md)
- DR Procedures: [disaster-recovery-plan.md](./disaster-recovery-plan.md)
- File Index: [INDEX.md](./INDEX.md)

**Getting Help:**
1. Check logs in `/backup/*.log`
2. Review documentation
3. Run `./verify-backups.sh`
4. Contact DevOps team

---

**Ready to deploy?** See [PRODUCTION-DEPLOYMENT-GUIDE.md](./PRODUCTION-DEPLOYMENT-GUIDE.md) for detailed production setup.

**Last Updated:** 2026-01-28
