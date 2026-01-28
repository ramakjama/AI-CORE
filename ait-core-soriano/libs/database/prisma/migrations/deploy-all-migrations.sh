#!/bin/bash

# =============================================================================
# AIT-CORE Database Migration Deployment Script
# =============================================================================
# This script deploys Prisma migrations to all 40 databases
# Usage: ./deploy-all-migrations.sh [environment]
# Example: ./deploy-all-migrations.sh production
# =============================================================================

set -e  # Exit on error

ENVIRONMENT=${1:-development}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="migration_deployment_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD}

# Array of all databases
declare -a DATABASES=(
    "ait_core_db01_policies"
    "ait_core_db02_claims"
    "ait_core_db03_customers"
    "ait_core_db04_finance"
    "ait_core_db05_agents"
    "ait_core_db06_products"
    "ait_core_db07_quotes"
    "ait_core_db08_underwriting"
    "ait_core_db09_reinsurance"
    "ait_core_db10_documents"
    "ait_core_db11_notifications"
    "ait_core_db12_tasks"
    "ait_core_db13_calendar"
    "ait_core_db14_marketing"
    "ait_core_db15_analytics"
    "ait_core_db16_reporting"
    "ait_core_db17_integrations"
    "ait_core_db18_compliance"
    "ait_core_db19_workflows"
    "ait_core_db20_vehicles"
    "ait_core_db21_properties"
    "ait_core_db22_insurers"
    "ait_core_db23_actuarial"
    "ait_core_db24_territories"
    "ait_core_db25_pricing"
    "ait_core_db26_renewals"
    "ait_core_db27_fraud_detection"
    "ait_core_db28_performance"
    "ait_core_db29_authentication"
    "ait_core_db30_audit_logs"
    "ait_core_db31_beneficiaries"
    "ait_core_db32_medical_records"
    "ait_core_db33_training"
    "ait_core_db34_complaints"
    "ait_core_db35_surveys"
    "ait_core_db36_referrals"
    "ait_core_db37_loyalty"
    "ait_core_db38_content_management"
    "ait_core_db39_email_templates"
    "ait_core_db40_system_config"
)

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}" | tee -a "$LOG_FILE"
}

# Function to check if database exists
check_database() {
    local db_name=$1
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $db_name
}

# Function to create database if it doesn't exist
create_database() {
    local db_name=$1
    if check_database $db_name; then
        print_message "$YELLOW" "Database $db_name already exists"
    else
        print_message "$BLUE" "Creating database $db_name..."
        PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $db_name
        print_message "$GREEN" "Database $db_name created successfully"
    fi
}

# Function to run migration for a specific database
run_migration() {
    local db_name=$1
    local db_number=$(echo $db_name | grep -oP 'db\K\d+')

    print_message "$BLUE" "=========================================="
    print_message "$BLUE" "Migrating: $db_name (DB-$db_number)"
    print_message "$BLUE" "=========================================="

    # Set DATABASE_URL
    export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${db_name}"

    # Create database if needed
    create_database $db_name

    # Run migration
    print_message "$BLUE" "Running Prisma migration..."
    if npx prisma migrate deploy 2>&1 | tee -a "$LOG_FILE"; then
        print_message "$GREEN" "✓ Migration completed successfully for $db_name"
        return 0
    else
        print_message "$RED" "✗ Migration failed for $db_name"
        return 1
    fi
}

# Function to backup database
backup_database() {
    local db_name=$1
    local backup_dir="./backups/${TIMESTAMP}"

    mkdir -p "$backup_dir"

    print_message "$BLUE" "Backing up $db_name..."
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -F c -b -v -f "${backup_dir}/${db_name}.backup" $db_name 2>&1 | tee -a "$LOG_FILE"

    if [ $? -eq 0 ]; then
        print_message "$GREEN" "✓ Backup completed: ${backup_dir}/${db_name}.backup"
    else
        print_message "$YELLOW" "⚠ Backup skipped (database may not exist yet)"
    fi
}

# Main execution
main() {
    print_message "$GREEN" "=========================================="
    print_message "$GREEN" "AIT-CORE Database Migration Deployment"
    print_message "$GREEN" "Environment: $ENVIRONMENT"
    print_message "$GREEN" "Timestamp: $TIMESTAMP"
    print_message "$GREEN" "=========================================="

    # Check if password is set
    if [ -z "$DB_PASSWORD" ]; then
        print_message "$RED" "Error: DB_PASSWORD environment variable not set"
        exit 1
    fi

    # Check if npx and prisma are available
    if ! command -v npx &> /dev/null; then
        print_message "$RED" "Error: npx not found. Please install Node.js"
        exit 1
    fi

    # Confirmation for production
    if [ "$ENVIRONMENT" = "production" ]; then
        print_message "$YELLOW" "⚠️  WARNING: You are about to deploy to PRODUCTION!"
        read -p "Are you sure you want to continue? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_message "$RED" "Deployment cancelled"
            exit 0
        fi
    fi

    # Initialize counters
    success_count=0
    failed_count=0

    # Loop through all databases
    for db_name in "${DATABASES[@]}"; do
        echo "" | tee -a "$LOG_FILE"

        # Backup if production
        if [ "$ENVIRONMENT" = "production" ]; then
            backup_database $db_name
        fi

        # Run migration
        if run_migration $db_name; then
            ((success_count++))
        else
            ((failed_count++))
        fi

        echo "" | tee -a "$LOG_FILE"
    done

    # Summary
    print_message "$GREEN" "=========================================="
    print_message "$GREEN" "Migration Deployment Summary"
    print_message "$GREEN" "=========================================="
    print_message "$GREEN" "Total databases: ${#DATABASES[@]}"
    print_message "$GREEN" "Successful: $success_count"
    if [ $failed_count -gt 0 ]; then
        print_message "$RED" "Failed: $failed_count"
    else
        print_message "$GREEN" "Failed: $failed_count"
    fi
    print_message "$GREEN" "Log file: $LOG_FILE"
    print_message "$GREEN" "=========================================="

    # Exit with error if any failures
    if [ $failed_count -gt 0 ]; then
        exit 1
    fi
}

# Run main function
main
