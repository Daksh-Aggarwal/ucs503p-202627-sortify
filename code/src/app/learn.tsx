import { NativeRouteShell } from '@/components/sortify/shell';
import { LearnScreen } from '@/features/guide';

export default function LearnRoute() {
  return (
    <NativeRouteShell>
      <LearnScreen />
    </NativeRouteShell>
  );
}
