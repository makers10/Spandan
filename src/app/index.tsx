import React, { useState, useEffect } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { StatCard } from '@/components/fitness/stat-card';
import { GoalBar } from '@/components/fitness/goal-bar';
import { WeeklyChart } from '@/components/fitness/weekly-chart';
import { FilterPills, FilterValue } from '@/components/fitness/filter-pills';
import { ActivityCard } from '@/components/fitness/activity-card';
import { SkeletonLoader } from '@/components/fitness/skeleton-loader';
import { EmptyState } from '@/components/fitness/empty-state';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { activityService } from '@/services/activity-service';
import {
  Activity,
  WeeklyStats,
  createEmptyWeeklyStats,
} from '@/types/fitness';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, isDemoMode } = useAuth();

  const [filter, setFilter] = useState<FilterValue>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [liveActivities, setLiveActivities] = useState<Activity[]>([]);
  const [liveWeeklyStats, setLiveWeeklyStats] = useState<WeeklyStats | null>(null);

  const isLiveUser = Boolean(user && !isDemoMode);

  // Fetch real activities if user is signed in with Supabase
  useEffect(() => {
    let ignore = false;

    if (isLiveUser && user) {
      void (async () => {
        await Promise.resolve();
        if (ignore) return;
        setIsLoading(true);
        try {
          const athleteName = profile?.full_name || user.email?.split('@')[0] || 'Athlete';
          const fetched = await activityService.fetchUserActivities(user.id, undefined, athleteName);
          if (!ignore) {
            setLiveActivities(fetched);
            const stats = activityService.calculateWeeklyStats(fetched, profile?.weekly_distance_goal_km || 50.0);
            setLiveWeeklyStats(stats);
          }
        } catch (err: any) {
          console.warn('Failed to load user activities from Supabase:', err.message);
        } finally {
          if (!ignore) {
            setIsLoading(false);
          }
        }
      })();
    }

    return () => {
      ignore = true;
    };
  }, [isLiveUser, user, profile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (isLiveUser && user) {
      try {
        const athleteName = profile?.full_name || user.email?.split('@')[0] || 'Athlete';
        const fetched = await activityService.fetchUserActivities(user.id, undefined, athleteName);
        setLiveActivities(fetched);
        const stats = activityService.calculateWeeklyStats(fetched, profile?.weekly_distance_goal_km || 50.0);
        setLiveWeeklyStats(stats);
      } catch (err: any) {
        console.warn('Failed to refresh user activities from Supabase:', err.message);
      }
    }
    setRefreshing(false);
  };

  // Determine active dataset (strictly real user activities)
  const activeWeeklyStats: WeeklyStats = liveWeeklyStats || createEmptyWeeklyStats();
  const rawActivities: Activity[] = liveActivities;

  // Filter activities based on selection
  const activities: Activity[] =
    filter === 'all'
      ? rawActivities
      : rawActivities.filter((a) => a.type === filter);

  const counts = {
    all: rawActivities.length,
    run: rawActivities.filter((a) => a.type === 'run').length,
    ride: rawActivities.filter((a) => a.type === 'ride').length,
    walk: rawActivities.filter((a) => a.type === 'walk').length,
  };

  const athleteDisplayName = isLiveUser
    ? profile?.full_name || user?.email?.split('@')[0] || 'Athlete'
    : 'Athlete';

  const athleteAvatar = isLiveUser
    ? profile?.avatar_text || athleteDisplayName.substring(0, 2).toUpperCase()
    : 'SP';

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  const bottomPadding = (insets.bottom || 16) + BottomTabInset + Spacing.four;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4FA99A"
            colors={['#4FA99A']}
          />
        }>
        <View style={styles.contentWrapper}>
          {/* Apple Health Large Title Navigation Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <Text style={styles.dateHeader}>{todayFormatted}</Text>
              <Text style={styles.largeTitle}>Summary</Text>
            </View>

            <View style={styles.headerRight}>
              <Pressable
                onPress={() => router.push('/record' as any)}
                style={({ pressed }) => [styles.recordBtn, pressed && styles.pressed]}>
                <Text style={styles.recordBtnText}>+ Record</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/profile' as any)}
                style={styles.avatarBtn}>
                <Text style={styles.avatarBtnText}>{athleteAvatar}</Text>
              </Pressable>
            </View>
          </View>

          {/* Loading State or Full Dashboard */}
          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* SECTION: ACTIVITY GOAL */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>ACTIVITY & GOAL</Text>
                </View>

                <GoalBar
                  currentDistance={activeWeeklyStats.totalDistanceKm}
                  targetDistance={activeWeeklyStats.distanceGoalKm}
                  streakWeeks={activeWeeklyStats.streakWeeks}
                />
              </View>

              {/* SECTION: FAVORITES / STAT CARDS */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>FAVORITES</Text>
                  <Text style={styles.sectionSubText}>{activeWeeklyStats.weekLabel}</Text>
                </View>

                <View style={styles.statsGrid}>
                  <StatCard
                    label="Distance"
                    value={activeWeeklyStats.totalDistanceKm.toFixed(1)}
                    unit="KM"
                    deltaText={isLiveUser ? `${activeWeeklyStats.activitiesCount} sessions` : `${activeWeeklyStats.distanceChangePercent}% vs last wk`}
                    isPositiveDelta
                    accentColor="#FF6B00"
                    iconName="flame-outline"
                  />

                  <StatCard
                    label="Active Time"
                    value={activeWeeklyStats.activeTimeFormatted}
                    deltaText={`${activeWeeklyStats.activitiesCount} workouts`}
                    isPositiveDelta
                    accentColor="#00D2D3"
                    iconName="time-outline"
                  />

                  <StatCard
                    label="Elevation"
                    value={activeWeeklyStats.elevationGainM}
                    unit="M"
                    deltaText={`${activeWeeklyStats.caloriesBurned} kcal`}
                    isPositiveDelta
                    accentColor="#10B981"
                    iconName="trending-up-outline"
                  />
                </View>
              </View>

              {/* SECTION: WEEKLY RHYTHM CHART */}
              <View style={styles.sectionContainer}>
                <WeeklyChart days={activeWeeklyStats.dailyActivities} />
              </View>

              {/* SECTION: WORKOUTS LIST */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>WORKOUTS</Text>
                  <Text style={styles.sectionSubText}>{rawActivities.length} total</Text>
                </View>

                {/* Filter Pills */}
                <FilterPills selected={filter} onSelect={setFilter} counts={counts} />

                {/* Workout Cards or Empty State */}
                {activities.length === 0 ? (
                  <EmptyState
                    title={filter === 'all' ? 'No Activities Yet' : `No ${filter.toUpperCase()} Workouts`}
                    message="Every milestone begins with a single step. Start recording your workouts to build your training history."
                    onRecordPress={() => router.push('/record' as any)}
                    onResetFilter={filter !== 'all' ? () => setFilter('all') : undefined}
                  />
                ) : (
                  <View style={styles.activitiesList}>
                    {activities.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.select({ web: Spacing.four, default: Spacing.three }),
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: 20,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 4,
  },
  headerLeft: {
    gap: 2,
  },
  dateHeader: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  largeTitle: {
    color: '#000000',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  recordBtn: {
    backgroundColor: '#4FA99A',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: '#4FA99A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  recordBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  avatarBtnText: {
    color: '#4FA99A',
    fontSize: 13,
    fontWeight: '800',
  },
  demoNoticeRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  demoNoticeText: {
    color: '#636366',
    fontSize: 12,
    fontWeight: '500',
  },
  demoNoticeLink: {
    color: '#4FA99A',
    fontWeight: '700',
  },
  sectionContainer: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sectionSubText: {
    color: '#AEAEB2',
    fontSize: 12,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  activitiesList: {
    gap: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});
