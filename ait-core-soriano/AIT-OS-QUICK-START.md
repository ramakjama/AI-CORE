# AIT-OS INTEGRATION - QUICK START GUIDE

**Quick reference for developers migrating modules to AIT-OS**

---

## 📋 PREREQUISITES

```bash
# Install required tools
- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker >= 24.0.0
- kubectl >= 1.28.0
- minikube or k3s (local K8s cluster)

# Verify installations
node --version
pnpm --version
docker --version
kubectl version --client
```

---

## 🚀 SETUP (15 MINUTES)

### Step 1: Clone AIT-OS

```bash
cd /c/Users/rsori/codex/
git clone https://github.com/ramakjama/ait-os.git
cd ait-os
pnpm install
```

### Step 2: Start Local Kubernetes

```bash
# Option A: minikube
minikube start --cpus=4 --memory=8192

# Option B: k3s
curl -sfL https://get.k3s.io | sh -

# Verify
kubectl get nodes
```

### Step 3: Deploy AIT-OS Core

```bash
# Install CRDs
kubectl apply -f core/kernel/src/crds/

# Deploy AIT-KERNEL
kubectl apply -f k8s/operators/ait-kernel-deployment.yaml

# Verify
kubectl get pods -n ait-os
```

### Step 4: Add Infrastructure Services

```bash
# In ait-core-soriano directory
cd /c/Users/rsori/codex/ait-core-soriano

# Add to docker-compose.yml
cat >> docker-compose.yml << 'EOF'
  # AIT-OS Services
  etcd:
    image: quay.io/coreos/etcd:v3.5.11
    command:
      - /usr/local/bin/etcd
      - --data-dir=/etcd-data
      - --listen-client-urls=http://0.0.0.0:2379
    ports: ["2379:2379"]
    volumes: ["etcd-data:/etcd-data"]

  jaeger:
    image: jaegertracing/all-in-one:1.52
    ports:
      - "16686:16686"  # UI
      - "14268:14268"  # Collector
EOF

# Start services
docker-compose up -d etcd jaeger
```

---

## 📦 MIGRATE A MODULE (30 MINUTES)

### Example: Migrating `ait-accountant`

#### 1. Create AITModule Manifest

```bash
cd modules/01-core-business/ait-accountant
```

Create `ait-module.yaml`:

```yaml
apiVersion: ait.core/v1
kind: AITModule
metadata:
  name: ait-accountant
  namespace: ait-core
spec:
  category: core-business
  version: "1.0.0"
  enabled: true
  replicas: 2

  # Dependencies
  dependencies:
    - ait-authenticator
    - ait-pgc-engine
    - ait-datahub

  # Resources
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"
    limits:
      cpu: "2000m"
      memory: "4Gi"

  # Auto-healing
  autoHealing:
    enabled: true
    scaleOnOOM: true
    maxRestarts: 5

  # Health check
  healthCheck:
    path: "/health"
    interval: "30s"
    timeout: "5s"
```

#### 2. Install AIT-OS Client Library

```bash
pnpm add @ait-os/nestjs @ait-os/security @ait-os/monitor
```

#### 3. Update Code

**src/main.ts:**
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AitOsModule } from '@ait-os/nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Register AIT-OS
  app.use(AitOsModule.forRoot({
    moduleId: 'ait-accountant',
    configServer: process.env.AIT_CONFIG_SERVER_URL || 'http://localhost:8081',
    security: {
      enabled: true,
      auditLevel: 'high'
    },
    monitoring: {
      metrics: true,
      tracing: true
    }
  }));

  await app.listen(3000);
  console.log('✅ ait-accountant running with AIT-OS');
}
bootstrap();
```

**src/invoices/invoices.controller.ts:**
```typescript
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AitAuthGuard, AitRoles, AitAudit, AitMetrics } from '@ait-os/security';

@Controller('invoices')
@UseGuards(AitAuthGuard)
export class InvoicesController {
  @Post()
  @AitRoles('accountant', 'admin')
  @AitAudit({ action: 'invoice.create', sensitivity: 'high' })
  @AitMetrics({ counter: 'invoice_created' })
  async create(@Body() invoice: CreateInvoiceDto) {
    // Your existing code
    return this.service.create(invoice);
  }
}
```

#### 4. Deploy to Kubernetes

```bash
# Deploy module
kubectl apply -f ait-module.yaml

# Check status
kubectl get aitmodules -n ait-core

# View details
kubectl describe aitmodule ait-accountant -n ait-core

# Check logs
kubectl logs -f deployment/ait-accountant -n ait-core
```

#### 5. Test

```bash
# Health check
curl http://localhost:3100/health

# API test
curl -X POST http://localhost:3100/api/invoices \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "client": "Test Client"}'

# Check metrics
curl http://localhost:3100/metrics
```

#### 6. Test Auto-Healing

```bash
# Kill the pod
kubectl delete pod -l app=ait-accountant -n ait-core

# Watch it recover (should be < 30 seconds)
watch kubectl get pods -l app=ait-accountant -n ait-core
```

---

## 🔧 COMMON COMMANDS

### Module Management

```bash
# List all modules
kubectl get aitmodules -n ait-core

# Get module status
kubectl get aitmodule <module-name> -n ait-core -o yaml

