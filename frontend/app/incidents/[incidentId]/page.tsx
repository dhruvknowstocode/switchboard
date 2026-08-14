import { AppShell } from '@/components/layout/AppShell';
import { IncidentDetail } from '@/features/incidents/IncidentDetail';

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ incidentId: string }>;
}) {
  const { incidentId } = await params;

  return (
    <AppShell title={`Incident · ${incidentId}`}>
      <IncidentDetail incidentId={incidentId} />
    </AppShell>
  );
}
