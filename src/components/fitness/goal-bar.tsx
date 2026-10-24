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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>Weekly Goal</Text>
          <Text style={styles.subTitle}>
            {currentDistance.toFixed(1)} / {targetDistance.toFixed(0)} km
          </Text>
        </View>

        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{streakWeeks} Wk Streak</Text>
        </View>
      </View>

      {/* Progress Track */}
      <View style={styles.track}>
        <View style={[styles.progress, { width: `${percentage}%` }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.percentText}>{percentage}% Completed</Text>
        <Text style={styles.remainingText}>
          {remaining === '0.0' ? '🎉 Goal achieved!' : `${remaining} km remaining`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243354',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    gap: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subTitle: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 169, 154, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(79, 169, 154, 0.3)',
    gap: 4,
  },
  streakEmoji: {
    fontSize: 13,
  },
  streakText: {
    color: '#4FA99A',
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 8,
    backgroundColor: '#1C263E',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progress: {
    height: '100%',
    backgroundColor: '#4FA99A',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  percentText: {
    color: '#4FA99A',
    fontSize: 12,
    fontWeight: '700',
  },
  remainingText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
});