# Enable/disable module
kubectl patch aitmodule <module-name> -n ait-core \
  --type=merge -p '{"spec":{"enabled":true}}'

# Scale module
kubectl patch aitmodule <module-name> -n ait-core \
  --type=merge -p '{"spec":{"replicas":5}}'

# Update version (triggers blue-green deployment)
kubectl patch aitmodule <module-name> -n ait-core \
  --type=merge -p '{"spec":{"version":"1.1.0"}}'
```

### Configuration

```bash
# Get config from etcd
curl http://localhost:2379/v3/kv/range \
  -d '{"key": "YWl0LWFjY291bnRhbnQ="}' # base64 encoded key

# Set config
curl http://localhost:2379/v3/kv/put \
  -d '{"key": "YWl0LWFjY291bnRhbnQ=", "value": "..."}'

# Watch config changes
curl http://localhost:2379/v3/watch \
  -d '{"create_request": {"key": "YWl0LWFjY291bnRhbnQ="}}'
```

### Monitoring

```bash
# Prometheus metrics
curl http://localhost:9090/api/v1/query?query=up

# Jaeger UI
open http://localhost:16686

# Grafana dashboards
open http://localhost:3010
```

### Logs

```bash
# Module logs
kubectl logs -f deployment/<module-name> -n ait-core

# AIT-KERNEL logs
kubectl logs -f deployment/ait-kernel -n ait-os

# All events
kubectl get events -n ait-core --sort-by='.lastTimestamp'
```

---

## 🐛 TROUBLESHOOTING

### Module Stuck in Pending

```bash
# Check module status
kubectl describe aitmodule <module-name> -n ait-core

# Check events
kubectl get events -n ait-core | grep <module-name>

# Check dependencies
kubectl get aitmodule <module-name> -n ait-core -o jsonpath='{.spec.dependencies}'

# Check if dependencies are ready
for dep in $(kubectl get aitmodule <module-name> -n ait-core -o jsonpath='{.spec.dependencies[*]}'); do
  kubectl get aitmodule $dep -n ait-core -o jsonpath='{.status.phase}'
  echo ""
done
```

### Module Crashes on Start

```bash
# Check logs
kubectl logs deployment/<module-name> -n ait-core --previous

# Check resource limits
kubectl describe pod -l app=<module-name> -n ait-core

# Check config
curl http://localhost:8081/api/config/<module-name>
```

### Auto-Healing Not Working

```bash
# Check auto-healing config
kubectl get aitmodule <module-name> -n ait-core \
  -o jsonpath='{.spec.autoHealing}'

# Check AIT-KERNEL logs
kubectl logs -f deployment/ait-kernel -n ait-os | grep <module-name>
```

### Configuration Not Loading

```bash
# Check etcd connectivity
kubectl exec -it <module-pod> -n ait-core -- curl http://etcd:2379/version

# Check config exists
curl http://localhost:2379/v3/kv/range -d '{"key": "<base64-key>"}'

# Check module logs for config errors
kubectl logs deployment/<module-name> -n ait-core | grep -i config
```

---

## 📊 MIGRATION CHECKLIST

Use this checklist for each module:

```markdown
## Module: ait-example

- [ ] Step 1: Create ait-module.yaml
- [ ] Step 2: Install AIT-OS libraries
- [ ] Step 3: Update main.ts with AitOsModule
- [ ] Step 4: Add decorators to controllers
  - [ ] @AitAuthGuard
  - [ ] @AitRoles
  - [ ] @AitAudit
  - [ ] @AitMetrics
- [ ] Step 5: Deploy to K8s
- [ ] Step 6: Verify deployment
  - [ ] Pod running
  - [ ] Health check passes
  - [ ] API responds
- [ ] Step 7: Test auto-healing
  - [ ] Kill pod
  - [ ] Verify recovery < 30s
- [ ] Step 8: Test configuration
  - [ ] Update config in etcd
  - [ ] Verify hot-reload works
- [ ] Step 9: Run E2E tests
- [ ] Step 10: Monitor for 24h
- [ ] Step 11: Update documentation
```

---

## 🎓 LEARNING RESOURCES

### Official Docs

- **AIT-OS:** https://github.com/ramakjama/ait-os
- **Kubernetes:** https://kubernetes.io/docs/
- **etcd:** https://etcd.io/docs/
- **Temporal:** https://docs.temporal.io/

### Video Tutorials

- **Kubernetes Crash Course:** https://www.youtube.com/watch?v=X48VuDVv0do
- **Temporal 101:** https://www.youtube.com/watch?v=f-18XztyN6c

### Internal Resources

- **Slack Channel:** #ait-os-migration
- **Wiki:** https://wiki.aintech.es/ait-os
- **Office Hours:** Tuesdays 10:00-11:00 CET

---

## 📞 GET HELP

1. **Check this guide first**
2. **Search existing issues:** https://github.com/ramakjama/ait-os/issues
3. **Ask in Slack:** #ait-os-migration
4. **Create an issue:** https://github.com/ramakjama/ait-os/issues/new
5. **Email team:** ait-os-team@aintech.es

---

**Quick Start Guide** - AIT-OS Integration
**Version:** 1.0.0
**Last Updated:** January 28, 2026
