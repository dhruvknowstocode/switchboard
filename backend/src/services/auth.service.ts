import { userRepository } from '../repositories/user.repository.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken } from '../utils/jwt.js';
import { toAuthUser, toPublicUser } from '../utils/user-mapper.js';
import { AppError } from '../middleware/error-handler.js';
import type { Role } from '@prisma/client';

/**
 * Auth service — login, register, me with JWT + bcrypt.
 */
export const authService = {
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const authUser = toAuthUser(user);
    return {
      accessToken: signAccessToken(authUser),
      user: toPublicUser(user),
    };
  },

  /**
   * Register a user.
   * - If no users exist: bootstrap first account as ADMIN (no actor required).
   * - Otherwise: caller must be ADMIN (`actorIsAdmin: true`).
   */
  async register(
    data: {
      email: string;
      password: string;
      name: string;
      role?: Role;
    },
    options?: { actorIsAdmin?: boolean },
  ) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError(409, 'EMAIL_TAKEN', 'A user with this email already exists');
    }

    const userCount = await userRepository.count();
    const isBootstrap = userCount === 0;

    if (!isBootstrap && !options?.actorIsAdmin) {
      throw new AppError(403, 'FORBIDDEN', 'Only admins can register users');
    }

    const role: Role = isBootstrap ? 'ADMIN' : (data.role ?? 'DEVELOPER');
    const passwordHash = await hashPassword(data.password);
    const user = await userRepository.create({
      email: data.email,
      passwordHash,
      name: data.name,
      role,
    });

    return toPublicUser(user);
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }
    return toPublicUser(user);
  },
};
