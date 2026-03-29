import { Server } from 'socket.io';
import config from './env.js';

let io;
const userSocketMap = new Map();

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap.set(userId, socket.id);
    }

    socket.on('disconnect', () => {
      if (userId) {
        userSocketMap.delete(userId);
      }
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function getUserSocket(userId) {
  return userSocketMap.get(userId);
}

export function emitToUser(userId, event, data) {
  const socketId = userSocketMap.get(userId);
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
}
