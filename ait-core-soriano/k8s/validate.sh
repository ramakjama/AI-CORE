#!/bin/bash
# Kubernetes Manifest Validation Script
# Validates all K8s manifests before deployment

set -e

echo "=========================================="
echo "AIT-CORE Kubernetes Manifest Validation"
echo "=========================================="

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

log_info() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((ERRORS++))
}

log_warn() {
    echo -e "${YELLOW}[!]${NC} $1"
    ((WARNINGS++))
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    log_error "kubectl is not installed"
    exit 1
fi

# Check if kustomize is available
if ! command -v kustomize &> /dev/null; then
    log_warn "kustomize not found, using kubectl kustomize"
    KUSTOMIZE="kubectl kustomize"
else
    KUSTOMIZE="kustomize"
fi

# Validate base manifests
log_info "Validating base manifests..."

if [ ! -d "base" ]; then
    log_error "base directory not found"
    exit 1
fi

# Validate namespace
if [ -f "namespace.yaml" ]; then
    kubectl apply --dry-run=client -f namespace.yaml > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_info "namespace.yaml is valid"
    else
        log_error "namespace.yaml is invalid"
    fi
else
    log_error "namespace.yaml not found"
fi

# Validate ConfigMaps
log_info "Validating ConfigMaps..."
for file in configmaps/*.yaml; do
    if [ -f "$file" ]; then
        kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_info "$(basename $file) is valid"
        else
            log_error "$(basename $file) is invalid"
        fi
    fi
done

# Validate Deployments
log_info "Validating Deployments..."
for file in base/deployments/*.yaml; do
    if [ -f "$file" ]; then
        kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_info "$(basename $file) is valid"
        else
            log_error "$(basename $file) is invalid"
        fi
    fi
done

# Validate Module Deployments
log_info "Validating Module Deployments..."
for file in base/deployments/modules/*.yaml; do
    if [ -f "$file" ]; then
        kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_info "$(basename $file) is valid"
        else
            log_error "$(basename $file) is invalid"
        fi
    fi
done

# Validate Services
log_info "Validating Services..."
for file in base/services/*.yaml; do
    if [ -f "$file" ]; then
        kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_info "$(basename $file) is valid"
        else
            log_error "$(basename $file) is invalid"
        fi
    fi
done

# Validate Ingress
log_info "Validating Ingress..."
for file in ingress/*.yaml; do
    if [ -f "$file" ]; then
        kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_info "$(basename $file) is valid"
        else
            log_error "$(basename $file) is invalid"
        fi
    fi
done

# Validate HPA
log_info "Validating HPA..."
for file in hpa/*.yaml; do
    if [ -f "$file" ]; then
        kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_info "$(basename $file) is valid"
        else
            log_error "$(basename $file) is invalid"
        fi
    fi
done

# Validate RBAC
log_info "Validating RBAC..."
for file in rbac/*.yaml; do
    if [ -f "$file" ]; then
        kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_info "$(basename $file) is valid"
        else
            log_error "$(basename $file) is invalid"
        fi
    fi
done

# Validate Network Policies
log_info "Validating Network Policies..."
for file in network-policies/*.yaml; do
    if [ -f "$file" ]; then
        kubectl apply --dry-run=client -f "$file" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_info "$(basename $file) is valid"
        else
            log_error "$(basename $file) is invalid"
        fi
    fi
done

# Validate Kustomize overlays
log_info "Validating Kustomize overlays..."

for env in dev staging production; do
    if [ -d "overlays/$env" ]; then
        log_info "Validating $env overlay..."
        $KUSTOMIZE build overlays/$env > /tmp/kustomize-$env.yaml 2>&1
        if [ $? -eq 0 ]; then
            kubectl apply --dry-run=client -f /tmp/kustomize-$env.yaml > /dev/null 2>&1
            if [ $? -eq 0 ]; then
                log_info "$env overlay is valid"
            else
                log_error "$env overlay produces invalid manifests"
            fi
            rm /tmp/kustomize-$env.yaml
        else
            log_error "$env overlay kustomization failed"
        fi
    fi
done

# Check resource limits
log_info "Checking resource limits..."

check_resources() {
    local file=$1
    if grep -q "resources:" "$file"; then
        if grep -q "limits:" "$file" && grep -q "requests:" "$file"; then
            log_info "$(basename $file) has resource limits"
        else
            log_warn "$(basename $file) missing resource limits or requests"
        fi
    else
        log_warn "$(basename $file) has no resource configuration"
    fi
}

for file in base/deployments/*.yaml; do
    if [ -f "$file" ]; then
        check_resources "$file"
    fi
done

# Check health probes
log_info "Checking health probes..."

check_probes() {
    local file=$1
    local has_liveness=0
    local has_readiness=0

    if grep -q "livenessProbe:" "$file"; then
        has_liveness=1
    fi

    if grep -q "readinessProbe:" "$file"; then
        has_readiness=1
    fi

    if [ $has_liveness -eq 1 ] && [ $has_readiness -eq 1 ]; then
        log_info "$(basename $file) has health probes"
    else
        log_warn "$(basename $file) missing health probes"
    fi
}

for file in base/deployments/*.yaml; do
    if [ -f "$file" ]; then
        check_probes "$file"
    fi
done

# Check security context
log_info "Checking security contexts..."

check_security() {
    local file=$1
    if grep -q "securityContext:" "$file"; then
        log_info "$(basename $file) has security context"
    else
        log_warn "$(basename $file) missing security context"
    fi
}

for file in base/deployments/*.yaml; do
    if [ -f "$file" ]; then
        check_security "$file"
    fi
done

# Summary
echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Validation failed with $ERRORS errors${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Validation passed with $WARNINGS warnings${NC}"
    exit 0
else
    echo -e "${GREEN}All validations passed!${NC}"
    exit 0
fi
