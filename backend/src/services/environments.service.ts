import { environmentRepository } from '../repositories/environment.repository.js';
import { auditLogRepository } from '../repositories/audit-log.repository.js';
import { AppError } from '../middleware/error-handler.js';

export const environmentsService = {
  async list() {
    return environmentRepository.findAll();
  },

  async create(data: { key: string; name: string; description?: string }, actorId: string) {
    const existing = await environmentRepository.findByKey(data.key);
    if (existing) {
      throw new AppError(409, 'ENVIRONMENT_EXISTS', `Environment "${data.key}" already exists`);
    }

    const environment = await environmentRepository.create(data);
    await auditLogRepository.create({
      actorId,
      action: 'CREATE_ENVIRONMENT',
      entityType: 'Environment',
      entityId: environment.id,
      newValue: environment,
    });
    return environment;
  },

  async update(
    id: string,
    data: Partial<{ name: string; description: string | null }>,
    actorId: string,
  ) {
    const existing = await environmentRepository.findById(id);
    if (!existing) {
      throw new AppError(404, 'ENVIRONMENT_NOT_FOUND', 'Environment not found');
    }

    const environment = await environmentRepository.update(id, data);
    await auditLogRepository.create({
      actorId,
      action: 'UPDATE_ENVIRONMENT',
      entityType: 'Environment',
      entityId: environment.id,
      previousValue: existing,
      newValue: environment,
    });
    return environment;
  },
};
