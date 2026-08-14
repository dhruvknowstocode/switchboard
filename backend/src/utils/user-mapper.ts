import type { Role as PrismaRole, User } from '@prisma/client';
import type { AuthUser, Role } from '../types/index.js';

export type PublicUser = AuthUser & {
  createdAt?: Date;
  updatedAt?: Date;
};

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  };
}

export function toPublicUser(user: User): PublicUser {
  return {
    ...toAuthUser(user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function isRole(value: string): value is Role {
  return (
    value === 'ADMIN' ||
    value === 'RELEASE_MANAGER' ||
    value === 'DEVELOPER' ||
    value === 'VIEWER'
  );
}

export type { PrismaRole };
