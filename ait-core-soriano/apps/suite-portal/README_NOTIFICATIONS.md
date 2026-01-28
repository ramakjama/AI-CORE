# 🔔 Real-Time Notifications System

> **Complete notification system for AIT-CORE Suite Portal with WebSocket support, toast notifications, and notification center.**

---

## Quick Links

- 📖 [Full Documentation](./NOTIFICATIONS_SYSTEM_README.md)
- ⚡ [Quick Start Guide](./NOTIFICATIONS_QUICK_START.md)
- 🏗️ [Architecture Overview](./NOTIFICATIONS_ARCHITECTURE.md)
- 📋 [Implementation Summary](./NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md)
- ✅ [Testing Checklist](./NOTIFICATIONS_CHECKLIST.md)
- 🎨 [Visual Guide](./NOTIFICATIONS_VISUAL_GUIDE.md)

---

## What's Included?

### ✨ Features

- ✅ **Real-time notifications** via WebSocket (Socket.IO)
- ✅ **Toast notifications** that auto-dismiss
- ✅ **Notification center** with grouped history
- ✅ **Unread count badge** with pulse animation
- ✅ **4 notification types** (info, success, warning, error)
- ✅ **Dark mode support**
- ✅ **TypeScript** with full type safety
- ✅ **Persistent storage** (localStorage)
- ✅ **Browser notifications** (optional)
- ✅ **Action URLs** for clickable notifications

### 📁 Files Created

```
Core System:
├── src/store/notifications.store.ts          State management
├── src/lib/notifications/notification-manager.ts  WebSocket manager
├── src/hooks/use-notifications.ts            React hook
├── src/types/notifications.types.ts          TypeScript types

UI Components:
├── src/components/notifications/NotificationToast.tsx     Toast UI
├── src/components/notifications/NotificationCenter.tsx    Center UI
├── src/components/notifications/NotificationDemo.tsx      Testing

Updated:
└── src/components/layout/topbar.tsx          Integrated system

Example:
└── notification-server-example.js            Test server
```

---

## 🚀 Quick Start (30 seconds)

### 1. Use in Your Component

```tsx
import { useNotifications } from '@/hooks/use-notifications';

function MyComponent() {
  const { addNotification } = useNotifications();

  const handleSuccess = () => {
    addNotification({
      type: 'success',
      title: 'Task Completed',
      message: 'Your export has finished successfully.',
      actionUrl: '/tasks',
      actionLabel: 'View Tasks',
    });
  };

  return <button onClick={handleSuccess}>Complete Task</button>;
}
```

### 2. Test with Demo Component

```tsx
import { NotificationDemo } from '@/components/notifications/NotificationDemo';

export default function Page() {
  return <NotificationDemo />;
}
```

### 3. Run Example Server (Optional)

```bash
node notification-server-example.js
```

---

## 📊 Visual Overview

### Bell Icon with Badge
```
Topbar:  [...] 🔔(3) 🌙 👤
                ↑ Badge shows unread count
```

### Toast Notifications (Bottom-Right)
```
┌─────────────────────────────┐
│ ✓ Task Completed         [X]│
│ Your export has finished.   │
│ [View Tasks →]             │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░      │
└─────────────────────────────┘
```

### Notification Center (Dropdown)
```
┌──────────────────────────────┐
│ 🔔 Notifications    [✓✓] [🗑️] │
├──────────────────────────────┤
│ TODAY                        │
├──────────────────────────────┤
│ ✓ Task Completed          ●  │
│ 2 minutes ago                │
├──────────────────────────────┤
│ YESTERDAY                    │
├──────────────────────────────┤
│ ℹ New Feature                │
│ Yesterday at 3:45 PM         │
└──────────────────────────────┘
```

---

## 🎯 Notification Types

### Success (Green)
```tsx
addNotification({
  type: 'success',
  title: 'Export Complete',
  message: 'Your data has been exported.',
});
```

### Error (Red)
```tsx
addNotification({
  type: 'error',
  title: 'Upload Failed',
  message: 'Failed to upload file.',
});
```

### Warning (Yellow)
```tsx
addNotification({
  type: 'warning',
  title: 'Storage Full',
  message: "You're at 95% capacity.",
});
```

### Info (Blue)
```tsx
addNotification({
  type: 'info',
  title: 'New Feature',
  message: 'Check out our AI analytics.',
});
```

---

## 🔌 WebSocket Integration

### Client Setup (Already Done)

The notification manager automatically connects to WebSocket when imported.

```env
# .env.local
NEXT_PUBLIC_WS_URL=ws://localhost:3002
```

### Server Events

```javascript
// Send notification to client
socket.emit('notification', {
  type: 'success',
  title: 'Welcome',
  message: 'You are now connected.',
});

// Broadcast to all clients
io.emit('notification:info', {
  title: 'System Update',
  message: 'Maintenance in 10 minutes.',
});
```

---

## 🎨 UI Components

### NotificationToast
- Appears in bottom-right corner
- Auto-dismisses after 5 seconds
- Progress bar shows time remaining
- Click to navigate to action URL
- Max 3 visible at once

### NotificationCenter
- Opens from bell icon
- Shows last 50 notifications
- Grouped by date (Today, Yesterday, etc.)
- Mark as read / Mark all as read
- Clear all notifications
- Scrollable list

### NotificationDemo
- Testing component for developers
- Buttons to test all notification types
- Shows WebSocket connection status
- Quick way to verify system works

---

## 📚 API Reference

### useNotifications Hook

