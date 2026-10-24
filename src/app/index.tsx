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

import { SpandanLogo } from '@/components/fitness/spandan-logo';
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
  getMockActivities,
  getMockWeeklyStats,
  Activity,
  WeeklyStats,
} from '@/data/mock-fitness-data';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, isDemoMode, isConfigured } = useAuth();

  const [filter, setFilter] = useState<FilterValue>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [simulateEmpty, setSimulateEmpty] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [liveActivities, setLiveActivities] = useState<Activity[]>([]);
  const [liveWeeklyStats, setLiveWeeklyStats] = useState<WeeklyStats | null>(null);

  const isLiveUser = Boolean(user && !isDemoMode && isConfigured);

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
    } else {
      await new Promise((r) => setTimeout(r, 800));
    }
    setRefreshing(false);
  };

  const handleSimulateLoadingToggle = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1200);
  };

  // Determine active dataset
  const activeWeeklyStats: WeeklyStats = isLiveUser && liveWeeklyStats
    ? liveWeeklyStats
    : getMockWeeklyStats();

  const rawActivities: Activity[] = isLiveUser
    ? liveActivities
    : getMockActivities();

  // Filter activities based on selection and simulated empty state
  const activities: Activity[] = simulateEmpty
    ? []
    : filter === 'all'
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
    : 'Alex';

  const athleteAvatar = isLiveUser
    ? profile?.avatar_text || athleteDisplayName.substring(0, 2).toUpperCase()
    : 'AV';

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
            tintColor="#FF6B00"
            colors={['#FF6B00']}
          />
        }>
        <View style={styles.contentWrapper}>
          {/* Top Brand Bar */}
          <View style={styles.headerBar}>
            <SpandanLogo size="medium" showTagline />

            <View style={styles.headerActions}>
              {/* Auth / Cloud Sync Status Pill */}
              {isLiveUser ? (
                <View style={styles.cloudBadge}>
                  <View style={styles.cloudDot} />
                  <Text style={styles.cloudBadgeText}>Supabase Connected</Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => router.push('/auth/login' as any)}
                  style={styles.demoModeBadge}>
                  <Text style={styles.demoBadgeText}>Demo Mode • Sign In</Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => router.push('/record' as any)}
                style={({ pressed }) => [styles.recordQuickBtn, pressed && styles.pressed]}>
                <Text style={styles.recordQuickBtnText}>+ Record</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/profile' as any)}
                style={styles.profileAvatarMini}>
                <Text style={styles.profileAvatarText}>{athleteAvatar}</Text>
              </Pressable>
            </View>
          </View>

          {/* Athlete Greeting */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingTitle}>Welcome back, {athleteDisplayName}</Text>
            <Text style={styles.greetingSub}>
              {isLiveUser
                ? `Signed in as ${user?.email}. Your cloud training sessions are secured with Row Level Security.`
                : 'Viewing in Safe Demo Mode (Mock Data). Real workouts sync to your Supabase PostgreSQL database when signed in.'}
            </Text>
          </View>

          {/* Interactive State Simulator Controls (For Milestone Review) */}
          <View style={styles.simulatorBanner}>
            <View style={styles.simLabelRow}>
              <Text style={styles.simLabel}>DEMO & STATE CONTROLS:</Text>
            </View>
            <View style={styles.simButtonsRow}>
              <Pressable
                onPress={handleSimulateLoadingToggle}
                style={({ pressed }) => [
                  styles.simBtn,
                  isLoading && styles.simBtnActive,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.simBtnText}>
                  {isLoading ? '⏳ Loading...' : '🔄 Test Loading'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSimulateEmpty((prev) => !prev)}
                style={({ pressed }) => [
                  styles.simBtn,
                  simulateEmpty && styles.simBtnActive,
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.simBtnText}>
                  {simulateEmpty ? '✅ Restore Data' : '📭 Test Empty State'}
                </Text>
              </Pressable>

              {!isLiveUser && (
                <Pressable
                  onPress={() => router.push('/auth/login' as any)}
                  style={({ pressed }) => [styles.simBtnOrange, pressed && styles.pressed]}>
                  <Text style={styles.simBtnOrangeText}>🔐 Authenticate</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Loading State or Full Dashboard */}
          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* Weekly Performance Stats Section */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Weekly Overview</Text>
                <Text style={styles.weekLabel}>{activeWeeklyStats.weekLabel}</Text>
              </View>

              {/* Goal Progress Banner */}
              <GoalBar
                currentDistance={activeWeeklyStats.totalDistanceKm}
                targetDistance={activeWeeklyStats.distanceGoalKm}
                streakWeeks={activeWeeklyStats.streakWeeks}
              />

              {/* Summary Metrics Cards Grid */}
              <View style={styles.statsGrid}>
                <StatCard
                  label="Distance"
                  value={activeWeeklyStats.totalDistanceKm.toFixed(1)}
                  unit="km"
                  deltaText={isLiveUser ? `${activeWeeklyStats.activitiesCount} logged` : `${activeWeeklyStats.distanceChangePercent}% vs last wk`}
                  isPositiveDelta
                  accentColor="#FF6B00"
                  iconSymbol="🏃"
                />

                <StatCard
                  label="Active Time"
                  value={activeWeeklyStats.activeTimeFormatted}
                  deltaText={`${activeWeeklyStats.activitiesCount} activities`}
                  isPositiveDelta
                  accentColor="#00D2D3"
                  iconSymbol="⏱️"
                />

                <StatCard
                  label="Elevation"
                  value={activeWeeklyStats.elevationGainM}
                  unit="m"
                  deltaText={`${activeWeeklyStats.caloriesBurned} kcal`}
                  isPositiveDelta
                  accentColor="#10B981"
                  iconSymbol="⛰️"
                />
              </View>

              {/* Weekly Rhythm Day-by-Day Chart */}
              <WeeklyChart days={activeWeeklyStats.dailyActivities} />

              {/* Recent Workouts Feed Header & Filter Pills */}
              <View style={styles.feedHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {isLiveUser ? 'Your Workouts (Supabase DB)' : 'Recent Workouts (Sample Data)'}
                  </Text>
                  <Text style={styles.feedSubTitle}>
                    {isLiveUser
                      ? 'Securely retrieved for your authenticated user ID'
                      : 'Activities from demo training partners'}
                  </Text>
                </View>
              </View>

              {/* Filter Pills */}
              <FilterPills selected={filter} onSelect={setFilter} counts={counts} />

              {/* Workout Cards or Empty State */}
              {activities.length === 0 ? (
                <EmptyState
                  title={
                    simulateEmpty
                      ? 'No Activities (Empty State Test)'
                      : isLiveUser
                      ? 'No Activities Recorded Yet'
                      : `No ${filter} Workouts Yet`
                  }
                  message={
                    simulateEmpty
                      ? 'You are currently viewing the simulated empty state. Click "Restore Data" above to return to sample workouts.'
                      : isLiveUser
                      ? 'You have not recorded any workouts yet. Tap "Record" to log your first stride or ride to Supabase!'
                      : `No workouts found matching "${filter}". Record your next stride or check another category.`
                  }
                  onRecordPress={() => router.push('/record' as any)}
                  onResetFilter={
                    simulateEmpty
                      ? () => setSimulateEmpty(false)
                      : filter !== 'all'
                      ? () => setFilter('all')
                      : undefined
                  }
                />
              ) : (
                <View style={styles.activitiesList}>
                  {activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </View>
              )}
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
    backgroundColor: '#0B111E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.select({ web: Spacing.four, default: Spacing.two }),
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: 18,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    flexWrap: 'wrap',
    gap: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    gap: 5,
  },
  cloudDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  cloudBadgeText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '700',
  },
  demoModeBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  demoBadgeText: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '700',
  },
  recordQuickBtn: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  recordQuickBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  profileAvatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#131B2E',
    borderWidth: 1.5,
    borderColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  greetingSection: {
    gap: 4,
  },
  greetingTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  greetingSub: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  simulatorBanner: {
    backgroundColor: '#131B2E',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1C263E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  simLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  simLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  simButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  simBtn: {
    backgroundColor: '#1C263E',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#243354',
  },
  simBtnActive: {
    borderColor: '#4FA99A',
    backgroundColor: 'rgba(79, 169, 154, 0.15)',
  },
  simBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  simBtnOrange: {
    backgroundColor: '#4FA99A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  simBtnOrangeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  weekLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  feedHeaderRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feedSubTitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
  },
  activitiesList: {
    gap: 16,
  },
  pressed: {
    opacity: 0.75,
  },
});
