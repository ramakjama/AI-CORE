#!/bin/bash
# AIT-CORE Kubernetes Deployment Script
# Usage: ./deploy.sh [dev|staging|production]

set -e

ENVIRONMENT=${1:-production}
NAMESPACE="ait-core"

if [ "$ENVIRONMENT" = "dev" ]; then
    NAMESPACE="ait-core-dev"
elif [ "$ENVIRONMENT" = "staging" ]; then
    NAMESPACE="ait-core-staging"
fi

echo "=========================================="
echo "AIT-CORE Kubernetes Deployment"
echo "Environment: $ENVIRONMENT"
echo "Namespace: $NAMESPACE"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    log_error "kubectl is not installed"
    exit 1
fi

if ! command -v kustomize &> /dev/null; then
    log_warn "kustomize not found, using kubectl kustomize"
fi

# Check cluster connection
log_info "Checking cluster connection..."
if ! kubectl cluster-info &> /dev/null; then
    log_error "Cannot connect to Kubernetes cluster"
    exit 1
fi

log_info "Connected to cluster: $(kubectl config current-context)"

# Create namespace if it doesn't exist
log_info "Creating namespace..."
kubectl apply -f namespace.yaml

# Create secrets (if not exists)
if ! kubectl get secret ait-core-secrets -n $NAMESPACE &> /dev/null; then
    log_warn "Secrets not found. Please create secrets before deploying:"
    log_warn "kubectl create secret generic ait-core-secrets --from-env-file=overlays/$ENVIRONMENT/secrets.env -n $NAMESPACE"
    read -p "Do you want to continue without secrets? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Apply CRDs if needed (cert-manager, prometheus-operator)
log_info "Checking for required CRDs..."

if ! kubectl get crd certificates.cert-manager.io &> /dev/null; then
    log_warn "cert-manager CRDs not found. Installing..."
    kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml
    log_info "Waiting for cert-manager to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n cert-manager
fi

if ! kubectl get crd servicemonitors.monitoring.coreos.com &> /dev/null; then
    log_warn "Prometheus Operator CRDs not found. Please install Prometheus Operator first."
fi

# Deploy using Kustomize
log_info "Deploying AIT-CORE to $ENVIRONMENT..."

if command -v kustomize &> /dev/null; then
    kustomize build overlays/$ENVIRONMENT | kubectl apply -f -
else
    kubectl apply -k overlays/$ENVIRONMENT
fi

# Wait for deployments to be ready
log_info "Waiting for deployments to be ready..."

deployments=(
    "api"
    "web"
    "admin"
    "mobile-api"
)

for deployment in "${deployments[@]}"; do
    log_info "Waiting for $deployment..."
    kubectl rollout status deployment/$deployment -n $NAMESPACE --timeout=300s
done

# Check pod status
log_info "Checking pod status..."
kubectl get pods -n $NAMESPACE

# Get service endpoints
log_info "Service endpoints:"
kubectl get svc -n $NAMESPACE

# Get ingress
if kubectl get ingress -n $NAMESPACE &> /dev/null; then
    log_info "Ingress configuration:"
    kubectl get ingress -n $NAMESPACE
fi

# Display useful commands
echo ""
log_info "Deployment completed successfully!"
echo ""
echo "Useful commands:"
echo "  View pods:        kubectl get pods -n $NAMESPACE"
echo "  View logs:        kubectl logs -f deployment/api -n $NAMESPACE"
echo "  View services:    kubectl get svc -n $NAMESPACE"
echo "  View ingress:     kubectl get ingress -n $NAMESPACE"
echo "  Port forward:     kubectl port-forward svc/api 3000:3000 -n $NAMESPACE"
echo ""

# Health check
log_info "Performing health check..."
sleep 10

healthy=0
unhealthy=0

pods=$(kubectl get pods -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')
for pod in $pods; do
    status=$(kubectl get pod $pod -n $NAMESPACE -o jsonpath='{.status.phase}')
    if [ "$status" = "Running" ]; then
        ((healthy++))
    else
        ((unhealthy++))
        log_warn "Pod $pod is in $status state"
    fi
done

log_info "Health check: $healthy healthy, $unhealthy unhealthy"

if [ $unhealthy -gt 0 ]; then
    log_warn "Some pods are not healthy. Check with: kubectl describe pods -n $NAMESPACE"
fi

echo ""
log_info "Deployment complete! 🚀"
