import { NativeRouteShell } from '@/components/sortify/shell';
import GuideScreen from '@/features/guide';

export default function ExploreRoute() {
  return (
    <NativeRouteShell>
      <GuideScreen />
    </NativeRouteShell>
  );
}
