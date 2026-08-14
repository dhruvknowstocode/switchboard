import { AppShell } from '@/components/layout/AppShell';
import { IncidentList } from '@/features/incidents/IncidentList';

export default function IncidentsPage() {
  return (
    <AppShell title="Incidents">
      <IncidentList />
    </AppShell>
  );
}
