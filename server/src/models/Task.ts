import mongoose, { Schema } from 'mongoose';

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ITask {
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: Date | null;

  assigneeUserId?: mongoose.Types.ObjectId | null;

  createdByUserId: mongoose.Types.ObjectId;
  updatedByUserId: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, index: true },
    description: { type: String, default: null },
    status: { type: String, required: true, enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED'], default: 'OPEN', index: true },
    priority: { type: String, required: true, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM', index: true },
    dueAt: { type: Date, default: null, index: true },

    assigneeUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    createdByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    updatedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>('Task', TaskSchema);
