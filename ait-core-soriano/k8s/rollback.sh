#!/bin/bash
# AIT-CORE Rollback Script
# Usage: ./rollback.sh [deployment-name] [namespace]

set -e

DEPLOYMENT=${1:-api}
NAMESPACE=${2:-ait-core}

echo "=========================================="
echo "AIT-CORE Rollback Script"
echo "Deployment: $DEPLOYMENT"
echo "Namespace: $NAMESPACE"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if deployment exists
if ! kubectl get deployment $DEPLOYMENT -n $NAMESPACE &> /dev/null; then
    log_error "Deployment $DEPLOYMENT not found in namespace $NAMESPACE"
    exit 1
fi

# Show rollout history
log_info "Rollout history for $DEPLOYMENT:"
kubectl rollout history deployment/$DEPLOYMENT -n $NAMESPACE

# Get current revision
CURRENT_REVISION=$(kubectl get deployment $DEPLOYMENT -n $NAMESPACE -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}')
log_info "Current revision: $CURRENT_REVISION"

# Confirm rollback
read -p "Do you want to rollback to previous revision? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "Rollback cancelled"
    exit 0
fi

# Perform rollback
log_info "Rolling back $DEPLOYMENT..."
kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE

# Wait for rollback to complete
log_info "Waiting for rollback to complete..."
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=300s

# Verify rollback
NEW_REVISION=$(kubectl get deployment $DEPLOYMENT -n $NAMESPACE -o jsonpath='{.metadata.annotations.deployment\.kubernetes\.io/revision}')
log_info "Rollback complete. New revision: $NEW_REVISION"

# Show pod status
log_info "Pod status:"
kubectl get pods -n $NAMESPACE -l app=$DEPLOYMENT

log_info "Rollback completed successfully! ✓"
