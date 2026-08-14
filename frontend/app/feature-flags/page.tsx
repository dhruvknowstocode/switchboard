import { AppShell } from '@/components/layout/AppShell';
import { FeatureFlagList } from '@/features/feature-flags/FeatureFlagList';

export default function FeatureFlagsPage() {
  return (
    <AppShell title="Feature Flags">
      <FeatureFlagList />
    </AppShell>
  );
}
