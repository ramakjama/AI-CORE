# Real-Time Notifications System

A complete real-time notification system for the AIT-CORE Suite Portal with WebSocket support, toast notifications, notification center, and full TypeScript support.

## Features

- **Real-time WebSocket notifications** via Socket.IO
- **Toast notifications** with auto-dismiss and stacked display
- **Notification Center** dropdown with grouped notifications
- **Unread count badge** with pulse animation
- **4 notification types**: info, success, warning, error
- **Dark mode support**
- **Persistent storage** (last 100 notifications in localStorage)
- **Browser notifications** with permission handling
- **Notification sound** support
- **Action URLs** for clickable notifications
- **Smooth animations** with Framer Motion

## Architecture

### Files Created

```
src/
├── store/
│   └── notifications.store.ts          # Zustand store for notifications state
├── lib/
│   └── notifications/
│       ├── notification-manager.ts      # WebSocket manager and notification logic
│       └── index.ts                     # Exports
├── hooks/
│   └── use-notifications.ts             # React hook for using notifications
├── components/
│   └── notifications/
│       ├── NotificationToast.tsx        # Toast notification component
│       ├── NotificationCenter.tsx       # Notification center dropdown
│       ├── NotificationDemo.tsx         # Demo component for testing
│       └── index.ts                     # Exports
└── components/layout/
    └── topbar.tsx                       # Updated with notification bell
```

## Usage

### 1. The notification system is already integrated in the topbar

The topbar now includes:
- Notification bell icon with unread count badge
- Pulse animation when new notifications arrive
- Notification center dropdown
- Toast notifications in bottom-right corner

### 2. Using Notifications in Your Code

```tsx
import { useNotifications } from '@/hooks/use-notifications';

function MyComponent() {
  const { addNotification, notifications, unreadCount, markAsRead } = useNotifications();

  // Add a notification
  const handleAction = () => {
    addNotification({
      type: 'success',
      title: 'Task Completed',
      message: 'Your export has been completed successfully.',
      actionUrl: '/tasks',
      actionLabel: 'View Tasks',
    });
  };

  return (
    <button onClick={handleAction}>
      Complete Task
    </button>
  );
}
```

### 3. Notification Types

```tsx
// Success notification
addNotification({
  type: 'success',
  title: 'Success!',
  message: 'Operation completed successfully.',
});

// Error notification
addNotification({
  type: 'error',
  title: 'Error',
  message: 'Something went wrong.',
});

// Warning notification
addNotification({
  type: 'warning',
  title: 'Warning',
  message: 'Please check your settings.',
});

// Info notification
addNotification({
  type: 'info',
  title: 'Info',
  message: 'New features are available.',
});
```

### 4. Notifications with Actions

```tsx
addNotification({
  type: 'info',
  title: 'New Message',
  message: 'You have a new message from John.',
  actionUrl: '/messages/123',
  actionLabel: 'View Message',
});
```

### 5. Testing the System

Add the demo component to any page:

```tsx
import { NotificationDemo } from '@/components/notifications/NotificationDemo';

function MyPage() {
  return (
    <div>
      <NotificationDemo />
      {/* Your page content */}
    </div>
  );
}
```

## WebSocket Integration

### Configuration

Set the WebSocket URL in your environment variables:

```env
NEXT_PUBLIC_WS_URL=ws://localhost:3002
```

### WebSocket Events

The notification manager listens for these events:

```typescript
// Generic notification event
socket.on('notification', (data) => {
  // data: { type, title, message, actionUrl?, actionLabel?, metadata? }
});

// Type-specific events
socket.on('notification:info', (data) => { /* ... */ });
socket.on('notification:success', (data) => { /* ... */ });
socket.on('notification:warning', (data) => { /* ... */ });
socket.on('notification:error', (data) => { /* ... */ });
```

### Server-Side Example (Node.js + Socket.IO)

```javascript
const io = require('socket.io')(3002, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send a notification
  socket.emit('notification', {
    type: 'success',
    title: 'Welcome!',
    message: 'You are now connected to real-time notifications.',
  });

  // Send to all clients
  io.emit('notification:info', {
    title: 'System Update',
    message: 'The system will be updated in 10 minutes.',
  });
});
```

## Store API

### useNotificationsStore

```typescript
import { useNotificationsStore } from '@/store/notifications.store';

const {
  notifications,        // Notification[]
  unreadCount,         // number
  addNotification,     // (notification) => void
  markAsRead,          // (id: string) => void
  markAllAsRead,       // () => void
  clearAll,            // () => void
  removeNotification,  // (id: string) => void
} = useNotificationsStore();
```

