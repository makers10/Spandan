import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function AuthStepper({ step, total }: { step: number; total: number }) {
  const percent = `${Math.round((step / total) * 100)}%` as any;

  return (
    <View style={styles.stepperSection}>
      <View style={styles.stepperHeader}>
        <View style={styles.protocolBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.protocolText}>CALIBRATION PROTOCOL</Text>
        </View>
        <Text style={styles.stepCountText}>Step {step} of {total}</Text>
      </View>
      <View style={styles.stepperTrack}>
        <View style={[styles.stepperFill, { width: percent }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepperSection: { marginVertical: 8 },
  stepperHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  protocolBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#006b5d' },
  protocolText: { fontSize: 10, fontWeight: '800', color: '#006b5d', letterSpacing: 0.8 },
  stepCountText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  stepperTrack: { height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' },
  stepperFill: { height: '100%', backgroundColor: '#006b5d' },
});

