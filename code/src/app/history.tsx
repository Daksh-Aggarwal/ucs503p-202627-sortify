import { NativeRouteShell } from '@/components/sortify/shell';
import HistoryScreen from '@/features/history';

export default function HistoryRoute() {
  return (
    <NativeRouteShell>
      <HistoryScreen />
    </NativeRouteShell>
  );
}
