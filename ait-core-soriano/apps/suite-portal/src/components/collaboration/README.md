# Collaboration Components

Real-time collaboration components featuring remote cursors, text selections, and presence indicators.

## Components

### RemoteCursors
Display remote user cursors with smooth animations and labels.

```tsx
<RemoteCursors
  activeUsers={activeUsers}
  localUserId={currentUserId}
/>
```

### RemoteSelection
Show text selections from other users with colored highlights.

```tsx
<RemoteSelection
  activeUsers={activeUsers}
  localUserId={currentUserId}
/>
```

### UserPresenceIndicator
Display user online/idle/offline status with animated indicators.

```tsx
<UserPresenceIndicator
  user={userPresence}
  size="md"
  showLabel={true}
/>
```

### CollaborationDemo
Interactive demo playground for testing collaboration features.

```tsx
<CollaborationDemo />
```

## Hooks

### usePresence
Main hook for managing user presence and collaboration state.

```tsx
const {
  activeUsers,
  onlineUsers,
  updateCursor,
  updateSelection,
  processRemoteUpdate
} = usePresence({
  userId: 'user-123',
  userName: 'John Doe',
  documentId: 'doc-456',
  enabled: true,
  onBroadcast: (broadcast) => {
    // Send to WebSocket
  }
});
```

### useMouseTracking
Track mouse position within a container.

```tsx
const cursorPosition = useMouseTracking(containerRef, true);
```

### useSelectionTracking
Track text selection within an element.

```tsx
const selectionRange = useSelectionTracking(contentRef, true);
```

## Quick Example

```tsx
'use client';

import { useRef } from 'react';
import { RemoteCursors, RemoteSelection } from '@/components/collaboration';
import { usePresence } from '@/hooks/use-presence';

export default function CollaborativeEditor() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { activeUsers, updateCursor } = usePresence({
    userId: 'user-123',
    userName: 'John Doe',
    enabled: true
  });

  return (
    <div ref={containerRef} className="relative">
      <div>{/* Your content */}</div>
      <RemoteSelection activeUsers={activeUsers} localUserId="user-123" />
      <RemoteCursors activeUsers={activeUsers} localUserId="user-123" />
    </div>
  );
}
```

## Features

- ✅ Real-time cursor tracking
- ✅ Text selection highlights
- ✅ Presence indicators (online/idle/offline)
- ✅ Smooth animations (Framer Motion)
- ✅ Auto-hide idle cursors (10s)
- ✅ Throttled updates (100ms)
- ✅ Color-coded users (10 colors)
- ✅ Dark mode support
- ✅ TypeScript support
- ✅ Performance optimized

## Documentation

See root directory for complete documentation:
- `COLLABORATION_SYSTEM.md` - Full API reference
- `COLLABORATION_QUICK_START.md` - Quick integration guide
- `COLLABORATION_VISUAL_GUIDE.md` - Visual examples
- `COLLABORATION_IMPLEMENTATION_COMPLETE.md` - Implementation details

## File Structure

```
collaboration/
├── RemoteCursors.tsx           # Remote cursor component
├── RemoteSelection.tsx         # Selection highlight component
├── UserPresenceIndicator.tsx   # Status indicator component
├── CollaborationDemo.tsx       # Demo playground
├── CollaborationBar.tsx        # Y.js collaboration bar
├── CollaborativeCursor.tsx     # Y.js cursor component
├── index.ts                    # Barrel exports
└── README.md                   # This file
```

## Dependencies

All dependencies are already installed:
- `framer-motion` - Animations
- `date-fns` - Date formatting
- `lucide-react` - Icons
- `socket.io-client` - WebSocket (optional)

## Browser Support

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile (limited - no cursor tracking)

## License

Part of AIT-CORE Suite Portal
