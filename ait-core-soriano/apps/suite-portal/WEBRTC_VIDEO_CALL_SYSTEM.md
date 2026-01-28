# WebRTC Video Call System

A complete WebRTC-based video call system integrated into the AIT-CORE Suite Portal.

## Overview

This system provides peer-to-peer video calling with the following features:

- **Real-time video/audio communication**
- **Screen sharing**
- **Multi-participant support** (grid layout)
- **Call notifications** (incoming call toasts)
- **Media controls** (mute/unmute, camera on/off)
- **Connection quality monitoring**
- **Dark mode support**
- **Responsive design**

## Architecture

### Core Components

#### 1. **PeerConnection** (`src/lib/webrtc/peer-connection.ts`)
- Wraps SimplePeer for WebRTC connections
- Manages local and remote media streams
- Handles signaling (offer/answer/ICE candidates)
- Provides media controls (mute, video toggle, screen share)
- Connection quality monitoring

**Key Methods:**
```typescript
create(config: PeerConnectionConfig): Promise<void>
signal(signal: SimplePeer.SignalData): void
getUserMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>
getDisplayMedia(constraints?: DisplayMediaStreamOptions): Promise<MediaStream>
replaceVideoTrack(newStream: MediaStream): Promise<void>
toggleAudio(): boolean
toggleVideo(): boolean
sendData(data: any): void
disconnect(): void
```

#### 2. **SignalingClient** (`src/lib/webrtc/signaling-client.ts`)
- WebSocket client for signaling server
- Manages room joining/leaving
- Handles call requests/responses
- Sends/receives signaling messages

**Key Methods:**
```typescript
connect(url: string, userId: string, userName: string): void
joinRoom(roomId: string): void
leaveRoom(): void
sendSignal(message: SignalingMessage): void
requestCall(toUserId: string, userName: string): void
acceptCall(fromUserId: string): void
declineCall(fromUserId: string): void
disconnect(): void
```

#### 3. **useVideoCall Hook** (`src/hooks/use-video-call.ts`)
- Custom React hook for video call management
- Manages peer connections and signaling
- Handles call lifecycle (start, accept, decline, end)
- Provides media controls and state

**Return Values:**
```typescript
{
  // Connection state
  isConnected: boolean;
  isInCall: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';

  // Streams
  localStream: MediaStream | null;
  remoteParticipants: RemoteParticipant[];

  // Media controls
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;

  // Call management
  startCall: (targetUserId: string, targetUserName?: string) => Promise<void>;
  endCall: () => void;
  acceptCall: (fromUserId: string) => Promise<void>;
  declineCall: (fromUserId: string) => void;

  // Incoming calls
  incomingCall: IncomingCall | null;
  clearIncomingCall: () => void;

  // Errors
  error: string | null;
  clearError: () => void;
}
```

### UI Components

#### 1. **VideoCallModal** (`src/components/video-call/VideoCallModal.tsx`)
Full-screen modal for active video calls.

**Features:**
- Responsive grid layout (1-1, 1-2, 2-2, 3-3)
- Local video preview (bottom-right corner)
- Remote video streams
- Control bar with:
  - Mute/unmute microphone
  - Enable/disable camera
  - Screen share toggle
  - End call button
  - Fullscreen toggle
- Participant info overlays
- Connection quality indicator
- Animated transitions

**Props:**
```typescript
interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  localStream: MediaStream | null;
  remoteParticipants: RemoteParticipant[];
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  localUserName?: string;
}
```

#### 2. **CallNotification** (`src/components/video-call/CallNotification.tsx`)
Incoming call notification toast.

**Features:**
- Caller name and avatar
- Accept (green) / Decline (red) buttons
- Auto-dismiss after 30 seconds
- Countdown timer
- Animated pulsing effects
- Optional ringtone support

**Props:**
```typescript
interface CallNotificationProps {
  callerName: string;
  callerAvatar?: string;
  onAccept: () => void;
  onDecline: () => void;
  autoDismissTimeout?: number;
  playRingtone?: boolean;
}
```

## Integration

### Topbar Integration

The video call button has been added to the topbar (`src/components/layout/topbar.tsx`):

