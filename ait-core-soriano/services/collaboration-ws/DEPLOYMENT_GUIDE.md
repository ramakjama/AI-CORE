# Deployment Guide - Collaboration WebSocket Server

Step-by-step guide to deploy the Collaboration WebSocket Server in various environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Development](#docker-development)
3. [Production Deployment](#production-deployment)
4. [Behind SSL Proxy](#behind-ssl-proxy)
5. [Scaling](#scaling)

---

## Local Development

### Step 1: Install Dependencies

```bash
cd C:/Users/rsori/codex/ait-core-soriano/services/collaboration-ws
npm install
```

### Step 2: Configure Environment

```bash
# Create .env file
cp .env.example .env

# Edit .env (optional)
# WS_PORT=1234
# DEBUG=true
```

### Step 3: Start Server

```bash
# Option 1: npm script
npm run dev

# Option 2: start script
./start.sh        # Unix/Mac
start.bat         # Windows

# Option 3: direct
node server.js
```

### Step 4: Verify

```bash
# Health check
curl http://localhost:1234/health

# Test connection
node test-client.js ws://localhost:1234 test-room

# Open browser client
open client-example.html
```

---

## Docker Development

### Step 1: Build Image

```bash
cd C:/Users/rsori/codex/ait-core-soriano/services/collaboration-ws
docker build -t ait-collaboration-ws:dev .
```

### Step 2: Run Container

```bash
docker run -d \
  --name ait-collaboration-ws-dev \
  -p 1234:1234 \
  -e DEBUG=true \
  -e NODE_ENV=development \
  ait-collaboration-ws:dev
```

### Step 3: Verify

```bash
# Check status
docker ps | grep ait-collaboration-ws

# View logs
docker logs -f ait-collaboration-ws-dev

# Health check
curl http://localhost:1234/health

# Test
node test-client.js ws://localhost:1234 test-room
```

### Step 4: Stop & Clean

```bash
docker stop ait-collaboration-ws-dev
docker rm ait-collaboration-ws-dev
```

---

## Production Deployment

### Method 1: Docker Compose (Recommended)

#### Step 1: Navigate to Project Root

```bash
cd C:/Users/rsori/codex/ait-core-soriano
```

#### Step 2: Review Configuration

Check `docker-compose.yml`:

```yaml
collaboration-ws:
  build:
    context: ./services/collaboration-ws
    dockerfile: Dockerfile
  container_name: ait-collaboration-ws
  restart: unless-stopped
  ports:
    - "1234:1234"
  environment:
    WS_PORT: 1234
    NODE_ENV: production
    DEBUG: "false"
  networks:
    - ait-network
  healthcheck:
    test: ["CMD-SHELL", "..."]
    interval: 30s
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
```

#### Step 3: Deploy

```bash
# Start service
docker-compose up -d collaboration-ws

# Or start entire stack
docker-compose up -d
```

#### Step 4: Verify Deployment

```bash
# Check status
docker-compose ps collaboration-ws

# View logs
docker-compose logs -f collaboration-ws

# Health check
curl http://localhost:1234/health

# Check stats
curl http://localhost:1234/stats
```

#### Step 5: Monitor

```bash
# Watch logs
docker-compose logs -f collaboration-ws

# Check resource usage
docker stats ait-collaboration-ws

# Health status
watch -n 5 'curl -s http://localhost:1234/health | jq'
```

### Method 2: Kubernetes

#### Step 1: Create Deployment YAML

`k8s/collaboration-ws-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: collaboration-ws
  labels:
    app: collaboration-ws
spec:
  replicas: 3
  selector:
    matchLabels:
      app: collaboration-ws
  template:
    metadata:
      labels:
        app: collaboration-ws
    spec:
      containers:
      - name: collaboration-ws
        image: ait-collaboration-ws:1.0.0
        ports:
        - containerPort: 1234
          name: websocket
        env:
        - name: WS_PORT
          value: "1234"
        - name: NODE_ENV
          value: "production"
        - name: DEBUG
          value: "false"
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
          requests:
            cpu: "250m"
            memory: "128Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 1234
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 1234
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: collaboration-ws
spec:
  selector:
    app: collaboration-ws
  ports:
  - protocol: TCP
    port: 1234
    targetPort: 1234
  type: LoadBalancer
  sessionAffinity: ClientIP  # Sticky sessions for WebSocket
```

#### Step 2: Deploy

```bash
kubectl apply -f k8s/collaboration-ws-deployment.yaml

# Check status
kubectl get pods -l app=collaboration-ws
kubectl get svc collaboration-ws

# View logs
kubectl logs -f -l app=collaboration-ws
```

---

## Behind SSL Proxy

### Nginx Configuration

#### Step 1: Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### Step 2: Configure SSL Certificate

```bash
# Using Let's Encrypt (Certbot)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ws.yourdomain.com
```

#### Step 3: Configure Nginx

`/etc/nginx/sites-available/collaboration-ws`:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ws.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS WebSocket proxy
server {
    listen 443 ssl http2;
    server_name ws.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ws.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ws.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;

    # WebSocket Proxy
    location / {
        proxy_pass http://localhost:1234;
        proxy_http_version 1.1;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for long-lived connections
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;

        # Buffer settings
        proxy_buffering off;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:1234/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
}
```

#### Step 4: Enable & Reload

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/collaboration-ws /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

#### Step 5: Test SSL Connection

```bash
# Test from client
node test-client.js wss://ws.yourdomain.com test-room

# Or in browser
const ws = new WebSocket('wss://ws.yourdomain.com?room=test');
```

### Caddy Configuration (Alternative)

`Caddyfile`:

```caddy
ws.yourdomain.com {
    reverse_proxy localhost:1234 {
        header_up Host {host}
        header_up X-Real-IP {remote}
        header_up X-Forwarded-For {remote}
        header_up X-Forwarded-Proto {scheme}
    }
}
```

Deploy:

```bash
sudo systemctl reload caddy
```

---

## Scaling

### Horizontal Scaling

#### Option 1: Docker Compose Replicas

`docker-compose.yml`:

```yaml
collaboration-ws:
  # ... existing config ...
  deploy:
    replicas: 3
    update_config:
      parallelism: 1
      delay: 10s
    restart_policy:
      condition: on-failure
```

Start:

```bash
docker-compose up -d --scale collaboration-ws=3
```

#### Option 2: Multiple Instances with Nginx Load Balancing

**Start Multiple Instances:**

```bash
# Instance 1
docker run -d --name ait-ws-1 -p 1234:1234 ait-collaboration-ws

# Instance 2
docker run -d --name ait-ws-2 -p 1235:1234 ait-collaboration-ws

# Instance 3
docker run -d --name ait-ws-3 -p 1236:1234 ait-collaboration-ws
```

**Nginx Load Balancer:**

```nginx
upstream collaboration_ws_backend {
    # Use IP hash for sticky sessions (required for WebSocket)
    ip_hash;

    server localhost:1234 max_fails=3 fail_timeout=30s;
    server localhost:1235 max_fails=3 fail_timeout=30s;
    server localhost:1236 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl http2;
    server_name ws.yourdomain.com;

    # SSL config...

    location / {
        proxy_pass http://collaboration_ws_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        # ... other headers ...
    }
}
```

### Vertical Scaling

Increase resources in `docker-compose.yml`:

```yaml
collaboration-ws:
  deploy:
    resources:
      limits:
        cpus: '4'      # Increased from 1
        memory: 2G     # Increased from 512M
      reservations:
        cpus: '1'
        memory: 512M
```

---

## Monitoring Setup

### Prometheus + Grafana

#### Step 1: Add Metrics Endpoint (Future Enhancement)

Current version uses `/stats` endpoint. For Prometheus, you'd add:

```javascript
// In server.js (future enhancement)
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(`
# HELP ws_connections Total WebSocket connections
# TYPE ws_connections gauge
ws_connections ${wss.clients.size}

# HELP ws_rooms Total active rooms
# TYPE ws_rooms gauge
ws_rooms ${rooms.size}
  `);
});
```

#### Step 2: Configure Prometheus

`prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'collaboration-ws'
    scrape_interval: 15s
    static_configs:
      - targets: ['collaboration-ws:1234']
```

#### Step 3: Create Grafana Dashboard

Import dashboard JSON or create panels:
- Active Connections (gauge)
- Active Rooms (gauge)
- Message Rate (graph)
- Error Rate (graph)
- Memory Usage (graph)

---

## Backup & Recovery

### Configuration Backup

```bash
# Backup configuration
tar -czf collaboration-ws-config-$(date +%Y%m%d).tar.gz \
  services/collaboration-ws/.env \
  services/collaboration-ws/package.json \
  docker-compose.yml

# Backup to remote
scp collaboration-ws-config-*.tar.gz user@backup-server:/backups/
```

### Disaster Recovery

```bash
# 1. Stop service
docker-compose stop collaboration-ws

# 2. Restore configuration
tar -xzf collaboration-ws-config-20260128.tar.gz

# 3. Rebuild image (if needed)
docker-compose build collaboration-ws

# 4. Start service
docker-compose up -d collaboration-ws

# 5. Verify
curl http://localhost:1234/health
```

---

## Rollback Procedure

```bash
# 1. Stop current version
docker-compose stop collaboration-ws

# 2. Pull previous image
docker pull ait-collaboration-ws:previous-version

# 3. Update docker-compose.yml
# Change image tag to previous version

# 4. Start previous version
docker-compose up -d collaboration-ws

# 5. Verify
curl http://localhost:1234/health
docker-compose logs -f collaboration-ws
```

---

## Security Hardening

### Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 1234/tcp  # WebSocket
sudo ufw deny 1234/udp   # Deny UDP

# Or restrict to specific IPs
sudo ufw allow from 10.0.0.0/8 to any port 1234
```

### Network Isolation

`docker-compose.yml`:

```yaml
networks:
  ait-network:
    driver: bridge
    internal: false  # Set to true to isolate from internet
  ait-internal:
    driver: bridge
    internal: true   # Internal network only
```

---

## Troubleshooting Deployment

### Container Won't Start

```bash
# Check logs
docker logs ait-collaboration-ws

# Check for port conflicts
lsof -i :1234
netstat -ano | findstr :1234

# Verify image
docker images | grep collaboration-ws

# Rebuild
docker-compose build --no-cache collaboration-ws
```

### Health Check Failing

```bash
# Manual health check
curl -v http://localhost:1234/health

# Inside container
docker exec ait-collaboration-ws curl http://localhost:1234/health

# Check if server is listening
docker exec ait-collaboration-ws netstat -tulpn | grep 1234
```

### SSL Connection Issues

```bash
# Test SSL certificate
openssl s_client -connect ws.yourdomain.com:443

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify WebSocket upgrade
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: test" \
  -H "Sec-WebSocket-Version: 13" \
  https://ws.yourdomain.com
```

---

## Best Practices

1. **Always use SSL in production** (WSS, not WS)
2. **Implement authentication** before production deployment
3. **Set resource limits** to prevent resource exhaustion
4. **Enable monitoring and alerts** for proactive issue detection
5. **Test rollback procedure** before production deployment
6. **Use sticky sessions** for load balancing
7. **Keep dependencies updated** for security patches
8. **Review logs regularly** for anomalies
9. **Document customizations** for maintainability
10. **Test at scale** before production traffic

---

## Quick Commands Reference

```bash
# Deploy
docker-compose up -d collaboration-ws

# Check status
docker-compose ps collaboration-ws
curl http://localhost:1234/health

# View logs
docker-compose logs -f collaboration-ws

# Restart
docker-compose restart collaboration-ws

# Update
docker-compose pull collaboration-ws
docker-compose up -d collaboration-ws

# Scale
docker-compose up -d --scale collaboration-ws=3

# Stop
docker-compose stop collaboration-ws

# Remove
docker-compose down collaboration-ws
```

---

For more information:
- **Installation:** See INSTALLATION.md
- **Production Checklist:** See PRODUCTION_CHECKLIST.md
- **Quick Start:** See QUICK_START.md
- **API Reference:** See README.md
