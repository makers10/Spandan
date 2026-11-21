import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BiometricCardProps {
  onUnlock: () => void;
  loading?: boolean;
}

export function BiometricCard({ onUnlock, loading }: BiometricCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconCircle}>
          <Ionicons name="finger-print-outline" size={24} color="#006b5d" />
        </View>
        <View>
          <View style={styles.badgeRow}>
            <Text style={styles.title}>Face ID / Biometrics</Text>
            <View style={styles.fastBadge}>
              <Text style={styles.fastBadgeText}>FAST</Text>
            </View>
          </View>
          <Text style={styles.sub}>Touch to authorize secure bio-link</Text>
        </View>
      </View>

      <Pressable
        aria-label="Authenticate with biometrics"
        onPress={onUnlock}
        disabled={loading}
        style={({ pressed }) => [styles.unlockBtn, pressed && styles.btnPressed]}>
        <Ionicons name="lock-open-outline" size={16} color="#ffffff" style={{ marginRight: 4 }} />
        <Text style={styles.unlockBtnText}>Unlock</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff', padding: 14, borderRadius: 16, borderWidth: 1,
    borderColor: '#e2e8f0', marginVertical: 12,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#e6f4f1',
    alignItems: 'center', justifyContent: 'center',
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  fastBadge: { backgroundColor: '#006b5d', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  fastBadgeText: { fontSize: 9, fontWeight: '800', color: '#ffffff' },
  sub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#006b5d',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  btnPressed: { opacity: 0.8 },
  unlockBtnText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
});

