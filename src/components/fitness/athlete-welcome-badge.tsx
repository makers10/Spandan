import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function AthleteWelcomeBadge({ athleteFirstName }: { athleteFirstName: string }) {
  return (
    <View style={styles.welcomeRow}>
      <View style={styles.welcomeLeft}>
        <View style={styles.bioSyncBadge}>
          <View style={styles.bioSyncDot} />
          <Text style={styles.bioSyncText}>BIO-SYNC OK</Text>
        </View>
        <Text style={styles.welcomeTitle}>Ready to Move, {athleteFirstName}</Text>
      </View>

      <View style={styles.primeBadge}>
        <Ionicons name="flash" size={13} color="#FFFFFF" />
        <Text style={styles.primeBadgeText}>PRIME</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcomeLeft: { gap: 6 },
  bioSyncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E6F4F1',
    alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12,
  },
  bioSyncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#006B5D' },
  bioSyncText: { fontSize: 10, fontWeight: '800', color: '#006B5D', letterSpacing: 0.8 },
  welcomeTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  primeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#006B5D',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
  },
  primeBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.8 },
});

