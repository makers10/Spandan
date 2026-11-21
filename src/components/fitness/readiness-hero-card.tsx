import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './readiness-hero-card.styles';

export interface ReadinessHeroCardProps {
  score?: number;
  statusLabel?: string;
  dailySteps?: number;
  activeMinutes?: number;
  floorsClimbed?: number;
}

export function ReadinessHeroCard({
  score = 0,
  statusLabel = 'READY',
  dailySteps = 0,
  activeMinutes = 0,
  floorsClimbed = 0,
}: ReadinessHeroCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.textCol}>
          <Text style={styles.metaLabel}>RECOVERY & READINESS</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreUnit}>%</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.description}>
            {score > 0
              ? 'Movement score calculated from phone motion & GPS workouts.'
              : 'Record your first walk or run to track daily progress.'}
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

      {/* 100% Phone Hardware Metrics Sub-grid */}
      <View style={styles.vitalsGrid}>
        <View style={styles.vitalCell}>
          <Text style={styles.vitalLabel}>STEPS</Text>
          <View style={styles.vitalValRow}>
            <Text style={styles.vitalValue}>{dailySteps > 0 ? dailySteps.toLocaleString() : '0'}</Text>
            <Text style={styles.vitalUnit}>pts</Text>
          </View>
          <Text style={styles.vitalTrendGreen}>Pedometer</Text>
        </View>

        <View style={styles.vitalCell}>
          <Text style={styles.vitalLabel}>ACTIVE TIME</Text>
          <View style={styles.vitalValRow}>
            <Text style={styles.vitalValue}>{activeMinutes > 0 ? activeMinutes : '0'}</Text>
            <Text style={styles.vitalUnit}>min</Text>
          </View>
          <Text style={styles.vitalTrendTeal}>Moving Time</Text>
        </View>

        <View style={styles.vitalCell}>
          <Text style={styles.vitalLabel}>FLOORS</Text>
          <View style={styles.vitalValRow}>
            <Text style={styles.vitalValue}>{floorsClimbed > 0 ? floorsClimbed : '0'}</Text>
            <Text style={styles.vitalUnit}>flr</Text>
          </View>
          <Text style={styles.vitalTrendMuted}>Barometer</Text>
        </View>
      </View>
    </View>
  );
}
