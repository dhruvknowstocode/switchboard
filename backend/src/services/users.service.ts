import type { Role } from '@prisma/client';
import { userRepository } from '../repositories/user.repository.js';
import { toPublicUser } from '../utils/user-mapper.js';
import { AppError } from '../middleware/error-handler.js';

/**
 * Users service — listing and role management (ADMIN).
 */
export const usersService = {
  async list() {
    const users = await userRepository.findAll();
    return users.map(toPublicUser);
  },

  async getById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }
    return toPublicUser(user);
  },

  async updateRole(id: string, role: Role) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const updated = await userRepository.updateRole(id, role);
    // TODO: Phase 6 — audit log role change
    return toPublicUser(updated);
  },
};
