import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { signIn, signInAsAthlete, error, clearError } = useAuth();

  const [email, setEmail] = useState('alex.vance@athletics.io');
  const [password, setPassword] = useState('PulseEngine#2025');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberRig, setRememberRig] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleLogin = async () => {
    setValidationError(null);
    clearError();

    if (!email.trim() || !password) {
      setValidationError('Please enter both email and passcode.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setValidationError('Please enter a valid athlete email address.');
      return;
    }

    setLocalLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/' as any);
    } catch {
      // Handled by AuthContext
    } finally {
      setLocalLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    setLocalLoading(true);
    try {
      const userEmail = email.trim() || 'alex.vance@athletics.io';
      const rawName = userEmail.includes('@') ? userEmail.split('@')[0] : 'Alex Vance';
      const formattedName = rawName
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      await signInAsAthlete(formattedName, userEmail);
      router.replace('/' as any);
    } catch {
      Alert.alert('Biometric Auth', 'Failed to authenticate biometrics.');
    } finally {
      setLocalLoading(false);
    }
  };

  const displayedError = validationError || error;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Pressable
            aria-label="Go Back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}>
            <Ionicons name="arrow-back" size={22} color="#131b2e" />
          </Pressable>

          <View style={styles.headerTitleCenter}>
            <Text style={styles.kineticBrandCaps}>KINETIC</Text>
            <Text style={styles.screenHeading}>Sign In</Text>
          </View>

          <View style={styles.profileCircle}>
            <Ionicons name="person" size={16} color="#ffffff" />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Top Status & Sensor Standby Pills */}
          <View style={styles.statusRow}>
            <View style={styles.authBadgePill}>
              <View style={styles.pulseDot} />
              <Text style={styles.authBadgeText}>KINETIC {'//'} AUTH-01</Text>
            </View>

            <View style={styles.sensorStandbyPill}>
              <View style={styles.sensorDot} />
              <Text style={styles.sensorStandbyText}>SENSORS STANDBY</Text>
            </View>
          </View>

          {/* Heading */}
          <View style={styles.headingSection}>
            <Text style={styles.mainTitle}>
              Welcome Back, <Text style={{ color: '#006b5d' }}>Athlete</Text>
            </Text>
            <Text style={styles.subtitle}>
              Sync your bio-telemetry and resume daily training.
            </Text>
          </View>

          {/* Error Message */}
          {displayedError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={17} color="#ba1a1a" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{displayedError}</Text>
            </View>
          )}

          {/* Biometrics Authorization Card */}
          <View style={styles.biometricCard}>
            <View style={styles.biometricLeft}>
              <View style={styles.fingerprintCircle}>
                <Ionicons name="finger-print-outline" size={24} color="#006b5d" />
                <View style={styles.fingerprintBadgeDot} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.biometricTitle}>Face ID / Biometrics</Text>
                  <View style={styles.fastBadge}>
                    <Text style={styles.fastBadgeText}>FAST</Text>
                  </View>
                </View>
                <Text style={styles.biometricSub}>Touch to authorize secure bio-link</Text>
              </View>
            </View>

            <Pressable
              aria-label="Authenticate with biometrics"
              onPress={handleBiometricAuth}
              disabled={localLoading}
              style={({ pressed }) => [styles.unlockBtn, pressed && styles.btnPressed]}>
              <Ionicons name="lock-open-outline" size={16} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.unlockBtnText}>Unlock</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in with telemetry id</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Athlete ID or Email</Text>
                <Text style={styles.fieldBadge}>VERIFIED SYNC</Text>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="fitness-outline"
                  size={19}
                  color="#64748b"
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="alex.vance@athletics.io"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>Secret Passcode</Text>
                <Pressable
                  onPress={() =>
                    Alert.alert('Passcode Recovery', 'A recovery link will be sent to your registered email.')
                  }>
                  <Text style={styles.forgotLink}>Forgot Code?</Text>
                </Pressable>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#64748b"
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  style={[styles.textInput, { paddingRight: 40 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.inputRightToggle}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#64748b"
                  />
                </Pressable>
              </View>
            </View>

            {/* Remember Rig Checkbox */}
            <View style={styles.rememberRow}>
              <Pressable
                onPress={() => setRememberRig((prev) => !prev)}
                style={styles.checkboxContainer}>
                <View style={[styles.checkboxBox, rememberRig && styles.checkboxBoxChecked]}>
                  {rememberRig && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                </View>
                <Text style={styles.rememberText}>Remember this athletic rig</Text>
              </Pressable>
              <Text style={styles.tokenText}>30-day token</Text>
            </View>

            {/* Primary Submit Button */}
            <Pressable
              onPress={handleLogin}
              disabled={localLoading}
              style={({ pressed }) => [styles.submitBtn, pressed && styles.btnPressed]}>
              {localLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>SIGN IN TO KINETIC</Text>
                  <Ionicons name="flash" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </>
              )}
            </Pressable>
          </View>

          {/* Athletic Data Integrations */}
          <View style={styles.integrationsSection}>
            <Text style={styles.integrationsTitle}>ATHLETIC DATA INTEGRATIONS</Text>
            <View style={styles.integrationsGrid}>
              <Pressable
                onPress={() => Alert.alert('Apple Health', 'Apple Health integration active.')}
                style={({ pressed }) => [styles.integrationBtn, pressed && styles.btnPressed]}>
                <Ionicons name="heart" size={18} color="#a73a05" style={{ marginRight: 6 }} />
                <Text style={styles.integrationBtnText}>Apple Health</Text>
              </Pressable>

              <Pressable
                onPress={() => Alert.alert('Strava Sync', 'Strava Sync API verified.')}
                style={({ pressed }) => [styles.integrationBtn, pressed && styles.btnPressed]}>
                <Ionicons name="sync-outline" size={18} color="#006b5d" style={{ marginRight: 6 }} />
                <Text style={styles.integrationBtnText}>Strava Sync</Text>
              </Pressable>
            </View>
          </View>

          {/* Join Roster Card */}
          <View style={styles.joinRosterCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.rosterBadgeIcon}>
                <Ionicons name="id-card-outline" size={18} color="#006b5d" />
              </View>
              <View>
                <Text style={styles.rosterCardTitle}>New to the Kinetic roster?</Text>
                <Text style={styles.rosterCardSub}>Calibrate your telemetry suite</Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/auth/register')}
              style={({ pressed }) => [styles.joinRosterBtn, pressed && styles.btnPressed]}>
              <Text style={styles.joinRosterBtnText}>Join Roster</Text>
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
    backgroundColor: '#faf8ff',
  },
  container: {
    flex: 1,
  },
  headerBar: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(250, 248, 255, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kineticBrandCaps: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006b5d',
    letterSpacing: 1.5,
  },
  screenHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#131b2e',
    letterSpacing: -0.2,
  },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#006b5d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  authBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e7ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00b8a2',
  },
  authBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#006b5d',
    letterSpacing: 1,
  },
  sensorStandbyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    gap: 6,
  },
  sensorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00b8a2',
  },
  sensorStandbyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  headingSection: {
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#131b2e',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffdad6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#ba1a1a',
  },
  biometricCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
    marginBottom: 16,
  },
  biometricLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fingerprintCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fingerprintBadgeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00b8a2',
  },
  biometricTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#131b2e',
  },
  fastBadge: {
    backgroundColor: '#ffdbcf',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  fastBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#802900',
  },
  biometricSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00b8a2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#00b8a2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  unlockBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e7ff',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  formSection: {
    gap: 14,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#131b2e',
  },
  fieldBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#006b5d',
    letterSpacing: 0.5,
  },
  forgotLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006b5d',
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputLeftIcon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  textInput: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingLeft: 42,
    paddingRight: 14,
    fontSize: 13,
    color: '#131b2e',
    borderWidth: 1,
    borderColor: '#e2e7ff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputRightToggle: {
    position: 'absolute',
    right: 12,
    padding: 6,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    backgroundColor: '#eaedff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbcac5',
  },
  checkboxBoxChecked: {
    backgroundColor: '#006b5d',
    borderColor: '#006b5d',
  },
  rememberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#131b2e',
  },
  tokenText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  submitBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#006b5d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#006b5d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  integrationsSection: {
    marginTop: 24,
    gap: 10,
  },
  integrationsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    textAlign: 'center',
    letterSpacing: 1,
  },
  integrationsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  integrationBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e7ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  integrationBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#131b2e',
  },
  joinRosterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f3ff',
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#dae2fd',
  },
  rosterBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e2e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#131b2e',
  },
  rosterCardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  joinRosterBtn: {
    backgroundColor: '#dae2fd',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  joinRosterBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006b5d',
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.88,
  },
});
