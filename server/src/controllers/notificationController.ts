import { z } from 'zod';
import { Notification } from '../models/Notification.js';
import { HttpError, notFound } from '../utils/httpError.js';

export async function listMyNotifications(req: any, res: any) {
  const userId = req.auth?.sub;
  if (!userId) throw new HttpError(401, 'Unauthorized');

  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
  res.json(notifications);
}

const markReadSchema = z.object({ read: z.boolean().default(true) });

export async function markNotificationRead(req: any, res: any) {
  const userId = req.auth?.sub;
  if (!userId) throw new HttpError(401, 'Unauthorized');

  const _input = markReadSchema.parse(req.body ?? {});

  const n = await Notification.findOne({ _id: req.params.notificationId, userId });
  if (!n) throw notFound('Notification not found');

  n.readAt = new Date();
  await n.save();
  res.json(n.toObject());
}
