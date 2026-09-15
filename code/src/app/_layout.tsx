import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider , useApp } from '@/state/app-state';
import { Shell } from '@/components/sortify/shell';
import { ActivityIndicator, View } from 'react-native';
import { C } from '@/components/sortify/ui';
function AppContent() {
  const { ready } = useApp();
  if (!ready)
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: C.bg },
      }}
      screenLayout={({ children }) => <Shell>{children}</Shell>}
    />
  );
}
export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <AppContent />
    </AppProvider>
  );
}
