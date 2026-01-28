# Y.js Collaboration System - Quick Installation

Quick start guide to get the Y.js collaborative editing system running.

## What Was Created

### Core Files

**1. Y.js Provider**
- `src/lib/collaboration/yjs-provider.ts` - Y.js document and WebSocket provider
- Features: Document sync, awareness protocol, auto-reconnect, undo/redo

**2. Collaboration Manager**
- `src/lib/collaboration/collaboration-manager.ts` - Session management
- Features: Join/leave sessions, user management, event handling

**3. React Components**
- `src/components/collaboration/CollaborationBar.tsx` - User presence bar
- `src/components/collaboration/CollaborativeCursor.tsx` - Remote cursors
- Features: Animated avatars, connection status, cursor tracking

**4. React Hook**
- `src/hooks/use-collaboration.ts` - Main collaboration hook
- Features: Auto-connect, state management, cursor sync

**5. Updated Store**
- `src/store/collaboration.store.ts` - Already exists, used by system

**6. Example Implementation**
- `src/app/documents/page-yjs.tsx` - Full TipTap + Y.js integration

**7. Index Exports**
- `src/lib/collaboration/index.ts`
- `src/components/collaboration/index.ts`

## Installation Steps

### Step 1: Verify Dependencies

All required dependencies are already in `package.json`. If you need to install:

```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal
pnpm install
```

Required packages:
- `yjs` - CRDT document structure
- `y-webrtc` - WebRTC provider for P2P collaboration
- `@tiptap/extension-collaboration` - TipTap Y.js integration
- `@tiptap/extension-collaboration-cursor` - Collaborative cursors
- `framer-motion` - Animations
- `zustand` - State management

### Step 2: Choose Server Setup

#### Option A: Development (WebRTC P2P - No Server Required)
The system is pre-configured for WebRTC peer-to-peer. Just start using it!

**Pros:**
- No server setup needed
- Works immediately
- Good for testing

**Cons:**
- Requires signaling server (uses public defaults)
- Not suitable for production

#### Option B: Production (WebSocket Server)

**Using y-websocket (Simple)**
```bash
# Install globally
npm install -g y-websocket

# Run server
npx y-websocket --port 1234
```

**Using Hocuspocus (Recommended)**
```bash
# Create server directory
mkdir collab-server
cd collab-server

# Install Hocuspocus
npm init -y
npm install @hocuspocus/server

# Create server.js
```

```javascript
// server.js
import { Server } from '@hocuspocus/server'

const server = Server.configure({
  port: 1234,

  async onConnect({ documentName, socketId, context }) {
    console.log(`Client ${socketId} connected to document: ${documentName}`)
  },

  async onDisconnect({ documentName, socketId }) {
    console.log(`Client ${socketId} disconnected from document: ${documentName}`)
  }
})

server.listen()
console.log('Hocuspocus server running on port 1234')
```

```bash
# Run server
node server.js
```

### Step 3: Configure Connection

If using your own server, update the server URL:

**Option A: Environment Variable (Recommended)**
```env
# .env.local
NEXT_PUBLIC_COLLABORATION_SERVER=ws://localhost:1234
```

**Option B: Direct Configuration**
Edit the usage in your component:
```typescript
useCollaboration({
  documentId: 'doc-123',
  userId: 'user-456',
  userName: 'John Doe',
  serverUrl: 'ws://localhost:1234', // Your server URL
});
```

### Step 4: Use in Your Application

#### Quick Integration

Replace your existing documents page:

```bash
# Backup original
copy src\app\documents\page.tsx src\app\documents\page.backup.tsx

# Use Y.js version
copy src\app\documents\page-yjs.tsx src\app\documents\page.tsx
```

#### Manual Integration

Add to any component:

```tsx
import { useCollaboration } from '@/hooks/use-collaboration';
import { CollaborationBar } from '@/components/collaboration';
import { CollaborativeCursors } from '@/components/collaboration';

function MyEditor({ documentId }) {
  // Setup collaboration
  const {
    doc,
    provider,
    status,
    activeUsers,
  } = useCollaboration({
    documentId,
    userId: getCurrentUserId(),
    userName: getCurrentUserName(),
  });

  // Setup TipTap with Y.js
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: doc }),
      CollaborationCursor.configure({
        provider,
        user: { name: 'Me', color: '#3B82F6' }
      }),
    ],
  });

  return (
    <div>
      {/* Show active users */}
      <CollaborationBar status={status} />

      {/* Your editor */}
      <EditorContent editor={editor} />

      {/* Show remote cursors */}
      <CollaborativeCursors />
    </div>
  );
}
```

