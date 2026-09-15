import { NativeRouteShell } from '@/components/sortify/shell';
import AdminScreen from '@/features/admin';

export default function AdminRoute() {
  return (
    <NativeRouteShell>
      <AdminScreen />
    </NativeRouteShell>
  );
}
