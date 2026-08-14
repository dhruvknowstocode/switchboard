import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthUser, Role } from '../types/index.js';
import { AppError } from '../middleware/error-handler.js';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

export function signAccessToken(user: AuthUser): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid access token');
    }

    const { sub, email, name, role } = decoded as Partial<AccessTokenPayload>;
    if (!sub || !email || !name || !role) {
      throw new AppError(401, 'INVALID_TOKEN', 'Invalid access token payload');
    }

    return { sub, email, name, role };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired access token');
  }
}
