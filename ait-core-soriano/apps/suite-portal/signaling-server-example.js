/**
 * Example WebRTC Signaling Server
 *
 * This is a simple signaling server for the WebRTC video call system.
 * It uses Socket.IO to handle WebSocket connections and message routing.
 *
 * To run this server:
 * 1. Install dependencies: npm install socket.io
 * 2. Run: node signaling-server-example.js
 * 3. Server will listen on ws://localhost:1234/signaling
 */

const { Server } = require('socket.io');

const PORT = 1234;
const PATH = '/signaling';

// Create Socket.IO server
const io = new Server(PORT, {
  path: PATH,
  cors: {
    origin: '*', // Allow all origins (configure this properly in production)
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

// Store connected users and their rooms
const users = new Map(); // userId -> { socketId, userName, rooms: Set }
const rooms = new Map(); // roomId -> Set of userIds

console.log(`🚀 WebRTC Signaling Server started on ws://localhost:${PORT}${PATH}`);
console.log('📡 Waiting for connections...\n');

io.on('connection', (socket) => {
  const { userId, userName } = socket.handshake.query;

  if (!userId || !userName) {
    console.error('❌ Connection rejected: Missing userId or userName');
    socket.disconnect();
    return;
  }

  // Store user info
  users.set(userId, {
    socketId: socket.id,
    userName,
    rooms: new Set(),
  });

  console.log(`✅ User connected: ${userName} (${userId})`);
  console.log(`   Socket ID: ${socket.id}`);
  console.log(`   Total users: ${users.size}\n`);

  /**
   * Join a room
   */
  socket.on('join-room', ({ room }) => {
    if (!room) {
      console.error('❌ Join room failed: Missing room ID');
      return;
    }

    socket.join(room);

    const userInfo = users.get(userId);
    if (userInfo) {
      userInfo.rooms.add(room);
    }

    if (!rooms.has(room)) {
      rooms.set(room, new Set());
    }
    rooms.get(room).add(userId);

    console.log(`📥 ${userName} joined room: ${room}`);
    console.log(`   Room participants: ${rooms.get(room).size}\n`);

    // Notify other users in the room
    socket.to(room).emit('user-joined', { userId, userName });
  });

  /**
   * Leave a room
   */
  socket.on('leave-room', ({ room }) => {
    if (!room) return;

    socket.leave(room);

    const userInfo = users.get(userId);
    if (userInfo) {
      userInfo.rooms.delete(room);
    }

    if (rooms.has(room)) {
      rooms.get(room).delete(userId);
      if (rooms.get(room).size === 0) {
        rooms.delete(room);
      }
    }

    console.log(`📤 ${userName} left room: ${room}\n`);

    // Notify other users in the room
    socket.to(room).emit('user-left', { userId });
  });

  /**
   * Forward signaling messages
   */
  socket.on('signal', (message) => {
    const { type, to, room, data } = message;

    console.log(`📡 Signal received: ${type}`);
    console.log(`   From: ${userName} (${userId})`);
    console.log(`   To: ${to || 'room'}`);
    console.log(`   Room: ${room || 'N/A'}\n`);

    // Send to specific user
    if (to) {
      const targetUser = users.get(to);
      if (targetUser) {
        io.to(targetUser.socketId).emit('signal', {
          ...message,
          from: userId,
        });
      } else {
        console.warn(`⚠️  Target user not found: ${to}\n`);
      }
    }
    // Broadcast to room
    else if (room) {
      socket.to(room).emit('signal', {
        ...message,
        from: userId,
      });
    }
  });

  /**
   * Call request (direct call to another user)
   */
  socket.on('call-request', ({ to, from, fromName }) => {
    console.log(`📞 Call request from ${fromName} (${from}) to ${to}\n`);

    const targetUser = users.get(to);
    if (targetUser) {
      io.to(targetUser.socketId).emit('call-request', {
        from: from || userId,
        fromName: fromName || userName,
      });
    } else {
      console.warn(`⚠️  Target user not found: ${to}\n`);
      socket.emit('error', { message: 'User not found' });
    }
  });

  /**
   * Call accepted
   */
  socket.on('call-accepted', ({ to, from }) => {
    console.log(`✅ Call accepted by ${userName} (${from || userId})\n`);

    const targetUser = users.get(to);
    if (targetUser) {
      io.to(targetUser.socketId).emit('call-accepted', {
        from: from || userId,
      });
    }
  });

  /**
   * Call declined
   */
  socket.on('call-declined', ({ to, from }) => {
    console.log(`❌ Call declined by ${userName} (${from || userId})\n`);

    const targetUser = users.get(to);
    if (targetUser) {
      io.to(targetUser.socketId).emit('call-declined', {
        from: from || userId,
      });
    }
  });

  /**
   * Handle disconnection
   */
  socket.on('disconnect', (reason) => {
    console.log(`❌ User disconnected: ${userName} (${userId})`);
    console.log(`   Reason: ${reason}`);

    const userInfo = users.get(userId);
    if (userInfo) {
      // Notify all rooms the user was in
      userInfo.rooms.forEach((room) => {
        socket.to(room).emit('user-left', { userId });

        if (rooms.has(room)) {
          rooms.get(room).delete(userId);
          if (rooms.get(room).size === 0) {
            rooms.delete(room);
          }
        }
      });
    }

    users.delete(userId);
    console.log(`   Total users: ${users.size}\n`);
  });

  /**
   * Handle errors
   */
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${userName}:`, error);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down signaling server...');
  io.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down signaling server...');
  io.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Log server stats periodically
setInterval(() => {
  console.log('📊 Server Stats:');
  console.log(`   Connected users: ${users.size}`);
  console.log(`   Active rooms: ${rooms.size}`);
  console.log(`   Total sockets: ${io.sockets.sockets.size}\n`);
}, 60000); // Every minute
