import { AppShell } from '@/components/layout/AppShell';
import { FeatureFlagDetail } from '@/features/feature-flags/FeatureFlagDetail';

export default async function FeatureFlagDetailPage({
  params,
}: {
  params: Promise<{ flagKey: string }>;
}) {
  const { flagKey } = await params;

  return (
    <AppShell title={`Flag · ${flagKey}`}>
      <FeatureFlagDetail flagKey={flagKey} />
    </AppShell>
  );
}
