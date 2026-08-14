import { AppShell } from '@/components/layout/AppShell';
import { AuditLogList } from '@/features/audit-logs/AuditLogList';

export default function AuditLogsPage() {
  return (
    <AppShell title="Audit Logs">
      <AuditLogList />
    </AppShell>
  );
}
