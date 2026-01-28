# Collaboration System - Quick Start Guide

## 🚀 5-Minute Integration

### Step 1: Import Components & Hooks

```tsx
import {
  RemoteCursors,
  RemoteSelection,
  UserPresenceIndicator
} from '@/components/collaboration';

import {
  usePresence,
  useMouseTracking,
  useSelectionTracking
} from '@/hooks/use-presence';
```

### Step 2: Set Up Container Refs

```tsx
const containerRef = useRef<HTMLDivElement>(null);
const contentRef = useRef<HTMLDivElement>(null);
```

### Step 3: Initialize Presence System

```tsx
const currentUserId = 'user-123';  // From your auth system

const {
  activeUsers,
  updateCursor,
  updateSelection,
  processRemoteUpdate
} = usePresence({
  userId: currentUserId,
  userName: 'John Doe',
  documentId: 'doc-456',
  enabled: true,
  onBroadcast: (broadcast) => {
    // TODO: Send via WebSocket
    console.log('Broadcast:', broadcast);
  }
});
```

### Step 4: Track Mouse & Selection

```tsx
// Automatic tracking
const cursor = useMouseTracking(containerRef, true);
const selection = useSelectionTracking(contentRef, true);

// Auto-update on change
useEffect(() => {
  if (cursor) updateCursor(cursor);
}, [cursor, updateCursor]);

useEffect(() => {
  updateSelection(selection || undefined);
}, [selection, updateSelection]);
```

### Step 5: Add Collaboration Overlays

```tsx
<div ref={containerRef} className="relative">
  <div ref={contentRef}>
    {/* Your content */}
  </div>

  <RemoteSelection activeUsers={activeUsers} localUserId={currentUserId} />
  <RemoteCursors activeUsers={activeUsers} localUserId={currentUserId} />
</div>
```

## ✅ Complete Example

```tsx
'use client';

import { useRef, useEffect } from 'react';
import { RemoteCursors, RemoteSelection } from '@/components/collaboration';
import { usePresence, useMouseTracking, useSelectionTracking } from '@/hooks/use-presence';

export default function MyCollaborativeApp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const currentUserId = 'user-123';

  const { activeUsers, updateCursor, updateSelection } = usePresence({
    userId: currentUserId,
    userName: 'John Doe',
    enabled: true
  });

  const cursor = useMouseTracking(containerRef, true);
  const selection = useSelectionTracking(contentRef, true);

  useEffect(() => {
    if (cursor) updateCursor(cursor);
  }, [cursor, updateCursor]);

  useEffect(() => {
    updateSelection(selection || undefined);
  }, [selection, updateSelection]);

  return (
    <div ref={containerRef} className="relative h-screen">
      <div ref={contentRef} className="p-8">
        <h1>Collaborative Document</h1>
        <p>Move your mouse and select text to see real-time collaboration!</p>
      </div>

      <RemoteSelection activeUsers={activeUsers} localUserId={currentUserId} />
      <RemoteCursors activeUsers={activeUsers} localUserId={currentUserId} />
    </div>
  );
}
```

## 🎨 Showing Online Users

```tsx
import { UserPresenceIndicator } from '@/components/collaboration';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// In your UI
{onlineUsers.map(user => (
  <div key={user.userId} className="flex items-center gap-2">
    <Avatar>
      <AvatarFallback style={{ backgroundColor: user.color }}>
        {user.user?.name?.[0]}
      </AvatarFallback>
    </Avatar>
    <UserPresenceIndicator user={user} size="sm" />
    <span>{user.user?.name}</span>
  </div>
))}
```

## 🔌 WebSocket Integration (Optional)

```tsx
// Connect to WebSocket
const socket = io('http://localhost:3000');

// Send broadcasts
const { activeUsers, processRemoteUpdate } = usePresence({
  userId: currentUserId,
  userName: 'John Doe',
  onBroadcast: (broadcast) => {
    socket.emit('presence:update', broadcast);
  }
});

// Receive updates
useEffect(() => {
  socket.on('presence:update', processRemoteUpdate);
  return () => socket.off('presence:update');
}, [processRemoteUpdate]);
```

## 🎯 Key Props

| Prop | Type | Description |
|------|------|-------------|
| `userId` | string | Current user ID (required) |
| `userName` | string | Display name |
| `documentId` | string | Document context |
| `enabled` | boolean | Enable/disable system |
| `onBroadcast` | function | Handle outgoing updates |

## 🎨 Customization

### Hide idle cursors (default: 10s)
Cursors automatically hide after 10 seconds of no movement.

### Change colors
Colors auto-assigned per user from a 10-color palette.

### Toggle presence
```tsx
const [showPresence, setShowPresence] = useState(true);

// Pass enabled prop
usePresence({ ..., enabled: showPresence })
```

## 📱 Responsive Design

All components are fully responsive and support:
- ✅ Light/Dark mode
- ✅ Mobile (touch-optimized)
- ✅ Tablet
- ✅ Desktop

## 🎭 Demo Component

Try the interactive demo:

```tsx
import { CollaborationDemo } from '@/components/collaboration/CollaborationDemo';

<CollaborationDemo />
```

## 🐛 Troubleshooting

**Cursors not showing?**
- Check `enabled={true}`
- Verify `activeUsers` has data
- Ensure refs are attached

**Performance slow?**
- Updates throttled to 100ms by default
- Check WebSocket latency
- Reduce number of users

**Selection not working?**
- Verify `contentRef` on text container
- Check browser compatibility
- Ensure not inside iframe

## 📚 Full Documentation

See `COLLABORATION_SYSTEM.md` for complete API reference and advanced features.

## ✨ Features at a Glance

- ✅ Remote cursors with smooth animations
- ✅ Text selection highlights
- ✅ Online/idle/offline presence
- ✅ Auto idle detection (10s)
- ✅ Throttled updates (100ms)
- ✅ Dark mode support
- ✅ TypeScript
- ✅ Framer Motion animations
- ✅ Performance optimized

---

**Ready to go!** Check `src/app/documents/page.tsx` for a real-world integration example.
