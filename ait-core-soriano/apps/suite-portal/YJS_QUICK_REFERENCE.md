# Y.js Collaboration - Quick Reference Card

Essential reference for Y.js collaborative editing system.

## 🚀 Quick Start (30 seconds)

```bash
cd C:\Users\rsori\codex\ait-core-soriano\apps\suite-portal
pnpm install
pnpm dev
```

Open http://localhost:3001/documents in multiple windows.

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/lib/collaboration/yjs-provider.ts` | Y.js core provider |
| `src/lib/collaboration/collaboration-manager.ts` | Session manager |
| `src/components/collaboration/CollaborationBar.tsx` | User presence UI |
| `src/components/collaboration/CollaborativeCursor.tsx` | Remote cursors |
| `src/hooks/use-collaboration.ts` | Main React hook |
| `src/app/documents/page-yjs.tsx` | Full example |

## 🎯 Basic Usage

```typescript
import { useCollaboration } from '@/hooks/use-collaboration';
import { CollaborationBar, CollaborativeCursors } from '@/components/collaboration';

function MyEditor() {
  const { doc, provider, status } = useCollaboration({
    documentId: 'doc-123',
    userId: 'user-456',
    userName: 'John Doe',
  });

  const editor = useEditor({
    extensions: [
      Collaboration.configure({ document: doc }),
      CollaborationCursor.configure({ provider }),
    ],
  });

  return (
    <>
      <CollaborationBar status={status} />
      <EditorContent editor={editor} />
      <CollaborativeCursors />
    </>
  );
}
```

## 🔌 Connection Setup

### Option 1: WebRTC P2P (Default - No Server)
```typescript
// Already configured, works out of the box
useCollaboration({ documentId, userId, userName });
```

### Option 2: WebSocket Server
```bash
# Start server
npx y-websocket --port 1234

# Or Hocuspocus
node collaboration-server.js
```

```typescript
// Use custom server
useCollaboration({
  documentId,
  userId,
  userName,
  serverUrl: 'ws://localhost:1234',
});
```

## 🎨 Components

### CollaborationBar
```typescript
<CollaborationBar
  status="connected" | "connecting" | "disconnected" | "error"
/>
```

### CollaborativeCursors
```typescript
<CollaborativeCursors visible={true} />
```

## 🪝 Hook API

### useCollaboration
```typescript
const {
  doc,              // Y.Doc
  provider,         // YjsProvider
  awareness,        // Awareness
  activeUsers,      // User[]
  isConnected,      // boolean
  status,           // ConnectionStatus
  manager,          // CollaborationManager
  connect,          // () => Promise<void>
  disconnect,       // () => void
  updateUser,       // (updates) => void
  updateCursor,     // (pos) => void
  getText,          // (name?) => Y.Text
  isActive,         // boolean
} = useCollaboration(config);
```

### Config
```typescript
{
  documentId: string,        // Required
  userId: string,            // Required
  userName: string,          // Required
  userColor?: string,        // Optional, auto-generated
  serverUrl?: string,        // Optional, default: ws://localhost:1234
  autoConnect?: boolean,     // Optional, default: true
  debug?: boolean,           // Optional, default: false
}
```

## 🎭 TipTap Integration

```typescript
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';

const editor = useEditor({
  extensions: [
    StarterKit.configure({ history: false }), // Important!
    Collaboration.configure({
      document: yjsDoc, // from useCollaboration
    }),
    CollaborationCursor.configure({
      provider: yjsProvider, // from useCollaboration
      user: { name: 'Me', color: '#3B82F6' },
    }),
  ],
});
```

## 📡 Connection Status

| Status | Meaning |
|--------|---------|
| `connecting` | Attempting connection |
| `connected` | ✅ Connected and syncing |
| `disconnected` | Not connected, will retry |
| `error` | ❌ Connection error |

## 🎨 User Colors

Default palette (can customize):
```typescript
'#EF4444', // red
'#F59E0B', // orange
'#10B981', // green
'#3B82F6', // blue
'#6366F1', // indigo
'#8B5CF6', // purple
'#EC4899', // pink
'#14B8A6', // teal
```

## 🔧 Common Tasks

### Get Active Users
```typescript
const { activeUsers } = useCollaboration(config);
// activeUsers: Array<{id, name, email, color, cursor, lastSeen, isActive}>
```

### Update User Info
```typescript
const { updateUser } = useCollaboration(config);
updateUser({ name: 'New Name', color: '#FF0000' });
```

### Track Cursor Position
```typescript
const { updateCursor } = useCollaboration(config);
updateCursor({ x: 100, y: 200 });
```

### Undo/Redo
```typescript
const provider = manager?.getProvider();
provider?.undo(); // Undo
provider?.redo(); // Redo
```

## 🐛 Troubleshooting

### No Connection
```typescript
// Check status
console.log(status);

