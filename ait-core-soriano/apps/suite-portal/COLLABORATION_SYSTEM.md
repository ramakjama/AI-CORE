# Collaboration System Documentation

## Overview

A complete real-time collaboration system featuring remote cursors, text selection highlights, and user presence indicators. Built with TypeScript, React, and optimized for performance with throttling and efficient state management.

## Features

### 1. Remote Cursors
- **Visual Cursor Display**: Beautifully rendered SVG cursors for each remote user
- **User Labels**: Name tags attached to each cursor showing who's active
- **Color Coding**: Each user gets a unique, consistent color
- **Smooth Animations**: CSS transitions for fluid cursor movement
- **Idle Detection**: Cursors automatically hide after 10 seconds of inactivity
- **Framer Motion**: Smooth entry/exit animations

### 2. Text Selection Highlights
- **Visual Overlays**: Semi-transparent colored highlights for text selections
- **User Attribution**: Hover tooltips showing which user made the selection
- **Multi-user Support**: Multiple selections visible simultaneously
- **Color Coordination**: Matches user's assigned color
- **Performance Optimized**: Only renders active, online users' selections

### 3. Presence Management
- **Online/Idle/Offline States**: Three-tier presence system
- **Automatic Status Detection**: Idle after 10s, offline after 30s
- **Last Seen Tracking**: Human-readable timestamps using date-fns
- **Animated Indicators**: Pulsing green dot for online users
- **Real-time Updates**: Instant state synchronization

### 4. Performance Optimizations
- **Throttled Updates**: 100ms throttle for cursor/selection broadcasts
- **Efficient State Management**: Map-based user storage
- **Memory Management**: Automatic cleanup of inactive users
- **Subscription Pattern**: Efficient React re-rendering

## File Structure

```
src/
├── types/
│   └── collaboration.ts          # TypeScript type definitions
├── lib/
│   └── collaboration/
│       └── presence-manager.ts   # Core presence management logic
├── hooks/
│   └── use-presence.ts           # React hooks for presence
├── components/
│   └── collaboration/
│       ├── RemoteCursors.tsx     # Remote cursor component
│       ├── RemoteSelection.tsx   # Selection highlight component
│       ├── UserPresenceIndicator.tsx  # Status indicator
│       ├── CollaborationDemo.tsx # Demo playground
│       └── index.ts              # Barrel exports
└── app/
    └── documents/
        └── page.tsx              # Integrated example
```

## Installation & Setup

### 1. Dependencies
All required dependencies are already installed:
- `framer-motion` - Animations
- `date-fns` - Date formatting
- `lucide-react` - Icons

### 2. Import Components

```tsx
import {
  RemoteCursors,
  RemoteSelection,
  UserPresenceIndicator
} from '@/components/collaboration';

import { usePresence, useMouseTracking, useSelectionTracking } from '@/hooks/use-presence';
```

### 3. Basic Integration

```tsx
'use client';

import { useRef, useEffect } from 'react';
import { RemoteCursors, RemoteSelection } from '@/components/collaboration';
import { usePresence, useMouseTracking, useSelectionTracking } from '@/hooks/use-presence';

export default function CollaborativeEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Current user info (get from auth)
  const currentUserId = 'user-123';
  const currentUserName = 'John Doe';

  // Initialize presence
  const {
    activeUsers,
    updateCursor,
    updateSelection,
    processRemoteUpdate
  } = usePresence({
    userId: currentUserId,
    userName: currentUserName,
    documentId: 'doc-456',
    enabled: true,
    onBroadcast: (broadcast) => {
      // Send to WebSocket/Socket.io
      socket.emit('presence:update', broadcast);
    }
  });

  // Track mouse and selection
  const cursorPosition = useMouseTracking(containerRef, true);
  const selectionRange = useSelectionTracking(contentRef, true);

  // Update cursor
  useEffect(() => {
    if (cursorPosition) updateCursor(cursorPosition);
  }, [cursorPosition, updateCursor]);

  // Update selection
  useEffect(() => {
    updateSelection(selectionRange || undefined);
  }, [selectionRange, updateSelection]);

  // Listen to remote updates
  useEffect(() => {
    socket.on('presence:update', (broadcast) => {
      processRemoteUpdate(broadcast);
    });

    return () => socket.off('presence:update');
  }, [processRemoteUpdate]);

  return (
    <div ref={containerRef} className="relative">
      <div ref={contentRef}>
        {/* Your content here */}
      </div>

      {/* Collaboration overlays */}
      <RemoteSelection
        activeUsers={activeUsers}
        localUserId={currentUserId}
      />
      <RemoteCursors
        activeUsers={activeUsers}
        localUserId={currentUserId}
      />
    </div>
  );
}
```

## API Reference

### `usePresence` Hook

```tsx
interface UsePresenceOptions {
  userId: string;              // Current user ID
  documentId?: string;         // Optional document context
  userName?: string;           // Display name
  userAvatar?: string;         // Avatar URL
  enabled?: boolean;           // Enable/disable presence
  onBroadcast?: (broadcast: PresenceBroadcast) => void;  // Broadcast callback
}

interface UsePresenceReturn {
  activeUsers: UserPresence[];                    // All active users
  onlineUsers: UserPresence[];                    // Online users only
  updateCursor: (cursor: CursorPosition) => void; // Update cursor position
  updateSelection: (selection?: SelectionRange) => void; // Update selection
  addRemoteUser: (userId: string, user?: any) => void;   // Add remote user
  removeRemoteUser: (userId: string) => void;            // Remove user
  processRemoteUpdate: (broadcast: PresenceBroadcast) => void; // Process updates
  presenceManager: PresenceManager;               // Manager instance
}
```

