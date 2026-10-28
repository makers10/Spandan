import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TelemetrySessionCardProps {
  title?: string;
  time?: string;
  efficiencyScore?: string;
  tag?: string;
  distanceKm?: number;
  pace?: string;
  calories?: number;
  maxHr?: number;
  peakSpeed?: string;
}

export function TelemetrySessionCard({
  title = 'Recent Workout',
  time = '--:--',
  efficiencyScore = 'GPS Session',
  tag = 'SESSION',
  distanceKm = 0.0,
  pace = '--:--',
  calories = 0,
  maxHr = 0,
  peakSpeed = '0.0 km/h',
}: TelemetrySessionCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleCluster}>
          <View style={styles.iconSquare}>
            <Ionicons name="fitness" size={20} color="#006B5D" />
          </View>
          <View>
            <Text style={styles.workoutTitle}>{title}</Text>
            <View style={styles.subRow}>
              <Text style={styles.subTime}>{time}</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.subEff}>{efficiencyScore}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      </View>

      {/* 4-Column Real-Time Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <Text style={styles.cellLabel}>DIST</Text>
          <Text style={styles.cellVal}>
            {distanceKm.toFixed(1)} <Text style={styles.cellUnit}>km</Text>
          </Text>
        </View>

        <View style={styles.metricCell}>
          <Text style={styles.cellLabel}>PACE</Text>
          <Text style={styles.cellVal}>
            {pace} <Text style={styles.cellUnit}>/km</Text>
          </Text>
        </View>

        <View style={styles.metricCell}>
          <Text style={styles.cellLabel}>ENERGY</Text>
          <Text style={styles.cellVal}>
            {calories} <Text style={styles.cellUnit}>kcal</Text>
          </Text>
        </View>

        <View style={styles.metricCell}>
          <Text style={styles.cellLabel}>MAX HR</Text>
          <Text style={styles.cellVal}>
            {maxHr} <Text style={styles.cellUnit}>bpm</Text>
          </Text>
        </View>
      </View>

      {/* Velocity Stability HUD Curve Indicator */}
      <View style={styles.velocitySection}>
        <View style={styles.velocityHeader}>
          <Text style={styles.velocityLabel}>VELOCITY STABILITY</Text>
          <Text style={styles.velocityPeak}>{peakSpeed}</Text>
        </View>

        {/* Dynamic Wave Bar Track */}
        <View style={styles.waveBarContainer}>
          {[35, 50, 42, 68, 55, 82, 70, 95, 62, 88, 75, 90, 84, 100, 72, 60].map((h, i) => (
            <View
              key={i}
              style={[
                styles.waveBar,
                {
                  height: `${h}%`,
                  backgroundColor: h > 80 ? '#00B8A2' : '#6EE7B7',
                  opacity: 0.4 + (h / 100) * 0.6,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#006B5D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  subTime: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dot: {
    fontSize: 10,
    color: '#CBD5E1',
  },
  subEff: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006B5D',
  },
  tagBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.6,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCell: {
    flex: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderRadius: 14,
    padding: 8,
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  cellVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  cellUnit: {
    fontSize: 9,
    fontWeight: '500',
    color: '#94A3B8',
  },
  velocitySection: {
    gap: 6,
  },
  velocityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  velocityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.6,
  },
  velocityPeak: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006B5D',
  },
  waveBarContainer: {
    height: 38,
    backgroundColor: 'rgba(236, 253, 245, 0.45)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  waveBar: {
    width: 10,
    borderRadius: 3,
  },
});
