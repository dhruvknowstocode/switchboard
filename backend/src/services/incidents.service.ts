import type { IncidentStatus, Severity } from '@prisma/client';
import { incidentRepository } from '../repositories/incident.repository.js';
import { featureFlagRepository } from '../repositories/feature-flag.repository.js';
import { auditLogRepository } from '../repositories/audit-log.repository.js';
import { featureFlagsService } from './feature-flags.service.js';
import { AppError } from '../middleware/error-handler.js';
import { publishIncidentEvent } from '../redis/incident-realtime.js';

function serializeIncident(
  incident: NonNullable<Awaited<ReturnType<typeof incidentRepository.findById>>>,
) {
  return {
    id: incident.id,
    number: incident.number,
    title: incident.title,
    description: incident.description,
    severity: incident.severity,
    status: incident.status,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
    resolvedAt: incident.resolvedAt,
    createdBy: incident.createdBy,
    assignedTo: incident.assignedTo,
    affectedFlags: incident.affectedFlags.map((row) => ({
      id: row.id,
      featureFlag: row.featureFlag,
    })),
    events: incident.events.map((event) => ({
      id: event.id,
      type: event.type,
      message: event.message,
      metadata: event.metadata,
      createdAt: event.createdAt,
      actor: event.actor,
    })),
  };
}

async function resolveFlagIds(params: {
  affectedFlagIds?: string[];
  affectedFlagKeys?: string[];
}): Promise<string[]> {
  const ids = new Set<string>(params.affectedFlagIds ?? []);

  for (const key of params.affectedFlagKeys ?? []) {
    const flag = await featureFlagRepository.findByKey(key);
    if (!flag) {
      throw new AppError(404, 'FLAG_NOT_FOUND', `Feature flag "${key}" not found`);
    }
    ids.add(flag.id);
  }

  return [...ids];
}

/**
 * Incidents service — lifecycle + emergency feature actions.
 */
