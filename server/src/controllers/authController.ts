import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { HttpError, unauthorized } from '../utils/httpError.js';
import { signToken } from '../services/jwt.js';

const overseerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const agentSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerAgentSchema = z.object({
  username: z.string().min(2).max(32),
  password: z.string().min(4).max(128),
});

export async function loginOverseer(req: any, res: any) {
  const input = overseerSchema.parse(req.body);

  const user = await User.findOne({ username: input.username, role: 'OVERSEER' });
  if (!user) throw unauthorized('Invalid credentials');

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw unauthorized('Invalid credentials');

  const token = signToken({ userId: user._id.toString(), role: 'OVERSEER' });
  res.json({ token, role: 'OVERSEER' });
}

export async function loginAgent(req: any, res: any) {
  const input = agentSchema.parse(req.body);

  const user = await User.findOne({ username: input.username, role: 'FIELD_AGENT' });
  if (!user) throw unauthorized('Invalid credentials');

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw unauthorized('Invalid credentials');

  const token = signToken({ userId: user._id.toString(), role: 'FIELD_AGENT' });
  res.json({ token, role: 'FIELD_AGENT' });
}

export async function registerAgent(req: any, res: any) {
  const input = registerAgentSchema.parse(req.body);

  const existingUsername = await User.findOne({ username: input.username });
  if (existingUsername) throw new HttpError(409, 'Username already exists');

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await User.create({
    username: input.username,
    passwordHash,
    role: 'FIELD_AGENT',
  });

  const token = signToken({ userId: user._id.toString(), role: 'FIELD_AGENT' });
  res.status(201).json({ token, role: 'FIELD_AGENT' });
}
