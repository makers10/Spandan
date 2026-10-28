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
import { Ionicons } from '@expo/vector-icons';

import { ReadinessHeroCard } from '@/components/fitness/readiness-hero-card';
import { KineticStrainCard } from '@/components/fitness/kinetic-strain-card';
import { QuickLaunchBar } from '@/components/fitness/quick-launch-bar';
import { FeaturedChallengeBanner } from '@/components/fitness/featured-challenge-banner';
import { TelemetrySessionCard } from '@/components/fitness/telemetry-session-card';
import { BiometricSyncCard } from '@/components/fitness/biometric-sync-card';
import { FilterPills, FilterValue } from '@/components/fitness/filter-pills';
import { ActivityCard } from '@/components/fitness/activity-card';
import { SkeletonLoader } from '@/components/fitness/skeleton-loader';
import { AtmosphericBackground } from '@/components/ui/atmospheric-background';
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

  const athleteFirstName = isLiveUser
    ? (profile?.full_name || user?.email?.split('@')[0] || 'Athlete').split(' ')[0]
    : 'Athlete';

  const athleteAvatar = isLiveUser
    ? profile?.avatar_text || athleteDisplayName.substring(0, 2).toUpperCase()
    : 'TM';

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  const bottomPadding = (insets.bottom || 16) + BottomTabInset + Spacing.four;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AtmosphericBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#006B5D"
            colors={['#006B5D']}
          />
        }>
        <View style={styles.contentWrapper}>
          {/* Top Kinetic Pulse Header */}
          <View style={styles.headerBar}>
            <View style={styles.brandCluster}>
              <View style={styles.logoBadge}>
                <Ionicons name="pulse" size={17} color="#006B5D" />
              </View>
              <View style={styles.brandTitleCol}>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.brandTitle}>TRACK YOUR MOVEMENT</Text>
                  <View style={styles.brandStatusDot} />
                </View>
                <Text style={styles.brandSubtitle}>Pulse OS // Dashboard</Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <Pressable
                onPress={() => router.push('/record' as any)}
                style={styles.sensorBadgeBtn}>
                <View style={styles.sensorPulsingDot} />
                <Text style={styles.sensorBadgeText}>Sensors</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/profile' as any)}
                accessibilityRole="button"
                accessibilityLabel="Athlete Profile"
                style={({ pressed }) => [styles.avatarBtn, pressed && styles.avatarBtnPressed]}>
                <Text style={styles.avatarBtnText}>{athleteAvatar}</Text>
                <View style={styles.avatarStatusDot} />
              </Pressable>
            </View>
          </View>

          {/* Loading State or Full Dashboard */}
          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <>
              {/* Athlete Welcome & Readiness Briefing */}
              <View style={styles.welcomeRow}>
                <View style={styles.welcomeLeft}>
                  <View style={styles.bioSyncBadge}>
                    <View style={styles.bioSyncDot} />
                    <Text style={styles.bioSyncText}>BIO-SYNC OK</Text>
                  </View>
                  <Text style={styles.welcomeTitle}>Ready to Move, {athleteFirstName}</Text>
                </View>

                <View style={styles.primeBadge}>
                  <Ionicons name="flash" size={13} color="#FFFFFF" />
                  <Text style={styles.primeBadgeText}>PRIME</Text>
                </View>
              </View>

              {/* Hero Telemetry Card: Recovery Index (94% Optimal) */}
              <ReadinessHeroCard
                score={activeWeeklyStats.totalDistanceKm > 0 ? Math.min(100, Math.round((activeWeeklyStats.totalDistanceKm / (activeWeeklyStats.distanceGoalKm || 30)) * 100)) : 0}
                statusLabel={activeWeeklyStats.totalDistanceKm > 0 ? 'ACTIVE' : 'READY'}
              />

              {/* Daily Movement Strain & Multi-Ring Tracker */}
              <KineticStrainCard
                currentStrain={activeWeeklyStats.totalDistanceKm > 0 ? Number(activeWeeklyStats.totalDistanceKm.toFixed(1)) : 0.0}
                targetStrain={activeWeeklyStats.distanceGoalKm || 18.0}
              />

              {/* Quick Launch Bar */}
              <QuickLaunchBar />

              {/* Live Movement Stream Visual Banner */}
              <FeaturedChallengeBanner />

              {/* Recent Movement Sessions (Session Log // Telemetry) */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>SESSION LOG // TELEMETRY</Text>
                  <Text style={styles.sectionSubText}>{todayFormatted}</Text>
                </View>

                {/* Real-Time Session Telemetry Card */}
                {rawActivities.length > 0 ? (
                  <TelemetrySessionCard
                    title={rawActivities[0].title}
                    time={rawActivities[0].timeAgo}
                    efficiencyScore={rawActivities[0].location || 'Outdoor Session'}
                    tag={rawActivities[0].type.toUpperCase()}
                    distanceKm={rawActivities[0].distanceKm}
                    pace={rawActivities[0].paceOrSpeedFormatted}
                    calories={rawActivities[0].calories}
                    maxHr={rawActivities[0].maxHeartRate || 0}
                    peakSpeed={`${rawActivities[0].paceOrSpeedFormatted} ${rawActivities[0].type === 'ride' ? 'km/h' : '/km'}`}
                  />
                ) : (
                  <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, marginVertical: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <Ionicons name="footsteps-outline" size={28} color="#006B5D" style={{ marginBottom: 6 }} />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>No Sessions Recorded Yet</Text>
                    <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
                      All telemetry starts from zero. Tap SESSION below to begin your first workout!
                    </Text>
                  </View>
                )}

                {/* Filter Pills for Recorded User Workouts */}
                {rawActivities.length > 0 && (
                  <FilterPills selected={filter} onSelect={setFilter} counts={counts} />
                )}

                {/* Real User Recorded Workouts */}
                {activities.length > 0 && (
                  <View style={styles.activitiesList}>
                    {activities.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))}
                  </View>
                )}
              </View>

              {/* Live Biometric Sync Status Card */}
              <BiometricSyncCard />
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
    backgroundColor: '#F6F8F8',
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
    alignItems: 'center',
    paddingVertical: 6,
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleCol: {
    gap: 1,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sensorBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sensorPulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  sensorBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
    position: 'relative',
  },
  avatarBtnPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  avatarBtnText: {
    color: '#006B5D',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  welcomeLeft: {
    gap: 4,
  },
  bioSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    alignSelf: 'flex-start',
  },
  bioSyncDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  bioSyncText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.8,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  primeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 2,
  },
  primeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  sectionContainer: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionSubText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  activitiesList: {
    gap: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});
