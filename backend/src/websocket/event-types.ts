/**
 * WebSocket / realtime event type definitions.
 * Keep frontend `types` roughly aligned with this envelope.
 */

export type RealtimeChannel = 'feature-flags' | 'incidents' | 'system-events';

export type FeatureFlagEventType =
  | 'FEATURE_FLAG_CREATED'
  | 'FEATURE_FLAG_UPDATED'
  | 'FEATURE_FLAG_KILLED'
  | 'FEATURE_FLAG_ROLLED_BACK';

export type IncidentEventType =
  | 'INCIDENT_CREATED'
  | 'INCIDENT_UPDATED'
  | 'INCIDENT_RESOLVED'
  | 'INCIDENT_ACTION_TAKEN';

export type SystemEventType = 'SYSTEM_STATUS' | 'AUDIT_LOG_CREATED';

export type RealtimeEventType =
  | FeatureFlagEventType
  | IncidentEventType
  | SystemEventType;

export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  channel: RealtimeChannel;
  payload: T;
  timestamp: string;
  requestId?: string;
}

export interface FeatureFlagUpdatedPayload {
  flagKey: string;
  environment: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  killed?: boolean;
  deleted?: boolean;
  name?: string;
}

export function createRealtimeEvent<T>(
  type: RealtimeEventType,
  channel: RealtimeChannel,
  payload: T,
  requestId?: string,
): RealtimeEvent<T> {
  return {
    type,
    channel,
    payload,
    timestamp: new Date().toISOString(),
    requestId,
  };
}
