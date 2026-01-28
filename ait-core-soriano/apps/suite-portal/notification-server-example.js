/**
 * Example WebSocket Notification Server
 *
 * Run this server to test real-time notifications:
 * node notification-server-example.js
 *
 * Requirements:
 * npm install socket.io
 */

const { Server } = require('socket.io');

const io = new Server(3002, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

console.log('🚀 Notification WebSocket Server running on port 3002');

// Track connected clients
let connectedClients = 0;

io.on('connection', (socket) => {
  connectedClients++;
  console.log(`✅ Client connected: ${socket.id} (Total: ${connectedClients})`);

  // Send welcome notification
  socket.emit('notification:success', {
    title: 'Connected!',
    message: 'You are now connected to real-time notifications.',
  });

  // Example: Send periodic info notifications
  const infoInterval = setInterval(() => {
    socket.emit('notification:info', {
      title: 'System Info',
      message: `Server time: ${new Date().toLocaleTimeString()}`,
    });
  }, 30000); // Every 30 seconds

  // Example: Handle custom events from client
  socket.on('request-notification', (data) => {
    console.log('📨 Client requested notification:', data);

    socket.emit('notification', {
      type: data.type || 'info',
      title: data.title || 'Custom Notification',
      message: data.message || 'This is a custom notification from the server.',
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
    });
  });

  // Clean up on disconnect
  socket.on('disconnect', (reason) => {
    connectedClients--;
    console.log(`❌ Client disconnected: ${socket.id} (Reason: ${reason}, Total: ${connectedClients})`);
    clearInterval(infoInterval);
  });
});

// Example: Send broadcast notifications
setInterval(() => {
  const notifications = [
    {
      type: 'success',
      title: 'Task Completed',
      message: 'A background task has been completed successfully.',
      actionUrl: '/tasks',
      actionLabel: 'View Tasks',
    },
    {
      type: 'warning',
      title: 'Storage Warning',
      message: 'You are using 85% of your storage quota.',
      actionUrl: '/storage',
      actionLabel: 'Manage Storage',
    },
    {
      type: 'info',
      title: 'New Feature',
      message: 'Check out our new AI-powered analytics dashboard.',
      actionUrl: '/analytics',
      actionLabel: 'Explore',
    },
  ];

  const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];

  io.emit('notification', randomNotification);
  console.log('📢 Broadcast notification sent:', randomNotification.title);
}, 60000); // Every minute

// Example: Send error notification
setTimeout(() => {
  io.emit('notification:error', {
    title: 'System Error',
    message: 'Failed to connect to external service. Retrying...',
    actionUrl: '/settings',
    actionLabel: 'Check Settings',
  });
  console.log('⚠️ Error notification sent to all clients');
}, 10000); // After 10 seconds

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down notification server...');
  io.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
