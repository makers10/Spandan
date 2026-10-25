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

type Discipline = 'Running' | 'Cycling' | 'Hybrid' | 'Rowing';

export default function RegisterScreen() {
  const { signUp, error, clearError } = useAuth();

  const [fullName, setFullName] = useState('Alex Vance');
  const [email, setEmail] = useState('alex.runner@precision.io');
  const [password, setPassword] = useState('K1net1c-Pr0#2024');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline>('Running');
  const [autoCalibrateIMU, setAutoCalibrateIMU] = useState(true);

  const [localLoading, setLocalLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async () => {
    setValidationError(null);
    clearError();

    if (!fullName.trim()) {
      setValidationError('Please enter your athlete identity name.');
      return;
    }

    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setValidationError('Please enter a valid athlete telemetry email.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    setLocalLoading(true);
    try {
      const res = await signUp(email.trim(), password, fullName.trim());
      if (res.requiresEmailConfirmation || !res.user?.confirmed_at) {
        setIsSuccess(true);
      } else {
        router.replace('/' as any);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to initialize athlete profile.';
      setValidationError(msg);
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
            <Text style={styles.screenHeading}>Create Account</Text>
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
          {/* Top Stepper & Telemetry Pill */}
          <View style={styles.stepperSection}>
            <View style={styles.stepperHeader}>
              <View style={styles.protocolBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.protocolText}>CALIBRATION PROTOCOL</Text>
              </View>
              <Text style={styles.stepCountText}>Step 1 of 3</Text>
            </View>
            <View style={styles.stepperTrack}>
              <View style={styles.stepperFill} />
            </View>
          </View>

          {/* Screen Heading */}
          <View style={styles.headingSection}>
            <Text style={styles.mainTitle}>Create Athlete Profile</Text>
            <Text style={styles.subtitle}>
              Calibrate precision biomechanics and performance telemetry.
            </Text>
          </View>

          {/* Success Banner if awaiting email confirmation */}
          {isSuccess && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color="#006b5d" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Profile Initialized!</Text>
                <Text style={styles.successSub}>
                  Please check {email} to confirm your telemetry access link.
                </Text>
              </View>
            </View>
          )}

          {/* Error Message */}
          {displayedError && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#ba1a1a" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{displayedError}</Text>
            </View>
          )}

          {/* Fast Onboarding / Social Link Hub */}
          <View style={styles.fastHubGrid}>
            <Pressable
              onPress={() => Alert.alert('Apple ID', 'Apple ID telemetry sync initiated.')}
              style={({ pressed }) => [styles.fastHubBtn, pressed && styles.btnPressed]}>
              <Ionicons name="logo-apple" size={18} color="#131b2e" style={{ marginRight: 6 }} />
              <Text style={styles.fastHubBtnText}>Apple ID</Text>
            </Pressable>

            <Pressable
              onPress={() => Alert.alert('Strava Sync', 'Strava Kinetic webhook connected.')}
              style={({ pressed }) => [styles.fastHubBtn, pressed && styles.btnPressed]}>
              <Ionicons name="bicycle" size={18} color="#a73a05" style={{ marginRight: 6 }} />
              <Text style={styles.fastHubBtnText}>Strava Sync</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or manual telemetry input</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>ATHLETE IDENTITY</Text>
                <Text style={styles.fieldBadge}>Verified ID</Text>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="id-card-outline"
                  size={19}
                  color="#6c7a76"
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  style={[styles.textInput, { paddingRight: 40 }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="First and last name"
                  placeholderTextColor="#94a3b8"
                />
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#00b8a2"
                  style={styles.inputRightIcon}
                />
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>TELEMETRY STREAM (EMAIL)</Text>
                <Text style={styles.fieldSubLabel}>Cloud Link</Text>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color="#6c7a76"
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  style={[styles.textInput, { paddingRight: 40 }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your.handle@domain.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color="#00b8a2"
                  style={styles.inputRightIcon}
                />
              </View>
            </View>

            {/* Primary Discipline Selector Chips */}
            <View style={styles.disciplineSection}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>PRIMARY DISCIPLINE</Text>
                <Text style={styles.activeSensorLabel}>Active Sensor Profile</Text>
              </View>

              <View style={styles.disciplineGrid}>
                {[
                  {
                    name: 'Running' as const,
                    sub: 'Gait / Cadence',
                    icon: 'fitness-outline' as const,
                  },
                  {
                    name: 'Cycling' as const,
                    sub: 'Power / W-Bal',
                    icon: 'bicycle-outline' as const,
                  },
                  {
                    name: 'Hybrid' as const,
                    sub: 'Strain / HR-V',
                    icon: 'barbell-outline' as const,
                  },
                  {
                    name: 'Rowing' as const,
                    sub: 'Stroke Force',
                    icon: 'boat-outline' as const,
                  },
                ].map((item) => {
                  const isSelected = selectedDiscipline === item.name;
                  return (
                    <Pressable
                      key={item.name}
                      onPress={() => setSelectedDiscipline(item.name)}
                      style={[
                        styles.disciplineChip,
                        isSelected && styles.disciplineChipActive,
                      ]}>
                      <View
                        style={[
                          styles.chipIconWrap,
                          isSelected && styles.chipIconWrapActive,
                        ]}>
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={isSelected ? '#ffffff' : '#64748b'}
                        />
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.chipTitle,
                            isSelected && styles.chipTitleActive,
                          ]}>
                          {item.name}
                        </Text>
                        <Text
                          style={[
                            styles.chipSub,
                            isSelected && styles.chipSubActive,
                          ]}>
                          {item.sub}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Password Field & Strength Meter */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>ACCESS ENCRYPTION</Text>
                <Text style={styles.biometricGuardText}>Biometric Guard</Text>
              </View>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#6c7a76"
                  style={styles.inputLeftIcon}
                />
                <TextInput
                  style={[styles.textInput, { paddingRight: 40 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 12 characters"
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

              {/* Strength Meter Cardlet */}
              <View style={styles.strengthCardlet}>
                <View style={styles.strengthHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="shield-checkmark-outline" size={15} color="#00b8a2" />
                    <Text style={styles.strengthText}>Secure: 12+ chars, biometric ready</Text>
                  </View>
                  <Text style={styles.strengthPctText}>98% STRENGTH</Text>
                </View>
                <View style={styles.strengthBarRow}>
                  <View style={styles.strengthSegment} />
                  <View style={styles.strengthSegment} />
                  <View style={styles.strengthSegment} />
                  <View style={styles.strengthSegment} />
                </View>
              </View>
            </View>

            {/* Sensor Auto-calibrate Toggle Card */}
            <Pressable
              onPress={() => setAutoCalibrateIMU((prev) => !prev)}
              style={styles.imuCard}>
              <View
                style={[
                  styles.checkboxBox,
                  autoCalibrateIMU && styles.checkboxBoxChecked,
                ]}>
                {autoCalibrateIMU && (
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.imuTitle}>
                  Auto-calibrate IMU sensor stream &amp; telemetry logs
                </Text>
                <Text style={styles.imuDescription}>
                  Calculates real-time force vectors, ground contact balance, and VO2-max estimation
                  curves automatically.
                </Text>
              </View>
            </Pressable>

            {/* Terms Disclaimer */}
            <Text style={styles.disclaimerText}>
              By initializing profile calibration, you endorse {"Kinetic's"}{' '}
              <Text style={styles.linkText}>Terms of Performance</Text> and{' '}
              <Text style={styles.linkText}>Privacy Encryption Standards</Text>.
            </Text>

            {/* Primary Action Button */}
            <Pressable
              onPress={handleRegister}
              disabled={localLoading}
              style={({ pressed }) => [styles.createBtn, pressed && styles.btnPressed]}>
              {localLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.createBtnText}>CREATE ACCOUNT &amp; SYNC</Text>
                  <Ionicons name="arrow-forward" size={19} color="#ffffff" style={{ marginLeft: 6 }} />
                </>
              )}
            </Pressable>

            {/* Secondary Sign In Link */}
            <View style={styles.signInRow}>
              <Text style={styles.alreadyAccountText}>Already have an account?</Text>
              <Pressable onPress={() => router.push('/auth/login')}>
                <Text style={styles.signInLinkText}>Sign In</Text>
              </Pressable>
            </View>
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
  stepperSection: {
    gap: 6,
    marginBottom: 16,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  protocolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00b8a2',
  },
  protocolText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#006b5d',
    letterSpacing: 1.2,
  },
  stepCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  stepperTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#eaedff',
    overflow: 'hidden',
  },
  stepperFill: {
    width: '33.3%',
    height: '100%',
    backgroundColor: '#00b8a2',
    borderRadius: 3,
  },
  headingSection: {
    marginBottom: 18,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#131b2e',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6fbf7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#006b5d',
  },
  successSub: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
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
  fastHubGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  fastHubBtn: {
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
  fastHubBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#131b2e',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  fieldBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006b5d',
  },
  fieldSubLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  biometricGuardText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006b5d',
  },
  activeSensorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00b8a2',
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
  inputRightIcon: {
    position: 'absolute',
    right: 14,
    zIndex: 1,
  },
  inputRightToggle: {
    position: 'absolute',
    right: 12,
    padding: 6,
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
  disciplineSection: {
    gap: 8,
  },
  disciplineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  disciplineChip: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e7ff',
  },
  disciplineChipActive: {
    backgroundColor: '#006b5d',
    borderColor: '#006b5d',
    shadowColor: '#00b8a2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 2,
  },
  chipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#eaedff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipIconWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  chipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#131b2e',
  },
  chipTitleActive: {
    color: '#ffffff',
  },
  chipSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  chipSubActive: {
    color: '#6df9e0',
  },
  strengthCardlet: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e7ff',
    gap: 8,
    marginTop: 4,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#131b2e',
  },
  strengthPctText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#006b5d',
    letterSpacing: 0.8,
  },
  strengthBarRow: {
    flexDirection: 'row',
    gap: 6,
  },
  strengthSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00b8a2',
  },
  imuCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e7ff',
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#eaedff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbcac5',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: '#00b8a2',
    borderColor: '#00b8a2',
  },
  imuTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#131b2e',
    lineHeight: 16,
  },
  imuDescription: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
    marginTop: 3,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  linkText: {
    color: '#006b5d',
    fontWeight: '700',
  },
  createBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#006b5d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00b8a2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
    marginTop: 4,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  alreadyAccountText: {
    fontSize: 12,
    color: '#64748b',
  },
  signInLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006b5d',
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.88,
  },
});
