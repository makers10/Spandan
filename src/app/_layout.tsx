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
    primary: '#4FA99A',
    background: '#0B1514',
    card: '#122220',
    text: '#FFFFFF',
    border: '#1F3A36',
  },
};

const SpandanLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4FA99A',
    background: '#F7FAF9',
    card: '#FFFFFF',
    text: '#132A26',
    border: '#E3ECE9',
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
