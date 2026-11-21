import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { AuthHeader } from '@/components/auth/auth-header';
import { AuthInput } from '@/components/auth/auth-input';
import { AuthButton } from '@/components/auth/auth-button';
import { AuthErrorBox } from '@/components/auth/auth-error-box';
import { BiometricCard } from '@/components/auth/biometric-card';
import { AuthDivider } from '@/components/auth/auth-divider';
import { authStyles as styles } from '@/components/auth/auth-styles';

export default function LoginScreen() {
  const { signIn, signInAsAthlete, error, clearError } = useAuth();
  const [email, setEmail] = useState('alex.vance@athletics.io');
  const [password, setPassword] = useState('PulseEngine#2025');
  const [rememberRig, setRememberRig] = useState(true);
  const [localLoading, setLocalLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleLogin = async () => {
    setValidationError(null);
    clearError();
    if (!email.trim() || !password) return setValidationError('Please enter both email and passcode.');
    if (!email.includes('@') || !email.includes('.')) return setValidationError('Please enter a valid athlete email address.');

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
      const formattedName = rawName.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await signInAsAthlete(formattedName, userEmail);
      router.replace('/' as any);
    } catch {
      Alert.alert('Biometric Auth', 'Failed to authenticate biometrics.');
    } finally {
      setLocalLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <AuthHeader title="Sign In" />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headingSection}>
            <Text style={styles.mainTitle}>Welcome Back, <Text style={{ color: '#006b5d' }}>Athlete</Text></Text>
            <Text style={styles.subtitle}>Sync your bio-telemetry and resume daily training.</Text>
          </View>
          <AuthErrorBox message={validationError || error} />
          <BiometricCard onUnlock={handleBiometricAuth} loading={localLoading} />
          <AuthDivider text="or sign in with telemetry id" />
          <AuthInput label="Athlete ID or Email" icon="fitness-outline" badge="VERIFIED SYNC" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <AuthInput
            label="Secret Passcode"
            icon="lock-closed-outline"
            isPassword
            value={password}
            onChangeText={setPassword}
            rightAction={{ text: 'Forgot Code?', onPress: () => Alert.alert('Passcode Recovery', 'A recovery link will be sent to your email.') }}
          />
          <Pressable onPress={() => setRememberRig((p) => !p)} style={styles.rememberRow}>
            <View style={[styles.checkbox, rememberRig && styles.checkboxChecked]}>
              {rememberRig && <Ionicons name="checkmark" size={14} color="#ffffff" />}
            </View>
            <Text style={styles.rememberText}>Remember this athletic rig</Text>
          </Pressable>
          <AuthButton label="Initialize Rig Link" loading={localLoading} onPress={handleLogin} />
          <Pressable onPress={() => router.push('/auth/register' as any)} style={styles.footerLink}>
            <Text style={styles.footerText}>New Athlete? <Text style={styles.footerHighlight}>Register Rig</Text></Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
