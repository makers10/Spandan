/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#132A26',
    background: '#F7FAF9',
    backgroundElement: '#E8F5F2',
    backgroundSelected: '#D2ECE6',
    textSecondary: '#6B8782',
    card: '#FFFFFF',
    cardBorder: '#E3ECE9',
    tint: '#4FA99A',
    primary: '#4FA99A',
    primaryHover: '#3D8C7F',
    primarySubtle: '#E8F5F2',
    accentTeal: '#4FA99A',
    accentOrange: '#FF6B00',
    accentCyan: '#00D2D3',
    accentEmerald: '#10B981',
    accentAmber: '#F59E0B',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0B1514',
    backgroundElement: '#122220',
    backgroundSelected: '#1B312E',
    textSecondary: '#8CA7A2',
    card: '#122220',
    cardBorder: '#1F3A36',
    tint: '#4FA99A',
    primary: '#4FA99A',
    primaryHover: '#5EBDB0',
    primarySubtle: 'rgba(79, 169, 154, 0.15)',
    accentTeal: '#4FA99A',
    accentOrange: '#FF6B00',
    accentCyan: '#00D2D3',
    accentEmerald: '#10B981',
    accentAmber: '#F59E0B',
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
