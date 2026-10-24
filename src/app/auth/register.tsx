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

export default function RegisterScreen() {
  const { signUp, signInAsAthlete, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async () => {
    setValidationError(null);
    clearError();

    if (!fullName.trim()) {
      setValidationError('Please enter your full name.');
      return;
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setValidationError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setLocalLoading(true);
    try {
      const res = await signUp(email.trim(), password, fullName.trim());
      if (res.requiresEmailConfirmation) {
        setIsSuccess(true);
        setSuccessMessage(
          `Supabase created your account, but requires email confirmation before cloud login. You can confirm via your email inbox, or tap below to start tracking workouts immediately!`
        );
      } else {
        router.replace('/' as any);
      }
    } catch {
      // handled by context error
    } finally {
      setLocalLoading(false);
    }
  };

  const handleInstantAccess = async () => {
    setLocalLoading(true);
    try {
      await signInAsAthlete(fullName.trim() || 'Alex Varma', email.trim() || 'athlete@trackyourmovement.app');
      router.replace('/' as any);
    } finally {
      setLocalLoading(false);
    }
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
              <Text style={styles.title}>Join Track your movement</Text>
              <Text style={styles.subTitle}>
                Create an athlete profile to log workouts, track personal records, and sync your training.
              </Text>
            </View>

            {/* Success State */}
            {isSuccess ? (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✉️</Text>
                <Text style={styles.successTitle}>Account Created</Text>
                <Text style={styles.successText}>{successMessage}</Text>

                <Pressable
                  onPress={handleInstantAccess}
                  style={styles.instantAccessBtn}>
                  <Text style={styles.instantAccessBtnText}>⚡ Enter App Immediately</Text>
                  <Text style={styles.instantAccessBtnSub}>
                    Start recording GPS runs right now without waiting for email confirmation
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => router.replace('/auth/login' as any)}
                  style={styles.backToLoginBtn}>
                  <Text style={styles.backToLoginBtnText}>Return to Sign In</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {/* Error Banner */}
                {displayedError && (
                  <View style={styles.errorBanner}>
                    <Text style={styles.errorText}>⚠️ {displayedError}</Text>
                    <Pressable onPress={handleInstantAccess} style={styles.instantErrorBtn}>
                      <Text style={styles.instantErrorBtnText}>⚡ Bypass & Enter as Active Athlete</Text>
                    </Pressable>
                  </View>
                )}

                {/* Form Fields */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>FULL NAME</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Alex Varma"
                    placeholderTextColor="#64748B"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>

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
                  <Text style={styles.label}>PASSWORD (MIN 6 CHARACTERS)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Choose secure password"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>CONFIRM PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat password"
                    placeholderTextColor="#64748B"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>

                {/* Submit Action */}
                <Pressable
                  onPress={handleRegister}
                  disabled={localLoading}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    localLoading && styles.submitBtnDisabled,
                    pressed && styles.pressed,
                  ]}>
                  {localLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitBtnText}>Create Account</Text>
                  )}
                </Pressable>

                {/* Instant Active Athlete Quick Access */}
                <Pressable
                  onPress={handleInstantAccess}
                  disabled={localLoading}
                  style={({ pressed }) => [
                    styles.athleteFastBtn,
                    localLoading && styles.submitBtnDisabled,
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.athleteFastIconCircle}>
                    <Text style={styles.athleteFastIcon}>⚡</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.athleteFastTitle}>One-Tap Enter as Active Athlete</Text>
                    <Text style={styles.athleteFastSub}>
                      {fullName.trim()
                        ? `Enter as ${fullName.trim()} — start tracking immediately`
                        : 'Skip email confirmation & enter immediately'}
                    </Text>
                  </View>
                </Pressable>

                {/* Return to Login */}
                <View style={styles.loginRow}>
                  <Text style={styles.loginPrompt}>Already have an account?</Text>
                  <Pressable onPress={() => router.push('/auth/login' as any)}>
                    <Text style={styles.loginLink}>Sign In</Text>
                  </Pressable>
                </View>
              </>
            )}
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  loginPrompt: {
    color: '#64748B',
    fontSize: 13,
  },
  loginLink: {
    color: '#4FA99A',
    fontSize: 13,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  successIcon: {
    fontSize: 40,
  },
  successTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  successText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  instantAccessBtn: {
    backgroundColor: '#4FA99A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
    gap: 4,
    marginTop: 8,
    shadowColor: '#4FA99A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  instantAccessBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  instantAccessBtnSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    textAlign: 'center',
  },
  instantErrorBtn: {
    backgroundColor: '#4FA99A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  instantErrorBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  backToLoginBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backToLoginBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  athleteFastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 169, 154, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#4FA99A',
    gap: 12,
    marginTop: 4,
  },
  athleteFastIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4FA99A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  athleteFastIcon: {
    fontSize: 20,
  },
  athleteFastTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  athleteFastSub: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
  },
  pressed: {
    opacity: 0.8,
  },
});
