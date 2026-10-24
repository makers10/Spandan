import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SpandanLogo } from '@/components/fitness/spandan-logo';
import { useAuth } from '@/context/auth-context';
import { Spacing } from '@/constants/theme';

export function AuthModal() {
  const {
    isAuthModalVisible,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    signIn,
    signUp,
    signInAsAthlete,
    setDemoMode,
    isConfigured,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(authModalMode || 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Sync active tab if context mode changes
  React.useEffect(() => {
    if (authModalMode) {
      setActiveTab(authModalMode);
    }
  }, [authModalMode]);

  const handleOneTapAthlete = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const userEmail = email.trim() || 'athlete@trackyourmovement.app';
      const rawName = fullName.trim() || (userEmail.includes('@') ? userEmail.split('@')[0] : 'Alex Varma');
      const formattedName = rawName
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      await signInAsAthlete(formattedName, userEmail);
      closeAuthModal();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not sign in as athlete.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (activeTab === 'register') {
      if (!fullName.trim()) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        const res = await signUp(email.trim(), password, fullName.trim());
        if (res.requiresEmailConfirmation) {
          setSuccessNotice(
            'Account registered! Supabase requires email confirmation before cloud login. Tap the button below to enter immediately as an active athlete without waiting!'
          );
        } else {
          closeAuthModal();
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to register account.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        await signIn(email.trim(), password);
        closeAuthModal();
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to sign in. Verify your email and password.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleContinueDemo = () => {
    setDemoMode(true);
    closeAuthModal();
  };

  if (!isAuthModalVisible) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isAuthModalVisible}
      onRequestClose={closeAuthModal}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
              {/* Top Navigation Bar inside Modal */}
              <View style={styles.topBar}>
                <SpandanLogo size="medium" showTagline />
                <Pressable onPress={closeAuthModal} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </Pressable>
              </View>

              {/* Header Title */}
              <View style={styles.header}>
                <Text style={styles.title}>
                  {activeTab === 'login' ? 'Athlete Sign In' : 'Join Track your movement'}
                </Text>
                <Text style={styles.subTitle}>
                  {activeTab === 'login'
                    ? 'Log your miles, analyze GPS routes, and conquer milestones.'
                    : 'Create your athlete profile to start recording GPS activities.'}
                </Text>
              </View>

              {/* Segmented Mode Selector */}
              <View style={styles.segmentedRow}>
                <Pressable
                  onPress={() => {
                    setActiveTab('login');
                    setErrorMessage(null);
                    setSuccessNotice(null);
                  }}
                  style={[styles.segmentTab, activeTab === 'login' && styles.segmentTabActive]}>
                  <Text
                    style={[
                      styles.segmentTabText,
                      activeTab === 'login' && styles.segmentTabTextActive,
                    ]}>
                    Sign In
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    setActiveTab('register');
                    setErrorMessage(null);
                    setSuccessNotice(null);
                  }}
                  style={[styles.segmentTab, activeTab === 'register' && styles.segmentTabActive]}>
                  <Text
                    style={[
                      styles.segmentTabText,
                      activeTab === 'register' && styles.segmentTabTextActive,
                    ]}>
                    Create Account
                  </Text>
                </Pressable>
              </View>

              {/* Supabase status banner if unconfigured */}
              {!isConfigured && (
                <View style={styles.unconfiguredBox}>
                  <Text style={styles.unconfiguredTitle}>⚡ SUPABASE SETUP REQUIRED</Text>
                  <Text style={styles.unconfiguredText}>
                    Your project URL is configured, but the Anon Key is missing in `.env`.
                    You can explore in Demo Mode or use One-Tap Sign In.
                  </Text>
                </View>
              )}

              {/* Success / Email Notice */}
              {successNotice && (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>✉️ {successNotice}</Text>
                  <Pressable onPress={handleOneTapAthlete} style={styles.bypassBtn}>
                    <Text style={styles.bypassBtnText}>⚡ Enter App Immediately</Text>
                  </Pressable>
                </View>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
                  <Pressable onPress={handleOneTapAthlete} style={styles.bypassBtn}>
                    <Text style={styles.bypassBtnText}>⚡ Bypass & Enter as Active Athlete</Text>
                  </Pressable>
                </View>
              )}

              {/* One-Tap Sign In Button */}
              <Pressable
                onPress={handleOneTapAthlete}
                disabled={loading}
                style={({ pressed }) => [
                  styles.oneTapBtn,
                  loading && styles.btnDisabled,
                  pressed && styles.pressed,
                ]}>
                <View style={styles.oneTapIconCircle}>
                  <Text style={styles.oneTapIcon}>🏃</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.oneTapTitle}>One-Tap Sign In as Active Athlete</Text>
                  <Text style={styles.oneTapSub}>
                    {email.trim()
                      ? `Sign in immediately as ${email.trim()}`
                      : 'Enter immediately as Alex Varma — record GPS runs & view stats'}
                  </Text>
                </View>
              </Pressable>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR WITH CLOUD CREDENTIALS</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Form Fields */}
              {activeTab === 'register' && (
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
              )}

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
                  placeholder="At least 6 characters"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {activeTab === 'register' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>CONFIRM PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor="#64748B"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              )}

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitBtn,
                  loading && styles.btnDisabled,
                  pressed && styles.pressed,
                ]}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {activeTab === 'login' ? 'Sign In with Cloud' : 'Create Account'}
                  </Text>
                )}
              </Pressable>

              {/* Demo Mode Action */}
              <Pressable
                onPress={handleContinueDemo}
                style={({ pressed }) => [styles.demoBtn, pressed && styles.pressed]}>
                <Text style={styles.demoBtnText}>Continue in Demo Mode</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    padding: Spacing.four,
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
  },
  subTitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentTabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  oneTapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 169, 154, 0.08)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#4FA99A',
    gap: 12,
  },
  oneTapIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4FA99A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oneTapIcon: {
    fontSize: 20,
  },
  oneTapTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  oneTapSub: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  successBanner: {
    backgroundColor: 'rgba(79, 169, 154, 0.15)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 169, 154, 0.3)',
    gap: 8,
  },
  successText: {
    color: '#132A26',
    fontSize: 13,
    lineHeight: 18,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  bypassBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  bypassBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    marginTop: 4,
    shadowColor: '#4FA99A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
  },
});
