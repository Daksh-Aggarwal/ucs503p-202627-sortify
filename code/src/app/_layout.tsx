import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const theme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: isDark ? Colors.dark.primary : Colors.light.primary,
      background: isDark ? Colors.dark.background : Colors.light.background,
      card: isDark ? Colors.dark.backgroundElement : Colors.light.background,
      text: isDark ? Colors.dark.text : Colors.light.text,
      border: isDark ? Colors.dark.backgroundSelected : Colors.light.accent,
    },
  };

  return (
    <ThemeProvider value={theme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
