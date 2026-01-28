#!/bin/bash
################################################################################
# Backup System Setup Script
# Initial setup and configuration for backup system
################################################################################

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="${BACKUP_ROOT:-/backup}"

echo "=========================================="
echo "AIT-CORE Backup System Setup"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Warning: Not running as root. Some operations may fail."
    echo "Consider running with sudo for full setup."
    echo ""
fi

# Create backup directories
echo "Creating backup directories..."
mkdir -p "$BACKUP_ROOT"/{postgres,redis,minio,elasticsearch,logs}
echo "✓ Directories created at $BACKUP_ROOT"

# Make scripts executable
echo "Making scripts executable..."
chmod +x "$SCRIPT_DIR"/*.sh
echo "✓ Scripts are now executable"

# Check for required tools
echo ""
echo "Checking required tools..."

check_tool() {
    local tool=$1
    local package=${2:-$1}

    if command -v "$tool" &> /dev/null; then
        echo "✓ $tool is installed"
        return 0
    else
        echo "✗ $tool is NOT installed"
        echo "  Install with: sudo apt-get install $package  (Debian/Ubuntu)"
        echo "             or: sudo yum install $package       (RHEL/CentOS)"
        return 1
    fi
}

MISSING_TOOLS=0

check_tool "psql" "postgresql-client" || ((MISSING_TOOLS++))
check_tool "pg_dump" "postgresql-client" || ((MISSING_TOOLS++))
check_tool "redis-cli" "redis-tools" || ((MISSING_TOOLS++))
check_tool "aws" "awscli" || ((MISSING_TOOLS++))
check_tool "gzip" "gzip" || ((MISSING_TOOLS++))
check_tool "tar" "tar" || ((MISSING_TOOLS++))
check_tool "curl" "curl" || ((MISSING_TOOLS++))

# Check for MinIO client
if ! command -v mc &> /dev/null; then
    echo "✗ mc (MinIO client) is NOT installed"
    echo ""
    echo "Installing MinIO client..."

    if curl -fsSL https://dl.min.io/client/mc/release/linux-amd64/mc -o /tmp/mc; then
        sudo mv /tmp/mc /usr/local/bin/mc
        sudo chmod +x /usr/local/bin/mc
        echo "✓ MinIO client installed"
    else
        echo "✗ Failed to install MinIO client"
        echo "  Manual installation: https://min.io/docs/minio/linux/reference/minio-mc.html"
        ((MISSING_TOOLS++))
    fi
else
    echo "✓ mc (MinIO client) is installed"
fi

echo ""

if [ $MISSING_TOOLS -gt 0 ]; then
    echo "⚠ Warning: $MISSING_TOOLS required tool(s) missing"
    echo "Please install missing tools before running backups"
else
    echo "✓ All required tools are installed"
fi

# Create configuration file
echo ""
if [ ! -f "$SCRIPT_DIR/backup.env" ]; then
    echo "Creating backup.env from template..."
    cp "$SCRIPT_DIR/backup.env.example" "$SCRIPT_DIR/backup.env"
    echo "✓ backup.env created"
    echo ""
    echo "IMPORTANT: Edit backup.env with your configuration:"
    echo "  nano $SCRIPT_DIR/backup.env"
    echo ""
else
    echo "✓ backup.env already exists"
fi

# Test database connection
echo ""
echo "Testing database connection..."
if [ -f "$SCRIPT_DIR/backup.env" ]; then
    source "$SCRIPT_DIR/backup.env"

    if [ -n "${POSTGRES_PASSWORD:-}" ]; then
        if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "${DB_HOST:-localhost}" -p "${DB_PORT:-5432}" \
           -U "${DB_USER:-aitcore}" -d "${DB_NAME:-soriano_core}" -c "SELECT 1;" &> /dev/null; then
            echo "✓ PostgreSQL connection successful"
        else
            echo "✗ PostgreSQL connection failed"
            echo "  Check database credentials in backup.env"
        fi
    else
        echo "⚠ POSTGRES_PASSWORD not set in backup.env"
    fi
else
    echo "⚠ backup.env not found, skipping connection test"
fi

# Setup cron jobs (optional)
echo ""
read -p "Do you want to setup automated backup cron jobs? (y/n): " -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Setting up cron jobs..."

    # Generate crontab entries
    CRON_FILE="/tmp/ait-backup-cron.txt"
    cat > "$CRON_FILE" <<EOF
# AIT-CORE Automated Backups
SHELL=/bin/bash
BACKUP_ENV=$SCRIPT_DIR/backup.env

# Daily full backup at 2 AM
0 2 * * * source \$BACKUP_ENV && $SCRIPT_DIR/backup-all.sh >> $BACKUP_ROOT/cron.log 2>&1

# PostgreSQL every 6 hours
0 */6 * * * source \$BACKUP_ENV && $SCRIPT_DIR/backup-postgres.sh >> $BACKUP_ROOT/postgres-cron.log 2>&1

