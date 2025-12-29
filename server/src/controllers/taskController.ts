import mongoose from 'mongoose';
import { z } from 'zod';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { HttpError, forbidden, notFound } from '../utils/httpError.js';
import { createAndEmitNotification, emitTask } from './taskRealtime.js';

const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueAt: z.string().datetime().optional(),
  assigneeUserId: z.string().optional().nullable(),
});

const taskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  assigneeUserId: z.string().optional().nullable(),
});

export async function listTasks(_req: any, res: any) {
  const tasks = await Task.find({}).sort({ updatedAt: -1 }).lean();
  res.json(tasks);
}

export async function createTask(req: any, res: any) {
  const input = taskCreateSchema.parse(req.body);
  const userId = req.auth?.sub;
  if (!userId) throw new HttpError(401, 'Unauthorized');

  const assigneeUserId = input.assigneeUserId ?? null;
  if (assigneeUserId && !mongoose.isValidObjectId(assigneeUserId)) throw new HttpError(400, 'Invalid assigneeUserId');
  const assigneeObjectId = assigneeUserId ? new mongoose.Types.ObjectId(assigneeUserId) : null;

  const dueAt = input.dueAt ? new Date(input.dueAt) : null;

  const task = await Task.create({
    title: input.title,
    description: input.description ?? null,
    priority: input.priority ?? 'MEDIUM',
    status: 'OPEN',
    dueAt,
    assigneeUserId: assigneeObjectId,
    createdByUserId: userId,
    updatedByUserId: userId,
  });

  if (assigneeUserId) {
    await createAndEmitNotification({
      userId: assigneeUserId,
      type: 'TASK_ASSIGNED',
      taskId: task._id.toString(),
      message: `New task assigned: ${task.title}`,
    });
  }

  await emitTask(task._id.toString());
  res.status(201).json(task.toObject());
}

export async function updateTask(req: any, res: any) {
  const input = taskUpdateSchema.parse(req.body);
  const taskId = req.params.taskId as string;
  const userId = req.auth?.sub;
  if (!userId) throw new HttpError(401, 'Unauthorized');

  const task = await Task.findById(taskId);
  if (!task) throw notFound('Task not found');

  const previousAssignee = task.assigneeUserId?.toString() ?? null;

  if (input.title !== undefined) task.title = input.title;
  if (input.description !== undefined) task.description = input.description ?? null;
  if (input.priority !== undefined) task.priority = input.priority;
  if (input.status !== undefined) task.status = input.status;
  if (input.dueAt !== undefined) task.dueAt = input.dueAt ? new Date(input.dueAt) : null;
  if (input.assigneeUserId !== undefined) {
    if (input.assigneeUserId && !mongoose.isValidObjectId(input.assigneeUserId)) throw new HttpError(400, 'Invalid assigneeUserId');
    task.assigneeUserId = input.assigneeUserId ? new mongoose.Types.ObjectId(input.assigneeUserId) : null;
  }

  task.updatedByUserId = userId;
  await task.save();

  const currentAssignee = task.assigneeUserId?.toString() ?? null;

  // Notifications
  if (currentAssignee && currentAssignee !== previousAssignee) {
    await createAndEmitNotification({
      userId: currentAssignee,
      type: 'TASK_ASSIGNED',
      taskId: task._id.toString(),
      message: `Task assigned to you: ${task.title}`,
    });
  }

  // Notify previous assignee about changes as well (if still relevant)
  const impactedUsers = new Set<string>();
  if (previousAssignee) impactedUsers.add(previousAssignee);
  if (currentAssignee) impactedUsers.add(currentAssignee);

  await Promise.all(
    Array.from(impactedUsers).map((uid) =>
      createAndEmitNotification({
        userId: uid,
        type: input.status ? 'TASK_STATUS_CHANGED' : 'TASK_UPDATED',
        taskId: task._id.toString(),
        message: input.status ? `Task status changed to ${task.status}: ${task.title}` : `Task updated: ${task.title}`,
      })
    )
  );

  await emitTask(task._id.toString());
  res.json(task.toObject());
}

export async function deleteTask(req: any, res: any) {
  const taskId = req.params.taskId as string;
  const task = await Task.findById(taskId);
  if (!task) throw notFound('Task not found');

  const assignee = task.assigneeUserId?.toString() ?? null;
  await task.deleteOne();

  if (assignee) {
    await createAndEmitNotification({
      userId: assignee,
      type: 'TASK_UPDATED',
      taskId,
      message: `Task deleted: ${task.title}`,
    });
  }

  // Deletion: emit a special payload so clients can remove it.
  await emitTask(taskId, { deleted: true });
  res.status(204).send();
}

export async function listElves(_req: any, res: any) {
  const users = await User.find({ role: 'FIELD_AGENT' }).sort({ username: 1 }).select({ username: 1, role: 1 }).lean();
  res.json(users);
}

const myStatusSchema = z.object({ status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']) });

export async function listMyTasks(req: any, res: any) {
  const userId = req.auth?.sub;
  if (!userId) throw new HttpError(401, 'Unauthorized');
  const tasks = await Task.find({ assigneeUserId: userId }).sort({ updatedAt: -1 }).lean();
  res.json(tasks);
}

export async function updateMyTaskStatus(req: any, res: any) {
  const userId = req.auth?.sub;
  if (!userId) throw new HttpError(401, 'Unauthorized');

  const input = myStatusSchema.parse(req.body);
  const task = await Task.findById(req.params.taskId);
  if (!task) throw notFound('Task not found');

  if ((task.assigneeUserId?.toString() ?? null) !== userId) throw forbidden();

  task.status = input.status;
  task.updatedByUserId = userId;
  await task.save();

  // Notify overseer + assignee (same user) via realtime & notifications
  await createAndEmitNotification({
    userId,
    type: 'TASK_STATUS_CHANGED',
    taskId: task._id.toString(),
    message: `Status updated to ${task.status}: ${task.title}`,
  });

  await emitTask(task._id.toString());
  res.json(task.toObject());
}