### Step 5: Test the System

1. **Start the development server:**
```bash
pnpm dev
```

2. **Open multiple browser windows:**
```
http://localhost:3001/documents
```

3. **Create or open a document**

4. **Open the same document in another window**

5. **Test features:**
   - Type in one window, see changes in the other
   - Move your cursor, see remote cursors
   - Check user presence in collaboration bar
   - Close one window, see user leave notification

## Verification Checklist

- [ ] Dependencies installed
- [ ] Y.js provider created
- [ ] Collaboration manager created
- [ ] Components created (CollaborationBar, CollaborativeCursors)
- [ ] Hook created (use-collaboration)
- [ ] Server running (if using WebSocket)
- [ ] Can open document in multiple windows
- [ ] Real-time typing works
- [ ] Remote cursors visible
- [ ] User presence shows in bar
- [ ] Connection status indicator works

## Quick Test

```tsx
// Test component
'use client';
import { useCollaboration } from '@/hooks/use-collaboration';
import { CollaborationBar } from '@/components/collaboration';

export default function TestCollaboration() {
  const { status, activeUsers } = useCollaboration({
    documentId: 'test-doc',
    userId: 'test-user-' + Math.random(),
    userName: 'Test User',
  });

  return (
    <div className="p-8">
      <h1>Collaboration Test</h1>
      <CollaborationBar status={status} />
      <div className="mt-4">
        <p>Status: {status}</p>
        <p>Active Users: {activeUsers.length}</p>
        <pre>{JSON.stringify(activeUsers, null, 2)}</pre>
      </div>
    </div>
  );
}
```

## Troubleshooting

### "Cannot connect to server"
- **WebRTC Mode**: Check if signaling servers are accessible
- **WebSocket Mode**: Verify server is running on correct port
- **Firewall**: Check if port 1234 is open

### "No remote cursors showing"
```typescript
// Make sure CollaborativeCursors is rendered
<CollaborativeCursors />
```

### "Changes not syncing"
- Check browser console for errors
- Verify both clients use same documentId
- Check network tab for WebSocket/WebRTC connections

### "TypeScript errors"
```bash
# Rebuild types
pnpm type-check
```

## Next Steps

1. **Add Authentication**
   - Integrate with your auth system
   - Pass real user IDs and names

2. **Customize UI**
   - Update colors in components
   - Add your branding
   - Customize cursor styles

3. **Production Setup**
   - Deploy Hocuspocus server
   - Add authentication middleware
   - Setup monitoring
   - Add rate limiting

4. **Advanced Features**
   - Document persistence to database
   - Conflict resolution strategies
   - Offline support
   - Version history

## Production Deployment

### Server Deployment

**Docker (Recommended)**
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 1234
CMD ["node", "server.js"]
```

```bash
docker build -t yjs-server .
docker run -p 1234:1234 yjs-server
```

**Environment Variables**
```env
# Production
NEXT_PUBLIC_COLLABORATION_SERVER=wss://collab.yourdomain.com

# Development
NEXT_PUBLIC_COLLABORATION_SERVER=ws://localhost:1234
```

### Nginx Configuration
```nginx
# WebSocket proxy
location /collaboration {
    proxy_pass http://localhost:1234;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

## Resources

- Full Documentation: `YJS_COLLABORATION_GUIDE.md`
- Example Implementation: `src/app/documents/page-yjs.tsx`
- Y.js Docs: https://docs.yjs.dev/
- TipTap Collaboration: https://tiptap.dev/docs/collaboration
- Hocuspocus: https://tiptap.dev/hocuspocus

## Support

Check the comprehensive guide in `YJS_COLLABORATION_GUIDE.md` for:
- Complete API reference
- Advanced configuration
- Security best practices
- Performance optimization
- Custom features

## Summary

You now have a complete Y.js collaborative editing system with:
- ✅ Real-time document synchronization
- ✅ User presence and awareness
- ✅ Collaborative cursors
- ✅ Connection status indicators
- ✅ Auto-reconnection
- ✅ TypeScript support
- ✅ Dark mode support
- ✅ Framer Motion animations

**Start collaborating now!** 🚀
