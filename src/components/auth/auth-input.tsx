import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthInputProps extends TextInputProps {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
  rightAction?: {
    text: string;
    onPress: () => void;
  };
  isPassword?: boolean;
}

export function AuthInput({
  label,
  icon,
  badge,
  rightAction,
  isPassword,
  secureTextEntry,
  style,
  ...props
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isSecure = isPassword ? !showPassword : secureTextEntry;

  return (
    <View style={styles.fieldGroup}>
      <View style={styles.labelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {badge ? (
          <Text style={styles.fieldBadge}>{badge}</Text>
        ) : rightAction ? (
          <Pressable onPress={rightAction.onPress}>
            <Text style={styles.forgotLink}>{rightAction.text}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.inputContainer}>
        <Ionicons name={icon} size={19} color="#64748b" style={styles.inputLeftIcon} />
        <TextInput
          style={[styles.textInput, isPassword && { paddingRight: 40 }, style]}
          secureTextEntry={isSecure}
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
          <Pressable onPress={() => setShowPassword((p) => !p)} style={styles.inputRightToggle}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#64748b" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
  fieldBadge: { fontSize: 9, fontWeight: '800', color: '#006b5d', backgroundColor: '#e6f4f1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  forgotLink: { fontSize: 12, fontWeight: '600', color: '#006b5d' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc',
    borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12,
  },
  inputLeftIcon: { marginRight: 8 },
  textInput: { flex: 1, height: 46, fontSize: 14, color: '#0f172a' },
  inputRightToggle: { position: 'absolute', right: 12, padding: 4 },
});

