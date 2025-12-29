import mongoose from 'mongoose';
import { Notification, type NotificationType } from '../models/Notification.js';
import { Task } from '../models/Task.js';
import { realtime } from '../index.js';

export async function emitTask(taskId: string, extra?: { deleted?: boolean }) {
  const task = await Task.findById(taskId).lean();
  await realtime?.emitTaskUpdate(taskId, { task, deleted: extra?.deleted ?? false });
}

export async function createAndEmitNotification(args: {
  userId: string;
  type: NotificationType;
  message: string;
  taskId?: string | null;
}) {
  const userObjectId = new mongoose.Types.ObjectId(args.userId);
  const taskObjectId = args.taskId ? new mongoose.Types.ObjectId(args.taskId) : null;

  const n = await Notification.create({
    userId: userObjectId,
    type: args.type,
    message: args.message,
    taskId: taskObjectId,
    readAt: null,
  });

  await realtime?.emitNotificationNew(args.userId, n.toObject());
  return n;
}
