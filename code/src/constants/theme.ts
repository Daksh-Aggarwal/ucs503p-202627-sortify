/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Palette = {
  primary: '#1B5E3F', // Trust, sustainability
  secondary: '#4CAF7A', // Growth, positive action
  accent: '#CFEBD0', // Fresh, clean, modern
  background: '#FAFBF7', // Minimal, airy
  textPrimary: '#1F2937', // Clarity, readability
  textSecondary: '#6B7280', // Supporting text
  highlight: '#F5C46B', // Attention, actions
} as const;

export const Colors = {
  light: {
    primary: Palette.primary,
    secondary: Palette.secondary,
    accent: Palette.accent,
    highlight: Palette.highlight,
    text: Palette.textPrimary,
    textSecondary: Palette.textSecondary,
    background: Palette.background,
    backgroundElement: '#F0F4EC',
    backgroundSelected: Palette.accent,
  },
  dark: {
    primary: Palette.secondary,
    secondary: '#34D399',
    accent: '#1B5E3F',
    highlight: Palette.highlight,
    text: Palette.background,
    textSecondary: '#9CA3AF',
    background: '#111827',
    backgroundElement: Palette.textPrimary,
    backgroundSelected: '#374151',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