# Redis every 4 hours
0 */4 * * * source \$BACKUP_ENV && $SCRIPT_DIR/backup-redis.sh >> $BACKUP_ROOT/redis-cron.log 2>&1

# MinIO daily at 3 AM
0 3 * * * source \$BACKUP_ENV && $SCRIPT_DIR/backup-minio.sh >> $BACKUP_ROOT/minio-cron.log 2>&1

# Elasticsearch daily at 4 AM
0 4 * * * source \$BACKUP_ENV && $SCRIPT_DIR/backup-elasticsearch.sh >> $BACKUP_ROOT/es-cron.log 2>&1

# Weekly verification on Sundays at 1 AM
0 1 * * 0 source \$BACKUP_ENV && $SCRIPT_DIR/verify-backups.sh >> $BACKUP_ROOT/verify.log 2>&1
EOF

    echo "Cron jobs have been generated. To install them, run:"
    echo "  crontab $CRON_FILE"
    echo ""
    echo "Or manually add them to your crontab with: crontab -e"
    echo "Cron entries saved to: $CRON_FILE"
else
    echo "Skipping cron setup. See cron-schedule.example for manual setup."
fi

# Setup S3 (optional)
echo ""
read -p "Do you want to configure S3 for remote backups? (y/n): " -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "S3 Configuration"
    echo "----------------"

    read -p "S3 Bucket Name: " S3_BUCKET
    read -p "AWS Region (default: us-east-1): " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}

    echo ""
    echo "Testing S3 connection..."

    if aws s3 ls "s3://$S3_BUCKET/" &> /dev/null; then
        echo "✓ S3 bucket is accessible"
    else
        echo "✗ Cannot access S3 bucket"
        echo ""
        read -p "Do you want to create the bucket? (y/n): " -r
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            aws s3 mb "s3://$S3_BUCKET" --region "$AWS_REGION"
            echo "✓ Bucket created: s3://$S3_BUCKET"

            # Enable versioning
            aws s3api put-bucket-versioning \
                --bucket "$S3_BUCKET" \
                --versioning-configuration Status=Enabled
            echo "✓ Versioning enabled"

            # Enable encryption
            aws s3api put-bucket-encryption \
                --bucket "$S3_BUCKET" \
                --server-side-encryption-configuration '{
                    "Rules": [{
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }]
                }'
            echo "✓ Encryption enabled"

            # Set lifecycle policy
            aws s3api put-bucket-lifecycle-configuration \
                --bucket "$S3_BUCKET" \
                --lifecycle-configuration "file://$SCRIPT_DIR/s3-lifecycle.json"
            echo "✓ Lifecycle policy applied"
        fi
    fi

    # Update backup.env
    if [ -f "$SCRIPT_DIR/backup.env" ]; then
        sed -i "s|^S3_BUCKET=.*|S3_BUCKET=$S3_BUCKET|" "$SCRIPT_DIR/backup.env"
        sed -i "s|^AWS_DEFAULT_REGION=.*|AWS_DEFAULT_REGION=$AWS_REGION|" "$SCRIPT_DIR/backup.env"
        echo "✓ backup.env updated with S3 configuration"
    fi
fi

# Run initial backup test
echo ""
read -p "Do you want to run a test backup now? (y/n): " -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running test backup..."
    source "$SCRIPT_DIR/backup.env"
    bash "$SCRIPT_DIR/backup-all.sh"
fi

# Summary
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Review and update configuration: $SCRIPT_DIR/backup.env"
echo "2. Test backups manually: $SCRIPT_DIR/backup-all.sh"
echo "3. Setup cron jobs for automation (see above)"
echo "4. Review disaster recovery plan: $SCRIPT_DIR/disaster-recovery-plan.md"
echo "5. Schedule DR testing and verification"
echo ""
echo "Backup directories:"
echo "  PostgreSQL:     $BACKUP_ROOT/postgres"
echo "  Redis:          $BACKUP_ROOT/redis"
echo "  MinIO:          $BACKUP_ROOT/minio"
echo "  Elasticsearch:  $BACKUP_ROOT/elasticsearch"
echo ""
echo "Documentation:"
echo "  README:         $SCRIPT_DIR/README.md"
echo "  DR Plan:        $SCRIPT_DIR/disaster-recovery-plan.md"
echo ""
echo "For help and support, see README.md"
echo "=========================================="

exit 0
