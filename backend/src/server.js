const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const storyRoutes = require('./routes/storyRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const searchRoutes = require('./routes/searchRoutes');
const reelRoutes = require('./routes/reelRoutes');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://socialsphere-fdzq.onrender.com',
  'https://socialsphere-frontend.onrender.com',
  'https://socialsphere-backend.onrender.com'
];

// CORS middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log('Blocked origin:', origin);
      // For production, you might want to allow all origins temporarily
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Global variables for socket access
global.io = io;
global.onlineUsers = new Map();

const onlineUsers = global.onlineUsers;

io.on('connection', (socket) => {
  console.log('🔵 New client:', socket.id);

  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
    global.onlineUsers = onlineUsers;
    console.log(`📌 User ${userId} online`);
  });

  socket.on('send_message', (data) => {
    const { receiverId, message } = data;
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('receive_message', message);
      console.log(`✅ Message sent to ${receiverId}`);
    }
  });

  socket.on('delete_message', (data) => {
    const { receiverId, chatId, messageId, deleteForEveryone } = data;
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('message_deleted', {
        chatId,
        messageId,
        deleteForEveryone
      });
      console.log(`🗑️ Message deleted for ${receiverId}`);
    }
  });

  // 📞 CALL EVENTS
  socket.on('start_call', (data) => {
    const { callerId, callerName, receiverId, callType } = data;
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('incoming_call', { callerId, callerName, callType });
      console.log(`📞 Call from ${callerName} to ${receiverId}`);
    }
  });

  socket.on('accept_call', (data) => {
    const { callerId, receiverId, receiverName } = data;
    const callerSocket = onlineUsers.get(callerId);
    if (callerSocket) {
      io.to(callerSocket).emit('call_accepted', { receiverId, receiverName });
      console.log(`✅ Call accepted by ${receiverName}`);
    }
  });

  socket.on('reject_call', (data) => {
    const { callerId, receiverId } = data;
    const callerSocket = onlineUsers.get(callerId);
    if (callerSocket) {
      io.to(callerSocket).emit('call_rejected', { receiverId });
      console.log(`❌ Call rejected`);
    }
  });

  socket.on('end_call', (data) => {
    const { receiverId } = data;
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('call_ended', {});
      console.log(`🔴 Call ended`);
    }
  });

  socket.on('send_peer_id', (data) => {
    const { receiverId, peerId, callerId } = data;
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('receive_peer_id', { peerId, callerId });
    }
  });

  // 🔔 NOTIFICATION SOCKET
  socket.on('send_notification', (data) => {
    const { receiverId, notification } = data;
    const receiverSocket = onlineUsers.get(receiverId);
    if (receiverSocket) {
      io.to(receiverSocket).emit('new_notification', notification);
      console.log(`🔔 Notification sent to ${receiverId}`);
    }
  });

  socket.on('disconnect', () => {
    let disconnectedUser = null;
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUser = userId;
        onlineUsers.delete(userId);
        global.onlineUsers = onlineUsers;
        break;
      }
    }
    if (disconnectedUser) {
      console.log(`🔴 User ${disconnectedUser} disconnected`);
    }
  });
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reels', reelRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Social Media API is running...' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});