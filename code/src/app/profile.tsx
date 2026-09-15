import { NativeRouteShell } from '@/components/sortify/shell';
import ProfileScreen from '@/features/profile';

export default function ProfileRoute() {
  return (
    <NativeRouteShell>
      <ProfileScreen />
    </NativeRouteShell>
  );
}
