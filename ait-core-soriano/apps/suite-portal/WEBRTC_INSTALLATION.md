# WebRTC Video Call System - Installation Guide

## Quick Start

### Step 1: Install Dependencies

From the `suite-portal` directory, run:

```bash
pnpm install
```

This will install all required dependencies including:
- `simple-peer` - WebRTC wrapper library
- `@types/simple-peer` - TypeScript types for simple-peer
- `socket.io-client` - WebSocket client (already installed)
- `framer-motion` - Animation library (already installed)

### Step 2: Start the Signaling Server

The WebRTC system requires a signaling server to establish peer connections. A reference implementation is provided in `signaling-server-example.js`.

#### Option A: Using the Example Server

1. Navigate to the suite-portal directory:
```bash
cd apps/suite-portal
```

2. Install Socket.IO (if running the example server standalone):
```bash
npm install socket.io
```

3. Start the signaling server:
```bash
node signaling-server-example.js
```

The server will start on `ws://localhost:1234/signaling`.

#### Option B: Using Your Own Signaling Server

If you have your own signaling server, configure the URL in the `useVideoCall` hook:

```typescript
const videoCall = useVideoCall({
  signalingUrl: 'wss://your-signaling-server.com',
  userId: user?.id || 'anonymous',
  userName: user?.name || 'Anonymous User',
});
```

### Step 3: Start the Development Server

```bash
pnpm dev
```

The application will start on `http://localhost:3001`.

### Step 4: Test the Video Call System

1. Open the application in your browser
2. Click the video call button (camera icon) in the topbar
3. Grant camera and microphone permissions when prompted
4. The video call modal will open showing your local video preview

To test with multiple participants:
1. Open the application in multiple browser tabs or windows
2. Each tab should have a unique user ID (you may need to implement user authentication)
3. Start a call from one tab
4. Accept the call in another tab

## Configuration

### Custom Signaling Server URL

Edit `src/components/layout/topbar.tsx`:

```typescript
const videoCall = useVideoCall({
  signalingUrl: 'wss://your-server.com', // Change this
  userId: user?.id || 'anonymous',
  userName: user?.name || 'Anonymous User',
  autoConnect: true,
});
```

### Custom STUN/TURN Servers

Edit `src/lib/webrtc/peer-connection.ts`:

```typescript
config: config.config || {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Add your TURN server here
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'your-username',
      credential: 'your-password'
    }
  ],
}
```

## Production Deployment

### Requirements

1. **HTTPS**: WebRTC requires HTTPS in production (getUserMedia/getDisplayMedia won't work over HTTP)
2. **TURN Server**: Configure a TURN server for users behind restrictive firewalls/NATs
3. **Signaling Server**: Deploy a production-grade signaling server with authentication
4. **Authentication**: Implement proper user authentication

### Signaling Server Deployment

The example signaling server is suitable for development but should be enhanced for production:

1. Add authentication/authorization
2. Implement rate limiting
3. Add logging and monitoring
4. Use Redis for scaling across multiple instances
5. Add SSL/TLS support
6. Implement room management and cleanup

### Recommended Services

**TURN Servers:**
- [Twilio Network Traversal Service](https://www.twilio.com/stun-turn)
- [Xirsys](https://xirsys.com/)
- Self-hosted [coturn](https://github.com/coturn/coturn)

**Signaling Server Hosting:**
- Heroku
- AWS EC2/ECS
- DigitalOcean
- Google Cloud Run

## Troubleshooting

### Issue: Dependencies Not Installing

If `pnpm install` fails due to workspace issues:

```bash
# From the suite-portal directory
pnpm add simple-peer @types/simple-peer --filter @ait-core/suite-portal
```

### Issue: Camera/Microphone Not Working

1. Ensure you're using HTTPS or localhost
2. Check browser permissions
3. Verify no other application is using the devices
4. Check browser console for errors

### Issue: Connection Not Establishing

1. Verify signaling server is running:
```bash
curl http://localhost:1234/signaling
```

2. Check WebSocket connection in browser DevTools (Network tab)
3. Verify firewall settings
4. Check STUN/TURN server configuration

### Issue: "Simple Peer Not Found" Error

If you see import errors for `simple-peer`:

```bash
# Install directly in the suite-portal directory
cd apps/suite-portal
npm install simple-peer @types/simple-peer
```

### Issue: TypeScript Errors

If you see TypeScript errors related to simple-peer:

```bash
# Ensure types are installed
pnpm add -D @types/simple-peer --filter @ait-core/suite-portal
```

Then restart your TypeScript server in your IDE.

## Browser Compatibility

### Supported Browsers

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 74+ | Full support |
| Edge | 79+ | Full support |
| Firefox | 66+ | Full support |
| Safari | 12.1+ | Full support |
| Opera | 62+ | Full support |

### Testing Browsers

To test in different browsers:
1. Copy the localhost URL
2. Open in different browsers
3. Each browser instance will be a separate participant

## Development Tips

### Hot Reload

The video call system supports hot reload during development. Changes to components will refresh automatically without losing the connection (though you may need to restart the call).

### Debugging

Enable debug logging by opening browser console and setting:

```javascript
localStorage.debug = 'simple-peer:*,socket.io-client:*'
```

Then refresh the page. You'll see detailed logs for WebRTC and Socket.IO.

### Testing Without Camera

To test without a physical camera, use a virtual camera:
- **macOS**: Use OBS with virtual camera
- **Windows**: Use OBS, ManyCam, or similar
- **Linux**: Use v4l2loopback

### Multiple Tabs Testing

To test with multiple participants on the same machine:
1. Open multiple browser tabs
2. Each tab needs a unique user ID
3. You can modify the code to use random IDs for testing:

```typescript
const videoCall = useVideoCall({
  userId: `user-${Math.random().toString(36).substr(2, 9)}`,
  userName: `Test User ${Math.floor(Math.random() * 1000)}`,
  autoConnect: true,
});
```

## File Locations

```
apps/suite-portal/
├── src/
│   ├── lib/webrtc/               # WebRTC library
│   ├── hooks/use-video-call.ts   # Video call hook
│   └── components/
│       └── video-call/           # Video call components
├── signaling-server-example.js   # Example signaling server
├── WEBRTC_VIDEO_CALL_SYSTEM.md   # Full documentation
├── WEBRTC_INSTALLATION.md        # This file
└── package.json                  # Dependencies
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Start signaling server
3. ✅ Start development server
4. ✅ Test video call functionality
5. 🔲 Implement user authentication
6. 🔲 Deploy to production
7. 🔲 Configure production TURN servers
8. 🔲 Implement call history/analytics

## Support

For detailed documentation, see `WEBRTC_VIDEO_CALL_SYSTEM.md`.

For issues or questions, please contact the development team.

---

**Last Updated:** 2026-01-28
**Version:** 1.0.0
