import { NativeRouteShell } from '@/components/sortify/shell';
import { ActivityScreen } from '@/features/history';

export default function ActivityRoute() {
  return (
    <NativeRouteShell>
      <ActivityScreen />
    </NativeRouteShell>
  );
}
