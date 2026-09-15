import { Stack } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '@/state/app-state';
import { Shell } from '@/components/sortify/shell';
import { ActivityIndicator, Platform, View } from 'react-native';
import { C } from '@/components/sortify/ui';

const nativeTabs = [
  {
    name: 'index',
    label: 'Home',
    sf: { default: 'house', selected: 'house.fill' },
  },
  {
    name: 'explore',
    label: 'Guide',
    sf: { default: 'book', selected: 'book.fill' },
  },
  {
    name: 'scan',
    label: 'Scan',
    sf: { default: 'viewfinder', selected: 'viewfinder' },
  },
  {
    name: 'activity',
    label: 'Activity',
    sf: { default: 'chart.bar', selected: 'chart.bar.fill' },
  },
  {
    name: 'history',
    label: 'History',
    sf: { default: 'clock.arrow.circlepath', selected: 'clock.arrow.circlepath' },
  },
  {
    name: 'assistant',
    label: 'Assistant',
    sf: { default: 'message', selected: 'message.fill' },
  },
  {
    name: 'learn',
    label: 'Learn',
    sf: { default: 'leaf', selected: 'leaf.fill' },
  },
  {
    name: 'profile',
    label: 'Profile',
    sf: { default: 'person.crop.circle', selected: 'person.crop.circle.fill' },
  },
  {
    name: 'admin',
    label: 'Admin',
    sf: { default: 'flask', selected: 'flask.fill' },
  },
  {
    name: 'result',
    label: 'Result',
    sf: { default: 'checkmark.seal', selected: 'checkmark.seal.fill' },
  },
] as const;

function AppContent() {
  const { ready } = useApp();
  if (!ready)
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator color={C.green} />
      </View>
    );
  if (Platform.OS === 'ios') {
    return (
      <NativeTabs
        tintColor={C.green}
        iconColor={{ default: C.muted, selected: C.green }}
        labelStyle={{
          default: { fontSize: 11, color: C.muted },
          selected: { fontSize: 11, color: C.green, fontWeight: '600' },
        }}
        minimizeBehavior="automatic"
        disableTransparentOnScrollEdge={false}
        sidebarAdaptable={false}
      >
        {nativeTabs.map((tab) => (
          <NativeTabs.Trigger key={tab.name} name={tab.name}>
            <NativeTabs.Trigger.Label>{tab.label}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={tab.sf} />
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }
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
