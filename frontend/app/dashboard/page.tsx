'use client';

import { AppShell } from '@/components/layout/AppShell';
import { DashboardOverview } from '@/features/dashboard/DashboardOverview';

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <DashboardOverview />
    </AppShell>
  );
}
