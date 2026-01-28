# Y.js Collaborative Editing System

Complete implementation of real-time collaborative editing using Y.js for the AIT-CORE Suite Portal.

## Features

- Real-time document synchronization using Y.js
- WebRTC-based peer-to-peer collaboration
- User presence and awareness (see who's online)
- Collaborative cursors (see where others are typing)
- Automatic reconnection with exponential backoff
- Undo/Redo support with Y.js UndoManager
- Connection status indicators
- User avatars and presence badges
- Smooth cursor animations with Framer Motion
- Dark mode support
- TypeScript with full type safety

## Architecture

### Core Components

#### 1. **Y.js Provider** (`src/lib/collaboration/yjs-provider.ts`)
- Manages Y.Doc instance
- Handles WebSocket/WebRTC connections
- Implements awareness protocol for user presence
- Manages cursor positions
- Provides undo/redo functionality
- Auto-reconnection with exponential backoff

#### 2. **Collaboration Manager** (`src/lib/collaboration/collaboration-manager.ts`)
- High-level session management
- Join/leave document sessions
- User information updates
- Active users tracking
- Event handling and callbacks
- Heartbeat system for user activity

#### 3. **CollaborationBar** (`src/components/collaboration/CollaborationBar.tsx`)
- Visual indicator of active users
- Connection status with animated indicators
- User list popover with avatars
- Real-time user count badge
- Animated user presence changes

#### 4. **CollaborativeCursors** (`src/components/collaboration/CollaborativeCursor.tsx`)
- Renders remote user cursors
- Smooth cursor movement animations
- User name labels with colors
- Idle cursor hiding
- Position tracking utilities

#### 5. **useCollaboration Hook** (`src/hooks/use-collaboration.ts`)
- Main hook for collaboration setup
- Auto-connect/disconnect lifecycle
- Y.Doc and awareness access
- Connection status management
- Cursor position updates

## Installation

### 1. Check Dependencies

The required dependencies should already be in `package.json`:

```json
{
  "dependencies": {
    "yjs": "^13.6.15",
    "y-webrtc": "^10.3.0",
    "@tiptap/extension-collaboration": "^2.3.1",
    "@tiptap/extension-collaboration-cursor": "^2.3.1",
    "framer-motion": "^11.1.7",
    "zustand": "^4.5.2"
  }
}
```

### 2. Install Dependencies (if needed)

```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal
pnpm install
```

### 3. Setup Y.js WebSocket Server (Optional)

For production, you'll need a Y.js WebSocket server. For development, y-webrtc will use signaling servers.

**Option A: Use default signaling servers (easiest for development)**
The system is configured to use WebRTC with default signaling servers.

**Option B: Run your own Y.js WebSocket server**
```bash
# Install y-websocket server
npm install -g y-websocket

# Run server
HOST=localhost PORT=1234 npx y-websocket
```

**Option C: Use Hocuspocus (recommended for production)**
```bash
npm install @hocuspocus/server
```

Create `collaboration-server.js`:
```javascript
import { Server } from '@hocuspocus/server'

const server = Server.configure({
  port: 1234,

  async onAuthenticate({ token }) {
    // Add authentication here
    return true
  },

  async onConnect({ documentName, socketId }) {
    console.log(`Client ${socketId} connected to ${documentName}`)
  }
})

server.listen()
```

## Usage

### Basic Setup

```tsx
import { useCollaboration } from '@/hooks/use-collaboration';
import { CollaborationBar } from '@/components/collaboration/CollaborationBar';
import { CollaborativeCursors } from '@/components/collaboration/CollaborativeCursor';

function DocumentEditor() {
  const {
    doc,
    provider,
    awareness,
    activeUsers,
    isConnected,
    status,
    updateCursor,
  } = useCollaboration({
    documentId: 'my-document-id',
    userId: 'user-123',
    userName: 'John Doe',
    userColor: '#3B82F6',
    autoConnect: true,
  });

  return (
    <div>
      <CollaborationBar status={status} />
      <Editor yDoc={doc} provider={provider} />
      <CollaborativeCursors />
    </div>
  );
}
```

### With TipTap Editor

```tsx
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      history: false, // Disable history (Y.js handles undo/redo)
    }),
    Collaboration.configure({
      document: yjsDoc, // Y.Doc from useCollaboration
    }),
    CollaborationCursor.configure({
      provider: provider, // Provider from useCollaboration
      user: {
        name: userName,
        color: userColor,
      },
    }),
  ],
});
```

### Complete Example

See `src/app/documents/page-yjs.tsx` for a complete implementation with:
- Document management
- Real-time collaboration
- Cursor tracking
- User presence
- Auto-save
- All TipTap features

## API Reference

### useCollaboration Hook

```typescript
const {
  doc,              // Y.Doc instance
  provider,         // YjsProvider instance
  awareness,        // Awareness instance
  activeUsers,      // Array of active users
  isConnected,      // Boolean connection status
  status,           // 'connecting' | 'connected' | 'disconnected' | 'error'
  manager,          // CollaborationManager instance
  connect,          // () => Promise<void>
  disconnect,       // () => void
  updateUser,       // (updates) => void
  updateCursor,     // (position) => void
  getText,          // (name?) => Y.Text
  isActive,         // Boolean
} = useCollaboration({
  documentId: string,
  userId: string,
  userName: string,
  userColor?: string,
  serverUrl?: string,
  autoConnect?: boolean,
  debug?: boolean,
});
```

### CollaborationBar Component

```typescript
<CollaborationBar
  status={'connected' | 'connecting' | 'disconnected' | 'error'}
  className?: string
/>
```

### CollaborativeCursors Component

```typescript
<CollaborativeCursors
  visible?: boolean
  className?: string
/>
```

### YjsProvider Class

```typescript
const provider = new YjsProvider({
  documentId: string,
  user: {
    id: string,
    name: string,
    color?: string,
  },
  serverUrl?: string,
  roomName?: string,
  onStatusChange?: (status) => void,
  onAwarenessUpdate?: (states) => void,
  onError?: (error) => void,
});

// Methods
provider.getDoc()              // Get Y.Doc
provider.getProvider()         // Get WebRTC provider
provider.getAwareness()        // Get awareness instance
provider.getText(name)         // Get Y.Text binding
provider.getActiveUsers()      // Get active users
provider.updateUser(updates)   // Update user info
provider.updateCursor(cursor)  // Update cursor position
provider.undo()                // Undo last change
provider.redo()                // Redo last change
provider.disconnect()          // Disconnect
provider.destroy()             // Cleanup
```

### CollaborationManager Class

```typescript
const manager = new CollaborationManager(
  {
    documentId: string,
    userId: string,
    userName: string,
    userColor?: string,
    serverUrl?: string,
  },
  {
    onUserJoin?: (user) => void,
    onUserLeave?: (userId) => void,
    onUserUpdate?: (user) => void,
    onStatusChange?: (status) => void,
    onError?: (error) => void,
  }
);

// Methods
await manager.joinSession()
manager.leaveSession()
manager.updateUserInfo(updates)
manager.updateCursorPosition(cursor)
manager.getActiveUsers()
manager.isActive()
manager.getStatus()
manager.destroy()
```

## Configuration

### Connection Settings

Edit `src/lib/collaboration/yjs-provider.ts` to customize:

```typescript
// Default WebSocket URL
serverUrl: config.serverUrl || 'ws://localhost:1234'

// Reconnection settings
private maxReconnectAttempts = 5;
private reconnectDelay = 1000; // 1 second, with exponential backoff

// Heartbeat interval
private heartbeatInterval = 30000; // 30 seconds
```

### User Colors

Customize user colors in `yjs-provider.ts`:

```typescript
const colors = [
  '#EF4444', // red
  '#F59E0B', // orange
  '#10B981', // green
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
];
```

## File Structure

```
src/
├── lib/
│   └── collaboration/
│       ├── yjs-provider.ts           # Y.js provider with WebSocket
│       ├── collaboration-manager.ts  # High-level session manager
│       └── index.ts                  # Exports
├── components/
│   └── collaboration/
│       ├── CollaborationBar.tsx      # User presence bar
│       ├── CollaborativeCursor.tsx   # Remote cursors
│       └── index.ts                  # Exports
├── hooks/
│   └── use-collaboration.ts          # Main collaboration hook
├── store/
│   └── collaboration.store.ts        # Zustand store (existing)
└── app/
    └── documents/
        ├── page.tsx                  # Original documents page
        └── page-yjs.tsx             # Y.js integrated version
```

## Testing

### 1. Start the development server
```bash
pnpm dev
```

### 2. Open multiple browser windows
```
http://localhost:3001/documents
```

### 3. Test features:
- [ ] Create a new document
- [ ] Open same document in multiple windows
- [ ] Type in one window, see changes in others
- [ ] Move cursor, see remote cursors
- [ ] Check user presence in collaboration bar
- [ ] Test disconnection/reconnection
- [ ] Test undo/redo
- [ ] Test with network throttling

## Troubleshooting

### Connection Issues

**Problem:** Can't connect to collaboration server
```
Solution: Check serverUrl in useCollaboration config
```

**Problem:** Users not seeing each other
```
Solution: Ensure same documentId and serverUrl
```

### Performance Issues

**Problem:** Lag when typing
```
Solution:
- Check network connection
- Reduce cursor update frequency
- Enable WebRTC instead of WebSocket
```

**Problem:** High memory usage
```
Solution:
- Implement document cleanup
- Limit history size
- Clear old awareness states
```

### Cursor Issues

**Problem:** Cursors not appearing
```
Solution:
- Verify CollaborativeCursors is rendered
- Check awareness updates
- Ensure cursor position updates
```

## Advanced Features

### Custom Awareness States

```typescript
provider.getAwareness().setLocalState({
  user: { name, color },
  cursor: { x, y },
  selection: { from, to },
  customData: { /* your data */ }
});
```

### Offline Support

```typescript
// Y.js automatically handles offline editing
// Changes sync when connection is restored
```

### Persistence

```typescript
// Save document state
const state = Y.encodeStateAsUpdate(doc);
localStorage.setItem('doc-state', state);

// Load document state
const savedState = localStorage.getItem('doc-state');
if (savedState) {
  Y.applyUpdate(doc, savedState);
}
```

## Security Considerations

1. **Authentication**: Add JWT or session-based auth
2. **Authorization**: Verify user permissions before joining
3. **Rate Limiting**: Prevent abuse of collaboration server
4. **Input Validation**: Sanitize user input
5. **HTTPS**: Use secure WebSocket (wss://)

## Production Deployment

### 1. Setup Y.js server
```bash
# Use Hocuspocus or y-websocket
docker run -p 1234:1234 hocuspocus/hocuspocus
```

### 2. Update configuration
```typescript
serverUrl: process.env.NEXT_PUBLIC_COLLABORATION_SERVER
```

### 3. Add environment variable
```env
NEXT_PUBLIC_COLLABORATION_SERVER=wss://collab.yourdomain.com
```

### 4. Deploy
```bash
pnpm build
pnpm start
```

## Resources

- [Y.js Documentation](https://docs.yjs.dev/)
- [TipTap Collaboration](https://tiptap.dev/docs/collaboration)
- [Hocuspocus Server](https://tiptap.dev/hocuspocus)
- [WebRTC Provider](https://github.com/yjs/y-webrtc)

## Support

For issues or questions:
1. Check this documentation
2. Review example implementation in `page-yjs.tsx`
3. Check browser console for errors
4. Verify Y.js server is running

## License

Part of the AIT-CORE Suite Portal project.
