import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { SpandanLogo } from '@/components/fitness/spandan-logo';
import { useAuth } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { signIn, isConfigured, setDemoMode, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleLogin = async () => {
    setValidationError(null);
    clearError();

    if (!email.trim() || !password) {
      setValidationError('Please enter both email and password.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    setLocalLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/' as any);
    } catch {
      // error is handled by AuthContext
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDemoMode = () => {
    setDemoMode(true);
    router.replace('/' as any);
  };

  const displayedError = validationError || error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.contentContainer}>
            {/* Header branding */}
            <View style={styles.header}>
              <SpandanLogo size="large" showTagline />
              <Text style={styles.title}>Athlete Sign In</Text>
              <Text style={styles.subTitle}>
                Access your training logs, personal records, and cloud telemetry.
              </Text>
            </View>

            {/* Supabase status banner */}
            {!isConfigured && (
              <View style={styles.unconfiguredBox}>
                <Text style={styles.unconfiguredTitle}>⚡ SUPABASE SETUP REQUIRED</Text>
                <Text style={styles.unconfiguredText}>
                  Your project URL is configured, but the Anon Key is missing in `.env`.
                  You can explore in Demo Mode or paste your key into `.env`.
                </Text>
              </View>
            )}

            {/* Error Banner */}
            {displayedError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠️ {displayedError}</Text>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="athlete@example.com"
                placeholderTextColor="#64748B"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#64748B"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Submit Action */}
            <Pressable
              onPress={handleLogin}
              disabled={localLoading}
              style={({ pressed }) => [
                styles.submitBtn,
                localLoading && styles.submitBtnDisabled,
                pressed && styles.pressed,
              ]}>
              {localLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Sign In</Text>
              )}
            </Pressable>

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>New athlete?</Text>
              <Pressable onPress={() => router.push('/auth/register' as any)}>
                <Text style={styles.registerLink}>Create account</Text>
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Demo Mode Button */}
            <Pressable
              onPress={handleDemoMode}
              style={({ pressed }) => [styles.demoBtn, pressed && styles.pressed]}>
              <Text style={styles.demoBtnText}>🏃 Continue in Safe Demo Mode</Text>
              <Text style={styles.demoBtnSub}>Explore sample workouts without logging in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    padding: Spacing.four,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  subTitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  unconfiguredBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 4,
  },
  unconfiguredTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  unconfiguredText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  formGroup: {
    gap: 6,
  },
  label: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: '#F8FAF9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#0F172A',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  submitBtn: {
    backgroundColor: '#4FA99A',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#4FA99A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  registerPrompt: {
    color: '#64748B',
    fontSize: 13,
  },
  registerLink: {
    color: '#4FA99A',
    fontSize: 13,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  demoBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  demoBtnText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  demoBtnSub: {
    color: '#64748B',
    fontSize: 11,
  },
  pressed: {
    opacity: 0.8,
  },
});
