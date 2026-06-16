import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PORT = 3003;

const io = new Server({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins with their ID
  socket.on('user-connect', async (userId: string) => {
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    // Update user online status
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen: new Date() },
    });

    // Broadcast to all that user is online
    io.emit('user-online', { userId, socketId: socket.id });

    // Send list of online users to connected user
    const users = await prisma.user.findMany({
      where: { isOnline: true, id: { not: userId } },
      select: { id: true, name: true },
    });

    socket.emit('online-users', users);
  });

  // Typing indicators
  socket.on('typing-start', (data: { conversationId: string; senderId: string; senderName: string }) => {
    const { conversationId, senderId, senderName } = data;
    socket.to(`conversation:${conversationId}`).emit('user-typing', {
      senderId,
      senderName,
    });
  });

  socket.on('typing-stop', (data: { conversationId: string; senderId: string }) => {
    const { conversationId, senderId } = data;
    socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', { senderId });
  });

  // Join conversation room
  socket.on('join-conversation', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
  });

  // Leave conversation room
  socket.on('leave-conversation', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // New message
  socket.on('new-message', (data: any) => {
    io.to(`conversation:${data.conversationId}`).emit('receive-message', data);
  });

  // Message read
  socket.on('message-read', (data: { conversationId: string; userId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit('messages-read', data);
  });

  // Notification
  socket.on('send-notification', (data: { userId: string; notification: any }) => {
    io.to(`user:${data.userId}`).emit('notification', data.notification);
  });

  // Disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);

    // Find user by socketId and update status
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);

        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false, lastSeen: new Date() },
        });

        io.emit('user-offline', { userId });
        break;
      }
    }
  });
});

io.listen(PORT);
console.log(`Socket.IO server running on port ${PORT}`);