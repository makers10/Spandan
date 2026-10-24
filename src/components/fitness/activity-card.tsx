import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Activity } from '@/data/mock-fitness-data';

interface ActivityCardProps {
  activity: Activity;
  onKudosToggle?: (activityId: string, nowKudoed: boolean) => void;
}

export function ActivityCard({ activity, onKudosToggle }: ActivityCardProps) {
  const [hasKudoed, setHasKudoed] = useState(activity.hasKudoed);
  const [kudosCount, setKudosCount] = useState(activity.kudosCount);

  const handleKudosPress = () => {
    const nextState = !hasKudoed;
    setHasKudoed(nextState);
    setKudosCount((prev) => (nextState ? prev + 1 : prev - 1));
    onKudosToggle?.(activity.id, nextState);
  };

  const handleCardPress = () => {
    router.push({
      pathname: '/activity/[id]',
      params: { id: activity.id },
    } as any);
  };

  const sportMeta = {
    run: {
      label: 'RUN',
      color: '#FF6B00',
      icon: '🏃',
      paceLabel: 'Avg Pace',
      paceUnit: '/km',
    },
    ride: {
      label: 'RIDE',
      color: '#00D2D3',
      icon: '🚴',
      paceLabel: 'Avg Speed',
      paceUnit: 'km/h',
    },
    walk: {
      label: 'WALK',
      color: '#10B981',
      icon: '🚶',
      paceLabel: 'Avg Pace',
      paceUnit: '/km',
    },
  }[activity.type];

  return (
    <View style={styles.card}>
      <Pressable onPress={handleCardPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {/* Top Athlete Header */}
        <View style={styles.athleteRow}>
          <View style={styles.avatar}>
          <Text style={styles.avatarText}>{activity.athlete.avatar}</Text>
        </View>

        <View style={styles.athleteInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.athleteName}>{activity.athlete.name}</Text>
            {activity.athlete.badge && (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>{activity.athlete.badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.dateText}>
            {activity.date} • {activity.timeAgo}
          </Text>
        </View>

        {/* Sport Type Badge */}
        <View style={[styles.sportBadge, { backgroundColor: `${sportMeta.color}20` }]}>
          <Text style={styles.sportBadgeIcon}>{sportMeta.icon}</Text>
          <Text style={[styles.sportBadgeText, { color: sportMeta.color }]}>
            {sportMeta.label}
          </Text>
        </View>
      </View>

      {/* Activity Title & Location */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.location}>📍 {activity.location}</Text>
      </View>

      {/* Primary Metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>DISTANCE</Text>
          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{activity.distanceKm.toFixed(2)}</Text>
            <Text style={styles.metricUnit}>km</Text>
          </View>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>{activity.paceOrSpeedLabel.toUpperCase()}</Text>
          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{activity.paceOrSpeedFormatted}</Text>
            <Text style={styles.metricUnit}>{sportMeta.paceUnit}</Text>
          </View>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>TIME</Text>
          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{activity.durationFormatted}</Text>
          </View>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>ELEV GAIN</Text>
          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{activity.elevationMeters}</Text>
            <Text style={styles.metricUnit}>m</Text>
          </View>
        </View>
      </View>

      {/* Secondary Stats Row (Heart Rate, Cadence, Calories) */}
      <View style={styles.secondaryStatsRow}>
        {activity.avgHeartRate && (
          <View style={styles.secStat}>
            <Text style={styles.secStatIcon}>❤️</Text>
            <Text style={styles.secStatText}>{activity.avgHeartRate} bpm</Text>
          </View>
        )}
        {activity.cadenceOrSteps && (
          <View style={styles.secStat}>
            <Text style={styles.secStatIcon}>⚡</Text>
            <Text style={styles.secStatText}>{activity.cadenceOrSteps}</Text>
          </View>
        )}
        <View style={styles.secStat}>
          <Text style={styles.secStatIcon}>🔥</Text>
          <Text style={styles.secStatText}>{activity.calories} kcal</Text>
        </View>
        {activity.gearName && (
          <View style={styles.gearStat}>
            <Text style={styles.gearStatText}>👟 {activity.gearName}</Text>
          </View>
        )}
      </View>

      {/* Route Preview Graphic */}
      <View style={styles.routeContainer}>
        <View style={styles.routeTrack}>
          {/* Stylized route elevation wave preview */}
          <View style={[styles.routePath, { borderColor: sportMeta.color }]} />
          <View style={[styles.routeElevationFill, { backgroundColor: `${sportMeta.color}15` }]} />
        </View>
        <Text style={styles.gpsTag}>VIEW ROUTE & SPLITS →</Text>
      </View>
    </Pressable>

    {/* Action Footer: Kudos & Comments */}
    <View style={styles.footer}>
      <Pressable
        onPress={handleKudosPress}
        style={({ pressed }) => [
          styles.kudosButton,
          hasKudoed && styles.kudosButtonActive,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.kudosIcon}>{hasKudoed ? '🧡' : '🤍'}</Text>
        <Text style={[styles.kudosCountText, hasKudoed && styles.kudosCountTextActive]}>
          {kudosCount} {kudosCount === 1 ? 'Kudo' : 'Kudos'}
        </Text>
      </Pressable>

      <Pressable onPress={handleCardPress} style={styles.commentsGroup}>
        <Text style={styles.commentsIcon}>💬</Text>
        <Text style={styles.commentsText}>{activity.commentsCount} comments</Text>
      </Pressable>
    </View>
  </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 12,
  },
  athleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C263E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4FA99A',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  athleteInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  athleteName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: '#4FA99A',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  dateText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  sportBadgeIcon: {
    fontSize: 12,
  },
  sportBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleSection: {
    gap: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  location: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#0B111E',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1C263E',
  },
  metricItem: {
    alignItems: 'flex-start',
    flex: 1,
    paddingHorizontal: 4,
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  metricUnit: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  secondaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  secStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  secStatIcon: {
    fontSize: 12,
  },
  secStatText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  gearStat: {
    backgroundColor: '#1C263E',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gearStatText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  routeContainer: {
    backgroundColor: '#0B111E',
    borderRadius: 10,
    padding: 12,
    height: 72,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1C263E',
    position: 'relative',
    overflow: 'hidden',
  },
  routeTrack: {
    flex: 1,
    justifyContent: 'center',
  },
  routePath: {
    height: 2,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderRadius: 1,
  },
  routeElevationFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  gpsTag: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    alignSelf: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1C263E',
  },
  kudosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1C263E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  kudosButtonActive: {
    backgroundColor: 'rgba(79, 169, 154, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(79, 169, 154, 0.4)',
  },
  kudosIcon: {
    fontSize: 14,
  },
  kudosCountText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  kudosCountTextActive: {
    color: '#4FA99A',
  },
  commentsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentsIcon: {
    fontSize: 13,
  },
  commentsText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});
