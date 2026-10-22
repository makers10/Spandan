import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthProvider } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

const SpandanDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#FF6B00',
    background: '#0B111E',
    card: '#131B2E',
    text: '#FFFFFF',
    border: '#243354',
  },
};

const SpandanLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF6B00',
    background: '#0B111E',
    card: '#131B2E',
    text: '#FFFFFF',
    border: '#243354',
  },
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'light' ? SpandanLightTheme : SpandanDarkTheme;

  return (
    <AuthProvider>
      <ThemeProvider value={theme}>
        <StatusBar style="light" />
        <AnimatedSplashOverlay />
        <AppTabs />
      </ThemeProvider>
    </AuthProvider>
  );
}
