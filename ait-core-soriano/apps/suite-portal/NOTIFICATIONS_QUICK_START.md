# Notifications System - Quick Start Guide

Get up and running with the real-time notifications system in 5 minutes.

## Step 1: Start the WebSocket Server (Optional for Testing)

```bash
# Install socket.io if not already installed
npm install socket.io

# Run the example server
node notification-server-example.js
```

The server will start on `ws://localhost:3002` and send test notifications.

## Step 2: Start the Suite Portal

```bash
# In the suite-portal directory
npm run dev
```

The portal will start on `http://localhost:3001`

## Step 3: Test the System

### Option A: Use the Demo Component

Add the demo component to any page (e.g., `src/app/dashboard/page.tsx`):

```tsx
import { NotificationDemo } from '@/components/notifications/NotificationDemo';

export default function DashboardPage() {
  return (
    <div>
      <NotificationDemo />
      {/* Your page content */}
    </div>
  );
}
```

### Option B: Add Notifications Programmatically

```tsx
'use client';

import { useNotifications } from '@/hooks/use-notifications';

export default function MyPage() {
  const { addNotification } = useNotifications();

  const handleClick = () => {
    addNotification({
      type: 'success',
      title: 'Test Notification',
      message: 'This is a test notification!',
    });
  };

  return (
    <button onClick={handleClick}>
      Send Test Notification
    </button>
  );
}
```

## Step 4: Check the UI

1. **Bell Icon**: Look for the bell icon in the topbar (top-right)
2. **Unread Badge**: You should see a red badge with the count
3. **Pulse Animation**: When a new notification arrives, the badge pulses
4. **Toast Notification**: Appears in bottom-right corner
5. **Click the Bell**: Opens the notification center dropdown

## What You Should See

### Toast Notifications (Bottom-Right)
- Automatically appear when notifications arrive
- Auto-dismiss after 5 seconds
- Progress bar shows time remaining
- Click to navigate to action URL
- Close button (X) to dismiss manually
- Max 3 stacked at once

### Notification Center (Dropdown)
- Opens when clicking the bell icon
- Shows last 50 notifications
- Grouped by: Today, Yesterday, This Week, Older
- Unread indicator (blue dot)
- Mark all as read button
- Clear all button
- Scrollable list

### Bell Icon Badge
- Shows unread count
- Red background
- Pulses when new notification arrives
- Displays "99+" for counts over 99

## Common Use Cases

### 1. Success Message

```tsx
addNotification({
  type: 'success',
  title: 'Export Complete',
  message: 'Your data has been exported successfully.',
  actionUrl: '/downloads',
  actionLabel: 'View Downloads',
});
```

### 2. Error Alert

```tsx
addNotification({
  type: 'error',
  title: 'Upload Failed',
  message: 'Failed to upload file. Please try again.',
  actionUrl: '/uploads',
  actionLabel: 'Retry',
});
```

### 3. Warning

```tsx
addNotification({
  type: 'warning',
  title: 'Storage Full',
  message: 'You have used 95% of your storage quota.',
  actionUrl: '/storage',
  actionLabel: 'Manage Storage',
});
```

### 4. Information

```tsx
addNotification({
  type: 'info',
  title: 'New Feature',
  message: 'Check out our new AI analytics dashboard.',
  actionUrl: '/analytics',
  actionLabel: 'Explore Now',
});
```

## Server-Side Integration

### Node.js + Socket.IO

```javascript
const io = require('socket.io')(3002);

io.on('connection', (socket) => {
  // Send notification to specific user
  socket.emit('notification', {
    type: 'success',
    title: 'Welcome!',
    message: 'You are now connected.',
  });

  // Broadcast to all users
  io.emit('notification:info', {
    title: 'System Update',
    message: 'The system will be updated in 10 minutes.',
  });
});
```

### Python + python-socketio

```python
import socketio

sio = socketio.Server(cors_allowed_origins='*')

@sio.event
def connect(sid, environ):
    sio.emit('notification', {
        'type': 'success',
        'title': 'Connected',
        'message': 'Real-time notifications active'
    }, room=sid)
```

## Configuration

### Change WebSocket URL

Edit `.env.local`:

```env
NEXT_PUBLIC_WS_URL=ws://your-server.com:3002
```

### Disable WebSocket (Use Only Manual Notifications)

The system works without WebSocket. Just use the `addNotification` function directly.

## Troubleshooting

### No Notifications Appearing

1. Check browser console for errors
2. Verify the notification store is initialized
3. Check that topbar.tsx is rendered

### WebSocket Not Connecting

1. Verify `NEXT_PUBLIC_WS_URL` is set
2. Check WebSocket server is running
3. Check CORS settings
4. Look for errors in browser console

### Dark Mode Issues

1. Make sure `useAppStore` dark mode is working
2. Check Tailwind dark mode is configured
3. Verify dark: classes are present

## Testing Checklist

- [ ] Toast notifications appear in bottom-right
- [ ] Toast auto-dismisses after 5 seconds
- [ ] Multiple toasts stack properly
- [ ] Bell icon shows unread count
- [ ] Badge pulses on new notification
- [ ] Notification center opens on bell click
- [ ] Notifications grouped by date
- [ ] Mark as read works
- [ ] Mark all as read works
- [ ] Clear all works
- [ ] Action URLs navigate correctly
- [ ] Dark mode works
- [ ] WebSocket connects (if server running)
- [ ] Browser notifications appear (with permission)
- [ ] Notifications persist after page reload

## Next Steps

1. Read the full [NOTIFICATIONS_SYSTEM_README.md](./NOTIFICATIONS_SYSTEM_README.md)
2. Set up your WebSocket notification server
3. Integrate notifications into your backend
4. Customize notification types and styles
5. Add notification preferences/settings

## Support

For issues or questions, check:
- Full documentation in NOTIFICATIONS_SYSTEM_README.md
- Example server code in notification-server-example.js
- Demo component in src/components/notifications/NotificationDemo.tsx

---

**Enjoy your new real-time notification system!** 🎉
