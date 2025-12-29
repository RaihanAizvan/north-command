import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthPayload, Role } from '../middleware/auth.js';

export function signToken(args: { userId: string; role: Role }) {
  const payload: AuthPayload = {
    sub: args.userId,
    role: args.role,
  };

  return jwt.sign(payload, env.JWT_SECRET as jwt.Secret, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}
