import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ReadinessHeroCardProps {
  score?: number;
  statusLabel?: string;
  hrvMs?: number;
  restingHrBpm?: number;
  sleepScorePercent?: number;
}

export function ReadinessHeroCard({
  score = 94,
  statusLabel = 'OPTIMAL',
  hrvMs = 78,
  restingHrBpm = 48,
  sleepScorePercent = 89,
}: ReadinessHeroCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.textCol}>
          <Text style={styles.metaLabel}>RECOVERY INDEX</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreUnit}>%</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.description}>
            Neuromuscular fatigue low. High intensity capacity verified.
          </Text>
        </View>

        {/* Concentric Radial Gauge */}
        <View style={styles.gaugeContainer}>
          <View style={styles.gaugeTrack} />
          <View style={styles.gaugeArc} />
          <View style={styles.gaugeIconCenter}>
            <Ionicons name="flash" size={20} color="#059669" />
          </View>
        </View>
      </View>

      {/* Recovery Vitals Sub-grid */}
      <View style={styles.vitalsGrid}>
        <View style={styles.vitalCell}>
          <Text style={styles.vitalLabel}>HRV R-R</Text>
          <View style={styles.vitalValRow}>
            <Text style={styles.vitalValue}>{hrvMs}</Text>
            <Text style={styles.vitalUnit}>ms</Text>
          </View>
          <Text style={styles.vitalTrendGreen}>+12% vs 7D</Text>
        </View>

        <View style={styles.vitalCell}>
          <Text style={styles.vitalLabel}>RESTING HR</Text>
          <View style={styles.vitalValRow}>
            <Text style={styles.vitalValue}>{restingHrBpm}</Text>
            <Text style={styles.vitalUnit}>bpm</Text>
          </View>
          <Text style={styles.vitalTrendTeal}>Trained</Text>
        </View>

        <View style={styles.vitalCell}>
          <Text style={styles.vitalLabel}>SLEEP QUAL</Text>
          <View style={styles.vitalValRow}>
            <Text style={styles.vitalValue}>{sleepScorePercent}</Text>
            <Text style={styles.vitalUnit}>%</Text>
          </View>
          <Text style={styles.vitalTrendMuted}>7h 48m</Text>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  textCol: {
    flex: 1,
    paddingRight: 10,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 4,
  },
  scoreValue: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 42,
    letterSpacing: -1,
  },
  scoreUnit: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
  },
  badgeContainer: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginLeft: 6,
    alignSelf: 'center',
  },
  badgeText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  description: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
    lineHeight: 16,
  },
  gaugeContainer: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gaugeTrack: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    borderColor: '#F1F5F9',
  },
  gaugeArc: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 6,
    borderColor: '#10B981',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  gaugeIconCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  vitalCell: {
    flex: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderRadius: 16,
    padding: 10,
  },
  vitalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  vitalValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
    gap: 2,
  },
  vitalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  vitalUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  vitalTrendGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  vitalTrendTeal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006B5D',
    marginTop: 2,
  },
  vitalTrendMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
});
