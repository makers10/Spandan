import React from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { HomeHeader } from '@/components/fitness/home-header';
import { AthleteWelcomeBadge } from '@/components/fitness/athlete-welcome-badge';
import { ReadinessHeroCard } from '@/components/fitness/readiness-hero-card';
import { KineticStrainCard } from '@/components/fitness/kinetic-strain-card';
import { QuickLaunchBar } from '@/components/fitness/quick-launch-bar';
import { FeaturedChallengeBanner } from '@/components/fitness/featured-challenge-banner';
import { SessionLogSection } from '@/components/fitness/session-log-section';
import { BiometricSyncCard } from '@/components/fitness/biometric-sync-card';
import { SkeletonLoader } from '@/components/fitness/skeleton-loader';
import { AtmosphericBackground } from '@/components/ui/atmospheric-background';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useHomeActivities } from '@/hooks/use-home-activities';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { rawActivities, activeWeeklyStats, isLoading, refreshing, onRefresh, isLiveUser } = useHomeActivities();

  const athleteDisplayName = isLiveUser
    ? profile?.full_name || user?.email?.split('@')[0] || 'Athlete'
    : 'Athlete';

  const athleteFirstName = athleteDisplayName.split(' ')[0];
  const athleteAvatar = isLiveUser ? profile?.avatar_text || athleteDisplayName.substring(0, 2).toUpperCase() : 'TM';
  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
  const bottomPadding = (insets.bottom || 16) + BottomTabInset + Spacing.four;
  const stepsEst = Math.round(activeWeeklyStats.totalDistanceKm * 1300);
  const floorsEst = activeWeeklyStats.floorsClimbedTotal || Math.round(activeWeeklyStats.elevationGainM / 3.0) || 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AtmosphericBackground />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS === 'web' ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#006B5D" colors={['#006B5D']} />
          )
        }>
        <View style={styles.contentWrapper}>
          <HomeHeader
            athleteAvatar={athleteAvatar}
            onRecordPress={() => router.push('/record' as any)}
            onProfilePress={() => router.push('/profile' as any)}
          />

          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <>
              <AthleteWelcomeBadge athleteFirstName={athleteFirstName} />
              <ReadinessHeroCard
                score={activeWeeklyStats.totalDistanceKm > 0 ? Math.min(100, Math.round((activeWeeklyStats.totalDistanceKm / (activeWeeklyStats.distanceGoalKm || 30)) * 100)) : 0}
                statusLabel={activeWeeklyStats.totalDistanceKm > 0 ? 'ACTIVE' : 'READY'}
                dailySteps={stepsEst}
                activeMinutes={activeWeeklyStats.activeTimeMinutes}
                floorsClimbed={floorsEst}
              />
              <KineticStrainCard
                currentStrain={activeWeeklyStats.totalDistanceKm > 0 ? Number(activeWeeklyStats.totalDistanceKm.toFixed(1)) : 0.0}
                targetStrain={activeWeeklyStats.distanceGoalKm || 18.0}
              />
              <QuickLaunchBar />
              <FeaturedChallengeBanner />
              <SessionLogSection rawActivities={rawActivities} todayFormatted={todayFormatted} />
              <BiometricSyncCard />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, height: '100%', minHeight: 0, backgroundColor: '#F6F8F8' },
  scrollView: { flex: 1, minHeight: 0 },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.select({ web: Spacing.four, default: Spacing.three }),
  },
  contentWrapper: { width: '100%', maxWidth: MaxContentWidth, gap: 20 },
});
