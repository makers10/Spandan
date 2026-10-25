/**
 * Track your movement Design System Tokens - Apple Health Minimalist Theme
 * Clean, spacious, high-legibility interface with native iOS aesthetic.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#8E8E93',
    textTertiary: '#AEAEB2',
    background: '#F6F8F8',
    backgroundElement: '#E5E5EA',
    backgroundSelected: '#D1D1D6',
    card: '#FFFFFF',
    cardBorder: 'rgba(79, 169, 154, 0.08)',
    tint: '#4FA99A',
    primary: '#4FA99A',
    primaryHover: '#3D8C7F',
    primarySubtle: 'rgba(79, 169, 154, 0.12)',
    accentTeal: '#4FA99A',
    accentOrange: '#FF6B00',
    accentCyan: '#00D2D3',
    accentEmerald: '#10B981',
    accentAmber: '#F59E0B',
    separator: '#E5E5EA',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    textTertiary: '#636366',
    background: '#000000',
    backgroundElement: '#1C1C1E',
    backgroundSelected: '#2C2C2E',
    card: '#1C1C1E',
    cardBorder: 'rgba(255, 255, 255, 0.06)',
    tint: '#4FA99A',
    primary: '#4FA99A',
    primaryHover: '#5EBDB0',
    primarySubtle: 'rgba(79, 169, 154, 0.2)',
    accentTeal: '#4FA99A',
    accentOrange: '#FF6B00',
    accentCyan: '#00D2D3',
    accentEmerald: '#10B981',
    accentAmber: '#F59E0B',
    separator: '#38383A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 20,
  five: 28,
  six: 40,
} as const;

export const BottomTabInset = Platform.select({ ios: 90, android: 104, default: 96 }) ?? 96;
export const MaxContentWidth = 720;