### `RemoteCursors` Component

```tsx
interface RemoteCursorsProps {
  activeUsers: UserPresence[];  // Array of user presence data
  localUserId: string;          // Current user ID to filter out
  className?: string;           // Optional CSS class
}
```

### `RemoteSelection` Component

```tsx
interface RemoteSelectionProps {
  activeUsers: UserPresence[];  // Array of user presence data
  localUserId: string;          // Current user ID to filter out
  className?: string;           // Optional CSS class
}
```

### `UserPresenceIndicator` Component

```tsx
interface UserPresenceIndicatorProps {
  user: UserPresence;           // User presence data
  showLabel?: boolean;          // Show status label
  size?: 'sm' | 'md' | 'lg';   // Indicator size
  className?: string;           // Optional CSS class
}
```

## WebSocket Integration

### Server-side (Node.js + Socket.io)

```javascript
io.on('connection', (socket) => {
  // User joins document
  socket.on('presence:join', ({ userId, documentId, userName }) => {
    socket.join(`doc:${documentId}`);
    socket.to(`doc:${documentId}`).emit('presence:update', {
      type: 'join',
      userId,
      data: { user: { id: userId, name: userName } },
      timestamp: Date.now()
    });
  });

  // Broadcast presence updates
  socket.on('presence:update', ({ documentId, broadcast }) => {
    socket.to(`doc:${documentId}`).emit('presence:update', broadcast);
  });

  // User leaves
  socket.on('disconnect', () => {
    socket.to(`doc:${documentId}`).emit('presence:update', {
      type: 'leave',
      userId: socket.userId,
      data: {},
      timestamp: Date.now()
    });
  });
});
```

### Client-side Integration

```tsx
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');

// Join document
socket.emit('presence:join', {
  userId: currentUserId,
  documentId: 'doc-123',
  userName: 'John Doe'
});

// Listen for updates
socket.on('presence:update', (broadcast) => {
  processRemoteUpdate(broadcast);
});

// Send updates
const handleBroadcast = (broadcast) => {
  socket.emit('presence:update', {
    documentId: 'doc-123',
    broadcast
  });
};
```

## Styling & Customization

### Dark Mode Support
All components fully support dark mode using Tailwind's `dark:` prefix.

### Custom Colors
User colors are automatically assigned from a palette:
- Blue: `#3B82F6`
- Green: `#10B981`
- Amber: `#F59E0B`
- Red: `#EF4444`
- Violet: `#8B5CF6`
- Pink: `#EC4899`
- Teal: `#14B8A6`
- Orange: `#F97316`
- Indigo: `#6366F1`
- Lime: `#84CC16`

### Custom Cursor Design
To customize cursor appearance, edit `RemoteCursors.tsx`:

```tsx
<svg width="24" height="24" viewBox="0 0 24 24">
  {/* Your custom cursor SVG path */}
</svg>
```

## Performance Considerations

### Throttling
- Cursor updates: 100ms throttle
- Selection updates: 100ms throttle
- Status checks: 1 second interval

### Memory Management
- Automatic cleanup of disconnected users
- Map-based storage for O(1) lookups
- Efficient subscription pattern

### Optimization Tips
1. Only enable presence when document is active
2. Limit maximum number of visible cursors
3. Use production WebSocket server (not polling)
4. Implement cursor culling for off-screen cursors

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Cursor tracking disabled (touch events)

## Known Limitations
1. **Selection tracking**: Works best with contenteditable or textarea elements
2. **Cursor position**: Relative to container, may need adjustment for scrollable areas
3. **Mobile**: Cursor tracking not applicable for touch interfaces

## Troubleshooting

### Cursors not appearing
- Check `enabled` prop is true
- Verify `activeUsers` has data
- Ensure `localUserId` is set correctly

### Performance issues
- Reduce throttle interval if too slow
- Increase throttle interval if laggy
- Check WebSocket connection stability

### Selection not highlighting
- Verify `contentRef` points to correct element
- Check browser selection API compatibility
- Ensure element is not inside iframe

## Demo & Testing

Run the demo component:

```tsx
import { CollaborationDemo } from '@/components/collaboration/CollaborationDemo';

// In your page
<CollaborationDemo />
```

## Future Enhancements

- [ ] Voice/video call integration
- [ ] Commenting system
- [ ] Viewport awareness (show off-screen cursors)
- [ ] Gesture tracking (drawing/pointing)
- [ ] User avatars on cursors
- [ ] Presence audio/video indicators
- [ ] Activity feed
- [ ] Cursor trails/effects

## Support

For issues or questions:
- Check the demo component for working examples
- Review the documents page integration
- Inspect browser console for errors
- Verify WebSocket connection status

---

**Built with TypeScript, React, Framer Motion, and Tailwind CSS**

**Version**: 1.0.0
**Last Updated**: 2026-01-28
