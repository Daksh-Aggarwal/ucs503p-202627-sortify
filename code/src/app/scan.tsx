import { NativeRouteShell } from '@/components/sortify/shell';
import ScanScreen from '@/features/scan';

export default function ScanRoute() {
  return (
    <NativeRouteShell>
      <ScanScreen />
    </NativeRouteShell>
  );
}
