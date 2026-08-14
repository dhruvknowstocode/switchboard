/**
 * Shared backend types and domain enums.
 * Keep in sync with Prisma schema enums where applicable.
 */

export type Role = 'ADMIN' | 'RELEASE_MANAGER' | 'DEVELOPER' | 'VIEWER';

export type TargetingType = 'USER_ID' | 'REGION';

export type Severity = 'SEV_1' | 'SEV_2' | 'SEV_3' | 'SEV_4';

export type IncidentStatus =
  | 'INVESTIGATING'
  | 'IDENTIFIED'
  | 'MONITORING'
  | 'RESOLVED';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  /** jwt = operator dashboard; api_key = SDK / machine client */
  via?: 'jwt' | 'api_key';
}

export interface EvaluationContext {
  userId: string;
  region?: string;
  environment: string;
  attributes?: Record<string, string>;
}

export interface EvaluationResult {
  key: string;
  enabled: boolean;
  variant: 'on' | 'off';
  reason:
    | 'FLAG_DISABLED'
    | 'KILLED'
    | 'TARGETING'
    | 'ROLLOUT'
    | 'DEFAULT_OFF'
    | 'NOT_FOUND';
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  };
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthUser;
    }
  }
}

export {};
