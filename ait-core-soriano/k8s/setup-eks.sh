#!/bin/bash
# AWS EKS Cluster Setup Script
# Creates production-ready EKS cluster for AIT-CORE

set -e

CLUSTER_NAME=${1:-ait-core-production}
REGION=${2:-eu-west-1}
NODE_TYPE=${3:-t3.xlarge}
MIN_NODES=${4:-3}
MAX_NODES=${5:-10}

echo "=========================================="
echo "AWS EKS Cluster Setup"
echo "Cluster Name: $CLUSTER_NAME"
echo "Region: $REGION"
echo "Node Type: $NODE_TYPE"
echo "Nodes: $MIN_NODES-$MAX_NODES"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v aws &> /dev/null; then
    log_warn "AWS CLI not installed. Install from: https://aws.amazon.com/cli/"
    exit 1
fi

if ! command -v eksctl &> /dev/null; then
    log_warn "eksctl not installed. Install from: https://eksctl.io/"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    log_warn "kubectl not installed"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    log_warn "helm not installed"
    exit 1
fi

# Verify AWS credentials
log_info "Verifying AWS credentials..."
aws sts get-caller-identity > /dev/null

# Create EKS cluster
log_info "Creating EKS cluster $CLUSTER_NAME..."

eksctl create cluster \
  --name $CLUSTER_NAME \
  --region $REGION \
  --version 1.29 \
  --nodegroup-name ait-core-nodes \
  --node-type $NODE_TYPE \
  --nodes $MIN_NODES \
  --nodes-min $MIN_NODES \
  --nodes-max $MAX_NODES \
  --managed \
  --with-oidc \
  --ssh-access \
  --ssh-public-key ~/.ssh/id_rsa.pub \
  --full-ecr-access \
  --alb-ingress-access \
  --tags "Environment=production,Project=ait-core,ManagedBy=eksctl"

log_info "EKS cluster created successfully"

# Update kubeconfig
log_info "Updating kubeconfig..."
aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME

# Verify cluster
log_info "Verifying cluster..."
kubectl get nodes

# Install AWS Load Balancer Controller
log_info "Installing AWS Load Balancer Controller..."

# Create IAM policy
curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.7.0/docs/install/iam_policy.json

aws iam create-policy \
    --policy-name AWSLoadBalancerControllerIAMPolicy \
    --policy-document file://iam_policy.json || true

rm iam_policy.json

# Create service account
eksctl create iamserviceaccount \
  --cluster=$CLUSTER_NAME \
  --namespace=kube-system \
  --name=aws-load-balancer-controller \
  --role-name AmazonEKSLoadBalancerControllerRole \
  --attach-policy-arn=arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/AWSLoadBalancerControllerIAMPolicy \
  --approve \
  --region=$REGION || true

# Install controller with Helm
helm repo add eks https://aws.github.io/eks-charts
helm repo update

helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER_NAME \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller

# Install EBS CSI Driver
log_info "Installing EBS CSI Driver..."

eksctl create iamserviceaccount \
  --name ebs-csi-controller-sa \
  --namespace kube-system \
  --cluster $CLUSTER_NAME \
  --region $REGION \
  --attach-policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy \
  --approve \
  --role-only \
  --role-name AmazonEKS_EBS_CSI_DriverRole || true

eksctl create addon \
  --name aws-ebs-csi-driver \
  --cluster $CLUSTER_NAME \
  --region $REGION \
  --service-account-role-arn arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/AmazonEKS_EBS_CSI_DriverRole \
  --force || true

# Install Metrics Server
log_info "Installing Metrics Server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Install cert-manager
log_info "Installing cert-manager..."
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml

# Wait for cert-manager
kubectl wait --for=condition=available --timeout=300s deployment/cert-manager -n cert-manager

# Install Nginx Ingress Controller
log_info "Installing Nginx Ingress Controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.metrics.enabled=true \
  --set controller.podAnnotations."prometheus\.io/scrape"=true \
  --set controller.podAnnotations."prometheus\.io/port"=10254

# Install Prometheus Stack
log_info "Installing Prometheus Stack..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set grafana.adminPassword=admin \
  --set grafana.persistence.enabled=true \
  --set grafana.persistence.size=10Gi

# Create storage class for gp3
log_info "Creating gp3 storage class..."
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
  annotations:
    storageclass.kubernetes.io/is-default-class: "true"
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
EOF

# Enable cluster autoscaler
log_info "Installing Cluster Autoscaler..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

kubectl -n kube-system \
  annotate deployment.apps/cluster-autoscaler \
  cluster-autoscaler.kubernetes.io/safe-to-evict="false"

kubectl -n kube-system \
  set image deployment.apps/cluster-autoscaler \
  cluster-autoscaler=registry.k8s.io/autoscaling/cluster-autoscaler:v1.29.0

kubectl -n kube-system \
  edit deployment.apps/cluster-autoscaler

# Display info
log_info "EKS cluster setup complete!"
echo ""
echo "Cluster Information:"
echo "  Name: $CLUSTER_NAME"
echo "  Region: $REGION"
echo "  Endpoint: $(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')"
echo ""
echo "Installed Components:"
echo "  - AWS Load Balancer Controller"
echo "  - EBS CSI Driver"
echo "  - Metrics Server"
echo "  - cert-manager"
echo "  - Nginx Ingress Controller"
echo "  - Prometheus + Grafana"
echo "  - Cluster Autoscaler"
echo ""
echo "Next steps:"
echo "  1. Create secrets: kubectl create secret generic ait-core-secrets --from-env-file=secrets.env -n ait-core"
echo "  2. Deploy AIT-CORE: ./deploy.sh production"
echo ""
echo "Access Grafana:"
echo "  kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
echo "  Username: admin"
echo "  Password: admin"
echo ""
