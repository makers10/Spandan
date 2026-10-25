/**
 * Track your movement Design System Tokens - Apple Health Minimalist Theme
 * Clean, spacious, high-legibility interface with native iOS aesthetic.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0f172a',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    background: '#f4f8f7',
    backgroundElement: '#eef3f1',
    backgroundSelected: '#dbe3e0',
    card: '#FFFFFF',
    cardBorder: 'rgba(226, 232, 240, 0.8)',
    tint: '#00b8a2',
    primary: '#00b8a2',
    primaryHover: '#009684',
    primarySubtle: 'rgba(0, 184, 162, 0.12)',
    accentTeal: '#00b8a2',
    accentOrange: '#FF6B00',
    accentCyan: '#00D2D3',
    accentEmerald: '#10B981',
    accentAmber: '#F59E0B',
    separator: '#e2e8f0',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    background: '#0d131f',
    backgroundElement: '#131b2e',
    backgroundSelected: '#1e293b',
    card: '#131b2e',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    tint: '#00b8a2',
    primary: '#00b8a2',
    primaryHover: '#00b8a2',
    primarySubtle: 'rgba(0, 184, 162, 0.2)',
    accentTeal: '#00b8a2',
    accentOrange: '#FF6B00',
    accentCyan: '#00D2D3',
    accentEmerald: '#10B981',
    accentAmber: '#F59E0B',
    separator: 'rgba(255, 255, 255, 0.08)',
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
