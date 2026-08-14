import { apiFetch } from '@/lib/api-client';
import type { Incident, Severity, IncidentStatus } from '@/types';

export async function listIncidents(params?: {
  status?: IncidentStatus;
  severity?: Severity;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.severity) query.set('severity', params.severity);
  const qs = query.toString();
  const res = await apiFetch<{ data: Incident[] }>(`/incidents${qs ? `?${qs}` : ''}`);
  return res.data;
}

export async function getIncident(incidentId: string) {
  const res = await apiFetch<{ data: Incident }>(
    `/incidents/${encodeURIComponent(incidentId)}`,
  );
  return res.data;
}

export async function createIncident(payload: {
  title: string;
  description?: string;
  severity: Severity;
  affectedFlagKeys?: string[];
}) {
  const res = await apiFetch<{ data: Incident }>('/incidents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function updateIncidentStatus(incidentId: string, status: IncidentStatus) {
  const res = await apiFetch<{ data: Incident }>(
    `/incidents/${encodeURIComponent(incidentId)}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  );
  return res.data;
}

export async function killFlagFromIncident(
  incidentId: string,
  payload: { flagKey: string; environmentKey: string; reason: string },
) {
  const res = await apiFetch<{ data: Incident }>(
    `/incidents/${encodeURIComponent(incidentId)}/actions/kill-flag`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return res.data;
}

export async function reduceRolloutFromIncident(
  incidentId: string,
  payload: {
    flagKey: string;
    environmentKey: string;
    rolloutPercentage: number;
    reason: string;
  },
) {
  const res = await apiFetch<{ data: Incident }>(
    `/incidents/${encodeURIComponent(incidentId)}/actions/reduce-rollout`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  return res.data;
}
