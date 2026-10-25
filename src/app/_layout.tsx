import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthModal } from '@/components/fitness/auth-modal';
import { AuthProvider } from '@/context/auth-context';

SplashScreen.preventAutoHideAsync();

// Silence benign third-party library warnings
LogBox.ignoreLogs([
  '[Reanimated] Dependencies should only be used on the web',
  'SafeAreaView has been deprecated',
]);

const AppDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#4FA99A',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    border: '#2C2C2E',
  },
};

const AppLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4FA99A',
    background: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    border: 'rgba(0, 0, 0, 0.04)',
  },
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? AppDarkTheme : AppLightTheme;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={theme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AnimatedSplashOverlay />
          <AppTabs />
          <AuthModal />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