// Enable debug logging
useCollaboration({ ..., debug: true });
```

### No Remote Cursors
```typescript
// Ensure component is rendered
<CollaborativeCursors />

// Check awareness
console.log(awareness?.getStates());
```

### Changes Not Syncing
```typescript
// Verify same documentId
// Check browser console
// Check network tab for WebSocket
```

## 📦 Installation

### Required Dependencies (already in package.json)
```bash
yjs
y-webrtc
@tiptap/extension-collaboration
@tiptap/extension-collaboration-cursor
framer-motion
zustand
```

### Install (if needed)
```bash
pnpm install
```

## 🌐 Environment Variables

```env
# .env.local
NEXT_PUBLIC_COLLABORATION_SERVER=ws://localhost:1234
```

## 🧪 Testing

```bash
# Start dev server
pnpm dev

# Open multiple windows
# - Window 1: http://localhost:3001/documents
# - Window 2: http://localhost:3001/documents

# Create/open same document
# Type in one window
# See changes in other window
```

## 📚 Documentation

- **Full Guide:** `YJS_COLLABORATION_GUIDE.md` (~750 lines)
- **Installation:** `INSTALL_YJS_COLLABORATION.md` (~480 lines)
- **File List:** `YJS_FILES_MANIFEST.md`
- **This File:** Quick reference

## 🔒 Security Notes

⚠️ For production:
- Add authentication
- Use WSS (secure WebSocket)
- Implement rate limiting
- Validate user permissions
- Sanitize input

## 🚀 Production Deployment

```bash
# 1. Deploy Y.js server
docker run -p 1234:1234 -d yjs-server

# 2. Set environment variable
NEXT_PUBLIC_COLLABORATION_SERVER=wss://collab.yourdomain.com

# 3. Build and deploy
pnpm build
pnpm start
```

## 📊 Performance Tips

- Limit cursor update frequency (already throttled to 50ms)
- Use WebRTC for P2P (reduces server load)
- Implement document cleanup for old sessions
- Monitor memory usage with many users
- Consider Redis for scaling

## 🎯 Key Concepts

### Y.js
- **CRDT:** Conflict-free Replicated Data Type
- **Y.Doc:** Shared document container
- **Y.Text:** Collaborative text type
- **Awareness:** User presence protocol

### Provider
- **WebSocket:** Client-server sync
- **WebRTC:** Peer-to-peer sync
- **Hybrid:** Both for reliability

### TipTap
- **Collaboration:** Y.js integration
- **CollaborationCursor:** Remote selections
- **History:** Disabled (Y.js handles it)

## 💡 Pro Tips

1. **Always disable TipTap history** when using Y.js
   ```typescript
   StarterKit.configure({ history: false })
   ```

2. **Use same documentId** for all clients
   ```typescript
   documentId: document.id // Not Math.random()!
   ```

3. **Check connection status** before operations
   ```typescript
   if (isConnected) { /* safe to proceed */ }
   ```

4. **Handle reconnection** gracefully
   ```typescript
   // Automatic with exponential backoff
   // Max 5 attempts, 1s to 16s delays
   ```

5. **Debug with console**
   ```typescript
   useCollaboration({ ..., debug: true })
   ```

## 📞 Support

Check documentation:
1. This quick reference
2. `INSTALL_YJS_COLLABORATION.md`
3. `YJS_COLLABORATION_GUIDE.md`
4. Example: `src/app/documents/page-yjs.tsx`

## 🎉 Features Checklist

- ✅ Real-time sync
- ✅ User presence
- ✅ Remote cursors
- ✅ Connection status
- ✅ Auto-reconnect
- ✅ Undo/Redo
- ✅ TypeScript
- ✅ Dark mode
- ✅ Animations
- ✅ Mobile support

---

**Version:** 1.0.0
**Last Updated:** 2024-01-28
**Status:** Production Ready ✅
