import { apiKeyRepository } from '../repositories/api-key.repository.js';
import { auditLogRepository } from '../repositories/audit-log.repository.js';
import { generateApiKeySecret } from '../utils/api-key.js';
import { AppError } from '../middleware/error-handler.js';

export const apiKeysService = {
  async list() {
    return apiKeyRepository.list();
  },

  async create(name: string, createdById: string) {
    const generated = generateApiKeySecret();
    const record = await apiKeyRepository.create({
      name,
      keyPrefix: generated.prefix,
      keyHash: generated.hash,
      createdById,
    });

    await auditLogRepository.create({
      actorId: createdById,
      action: 'API_KEY_CREATED',
      entityType: 'ApiKey',
      entityId: record.id,
      newValue: { name: record.name, keyPrefix: record.keyPrefix },
    });

    return {
      ...record,
      /** Returned once — store securely; cannot be retrieved again. */
      apiKey: generated.plaintext,
    };
  },

  async revoke(id: string, actorId: string) {
    try {
      const revoked = await apiKeyRepository.revoke(id);
      await auditLogRepository.create({
        actorId,
        action: 'API_KEY_REVOKED',
        entityType: 'ApiKey',
        entityId: id,
        newValue: { revokedAt: revoked.revokedAt },
      });
      return revoked;
    } catch {
      throw new AppError(404, 'NOT_FOUND', 'API key not found');
    }
  },
};
