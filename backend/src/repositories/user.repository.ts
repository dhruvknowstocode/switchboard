import type { Role, User } from '@prisma/client';
import { prisma } from '../database/prisma.js';

/**
 * User repository — Prisma data access for authentication & user admin.
 */
export const userRepository = {
  async findAll(): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
  },

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  async count(): Promise<number> {
    return prisma.user.count();
  },

  async create(data: {
    email: string;
    passwordHash: string;
    name: string;
    role: Role;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
      },
    });
  },

  async updateRole(id: string, role: Role): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  },

  async upsertByEmail(data: {
    email: string;
    passwordHash: string;
    name: string;
    role: Role;
  }): Promise<User> {
    return prisma.user.upsert({
      where: { email: data.email.toLowerCase() },
      create: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
      },
      update: {
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role,
      },
    });
  },
};
