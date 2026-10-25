import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Activity } from '@/types/fitness';

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
      label: 'Outdoor Run',
      color: '#FF6B00',
      iconName: 'fitness-outline' as const,
      paceUnit: '/km',
    },
    ride: {
      label: 'Outdoor Ride',
      color: '#00D2D3',
      iconName: 'bicycle-outline' as const,
      paceUnit: 'km/h',
    },
    walk: {
      label: 'Outdoor Walk',
      color: '#10B981',
      iconName: 'walk-outline' as const,
      paceUnit: '/km',
    },
  }[activity.type];

  return (
    <View style={styles.card}>
      <Pressable onPress={handleCardPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {/* Apple Fitness Workout Summary Item */}
        <View style={styles.workoutRow}>
          {/* Leading Apple Activity Icon Square */}
          <View style={[styles.sportSquare, { backgroundColor: sportMeta.color }]}>
            <Ionicons name={sportMeta.iconName} size={24} color="#FFFFFF" />
          </View>

          {/* Center Details */}
          <View style={styles.centerCol}>
            {/* Workout Title & Date */}
            <View style={styles.titleRow}>
              <Text style={styles.workoutTitle} numberOfLines={1}>
                {activity.title}
              </Text>
              <Text style={styles.dateStamp}>{activity.timeAgo}</Text>
            </View>

            {/* Hero Distance & Metrics String (Apple Fitness format) */}
            <View style={styles.metricRow}>
              <Text style={styles.heroDistance}>
                {activity.distanceKm.toFixed(2)}
                <Text style={styles.heroUnit}> KM</Text>
              </Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.secondaryMetric}>{activity.durationFormatted}</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.secondaryMetric}>{activity.paceOrSpeedFormatted}</Text>
            </View>

            {/* Subtle Pills: Heart Rate & Calories */}
            <View style={styles.subPillRow}>
              <Text style={styles.metaSubText} numberOfLines={1} ellipsizeMode="tail">
                {activity.calories} KCAL
                {activity.avgHeartRate ? `  •  ${activity.avgHeartRate} BPM` : ''}
                {activity.elevationMeters > 0 ? `  •  +${activity.elevationMeters}m` : ''}
                {(activity.floorsClimbed || Math.floor((activity.elevationMeters || 0) / 3)) > 0
                  ? `  •  ${activity.floorsClimbed || Math.floor((activity.elevationMeters || 0) / 3)} fl`
                  : ''}
              </Text>
            </View>
          </View>

          {/* Right Disclosure Chevron */}
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>

      {/* Subtle Bottom Interaction Bar */}
      <View style={styles.footerRow}>
        <Pressable onPress={handleKudosPress} style={styles.kudosBtn}>
          <MotiView
            animate={{
              scale: hasKudoed ? [1, 1.35, 1] : 1,
            }}
            transition={{
              type: 'spring',
              damping: 12,
            } as any}>
            <Ionicons
              name={hasKudoed ? 'heart' : 'heart-outline'}
              size={17}
              color={hasKudoed ? '#FF2D55' : '#8E8E93'}
            />
          </MotiView>
          <Text style={[styles.kudosText, hasKudoed && styles.kudosTextActive]}>
            {kudosCount} {kudosCount === 1 ? 'Kudo' : 'Kudos'}
          </Text>
        </Pressable>

        <Pressable onPress={handleCardPress} style={styles.commentsBtn}>
          <Ionicons name="chatbubble-outline" size={15} color="#8E8E93" />
          <Text style={styles.commentsText}>
            {activity.commentsCount > 0 ? `${activity.commentsCount} comments` : 'Comment'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    shadowColor: '#17332C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(79, 169, 154, 0.08)',
  },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sportSquare: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  centerCol: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutTitle: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 6,
  },
  dateStamp: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 1,
  },
  heroDistance: {
    color: '#000000',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  heroUnit: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
  },
  dotSeparator: {
    color: '#C7C7CC',
    fontSize: 12,
  },
  secondaryMetric: {
    color: '#636366',
    fontSize: 14,
    fontWeight: '600',
  },
  subPillRow: {
    marginTop: 2,
  },
  metaSubText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
  },
  chevron: {
    color: '#C7C7CC',
    fontSize: 24,
    fontWeight: '300',
    marginLeft: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  kudosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  kudosEmoji: {
    fontSize: 13,
  },
  kudosText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  kudosTextActive: {
    color: '#FF6B00',
    fontWeight: '700',
  },
  commentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  commentsEmoji: {
    fontSize: 12,
  },
  commentsText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
  },
});
