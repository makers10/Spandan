import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AuthErrorBox({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle-outline" size={17} color="#ba1a1a" style={{ marginRight: 6 }} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffdad6',
    padding: 10, borderRadius: 10, marginVertical: 8,
  },
  errorText: { fontSize: 13, color: '#93000a', flex: 1, fontWeight: '500' },
});

