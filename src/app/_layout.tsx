import { DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox, StyleSheet, View } from 'react-native';
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

const SpandanLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#00b8a2',
    background: '#f4f8f7',
    card: '#FFFFFF',
    text: '#0f172a',
    border: 'rgba(226, 232, 240, 0.8)',
  },
};

export default function TabLayout() {
  return (
    <SafeAreaProvider style={styles.root}>
      <AuthProvider>
        <ThemeProvider value={SpandanLightTheme}>
          <View style={styles.root}>
            <StatusBar style="dark" />
            <AnimatedSplashOverlay />
            <AppTabs />
            <AuthModal />
          </View>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100%',
    minHeight: 0,
  },
});
