# Installation Guide - Collaboration WebSocket Server

Complete installation and setup guide for the AIT-CORE Collaboration WebSocket Server.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Methods](#installation-methods)
  - [Method 1: Docker Compose (Recommended)](#method-1-docker-compose-recommended)
  - [Method 2: Docker](#method-2-docker)
  - [Method 3: Local Development](#method-3-local-development)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Choose one based on your installation method:

### For Docker Compose (Recommended)
- Docker Engine 20.10+
- Docker Compose 2.0+

### For Docker
- Docker Engine 20.10+

### For Local Development
- Node.js 18+ (LTS recommended)
- npm 8+ or yarn 1.22+

## Installation Methods

### Method 1: Docker Compose (Recommended)

This is the easiest method and integrates with the main AIT-CORE infrastructure.

#### Step 1: Navigate to Project Root

```bash
cd C:/Users/rsori/codex/ait-core-soriano
```

#### Step 2: Start the Service

```bash
# Start collaboration-ws with all dependencies
docker-compose up -d collaboration-ws

# Or start entire stack
docker-compose up -d
```

#### Step 3: Verify

```bash
# Check if service is running
docker-compose ps collaboration-ws

# View logs
docker-compose logs -f collaboration-ws

# Check health
curl http://localhost:1234/health
```

Expected output:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-28T10:30:00.000Z",
  "rooms": 0,
  "connections": 0
}
```

#### Step 4: Stop Service

```bash
# Stop service
docker-compose stop collaboration-ws

# Stop and remove
docker-compose down collaboration-ws

# Stop entire stack
docker-compose down
```

### Method 2: Docker

Build and run as standalone Docker container.

#### Step 1: Navigate to Service Directory

```bash
cd C:/Users/rsori/codex/ait-core-soriano/services/collaboration-ws
```

#### Step 2: Build Image

```bash
docker build -t ait-collaboration-ws:latest .
```

#### Step 3: Run Container

```bash
# Basic run
docker run -d \
  --name ait-collaboration-ws \
  -p 1234:1234 \
  ait-collaboration-ws:latest

# With custom configuration
docker run -d \
  --name ait-collaboration-ws \
  -p 1234:1234 \
  -e WS_PORT=1234 \
  -e NODE_ENV=production \
  -e DEBUG=false \
  --restart unless-stopped \
  ait-collaboration-ws:latest

# With network
docker run -d \
  --name ait-collaboration-ws \
  -p 1234:1234 \
  --network ait-network \
  ait-collaboration-ws:latest
```

#### Step 4: Verify

```bash
# Check container status
docker ps | grep ait-collaboration-ws

# View logs
docker logs -f ait-collaboration-ws

# Check health
curl http://localhost:1234/health
```

#### Step 5: Stop Container

```bash
# Stop
docker stop ait-collaboration-ws

# Remove
docker rm ait-collaboration-ws

# Stop and remove
docker rm -f ait-collaboration-ws
```

### Method 3: Local Development

Run directly on your machine without Docker.

#### Step 1: Navigate to Service Directory

```bash
cd C:/Users/rsori/codex/ait-core-soriano/services/collaboration-ws
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
# Set WS_PORT, DEBUG, etc.
```

#### Step 4: Start Server

**Option A: Using npm**
```bash
# Development mode
npm run dev

# Production mode
NODE_ENV=production npm start
```

**Option B: Using start scripts**

Linux/Mac:
```bash
chmod +x start.sh
./start.sh
```

Windows:
```cmd
start.bat
```

**Option C: Direct node execution**
```bash
node server.js
```

#### Step 5: Verify

Open another terminal:

```bash
# Check health
curl http://localhost:1234/health

# Check stats
curl http://localhost:1234/stats

# Test with example client
node test-client.js ws://localhost:1234 test-room
```

## Configuration

### Environment Variables

Create a `.env` file or set environment variables:

```bash
# Server Configuration
WS_PORT=1234                    # WebSocket server port
WS_HOST=0.0.0.0                # Server bind address (0.0.0.0 for all interfaces)

# Environment
NODE_ENV=production             # production | development | test

# Debugging
DEBUG=false                     # Enable detailed logging (true | false)
```

### Docker Compose Configuration

Edit `docker-compose.yml` to customize:

```yaml
collaboration-ws:
  environment:
    WS_PORT: 1234
    DEBUG: "false"
  ports:
    - "1234:1234"              # Change external port here
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 512M
```

### Production Settings

For production deployment, consider:

1. **Use WSS (Secure WebSocket)**
   - Deploy behind nginx or Caddy with SSL/TLS
   - Configure SSL certificates
   - Use wss:// protocol in clients

2. **Resource Limits**
   - Set appropriate CPU and memory limits
   - Monitor resource usage
   - Scale horizontally if needed

3. **Logging**
   - Configure log rotation
   - Send logs to centralized logging system
   - Set appropriate log levels

4. **Security**
   - Implement authentication (JWT tokens)
   - Validate room access
   - Rate limit connections
   - Configure CORS if needed

## Verification

### 1. Health Check

```bash
curl http://localhost:1234/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-28T10:30:00.000Z",
  "rooms": 0,
  "connections": 0
}
```

### 2. Stats Endpoint

```bash
curl http://localhost:1234/stats
```

Should return:
```json
{
  "rooms": 0,
  "totalConnections": 0,
  "roomDetails": []
}
```

### 3. WebSocket Connection Test

```bash
# Run test client
node test-client.js ws://localhost:1234 test-room

# Or use wscat
npm install -g wscat
wscat -c "ws://localhost:1234?room=test-room"
```

### 4. Browser Test

Open `client-example.html` in a browser:

```bash
# Start a local web server
npx http-server -p 8080

# Open in browser
# http://localhost:8080/client-example.html
```

Or simply open the HTML file directly in your browser.

## Troubleshooting

### Issue: Connection Refused

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:1234
```

**Solutions:**
1. Check if server is running:
   ```bash
   docker ps | grep collaboration-ws
   # or
   lsof -i :1234  # Unix
   netstat -ano | findstr :1234  # Windows
   ```

2. Check logs for errors:
   ```bash
   docker logs ait-collaboration-ws
   ```

3. Verify port is not already in use:
   ```bash
   # Change WS_PORT in .env or docker-compose.yml
   ```

### Issue: Health Check Fails

**Symptoms:**
- Health check endpoint returns 500 or no response
- Container keeps restarting

**Solutions:**
1. Check server logs:
   ```bash
   docker logs ait-collaboration-ws
   ```

2. Verify Node.js is installed correctly in container:
   ```bash
   docker exec ait-collaboration-ws node --version
   ```

3. Test health endpoint manually:
   ```bash
   docker exec ait-collaboration-ws wget -O- http://localhost:1234/health
   ```

### Issue: Messages Not Received

**Symptoms:**
- Client connects but doesn't receive messages
- Messages sent but not broadcast to other clients

**Solutions:**
1. Enable debug logging:
   ```bash
   # Set DEBUG=true in .env or environment
   docker-compose up -d collaboration-ws
   docker logs -f collaboration-ws
   ```

2. Verify WebSocket state:
   ```javascript
   console.log(ws.readyState); // Should be 1 (OPEN)
   ```

3. Check room ID matches:
   ```javascript
   // All clients must use same room ID
   const ws = new WebSocket('ws://localhost:1234?room=SAME-ROOM-ID');
   ```

### Issue: High Memory Usage

**Symptoms:**
- Container uses excessive memory
- Server becomes slow or unresponsive

**Solutions:**
1. Monitor stats endpoint:
   ```bash
   curl http://localhost:1234/stats
   ```

2. Check for memory leaks in logs

3. Implement room cleanup:
   - Verify empty rooms are being cleaned up
   - Check cleanup interval (default: 5 minutes)

4. Set resource limits in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 512M
   ```

### Issue: Docker Build Fails

**Symptoms:**
```
ERROR [builder] failed to compute cache key
```

**Solutions:**
1. Check Dockerfile syntax:
   ```bash
   docker build --no-cache -t ait-collaboration-ws .
   ```

2. Verify files exist:
   ```bash
   ls -la server.js package.json
   ```

3. Clear Docker cache:
   ```bash
   docker builder prune -a
   ```

### Issue: Cannot Connect to Network

**Symptoms:**
```
ERROR: Network ait-network declared as external, but could not be found
```

**Solutions:**
1. Create network:
   ```bash
   docker network create ait-network
   ```

2. Or start main stack first:
   ```bash
   docker-compose -f docker-compose.yml up -d postgres redis
   ```

3. Check network exists:
   ```bash
   docker network ls | grep ait-network
   ```

## Next Steps

After successful installation:

1. **Read the API Documentation** - See [README.md](README.md) for protocol details
2. **Integrate with Your App** - Use Y.js or custom WebSocket client
3. **Test Thoroughly** - Run `node test-client.js` with multiple clients
4. **Configure Monitoring** - Set up alerts for health check failures
5. **Plan for Scaling** - Consider horizontal scaling for production

## Support

For additional help:

- **Documentation**: [README.md](README.md)
- **GitHub Issues**: Create an issue in the repository
- **Email**: support@ait-core.com

## Version History

- **1.0.0** (2026-01-28) - Initial release
  - Y.js CRDT integration
  - WebRTC signaling support
  - Room-based architecture
  - Production-ready Docker deployment
