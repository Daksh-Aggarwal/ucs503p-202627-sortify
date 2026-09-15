import { NativeRouteShell } from '@/components/sortify/shell';
import OverviewScreen from '@/features/overview';

export default function IndexRoute() {
  return (
    <NativeRouteShell>
      <OverviewScreen />
    </NativeRouteShell>
  );
}