export const incidentsService = {
  async list(filters?: { status?: string; severity?: string }) {
    const incidents = await incidentRepository.findAll({
      status: filters?.status as IncidentStatus | undefined,
      severity: filters?.severity as Severity | undefined,
    });
    return incidents.map(serializeIncident);
  },

  async getById(idOrNumber: string) {
    const incident = await incidentRepository.findByIdOrNumber(idOrNumber);
    if (!incident) {
      throw new AppError(404, 'INCIDENT_NOT_FOUND', 'Incident not found');
    }
    return serializeIncident(incident);
  },

  async create(data: {
    title: string;
    description?: string;
    severity: Severity;
    createdById: string;
    assignedToId?: string;
    affectedFlagIds?: string[];
    affectedFlagKeys?: string[];
  }) {
    const affectedFlagIds = await resolveFlagIds({
      affectedFlagIds: data.affectedFlagIds,
      affectedFlagKeys: data.affectedFlagKeys,
    });

    const number = await incidentRepository.nextNumber();
    const incident = await incidentRepository.create({
      number,
      title: data.title,
      description: data.description,
      severity: data.severity,
      createdById: data.createdById,
      assignedToId: data.assignedToId,
      affectedFlagIds,
    });

    await auditLogRepository.create({
      actorId: data.createdById,
      action: 'CREATE_INCIDENT',
      entityType: 'Incident',
      entityId: incident.id,
      newValue: serializeIncident(incident),
    });

    await publishIncidentEvent('INCIDENT_CREATED', {
      incidentId: incident.id,
      number: incident.number,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
    });

    return serializeIncident(incident);
  },

  async updateStatus(idOrNumber: string, status: IncidentStatus, actorId: string) {
    const existing = await incidentRepository.findByIdOrNumber(idOrNumber);
    if (!existing) {
      throw new AppError(404, 'INCIDENT_NOT_FOUND', 'Incident not found');
    }

    const previousStatus = existing.status;
    const updated = await incidentRepository.update(existing.id, {
      status,
      resolvedAt: status === 'RESOLVED' ? new Date() : null,
    });

    const withEvent = await incidentRepository.addEvent(existing.id, {
      type: 'STATUS_CHANGED',
      message: `Status changed ${previousStatus} → ${status}`,
      actorId,
      metadata: { previousStatus, status },
    });

    await auditLogRepository.create({
      actorId,
      action: status === 'RESOLVED' ? 'RESOLVE_INCIDENT' : 'UPDATE_INCIDENT_STATUS',
      entityType: 'Incident',
      entityId: existing.id,
      previousValue: { status: previousStatus },
      newValue: { status },
    });

    const eventType = status === 'RESOLVED' ? 'INCIDENT_RESOLVED' : 'INCIDENT_UPDATED';
    await publishIncidentEvent(eventType, {
      incidentId: existing.id,
      number: existing.number,
      title: existing.title,
      status,
      severity: existing.severity,
    });

    return serializeIncident(withEvent ?? updated);
  },

  async killAffectedFlag(params: {
    incidentId: string;
    flagKey: string;
    environmentKey: string;
    reason: string;
    actorId: string;
  }) {
    const incident = await incidentRepository.findByIdOrNumber(params.incidentId);
    if (!incident) {
      throw new AppError(404, 'INCIDENT_NOT_FOUND', 'Incident not found');
    }

    const flag = await featureFlagRepository.findByKey(params.flagKey);
    if (!flag) {
      throw new AppError(404, 'FLAG_NOT_FOUND', `Feature flag "${params.flagKey}" not found`);
    }

    await featureFlagsService.killSwitch(params.flagKey, params.environmentKey, {
      reason: params.reason,
      actorId: params.actorId,
    });

    await incidentRepository.addAffectedFlag(incident.id, flag.id);

    const refreshed = await incidentRepository.addEvent(incident.id, {
      type: 'KILL_SWITCH',
      message: `Kill switch on ${params.flagKey} (${params.environmentKey}): ${params.reason}`,
      actorId: params.actorId,
      metadata: {
        flagKey: params.flagKey,
        environmentKey: params.environmentKey,
        reason: params.reason,
      },
    });

    await publishIncidentEvent('INCIDENT_ACTION_TAKEN', {
      incidentId: incident.id,
      number: incident.number,
      title: incident.title,
      status: incident.status,
      severity: incident.severity,
      action: 'KILL_SWITCH',
      flagKey: params.flagKey,
      environment: params.environmentKey,
    });

    return serializeIncident(refreshed!);
  },

  async reduceRollout(params: {
    incidentId: string;
    flagKey: string;
    environmentKey: string;
    rolloutPercentage: number;
    reason: string;
    actorId: string;
  }) {
    const incident = await incidentRepository.findByIdOrNumber(params.incidentId);
    if (!incident) {
      throw new AppError(404, 'INCIDENT_NOT_FOUND', 'Incident not found');
    }

    const flag = await featureFlagRepository.findByKey(params.flagKey);
    if (!flag) {
      throw new AppError(404, 'FLAG_NOT_FOUND', `Feature flag "${params.flagKey}" not found`);
    }

    await featureFlagsService.updateConfig(params.flagKey, params.environmentKey, {
      rolloutPercentage: params.rolloutPercentage,
      updatedById: params.actorId,
    });

    await incidentRepository.addAffectedFlag(incident.id, flag.id);

    const refreshed = await incidentRepository.addEvent(incident.id, {
      type: 'ROLLOUT_REDUCED',
      message: `Reduced ${params.flagKey} in ${params.environmentKey} to ${params.rolloutPercentage}%: ${params.reason}`,
      actorId: params.actorId,
      metadata: {
        flagKey: params.flagKey,
        environmentKey: params.environmentKey,
        rolloutPercentage: params.rolloutPercentage,
        reason: params.reason,
      },
    });

    await publishIncidentEvent('INCIDENT_ACTION_TAKEN', {
      incidentId: incident.id,
      number: incident.number,
      action: 'REDUCE_ROLLOUT',
      flagKey: params.flagKey,
      environment: params.environmentKey,
    });

    return serializeIncident(refreshed!);
  },

  /** @deprecated use killAffectedFlag — kept for older route name */
  async disableAffectedFlag(params: {
    incidentId: string;
    flagKey: string;
    environmentKey: string;
    reason: string;
    actorId: string;
  }) {
    return this.killAffectedFlag(params);
  },
};
