import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { HttpError, notFound } from '../utils/httpError.js';

export async function getAnalytics(_req: any, res: any) {
  const [total, open, inProgress, completed] = await Promise.all([
    Task.countDocuments(),
    Task.countDocuments({ status: 'OPEN' }),
    Task.countDocuments({ status: 'IN_PROGRESS' }),
    Task.countDocuments({ status: 'COMPLETED' }),
  ]);

  const perElfOpen = await Task.aggregate([
    { $match: { status: { $ne: 'COMPLETED' }, assigneeUserId: { $ne: null } } },
    { $group: { _id: '$assigneeUserId', openCount: { $sum: 1 } } },
    { $sort: { openCount: -1 } },
  ]);

  const perElfDone = await Task.aggregate([
    { $match: { status: 'COMPLETED', assigneeUserId: { $ne: null } } },
    { $group: { _id: '$assigneeUserId', doneCount: { $sum: 1 } } },
    { $sort: { doneCount: -1 } },
  ]);

  const users = await User.find({ role: 'FIELD_AGENT' }).select({ username: 1 }).lean();
  const map = new Map<string, { userId: string; username: string; openCount: number; doneCount: number }>();
  users.forEach((u) =>
    map.set(u._id.toString(), { userId: u._id.toString(), username: u.username, openCount: 0, doneCount: 0 })
  );

  perElfOpen.forEach((row) => {
    const id = row._id?.toString();
    if (id && map.has(id)) map.set(id, { ...(map.get(id) as any), openCount: row.openCount });
  });

  perElfDone.forEach((row) => {
    const id = row._id?.toString();
    if (id && map.has(id)) map.set(id, { ...(map.get(id) as any), doneCount: row.doneCount });
  });

  const unreadNotifications = await Notification.countDocuments({ readAt: null });

  res.json({
    tasks: { total, open, inProgress, completed },
    elves: Array.from(map.values()).sort((a, b) => b.doneCount - a.doneCount),
    notifications: { unread: unreadNotifications },
  });
}

export async function listElvesAdmin(_req: any, res: any) {
  const elves = await User.find({ role: 'FIELD_AGENT' })
    .sort({ username: 1 })
    .select({ username: 1, role: 1, createdAt: 1 })
    .lean();
  res.json(elves.map((e) => ({ _id: e._id.toString(), username: e.username, role: e.role, createdAt: e.createdAt })));
}

const resetSchema = z.object({ password: z.string().min(4).max(128) });

export async function deleteElf(req: any, res: any) {
  const elfId = req.params.elfId as string;
  if (!mongoose.isValidObjectId(elfId)) throw new HttpError(400, 'Invalid elfId');

  const elf = await User.findById(elfId);
  if (!elf) throw notFound('Elf not found');
  if (elf.role !== 'FIELD_AGENT') throw new HttpError(400, 'Target is not a field agent');

  // Cleanup: unassign tasks and remove user-scoped notifications
  await Task.updateMany({ assigneeUserId: elf._id }, { $set: { assigneeUserId: null } });
  await Notification.deleteMany({ userId: elf._id });

  // Cleanup: delete chat messages involving this elf
  try {
    const { ChatMessage } = await import('../models/ChatMessage.js');
    await ChatMessage.deleteMany({ $or: [{ fromUserId: elf._id }, { toUserId: elf._id }] });
  } catch {
    // ignore if chat model not present
  }

  await elf.deleteOne();
  res.json({ ok: true });
}

export async function resetElfPassword(req: any, res: any) {
  const elfId = req.params.elfId as string;
  if (!mongoose.isValidObjectId(elfId)) throw new HttpError(400, 'Invalid elfId');

  const input = resetSchema.parse(req.body);

  const elf = await User.findById(elfId);
  if (!elf) throw notFound('Elf not found');
  if (elf.role !== 'FIELD_AGENT') throw new HttpError(400, 'Target is not a field agent');

  elf.passwordHash = await bcrypt.hash(input.password, 10);
  await elf.save();

  res.json({ ok: true });
}
