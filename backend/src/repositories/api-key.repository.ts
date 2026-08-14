import { prisma } from '../database/prisma.js';

export const apiKeyRepository = {
  async create(data: {
    name: string;
    keyPrefix: string;
    keyHash: string;
    createdById: string;
  }) {
    return prisma.apiKey.create({
      data,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async findByHash(keyHash: string) {
    return prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        createdBy: { select: { id: true, email: true, name: true, role: true } },
      },
    });
  },

  async list() {
    return prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async revoke(id: string) {
    return prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    });
  },

  async touchLastUsed(id: string) {
    return prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  },
};
