import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface KineticStrainCardProps {
  currentStrain?: number;
  targetStrain?: number;
  kineticForceKn?: number;
  activeDurationMinutes?: number;
  targetDurationMinutes?: number;
}

export function KineticStrainCard({
  currentStrain = 14.8,
  targetStrain = 18.0,
  kineticForceKn = 710,
  activeDurationMinutes = 68,
  targetDurationMinutes = 90,
}: KineticStrainCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleCol}>
          <Text style={styles.metaLabel}>ACTIVITY & GOAL</Text>
          <Text style={styles.cardTitle}>Kinetic Strain</Text>
        </View>
        <View style={styles.targetBadge}>
          <Text style={styles.targetBadgeText}>TARGET {targetStrain.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.contentRow}>
        {/* 3-Ring Concentric Multi-Strain Visualizer */}
        <View style={styles.ringsContainer}>
          {/* Outer Ring: Cardio Strain (Emerald) */}
          <View style={styles.outerTrack} />
          <View style={styles.outerArc} />

          {/* Middle Ring: Kinetic Force (Orange) */}
          <View style={styles.middleTrack} />
          <View style={styles.middleArc} />

          {/* Inner Ring: Active Duration (Teal) */}
          <View style={styles.innerTrack} />
          <View style={styles.innerArc} />

          <View style={styles.ringCenterTextWrap}>
            <Text style={styles.ringCenterVal}>{currentStrain.toFixed(1)}</Text>
            <Text style={styles.ringCenterLabel}>STRAIN</Text>
          </View>
        </View>

        {/* Ring Legends & Values */}
        <View style={styles.legendsCol}>
          <View style={styles.legendRow}>
            <View style={styles.legendTitleWrap}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendName} numberOfLines={1}>Cardio Strain</Text>
            </View>
            <Text style={styles.legendVal}>
              {currentStrain.toFixed(1)}
              <Text style={styles.legendSubVal}>/{targetStrain.toFixed(0)}</Text>
            </Text>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendTitleWrap}>
              <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
              <Text style={styles.legendName} numberOfLines={1}>Kinetic Force</Text>
            </View>
            <Text style={styles.legendVal}>
              {kineticForceKn} <Text style={styles.legendSubVal}>kN</Text>
            </Text>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendTitleWrap}>
              <View style={[styles.legendDot, { backgroundColor: '#00B8A2' }]} />
              <Text style={styles.legendName} numberOfLines={1}>Active Duration</Text>
            </View>
            <Text style={styles.legendVal}>
              {activeDurationMinutes}
              <Text style={styles.legendSubVal}>/{targetDurationMinutes}m</Text>
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#006B5D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleCol: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  targetBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  targetBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringsContainer: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },
  outerTrack: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 6,
    borderColor: '#F1F5F9',
  },
  outerArc: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 6,
    borderColor: '#10B981',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-30deg' }],
  },
  middleTrack: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 6,
    borderColor: '#F1F5F9',
  },
  middleArc: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 6,
    borderColor: '#F97316',
    borderRightColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
  innerTrack: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: '#F1F5F9',
  },
  innerArc: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 5,
    borderColor: '#00B8A2',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '-60deg' }],
  },
  ringCenterTextWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  ringCenterLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  legendsCol: {
    flex: 1,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  legendVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  legendSubVal: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
});
