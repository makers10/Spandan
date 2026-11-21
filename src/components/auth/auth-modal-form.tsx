import React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authModalStyles as styles } from './auth-modal-styles';

interface AuthModalFormProps {
  activeTab: 'login' | 'register';
  fullName: string;
  setFullName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  loading: boolean;
  onSubmit: () => void;
  onDemo: () => void;
  onOneTap: () => void;
}

export function AuthModalForm({
  activeTab, fullName, setFullName, email, setEmail, password, setPassword,
  confirmPassword, setConfirmPassword, loading, onSubmit, onDemo, onOneTap,
}: AuthModalFormProps) {
  const isRegister = activeTab === 'register';

  return (
    <>
      <Pressable onPress={onOneTap} disabled={loading} style={({ pressed }) => [styles.oneTapBtn, loading && styles.btnDisabled, pressed && styles.pressed]}>
        <View style={styles.oneTapIconCircle}>
          <Ionicons name="person-outline" size={20} color="#4FA99A" />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.oneTapTitle}>One-Tap Sign In as Active Athlete</Text>
          <Text style={styles.oneTapSub}>
            {email.trim() ? `Sign in immediately as ${email.trim()}` : 'Enter immediately as Alex Vance — record GPS runs & view stats'}
          </Text>
        </View>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} /><Text style={styles.dividerText}>OR WITH CLOUD CREDENTIALS</Text><View style={styles.dividerLine} />
      </View>

      {isRegister && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>FULL NAME</Text>
          <TextInput style={styles.input} placeholder="e.g. Alex Vance" placeholderTextColor="#64748B" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
        </View>
      )}

      <View style={styles.formGroup}>
        <Text style={styles.label}>EMAIL ADDRESS</Text>
        <TextInput style={styles.input} placeholder="athlete@example.com" placeholderTextColor="#64748B" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>PASSWORD</Text>
        <TextInput style={styles.input} placeholder="At least 6 characters" placeholderTextColor="#64748B" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
      </View>

      {isRegister && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>CONFIRM PASSWORD</Text>
          <TextInput style={styles.input} placeholder="Re-enter password" placeholderTextColor="#64748B" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />
        </View>
      )}

      <Pressable onPress={onSubmit} disabled={loading} style={({ pressed }) => [styles.submitBtn, loading && styles.btnDisabled, pressed && styles.pressed]}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>{isRegister ? 'Create Account' : 'Sign In with Cloud'}</Text>}
      </Pressable>

      <Pressable onPress={onDemo} style={({ pressed }) => [styles.demoBtn, pressed && styles.pressed]}>
        <Text style={styles.demoBtnText}>Continue in Demo Mode</Text>
      </Pressable>
    </>
  );
}