## Hook API

### useNotifications

```typescript
import { useNotifications } from '@/hooks/use-notifications';

const {
  notifications,        // Notification[]
  unreadCount,         // number
  markAsRead,          // (id: string) => void
  markAllAsRead,       // () => void
  clearAll,            // () => void
  removeNotification,  // (id: string) => void
  addNotification,     // (notification) => void
  isConnected,         // boolean
} = useNotifications();
```

## Notification Manager API

```typescript
import { notificationManager } from '@/lib/notifications';

// Connect to WebSocket
notificationManager.connect();

// Disconnect from WebSocket
notificationManager.disconnect();

// Add notification manually
notificationManager.addNotification({
  type: 'info',
  title: 'Manual Notification',
  message: 'This notification was added manually.',
});

// Emit custom event
notificationManager.emit('custom-event', { data: 'value' });

// Check connection status
const isConnected = notificationManager.isConnected();
```

## Components

### NotificationToast

Toast notification that appears in bottom-right corner.

**Features:**
- Auto-dismiss after 5 seconds
- Progress bar showing time remaining
- Click to navigate to action URL
- Stacked display (max 3 visible)
- Smooth entrance/exit animations

### NotificationCenter

Dropdown panel showing all notifications.

**Features:**
- Grouped by: Today, Yesterday, This Week, Older
- Mark individual as read
- Mark all as read button
- Clear all button
- Scrollable list (max height: 400px)
- Unread indicator dot

### NotificationDemo

Testing component for developers.

**Features:**
- Test all notification types
- Random notification button
- WebSocket connection status
- Pre-configured test messages

## Customization

### Changing Auto-Dismiss Duration

Edit `NotificationToast.tsx`:

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    handleClose();
  }, 10000); // Change to 10 seconds

  return () => clearTimeout(timer);
}, [notification.id]);
```

### Changing Max Notifications

Edit `notifications.store.ts`:

```tsx
addNotification: (notification) =>
  set((state) => {
    // ...
    const notifications = [newNotification, ...state.notifications].slice(0, 200); // Change to 200
    // ...
  }),
```

### Changing Toast Position

Edit `NotificationToast.tsx`:

```tsx
<motion.div
  className="fixed top-6 right-6 z-50" // Change to top-right
  // ...
>
```

### Disabling Sounds

Edit `notification-manager.ts`:

```tsx
private playNotificationSound() {
  return; // Disable sounds
  // ... rest of the code
}
```

## Browser Notifications

The system automatically requests browser notification permissions and shows native notifications when the browser tab is not focused.

To disable browser notifications:

```tsx
// In notification-manager.ts
private async showBrowserNotification(data: NotificationEvent) {
  return; // Disable browser notifications
}
```

## Performance Considerations

- **Storage Limit**: Only last 100 notifications are persisted to localStorage
- **Toast Limit**: Maximum 3 toast notifications visible at once
- **Center Limit**: Notification center shows last 50 notifications
- **WebSocket Reconnection**: Automatic reconnection with exponential backoff (max 5 attempts)

## Dark Mode

All components fully support dark mode via Tailwind CSS dark mode classes. Dark mode is controlled by the `useAppStore` and applies automatically.

## TypeScript Types

```typescript
type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface NotificationEvent {
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}
```

## Troubleshooting

### WebSocket Not Connecting

1. Check that `NEXT_PUBLIC_WS_URL` is set correctly
2. Ensure WebSocket server is running
3. Check browser console for connection errors
4. Verify CORS settings on server

### Notifications Not Appearing

1. Check that `useNotifications` hook is being used
2. Verify notification is being added to store
3. Check browser console for errors
4. Ensure toast container is rendered

### Browser Notifications Not Working

1. Check browser notification permissions
2. User must interact with page first (browser security)
3. Notifications only work in secure contexts (HTTPS or localhost)

## Future Enhancements

- [ ] Notification categories/filters
- [ ] Custom notification sounds per type
- [ ] Notification priority levels
- [ ] Snooze notifications
- [ ] Notification templates
- [ ] Rich media notifications (images, videos)
- [ ] Notification history page
- [ ] Export notifications
- [ ] Notification preferences/settings

## Dependencies

All required dependencies are already in package.json:
- `socket.io-client` - WebSocket client
- `zustand` - State management
- `framer-motion` - Animations
- `@radix-ui/react-dropdown-menu` - Dropdown component
- `@radix-ui/react-scroll-area` - Scrollable area
- `date-fns` - Date formatting
- `lucide-react` - Icons

## License

Part of the AIT-CORE Suite Portal ecosystem.
