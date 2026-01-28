#!/bin/bash

###############################################################################
# DevOps Master Script
# Description: Interactive menu for all DevOps operations
# Usage: ./devops.sh
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Clear screen and show header
show_header() {
    clear
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}║                  ${MAGENTA}AIT-CORE DevOps Menu${CYAN}                      ║${NC}"
    echo -e "${CYAN}║                                                              ║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Show main menu
show_menu() {
    show_header

    echo -e "${BLUE}Database Management:${NC}"
    echo "  1)  Run migrations"
    echo "  2)  Rollback migration"
    echo "  3)  Migration status"
    echo "  4)  Create new migration"
    echo "  5)  Seed database"
    echo ""

    echo -e "${BLUE}Backup & Restore:${NC}"
    echo "  6)  Create backup"
    echo "  7)  List backups"
    echo "  8)  Restore from backup"
    echo ""

    echo -e "${BLUE}Deployment:${NC}"
    echo "  9)  Deploy to staging"
    echo "  10) Deploy to production"
    echo "  11) Rollback deployment"
    echo ""

    echo -e "${BLUE}Monitoring:${NC}"
    echo "  12) Health check"
    echo "  13) Start monitoring"
    echo "  14) Analyze logs"
    echo "  15) Tail logs"
    echo ""

    echo -e "${BLUE}Performance:${NC}"
    echo "  16) Quick performance test"
    echo "  17) Full performance test"
    echo "  18) Load test"
    echo "  19) Stress test"
    echo ""

    echo -e "${BLUE}Utilities:${NC}"
    echo "  20) Setup environment"
    echo "  21) View README"
    echo "  22) Check system status"
    echo ""

    echo -e "${RED}  0) Exit${NC}"
    echo ""
}

# Read user choice
read_choice() {
    local choice
    read -p "$(echo -e ${GREEN}Enter choice [0-22]: ${NC})" choice
    echo "$choice"
}

# Execute choice
execute_choice() {
    local choice=$1

    case $choice in
        1)
            bash "$SCRIPT_DIR/db-migrate.sh" up
            ;;
        2)
            read -p "Number of migrations to rollback [1]: " count
            bash "$SCRIPT_DIR/db-migrate.sh" down "${count:-1}"
            ;;
        3)
            bash "$SCRIPT_DIR/db-migrate.sh" status
            ;;
        4)
            read -p "Migration name: " name
            bash "$SCRIPT_DIR/db-migrate.sh" create "$name"
            ;;
        5)
            echo "Environments: development, staging, production, test"
            read -p "Environment [development]: " env
            bash "$SCRIPT_DIR/db-seed.sh" "${env:-development}"
            ;;
        6)
            echo "Options: --db-only, --files-only, or full backup"
            read -p "Backup type [full]: " type
            bash "$SCRIPT_DIR/backup.sh" $type
            ;;
        7)
            bash "$SCRIPT_DIR/backup.sh" --list
            ;;
        8)
            bash "$SCRIPT_DIR/restore.sh"
            ;;
        9)
            bash "$SCRIPT_DIR/deploy.sh" staging
            ;;
        10)
            bash "$SCRIPT_DIR/deploy.sh" production
            ;;
        11)
            read -p "Environment [staging]: " env
            bash "$SCRIPT_DIR/rollback-deployment.sh" "${env:-staging}"
            ;;
        12)
            bash "$SCRIPT_DIR/health-check.sh"
            ;;
        13)
            read -p "Check interval in seconds [60]: " interval
            bash "$SCRIPT_DIR/monitor.sh" --interval "${interval:-60}" --alert
            ;;
        14)
            bash "$SCRIPT_DIR/log-analyzer.sh"
            ;;
        15)
            bash "$SCRIPT_DIR/log-analyzer.sh" --tail
            ;;
        16)
            bash "$SCRIPT_DIR/performance-test.sh" --quick
            ;;
        17)
            bash "$SCRIPT_DIR/performance-test.sh"
            ;;
        18)
            bash "$SCRIPT_DIR/performance-test.sh" --load
            ;;
        19)
            bash "$SCRIPT_DIR/performance-test.sh" --stress
            ;;
        20)
            bash "$SCRIPT_DIR/setup.sh"
            ;;
        21)
            less "$SCRIPT_DIR/README.md"
            ;;
        22)
            show_header
            echo -e "${BLUE}System Status:${NC}"
            echo ""
            bash "$SCRIPT_DIR/health-check.sh" --quick
            ;;
        0)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option${NC}"
            ;;
    esac
}

# Pause for user to read output
pause() {
    echo ""
    read -p "Press [Enter] to continue..."
}

# Main loop
main() {
    while true; do
        show_menu
        choice=$(read_choice)
        echo ""

        if [ "$choice" = "0" ]; then
            execute_choice "$choice"
            break
        fi

        execute_choice "$choice"
        pause
    done
}

# Check if running from scripts directory
if [ ! -f "$SCRIPT_DIR/db-migrate.sh" ]; then
    echo -e "${RED}Error: Scripts not found in $SCRIPT_DIR${NC}"
    echo "Please run this script from the scripts directory"
    exit 1
fi

main
