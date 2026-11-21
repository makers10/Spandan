import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthErrorBox } from '@/components/auth/auth-error-box';
import { AuthStepper } from '@/components/auth/auth-stepper';
import { DisciplineSelector, Discipline } from '@/components/auth/discipline-selector';
import { authStyles as styles } from '@/components/auth/auth-styles';

export default function RegisterScreen() {
  const { signUp, error, clearError } = useAuth();
  const [fullName, setFullName] = useState('Alex Vance');
  const [email, setEmail] = useState('alex.runner@precision.io');
  const [password, setPassword] = useState('K1net1c-Pr0#2024');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline>('Running');
  const [localLoading, setLocalLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async () => {
    setValidationError(null);
    clearError();
    if (!fullName.trim()) return setValidationError('Please enter your athlete identity name.');
    if (!email.trim() || !email.includes('@') || !email.includes('.')) return setValidationError('Please enter a valid athlete telemetry email.');
    if (password.length < 6) return setValidationError('Password must be at least 6 characters.');

    setLocalLoading(true);
    try {
      const res = await signUp(email.trim(), password, fullName.trim());
      if (res.requiresEmailConfirmation || !res.user?.confirmed_at) {
        setIsSuccess(true);
      } else {
        router.replace('/' as any);
      }
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to initialize athlete profile.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <AuthHeader title="Create Account" />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <AuthStepper step={1} total={3} />
          <View style={styles.headingSection}>
            <Text style={styles.mainTitle}>Create Athlete Profile</Text>
            <Text style={styles.subtitle}>Calibrate precision biomechanics and performance telemetry.</Text>
          </View>
          {isSuccess && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color="#006b5d" style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Profile Initialized!</Text>
                <Text style={styles.successSub}>Please check {email} to confirm your telemetry access link.</Text>
              </View>
            </View>
          )}
          <AuthErrorBox message={validationError || error} />
          <AuthInput label="Athlete Call-Sign / Full Name" icon="person-outline" value={fullName} onChangeText={setFullName} />
          <AuthInput label="Telemetry Sync Email" icon="mail-outline" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <AuthInput label="Secure Passcode" icon="lock-closed-outline" isPassword value={password} onChangeText={setPassword} />
          <DisciplineSelector selected={selectedDiscipline} onSelect={setSelectedDiscipline} />
          <AuthButton label="Deploy Athletic Profile" loading={localLoading} onPress={handleRegister} />
          <Pressable onPress={() => router.push('/auth/login' as any)} style={styles.footerLink}>
            <Text style={styles.footerText}>Already calibrated? <Text style={styles.footerHighlight}>Sign In</Text></Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
