import { prisma } from '../database/prisma.js';
import type { Prisma } from '@prisma/client';

export const environmentRepository = {
  async findAll() {
    return prisma.environment.findMany({ orderBy: { key: 'asc' } });
  },

  async findById(id: string) {
    return prisma.environment.findUnique({ where: { id } });
  },

  async findByKey(key: string) {
    return prisma.environment.findUnique({ where: { key } });
  },

  async create(data: { key: string; name: string; description?: string }) {
    return prisma.environment.create({
      data: {
        key: data.key,
        name: data.name,
        description: data.description,
      },
    });
  },

  async update(id: string, data: Partial<{ name: string; description: string | null }>) {
    return prisma.environment.update({
      where: { id },
      data,
    });
  },

  async upsertByKey(data: { key: string; name: string; description?: string }) {
    return prisma.environment.upsert({
      where: { key: data.key },
      create: {
        key: data.key,
        name: data.name,
        description: data.description,
      },
      update: {
        name: data.name,
        description: data.description,
      },
    });
  },
};

export type EnvironmentRecord = Prisma.EnvironmentGetPayload<object>;
