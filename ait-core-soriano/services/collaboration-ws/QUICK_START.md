# Quick Start Guide

Get the Collaboration WebSocket Server running in under 5 minutes.

## 1. Start with Docker Compose (Fastest)

```bash
# Navigate to project root
cd C:/Users/rsori/codex/ait-core-soriano

# Start the service
docker-compose up -d collaboration-ws

# Check if running
curl http://localhost:1234/health
```

## 2. Test the Connection

```bash
# Navigate to service directory
cd services/collaboration-ws

# Run test client
node test-client.js ws://localhost:1234 test-room
```

## 3. Try the Interactive Client

Open `client-example.html` in your browser and:
1. Enter a room ID (e.g., "test-room")
2. Click "Connect"
3. Try sending awareness updates or custom messages
4. Open in multiple browser tabs to see real-time sync

## 4. Connect from Your App

### JavaScript/TypeScript

```javascript
// Install Y.js
npm install yjs y-websocket

// Connect
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const doc = new Y.Doc();
const provider = new WebsocketProvider(
  'ws://localhost:1234',
  'my-room-id',
  doc
);

// Use shared types
const yText = doc.getText('content');
yText.insert(0, 'Hello, World!');

// Set awareness (cursor, user info)
provider.awareness.setLocalState({
  user: { name: 'John Doe', color: '#FF5733' },
  cursor: { line: 0, column: 0 }
});
```

### Plain WebSocket

```javascript
const ws = new WebSocket('ws://localhost:1234?room=my-room-id');

ws.onopen = () => {
  console.log('Connected!');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send awareness update
ws.send(JSON.stringify({
  type: 'awareness',
  data: {
    user: { name: 'John Doe', color: '#FF5733' },
    cursor: { line: 10, column: 5 }
  }
}));
```

## Common Commands

```bash
# View logs
docker-compose logs -f collaboration-ws

# Check stats
curl http://localhost:1234/stats

# Stop service
docker-compose stop collaboration-ws

# Restart service
docker-compose restart collaboration-ws

# Remove service
docker-compose down collaboration-ws
```

## Troubleshooting

**Connection refused?**
```bash
# Check if running
docker ps | grep collaboration-ws

# Check logs
docker-compose logs collaboration-ws
```

**Port already in use?**
Edit `docker-compose.yml` and change the port:
```yaml
ports:
  - "1235:1234"  # Use 1235 instead
```

## Next Steps

- Read full documentation: [README.md](README.md)
- Detailed installation: [INSTALLATION.md](INSTALLATION.md)
- Check API protocol in README for advanced features

## Need Help?

- Health check: `http://localhost:1234/health`
- Stats: `http://localhost:1234/stats`
- Support: support@ait-core.com
