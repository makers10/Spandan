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
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { signIn, signInAsAthlete, resendConfirmationEmail, isConfigured, setDemoMode, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendFeedback, setResendFeedback] = useState('');

  const handleLogin = async () => {
    setValidationError(null);
    clearError();
    setResendFeedback('');

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

  const handleResendConfirm = async () => {
    if (!email.trim()) {
      setValidationError('Please enter your email address to resend confirmation.');
      return;
    }
    setResendLoading(true);
    try {
      await resendConfirmationEmail(email.trim());
      setResendFeedback(`Confirmation link resent to ${email.trim()}! Please check your inbox.`);
    } catch (err: any) {
      setResendFeedback(err?.message || 'Could not resend email right now.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleAthleteSignIn = async () => {
    setLocalLoading(true);
    try {
      const userEmail = email.trim() || 'athlete@trackyourmovement.app';
      const rawName = userEmail.includes('@') ? userEmail.split('@')[0] : 'Alex Varma';
      const formattedName = rawName
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      await signInAsAthlete(formattedName, userEmail);
      router.replace('/' as any);
    } catch (err: any) {
      console.warn('Local athlete sign in error:', err);
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="warning-outline" size={16} color="#FF9500" />
                  <Text style={styles.unconfiguredTitle}>SUPABASE SETUP REQUIRED</Text>
                </View>
                <Text style={styles.unconfiguredText}>
                  Your project URL is configured, but the Anon Key is missing in `.env`.
                  You can explore in Demo Mode or paste your key into `.env`.
                </Text>
              </View>
            )}

            {/* Error Banner with Instant Bypass */}
            {displayedError && (
              <View style={styles.errorBanner}>
                {displayedError.toLowerCase().includes('email not confirmed') ? (
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="mail-outline" size={16} color="#34C759" />
                      <Text style={[styles.errorText, { fontWeight: '800' }]}>
                        Email Confirmation Pending
                      </Text>
                    </View>
                    <Text style={[styles.errorText, { fontWeight: '400', fontSize: 12 }]}>
                      Your account requires email confirmation. Please check your inbox (and Spam/Junk folder) at {email.trim() || 'your email'} and tap the verification link.
                    </Text>
                    {resendFeedback ? (
                      <Text style={{ color: '#4FA99A', fontSize: 12, fontWeight: '700' }}>
                        {resendFeedback}
                      </Text>
                    ) : (
                      <Pressable
                        onPress={handleResendConfirm}
                        disabled={resendLoading}
                        style={{
                          backgroundColor: 'rgba(79, 169, 154, 0.15)',
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          alignSelf: 'flex-start',
                        }}>
                        {resendLoading ? (
                          <ActivityIndicator size="small" color="#4FA99A" />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Ionicons name="refresh-outline" size={13} color="#4FA99A" />
                            <Text style={{ color: '#4FA99A', fontSize: 12, fontWeight: '700' }}>
                              Resend Confirmation Email
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    )}
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="alert-circle-outline" size={16} color="#FF3B30" />
                    <Text style={styles.errorText}>{displayedError}</Text>
                  </View>
                )}
                <Pressable
                  onPress={handleAthleteSignIn}
                  style={({ pressed }) => [styles.instantErrorBtn, pressed && styles.pressed]}>
                  <Text style={styles.instantErrorBtnText}>Bypass & Enter as Active Athlete Now</Text>
                </Pressable>
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

            {/* Instant Active Athlete Quick Access */}
            <Pressable
              onPress={handleAthleteSignIn}
              disabled={localLoading}
              style={({ pressed }) => [
                styles.athleteFastBtn,
                localLoading && styles.submitBtnDisabled,
                pressed && styles.pressed,
              ]}>
              <View style={styles.athleteFastIconCircle}>
                <Ionicons name="person-outline" size={20} color="#4FA99A" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.athleteFastTitle}>Sign In as Active Athlete (One-Tap)</Text>
                <Text style={styles.athleteFastSub}>
                  {email.trim()
                    ? `Enter immediately as ${email.trim()}`
                    : 'Enter as Alex Varma — record GPS runs & view stats'}
                </Text>
              </View>
            </Pressable>

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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="eye-outline" size={16} color="#64748B" />
                <Text style={styles.demoBtnText}>Continue in Safe Demo Mode</Text>
              </View>
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
  instantErrorBtn: {
    marginTop: 8,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  instantErrorBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
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
