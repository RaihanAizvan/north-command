import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthPayload } from '../middleware/auth.js';

export type AppIo = Server;

export function createIo(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = (socket.handshake.auth?.token as string | undefined) ?? '';
      if (!token) return next(new Error('unauthorized'));
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      (socket.data as any).auth = payload;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    const auth = (socket.data as any).auth as AuthPayload;

    if (auth.role === 'OVERSEER') {
      socket.join('overseer');
    }

    // User-scoped room for notifications & assigned tasks.
    socket.join(`user:${auth.sub}`);

    // Simple chat relay: overseer <-> individual elves (by userId)
    socket.on('chat:typing', (payload: { toUserId?: string }) => {
      const toUserId = (payload?.toUserId ?? '').toString();
      if (!toUserId) return;
      io.to(`user:${toUserId}`).emit('chat:typing', { fromUserId: auth.sub });
    });

    // chat:send is kept for backward compatibility, but messages are persisted+emitted via REST (/api/chat/dm/:userId).
    // To prevent duplicate delivery, this now only emits a 'chat:unsupported' signal.
    socket.on('chat:send', async () => {
      socket.emit('chat:unsupported', { message: 'Use REST /api/chat/dm/:userId' });
    });
  });

  return io;
}
