import mongoose from 'mongoose';
import { ChatMessage } from '../models/ChatMessage.js';
import { User } from '../models/User.js';
import { HttpError } from '../utils/httpError.js';

export async function getOverseer(_req: any, res: any) {
  const o = await User.findOne({ role: 'OVERSEER' }).select({ _id: 1, username: 1 }).lean();
  if (!o) throw new HttpError(500, 'Overseer not found');
  res.json({ _id: o._id.toString(), username: o.username });
}

export async function listDm(req: any, res: any) {
  const me = req.auth?.sub as string | undefined;
  if (!me) throw new HttpError(401, 'Unauthorized');
  const peerId = req.params.userId as string;
  if (!mongoose.isValidObjectId(peerId)) throw new HttpError(400, 'Invalid userId');

  const msgs = await ChatMessage.find({
    $or: [
      { fromUserId: me, toUserId: peerId },
      { fromUserId: peerId, toUserId: me },
    ],
  })
    .sort({ createdAt: 1 })
    .limit(500)
    .lean();

  res.json(
    msgs.map((m) => ({
      _id: m._id.toString(),
      fromUserId: (m.fromUserId as any).toString(),
      toUserId: (m.toUserId as any).toString(),
      message: m.message,
      createdAt: m.createdAt,
    }))
  );
}

export async function sendDm(req: any, res: any) {
  const me = req.auth?.sub as string | undefined;
  if (!me) throw new HttpError(401, 'Unauthorized');
  const peerId = req.params.userId as string;
  if (!mongoose.isValidObjectId(peerId)) throw new HttpError(400, 'Invalid userId');
  const message: string = (req.body?.message ?? '').toString().slice(0, 2000);
  if (!message.trim()) throw new HttpError(400, 'Empty message');

  const doc = await ChatMessage.create({ fromUserId: me, toUserId: peerId, message });

  try {
    const { realtime } = await import('../index.js');
    await realtime?.emitChatMessage({
      _id: doc._id.toString(),
      fromUserId: me,
      toUserId: peerId,
      message,
      createdAt: doc.createdAt,
    });
  } catch {
    // best-effort emit only; ignore errors
  }

  res.status(201).json({
    _id: doc._id.toString(),
    fromUserId: me,
    toUserId: peerId,
    message,
    createdAt: doc.createdAt,
  });
}
