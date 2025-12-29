import type { AppIo } from './socket.js';
import type { INotification } from '../models/Notification.js';
import { Task } from '../models/Task.js';

export function createRealtimeBroadcaster(io: AppIo) {
  return {
    async emitChatMessage(msg: { _id: string; fromUserId: string; toUserId: string; message: string; createdAt: Date | string }) {
      // Emit only to the two participants' user rooms to avoid duplicate delivery
      // (overseer sockets are usually in both user:<id> and overseer rooms).
      io.to(`user:${msg.toUserId}`).emit('chat:msg', { ...msg, self: false });
      io.to(`user:${msg.fromUserId}`).emit('chat:msg', { ...msg, self: true });
    },
    async emitTaskUpdate(taskId: string, payload?: { task: any; deleted?: boolean }) {
      const task = payload?.task ?? (await Task.findById(taskId).lean());
      // Broadcast to Santa (org admin) and to the assignee's user room.
      io.to('overseer').emit('task:update', { task, deleted: payload?.deleted ?? false });
      if (task?.assigneeUserId) {
        io.to(`user:${task.assigneeUserId.toString()}`).emit('task:update', { task, deleted: payload?.deleted ?? false });
      }
    },

    async emitNotificationNew(userId: string, notification: INotification) {
      io.to(`user:${userId}`).emit('notification:new', { notification });
      // Santa also receives notifications for coordination
      io.to('overseer').emit('notification:new', { notification });
    },
  };
}
