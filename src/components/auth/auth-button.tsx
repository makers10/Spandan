import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthButtonProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  onPress: () => void;
}

export function AuthButton({ label, icon = 'arrow-forward', loading, onPress }: AuthButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.primaryBtn,
        pressed && styles.btnPressed,
        loading && styles.btnDisabled,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <>
          <Text style={styles.primaryBtnText}>{label}</Text>
          <Ionicons name={icon} size={18} color="#ffffff" style={{ marginLeft: 6 }} />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#006b5d',
    height: 48,
    borderRadius: 14,
    marginTop: 8,
  },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});

