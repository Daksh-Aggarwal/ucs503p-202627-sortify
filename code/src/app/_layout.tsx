import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider , useApp } from '@/state/app-state';
import { Shell } from '@/components/sortify/shell';
import { ActivityIndicator, Platform, View } from 'react-native';
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
        animation: Platform.OS === 'ios' ? 'default' : 'fade',
        contentStyle: { backgroundColor: C.bg },
      }}
      screenLayout={({ children, route }) =>
        route.name === '(tabs)' ? children : <Shell>{children}</Shell>
      }
    >
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
    </Stack>
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
