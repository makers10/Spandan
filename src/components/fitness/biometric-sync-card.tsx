import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function BiometricSyncCard() {
  return (
    <View style={styles.card}>
      <View style={styles.leftCluster}>
        <View style={styles.statusDotWrap}>
          <View style={styles.statusPing} />
          <View style={styles.statusDot} />
        </View>

        <View style={styles.textGroup}>
          <Text style={styles.sensorTitle}>Pulse Sensor 01</Text>
          <Text style={styles.sensorSub}>Optical PPG 100Hz • 98% Battery</Text>
        </View>
      </View>

      <View style={styles.syncedBadge}>
        <Text style={styles.syncedText}>SYNCED</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#006B5D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  leftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDotWrap: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statusPing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    opacity: 0.35,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  textGroup: {
    gap: 1,
  },
  sensorTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  sensorSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  syncedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  syncedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.6,
  },
});
