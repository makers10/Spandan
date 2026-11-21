import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HomeHeaderProps {
  athleteAvatar: string;
  onRecordPress: () => void;
  onProfilePress: () => void;
}

export function HomeHeader({ athleteAvatar, onRecordPress, onProfilePress }: HomeHeaderProps) {
  return (
    <View style={styles.headerBar}>
      <View style={styles.brandCluster}>
        <View style={styles.logoBadge}>
          <Ionicons name="pulse" size={17} color="#006B5D" />
        </View>
        <View style={styles.brandTitleCol}>
          <View style={styles.brandTitleRow}>
            <Text style={styles.brandTitle}>TRACK YOUR MOVEMENT</Text>
            <View style={styles.brandStatusDot} />
          </View>
          <Text style={styles.brandSubtitle}>Pulse OS // Dashboard</Text>
        </View>
      </View>

      <View style={styles.headerRightActions}>
        <Pressable onPress={onRecordPress} style={styles.sensorBadgeBtn}>
          <View style={styles.sensorPulsingDot} />
          <Text style={styles.sensorBadgeText}>Sensors</Text>
        </Pressable>

        <Pressable
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Athlete Profile"
          style={({ pressed }) => [styles.avatarBtn, pressed && styles.avatarBtnPressed]}>
          <Text style={styles.avatarBtnText}>{athleteAvatar}</Text>
          <View style={styles.avatarStatusDot} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  brandCluster: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#E6F4F1', alignItems: 'center', justifyContent: 'center' },
  brandTitleCol: { gap: 1 },
  brandTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  brandTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  brandStatusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  brandSubtitle: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 1, textTransform: 'uppercase' },
  headerRightActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sensorBadgeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF',
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
    borderColor: '#E2E8F0', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  sensorPulsingDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10B981' },
  sensorBadgeText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  avatarBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)', elevation: 1, position: 'relative',
  },
  avatarBtnPressed: { transform: [{ scale: 0.95 }], opacity: 0.9 },
  avatarBtnText: { color: '#006B5D', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  avatarStatusDot: {
    position: 'absolute', bottom: -1, right: -1, width: 10, height: 10,
    borderRadius: 5, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFFFFF',
  },
});

