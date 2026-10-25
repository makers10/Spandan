import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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

export default function RegisterScreen() {
  const { signUp, signInAsAthlete, resendConfirmationEmail, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendFeedback, setResendFeedback] = useState('');

  const handleRegister = async () => {
    setValidationError(null);
    clearError();
    setResendStatus('idle');
    setResendFeedback('');

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
      // Supabase returns session: null when email confirmation is active
      if (res.requiresEmailConfirmation || !res.user?.confirmed_at) {
        setIsSuccess(true);
      } else {
        router.replace('/' as any);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already in use')
      ) {
        setValidationError(
          `This email is already registered. If you haven't confirmed your email yet, please check your inbox (including Spam/Junk) or tap Resend below.`
        );
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) return;
    setResendStatus('sending');
    setResendFeedback('');
    try {
      await resendConfirmationEmail(email.trim());
      setResendStatus('sent');
      setResendFeedback(`Verification link resent to ${email.trim()}! Please check your inbox.`);
    } catch (err: any) {
      setResendStatus('error');
      setResendFeedback(
        err?.message || 'Could not resend email right now. Please wait 60 seconds and try again.'
      );
    }
  };

  const handleOpenEmailApp = () => {
    Linking.openURL('mailto:').catch(() => {
      // Fallback if no mail client configured
    });
  };

  const handleInstantAccess = async () => {
    setLocalLoading(true);
    try {
      await signInAsAthlete(
        fullName.trim() || 'Alex Varma',
        email.trim() || 'athlete@trackyourmovement.app'
      );
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

            {/* Email Confirmation Notice (Success State) */}
            {isSuccess ? (
              <View style={styles.confirmationContainer}>
                {/* Visual Icon Badge */}
                <View style={styles.emailBadgeCircle}>
                  <Ionicons name="mail-outline" size={32} color="#4FA99A" />
                  <View style={styles.onlineDot} />
                </View>

                <Text style={styles.confirmationTitle}>Check Your Email</Text>
                <Text style={styles.confirmationSubtitle}>
                  Please confirm your email address to complete registration and activate cloud sync.
                </Text>

                {/* Recipient Badge */}
                <View style={styles.emailRecipientCard}>
                  <Text style={styles.recipientLabel}>CONFIRMATION SENT TO</Text>
                  <Text style={styles.recipientEmail}>{email.trim()}</Text>
                  <View style={styles.pendingPill}>
                    <Text style={styles.pendingPillText}>Verification Link Sent</Text>
                  </View>
                </View>

                {/* Clear Step-by-Step Instructions */}
                <View style={styles.instructionCard}>
                  <Text style={styles.instructionHeading}>What to do next:</Text>
                  
                  <View style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <View style={styles.stepTextContainer}>
                      <Text style={styles.stepTitle}>Check Your Inbox</Text>
                      <Text style={styles.stepDesc}>
                        Look for an email from <Text style={styles.boldText}>Track your movement</Text> or <Text style={styles.boldText}>Supabase</Text>. Also check your <Text style={styles.boldText}>Spam / Junk</Text> folder.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <View style={styles.stepTextContainer}>
                      <Text style={styles.stepTitle}>{"Click \"Confirm Your Email\""}</Text>
                      <Text style={styles.stepDesc}>
                        Tap the verification link in the email to activate your account.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stepItem}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <View style={styles.stepTextContainer}>
                      <Text style={styles.stepTitle}>Return and Sign In</Text>
                      <Text style={styles.stepDesc}>
                        Once confirmed, return to the app and sign in with your email and password.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Resend Status Banner */}
                {resendStatus === 'sent' && (
                  <View style={styles.resendSuccessBanner}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="checkmark-circle-outline" size={14} color="#34C759" />
                      <Text style={styles.resendSuccessText}>{resendFeedback}</Text>
                    </View>
                  </View>
                )}
                {resendStatus === 'error' && (
                  <View style={styles.resendErrorBanner}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="alert-circle-outline" size={14} color="#FF3B30" />
                      <Text style={styles.resendErrorText}>{resendFeedback}</Text>
                    </View>
                  </View>
                )}

                {/* Action: Open Email App */}
                <Pressable onPress={handleOpenEmailApp} style={styles.openEmailBtn}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Ionicons name="mail-open-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.openEmailBtnText}>Open Email App</Text>
                  </View>
                </Pressable>

                {/* Action: Resend Confirmation Link */}
                <Pressable
                  onPress={handleResend}
                  disabled={resendStatus === 'sending'}
                  style={styles.resendBtn}>
                  {resendStatus === 'sending' ? (
                    <ActivityIndicator size="small" color="#4FA99A" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Ionicons name="refresh-outline" size={13} color="#4FA99A" />
                      <Text style={styles.resendBtnText}>Resend Confirmation Email</Text>
                    </View>
                  )}
                </Pressable>

                {/* Divider */}
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR START TRACKING NOW</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Instant Active Athlete Bypass */}
                <Pressable
                  onPress={handleInstantAccess}
                  disabled={localLoading}
                  style={styles.instantAccessBtn}>
                  <Text style={styles.instantAccessBtnText}>
                    Enter App Immediately as {fullName.trim() || 'Active Athlete'}
                  </Text>
                  <Text style={styles.instantAccessBtnSub}>
                    Start logging runs and rides right away — workouts are saved locally and will sync once verified
                  </Text>
                </Pressable>

                {/* Back to Sign In */}
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="alert-circle-outline" size={16} color="#FF3B30" />
                      <Text style={styles.errorText}>{displayedError}</Text>
                    </View>
                    {displayedError.toLowerCase().includes('already registered') && (
                      <Pressable onPress={handleResend} style={styles.resendFromErrorBtn}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="refresh-outline" size={13} color="#4FA99A" />
                          <Text style={styles.resendFromErrorBtnText}>
                            Resend Confirmation Email to {email.trim() || 'this email'}
                          </Text>
                        </View>
                      </Pressable>
                    )}
                    <Pressable onPress={handleInstantAccess} style={styles.instantErrorBtn}>
                      <Text style={styles.instantErrorBtnText}>Bypass & Enter as Active Athlete</Text>
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

                {/* Email Confirmation Notice Prior to Submission */}
                <View style={styles.preNoticeBox}>
                  <Text style={styles.preNoticeText}>
                    ℹ️ <Text style={styles.boldText}>Note:</Text> After registration, you will receive a confirmation email with a verification link.
                  </Text>
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
                    <Ionicons name="flash-outline" size={20} color="#4FA99A" />
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
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  resendFromErrorBtn: {
    backgroundColor: 'rgba(79, 169, 154, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  resendFromErrorBtnText: {
    color: '#4FA99A',
    fontSize: 12,
    fontWeight: '700',
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
  preNoticeBox: {
    backgroundColor: 'rgba(79, 169, 154, 0.08)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(79, 169, 154, 0.2)',
  },
  preNoticeText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '700',
    color: '#0F172A',
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
    marginTop: 2,
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
  confirmationContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 14,
  },
  emailBadgeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(79, 169, 154, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#4FA99A',
  },
  emailBadgeEmoji: {
    fontSize: 32,
  },
  onlineDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4FA99A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  confirmationTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  confirmationSubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  emailRecipientCard: {
    backgroundColor: '#F8FAF9',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  recipientLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  recipientEmail: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  pendingPill: {
    backgroundColor: 'rgba(79, 169, 154, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginTop: 4,
  },
  pendingPillText: {
    color: '#4FA99A',
    fontSize: 11,
    fontWeight: '700',
  },
  instructionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  instructionHeading: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  stepItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4FA99A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepTextContainer: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  stepDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  resendSuccessBanner: {
    backgroundColor: 'rgba(79, 169, 154, 0.12)',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(79, 169, 154, 0.3)',
  },
  resendSuccessText: {
    color: '#4FA99A',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  resendErrorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  resendErrorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  openEmailBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  openEmailBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  resendBtn: {
    backgroundColor: 'rgba(79, 169, 154, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 169, 154, 0.3)',
  },
  resendBtnText: {
    color: '#4FA99A',
    fontSize: 14,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  instantAccessBtn: {
    backgroundColor: '#4FA99A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
    gap: 4,
    shadowColor: '#4FA99A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  instantAccessBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  instantAccessBtnSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  instantErrorBtn: {
    backgroundColor: '#4FA99A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
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
    width: '100%',
    alignItems: 'center',
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
