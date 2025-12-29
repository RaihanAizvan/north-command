import mongoose, { Schema } from 'mongoose';

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_STATUS_CHANGED';

export interface INotification {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  taskId?: mongoose.Types.ObjectId | null;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['TASK_ASSIGNED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED'],
      index: true,
    },
    message: { type: String, required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', default: null, index: true },
    readAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
