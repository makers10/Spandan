import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface GoalBarProps {
  currentDistance: number;
  targetDistance: number;
  streakWeeks: number;
}

export function GoalBar({ currentDistance, targetDistance, streakWeeks }: GoalBarProps) {
  const percentage = Math.min(100, Math.round((currentDistance / targetDistance) * 100));
  const remaining = Math.max(0, targetDistance - currentDistance).toFixed(1);

  return (
    <View style={styles.card}>
      {/* Apple Health Card Header */}
      <View style={styles.header}>
        <View style={styles.categoryCluster}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>🎯</Text>
          </View>
          <Text style={styles.categoryTitle}>WEEKLY GOAL</Text>
        </View>

        <View style={styles.streakPill}>
          <Text style={styles.streakText}>🔥 {streakWeeks} Wk Streak</Text>
        </View>
      </View>

      {/* Main Metric Value */}
      <View style={styles.metricRow}>
        <View style={styles.valueGroup}>
          <Text style={styles.currentValue}>{currentDistance.toFixed(1)}</Text>
          <Text style={styles.targetValue}>/ {targetDistance.toFixed(0)} KM</Text>
        </View>
        <Text style={styles.percentText}>{percentage}%</Text>
      </View>

      {/* Apple Continuous Rounded Progress Bar */}
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${percentage}%` }]} />
      </View>

      {/* Footer Details */}
      <View style={styles.footer}>
        <Text style={styles.remainingText}>
          {remaining === '0.0' ? '🎉 Goal achieved this week' : `${remaining} km to reach your goal`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(79, 169, 154, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 11,
  },
  categoryTitle: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  streakPill: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  streakText: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  currentValue: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  targetValue: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  percentText: {
    color: '#4FA99A',
    fontSize: 16,
    fontWeight: '800',
  },
  track: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#4FA99A',
    borderRadius: 4,
  },
  footer: {
    marginTop: 8,
  },
  remainingText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
});