```typescript
const {
  notifications,        // Notification[] - All notifications
  unreadCount,         // number - Count of unread
  markAsRead,          // (id: string) => void
  markAllAsRead,       // () => void
  clearAll,            // () => void
  removeNotification,  // (id: string) => void
  addNotification,     // (notification) => void
  isConnected,         // boolean - WebSocket status
} = useNotifications();
```

### Notification Interface

```typescript
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}
```

---

## 🔧 Configuration

### Environment Variables

```env
# WebSocket server URL (optional, defaults to ws://localhost:3002)
NEXT_PUBLIC_WS_URL=ws://your-server.com:3002
```

### Customization

- **Auto-dismiss duration**: `NotificationToast.tsx` line 95
- **Max stored notifications**: `notifications.store.ts` line 36
- **Max visible toasts**: `NotificationToast.tsx` line 171
- **Toast position**: `NotificationToast.tsx` line 96

---

## 🧪 Testing

### Manual Testing

1. Add `<NotificationDemo />` to any page
2. Click test buttons to see notifications
3. Check bell icon for unread count
4. Open notification center
5. Test mark as read, clear all, etc.

### With Test Server

```bash
# Install socket.io if not installed
npm install socket.io

# Run example server
node notification-server-example.js

# Server sends test notifications automatically
```

### Testing Checklist

See [NOTIFICATIONS_CHECKLIST.md](./NOTIFICATIONS_CHECKLIST.md) for complete testing checklist.

---

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ All modern browsers with WebSocket support

---

## 📦 Dependencies

All required dependencies are already in `package.json`:

- `socket.io-client@^4.7.5` - WebSocket client
- `zustand@^4.5.2` - State management
- `framer-motion@^11.1.7` - Animations
- `@radix-ui/react-*` - UI components
- `date-fns@^3.6.0` - Date formatting
- `lucide-react@^0.376.0` - Icons

No additional installation needed!

---

## 🎓 Examples

### Example 1: Simple Success Message

```tsx
import { useNotifications } from '@/hooks/use-notifications';

function ExportButton() {
  const { addNotification } = useNotifications();

  const handleExport = async () => {
    try {
      await exportData();
      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'Your data has been exported successfully.',
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export data. Please try again.',
      });
    }
  };

  return <button onClick={handleExport}>Export Data</button>;
}
```

### Example 2: Notification with Action

```tsx
addNotification({
  type: 'info',
  title: 'New Message',
  message: 'You have a new message from John Doe.',
  actionUrl: '/messages/123',
  actionLabel: 'View Message',
});
```

### Example 3: Server-Side (Node.js)

```javascript
const io = require('socket.io')(3002);

io.on('connection', (socket) => {
  // Send to specific user
  socket.emit('notification:success', {
    title: 'Welcome Back',
    message: 'Good to see you again!',
  });

  // Broadcast to all users
  io.emit('notification:warning', {
    title: 'Maintenance Alert',
    message: 'System maintenance in 10 minutes.',
  });
});
```

---

## 🐛 Troubleshooting

### Issue: Notifications not appearing
- Check browser console for errors
- Verify `useNotifications` hook is being used
- Ensure topbar is rendered

### Issue: WebSocket not connecting
- Check `NEXT_PUBLIC_WS_URL` environment variable
- Verify WebSocket server is running
- Check CORS settings on server

### Issue: Dark mode issues
- Verify Tailwind dark mode is configured
- Check that dark: classes are present

---

## 📖 Documentation Files

| File | Description |
|------|-------------|
| **README_NOTIFICATIONS.md** | This file - Overview and quick reference |
| **NOTIFICATIONS_SYSTEM_README.md** | Complete documentation (10KB) |
| **NOTIFICATIONS_QUICK_START.md** | 5-minute setup guide (6KB) |
| **NOTIFICATIONS_ARCHITECTURE.md** | System architecture diagrams (20KB) |
| **NOTIFICATIONS_IMPLEMENTATION_SUMMARY.md** | Implementation details (12KB) |
| **NOTIFICATIONS_CHECKLIST.md** | Testing checklist (7KB) |
| **NOTIFICATIONS_VISUAL_GUIDE.md** | Visual UI guide (11KB) |

---

## 🚀 Production Ready

The notification system is:
- ✅ Fully typed with TypeScript
- ✅ Tested and working
- ✅ Well documented
- ✅ Accessible (WCAG AA)
- ✅ Performant
- ✅ Secure
- ✅ Ready to deploy

---

## 🎯 Next Steps

1. **Test the system**: Add `<NotificationDemo />` to a page
2. **Integrate in your app**: Use `useNotifications()` hook
3. **Set up WebSocket server**: Use example or your own
4. **Customize styling**: Adjust colors, timing, etc.
5. **Deploy to production**: Set environment variables

---

## 📞 Support

For questions or issues:
1. Check the documentation files
2. Review the example code
3. Test with `NotificationDemo` component
4. Check the troubleshooting section

---

## 📝 Summary

You now have a complete, production-ready notification system with:

- 🔔 Real-time WebSocket notifications
- 🎨 Beautiful toast and dropdown UI
- 🌙 Full dark mode support
- 📱 Responsive design
- ♿ Accessibility features
- 📚 Comprehensive documentation
- 🧪 Testing tools included
- 🚀 Ready to use immediately

**Start using it now with just 3 lines of code:**

```tsx
const { addNotification } = useNotifications();
addNotification({ type: 'success', title: 'Hello', message: 'It works!' });
```

---

**Version**: 1.0.0
**Date**: 2026-01-28
**Status**: ✅ Production Ready

**Enjoy your new notification system!** 🎉
