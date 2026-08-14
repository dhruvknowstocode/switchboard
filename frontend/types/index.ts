export type Role = 'ADMIN' | 'RELEASE_MANAGER' | 'DEVELOPER' | 'VIEWER';

export type Severity = 'SEV_1' | 'SEV_2' | 'SEV_3' | 'SEV_4';

export type IncidentStatus =
  | 'INVESTIGATING'
  | 'IDENTIFIED'
  | 'MONITORING'
  | 'RESOLVED';

export type RealtimeChannel = 'feature-flags' | 'incidents' | 'system-events';

export type RealtimeEventType =
  | 'FEATURE_FLAG_CREATED'
  | 'FEATURE_FLAG_UPDATED'
  | 'FEATURE_FLAG_KILLED'
  | 'FEATURE_FLAG_ROLLED_BACK'
  | 'INCIDENT_CREATED'
  | 'INCIDENT_UPDATED'
  | 'INCIDENT_RESOLVED'
  | 'INCIDENT_ACTION_TAKEN'
  | 'SYSTEM_STATUS'
  | 'AUDIT_LOG_CREATED';

export interface RealtimeEvent<T = unknown> {
  type: RealtimeEventType;
  channel: RealtimeChannel;
  payload: T;
  timestamp: string;
  requestId?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export type WsConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface EnvironmentSummary {
  id: string;
  key: string;
  name: string;
}

export interface TargetingRule {
  id?: string;
  type: 'USER_ID' | 'REGION';
  value: string;
  rolloutPercentage: number;
  priority: number;
}

export interface FeatureFlagConfigView {
  id: string;
  enabled: boolean;
  rolloutPercentage: number;
  killed: boolean;
  killReason: string | null;
  environment: EnvironmentSummary;
  targetingRules: TargetingRule[];
  updatedAt: string;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  updatedBy: User | null;
  configs: FeatureFlagConfigView[];
}

export interface EvaluationResult {
  key: string;
  enabled: boolean;
  variant: 'on' | 'off';
  reason: string;
}

export interface Environment {
  id: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentEvent {
  id: string;
  type: string;
  message: string;
  metadata?: unknown;
  createdAt: string;
  actor: User;
}

export interface Incident {
  id: string;
  number: string;
  title: string;
  description: string | null;
  severity: Severity;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  createdBy: User;
  assignedTo: User | null;
  affectedFlags: Array<{
    id: string;
    featureFlag: { id: string; key: string; name: string };
  }>;
  events: IncidentEvent[];
}
