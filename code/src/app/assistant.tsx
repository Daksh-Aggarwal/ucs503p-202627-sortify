import { NativeRouteShell } from '@/components/sortify/shell';
import AssistantScreen from '@/features/assistant';

export default function AssistantRoute() {
  return (
    <NativeRouteShell>
      <AssistantScreen />
    </NativeRouteShell>
  );
}