```typescript
// Video call button with red dot indicator when in call
<button
  onClick={handleVideoCallClick}
  className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
  aria-label="Video Call"
>
  <Video className="w-5 h-5" />
  {videoCall.isInCall && (
    <motion.span
      animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
    />
  )}
</button>
```

## Usage

### Basic Usage

```typescript
import { useVideoCall } from '@/hooks/use-video-call';
import { VideoCallModal } from '@/components/video-call/VideoCallModal';
import { CallNotification } from '@/components/video-call/CallNotification';

function MyComponent() {
  const [videoCallModalOpen, setVideoCallModalOpen] = useState(false);

  const videoCall = useVideoCall({
    userId: 'user-123',
    userName: 'John Doe',
    autoConnect: true,
  });

  // Handle incoming call
  useEffect(() => {
    if (videoCall.isInCall) {
      setVideoCallModalOpen(true);
    }
  }, [videoCall.isInCall]);

  return (
    <>
      {/* Show incoming call notification */}
      {videoCall.incomingCall && (
        <CallNotification
          callerName={videoCall.incomingCall.fromName}
          onAccept={() => videoCall.acceptCall(videoCall.incomingCall!.from)}
          onDecline={() => videoCall.declineCall(videoCall.incomingCall!.from)}
        />
      )}

      {/* Show video call modal */}
      <VideoCallModal
        isOpen={videoCallModalOpen}
        onClose={() => setVideoCallModalOpen(false)}
        localStream={videoCall.localStream}
        remoteParticipants={videoCall.remoteParticipants}
        isMuted={videoCall.isMuted}
        isVideoEnabled={videoCall.isVideoEnabled}
        isScreenSharing={videoCall.isScreenSharing}
        connectionQuality={videoCall.connectionQuality}
        onToggleMute={videoCall.toggleMute}
        onToggleVideo={videoCall.toggleVideo}
        onToggleScreenShare={videoCall.toggleScreenShare}
        onEndCall={videoCall.endCall}
      />

      {/* Start call button */}
      <button onClick={() => videoCall.startCall('user-456', 'Jane Smith')}>
        Start Video Call
      </button>
    </>
  );
}
```

### Starting a Call

```typescript
// Request a call to another user
await videoCall.startCall('target-user-id', 'Target User Name');
```

### Accepting a Call

```typescript
// Accept incoming call
await videoCall.acceptCall(videoCall.incomingCall.from);
```

### Declining a Call

```typescript
// Decline incoming call
videoCall.declineCall(videoCall.incomingCall.from);
```

### Ending a Call

```typescript
// End current call
videoCall.endCall();
```

### Media Controls

```typescript
// Toggle microphone
videoCall.toggleMute();

// Toggle camera
videoCall.toggleVideo();

// Toggle screen share
await videoCall.toggleScreenShare();
```

## Signaling Server

The system requires a signaling server for WebRTC connection establishment. The default configuration expects a WebSocket server at `ws://localhost:1234/signaling`.

### Signaling Server Setup

You'll need to set up a signaling server that handles the following events:

**Client → Server:**
- `join-room`: Join a room
- `leave-room`: Leave a room
- `signal`: Send signaling data (offer/answer/ICE candidate)
- `call-request`: Request a call to another user
- `call-accepted`: Accept an incoming call
- `call-declined`: Decline an incoming call

**Server → Client:**
- `connect`: Connection established
- `disconnect`: Connection lost
- `signal`: Receive signaling data
- `user-joined`: User joined the room
- `user-left`: User left the room
- `call-request`: Incoming call request
- `call-accepted`: Call was accepted
- `call-declined`: Call was declined

### Example Signaling Server (Node.js + Socket.IO)

```javascript
const io = require('socket.io')(1234, {
  path: '/signaling',
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  const { userId, userName } = socket.handshake.query;

  socket.on('join-room', ({ room }) => {
    socket.join(room);
    socket.to(room).emit('user-joined', { userId, userName });
  });

  socket.on('leave-room', ({ room }) => {
    socket.to(room).emit('user-left', { userId });
    socket.leave(room);
  });

  socket.on('signal', (message) => {
    if (message.to) {
      io.to(message.to).emit('signal', message);
    } else if (message.room) {
      socket.to(message.room).emit('signal', message);
    }
  });

  socket.on('call-request', ({ to, from, fromName }) => {
    io.to(to).emit('call-request', { from, fromName });
  });

  socket.on('call-accepted', ({ to, from }) => {
    io.to(to).emit('call-accepted', { from });
  });

  socket.on('call-declined', ({ to, from }) => {
    io.to(to).emit('call-declined', { from });
  });
});
```

