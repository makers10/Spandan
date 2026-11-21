import { DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { LogBox, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  GoogleSans_400Regular,
  GoogleSans_500Medium,
  GoogleSans_600SemiBold,
  GoogleSans_700Bold,
} from '@expo-google-fonts/google-sans';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthModal } from '@/components/fitness/auth-modal';
import { AuthProvider } from '@/context/auth-context';
import { applyGlobalFont } from '@/utils/apply-global-font';

SplashScreen.preventAutoHideAsync();
applyGlobalFont();

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
  const [fontsLoaded] = useFonts({
    GoogleSans_400Regular,
    GoogleSans_500Medium,
    GoogleSans_600SemiBold,
    GoogleSans_700Bold,
    'Google Sans': GoogleSans_400Regular,
    'GoogleSans': GoogleSans_400Regular,
    'GoogleSans-Regular': GoogleSans_400Regular,
    'GoogleSans-Medium': GoogleSans_500Medium,
    'GoogleSans-SemiBold': GoogleSans_600SemiBold,
    'GoogleSans-Bold': GoogleSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

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