## Dependencies

The system requires the following packages:

```json
{
  "dependencies": {
    "simple-peer": "^9.11.1",
    "socket.io-client": "^4.7.5",
    "framer-motion": "^11.1.7",
    "lucide-react": "^0.376.0",
    "nanoid": "^5.0.7"
  },
  "devDependencies": {
    "@types/simple-peer": "^9.11.8"
  }
}
```

### Installing Dependencies

```bash
pnpm add simple-peer @types/simple-peer
```

Note: `socket.io-client`, `framer-motion`, `lucide-react`, and `nanoid` are already included in the project.

## Browser Support

The system requires browsers that support:
- WebRTC API
- getUserMedia API
- getDisplayMedia API (for screen sharing)
- WebSocket

**Supported Browsers:**
- Chrome/Edge 74+
- Firefox 66+
- Safari 12.1+
- Opera 62+

## Security Considerations

1. **HTTPS Required**: WebRTC requires HTTPS in production (getUserMedia/getDisplayMedia won't work over HTTP)
2. **STUN/TURN Servers**: Configure proper STUN/TURN servers for production
3. **Authentication**: Implement proper user authentication for the signaling server
4. **Encryption**: All WebRTC connections are encrypted by default (DTLS-SRTP)
5. **Permissions**: Handle camera/microphone permission requests gracefully

## Configuration

### Custom Signaling Server URL

```typescript
const videoCall = useVideoCall({
  signalingUrl: 'wss://your-signaling-server.com',
  userId: 'user-123',
  userName: 'John Doe',
});
```

### Custom STUN/TURN Servers

Modify the `PeerConnection` class in `src/lib/webrtc/peer-connection.ts`:

```typescript
config: config.config || {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'username',
      credential: 'password'
    }
  ],
}
```

## Troubleshooting

### Camera/Microphone Not Working

1. Ensure HTTPS is used (or localhost for development)
2. Check browser permissions for camera/microphone
3. Verify no other application is using the devices
4. Check browser console for error messages

### Connection Issues

1. Verify signaling server is running
2. Check WebSocket connection in browser DevTools
3. Verify STUN/TURN server configuration
4. Check firewall/network settings

### Screen Sharing Not Working

1. Ensure browser supports getDisplayMedia
2. Check if running on HTTPS (required for screen sharing)
3. Verify browser permissions

### No Remote Video

1. Check if peer connection is established
2. Verify signaling messages are being exchanged
3. Check ICE candidate exchange
4. Verify remote user has camera enabled

## File Structure

```
apps/suite-portal/
├── src/
│   ├── lib/
│   │   └── webrtc/
│   │       ├── peer-connection.ts       # WebRTC peer connection wrapper
│   │       ├── signaling-client.ts      # WebSocket signaling client
│   │       └── index.ts                 # Exports
│   ├── hooks/
│   │   └── use-video-call.ts            # Video call hook
│   ├── components/
│   │   ├── video-call/
│   │   │   ├── VideoCallModal.tsx       # Full-screen video call modal
│   │   │   ├── CallNotification.tsx     # Incoming call notification
│   │   │   └── index.ts                 # Exports
│   │   └── layout/
│   │       └── topbar.tsx               # Updated with video call button
│   └── ...
└── WEBRTC_VIDEO_CALL_SYSTEM.md         # This file
```

## Future Enhancements

- [ ] Recording functionality
- [ ] Virtual backgrounds
- [ ] Noise cancellation
- [ ] Picture-in-picture mode
- [ ] Chat during calls
- [ ] File sharing
- [ ] Call history
- [ ] Conference rooms with multiple participants
- [ ] Mobile app support
- [ ] Call statistics dashboard

## Support

For issues or questions, please refer to the project documentation or contact the development team.

---

**Created:** 2026-01-28
**Version:** 1.0.0
**Author:** AIT-CORE Development Team
