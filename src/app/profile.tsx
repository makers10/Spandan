import React, { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { SpandanLogo } from '@/components/fitness/spandan-logo';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getMockAthleteProfile } from '@/data/mock-fitness-data';
import { useAuth } from '@/context/auth-context';
import { activityService } from '@/services/activity-service';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, isDemoMode, isConfigured, signOut } = useAuth();

  const [realStats, setRealStats] = useState<{
    totalActivities: number;
    totalDistanceKm: number;
    totalHours: number;
    elevationTotalM: number;
  } | null>(null);

  const isLiveUser = Boolean(user && !isDemoMode && isConfigured);
  const mockProfile = getMockAthleteProfile();

  useEffect(() => {
    async function loadUserStats() {
      if (isLiveUser && user) {
        try {
          const acts = await activityService.fetchUserActivities(user.id);
          const totalDistance = acts.reduce((s, a) => s + a.distanceKm, 0);
          const totalElev = acts.reduce((s, a) => s + a.elevationMeters, 0);
          const totalMins = acts.reduce((s, a) => {
            const parts = a.durationFormatted.split(':').map(Number);
            if (parts.length === 3) return s + parts[0] * 60 + parts[1];
            if (parts.length === 2) return s + parts[0];
            return s + 30;
          }, 0);

          setRealStats({
            totalActivities: acts.length,
            totalDistanceKm: Number(totalDistance.toFixed(1)),
            totalHours: Math.round(totalMins / 60),
            elevationTotalM: totalElev,
          });
        } catch (err: any) {
          console.warn('Failed to calculate live profile stats:', err.message);
        }
      }
    }
    loadUserStats();
  }, [isLiveUser, user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/' as any);
  };

  const displayName = isLiveUser
    ? profile?.full_name || user?.email?.split('@')[0] || 'Athlete'
    : mockProfile.name;

  const displayHandle = isLiveUser
    ? `@${profile?.username || user?.email?.split('@')[0] || 'athlete'}`
    : mockProfile.handle;

  const displayAvatar = isLiveUser
    ? profile?.avatar_text || displayName.substring(0, 2).toUpperCase()
    : mockProfile.avatarText;

  const displayBio = isLiveUser
    ? profile?.bio || 'Spandan Athlete. Logging miles and finding the pulse.'
    : mockProfile.tagline;

  const displayCity = isLiveUser ? profile?.city || 'India' : mockProfile.city;

  const displayMemberSince = isLiveUser && user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : mockProfile.memberSince;

  const activeStats = isLiveUser && realStats ? realStats : mockProfile.stats;

  const bottomPadding = (insets.bottom || 16) + BottomTabInset + Spacing.four;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.headerBar}>
            <SpandanLogo size="medium" />

            {isLiveUser ? (
              <Pressable onPress={handleSignOut} style={styles.signOutHeaderBtn}>
                <Text style={styles.signOutHeaderText}>Sign Out</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.push('/auth/login' as any)}
                style={styles.signInHeaderBtn}>
                <Text style={styles.signInHeaderText}>Sign In / Join</Text>
              </Pressable>
            )}
          </View>

          {/* Mode Banner */}
          {!isLiveUser && (
            <View style={styles.demoBanner}>
              <View style={styles.demoTextGroup}>
                <Text style={styles.demoBannerTitle}>DEMO ATHLETE PROFILE (MOCK DATA)</Text>
                <Text style={styles.demoBannerSub}>
                  You are viewing sample metrics. Sign in with Supabase to save your personal records and cloud telemetry.
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/auth/login' as any)}
                style={styles.demoActionBtn}>
                <Text style={styles.demoActionBtnText}>Sign In</Text>
              </Pressable>
            </View>
          )}

          {/* Athlete Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>{displayAvatar}</Text>
              </View>

              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.athleteName}>{displayName}</Text>
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>
                      {isLiveUser ? 'VERIFIED ATHLETE' : 'PRO DEMO'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.handleText}>{displayHandle}</Text>
                <Text style={styles.locationText}>
                  📍 {displayCity} • Member since {displayMemberSince}
                </Text>
              </View>
            </View>

            <Text style={styles.bioText}>{displayBio}</Text>

            <View style={styles.socialStatsRow}>
              <View style={styles.socialCol}>
                <Text style={styles.socialVal}>{isLiveUser ? activeStats.totalActivities : 482}</Text>
                <Text style={styles.socialLabel}>
                  {isLiveUser ? 'ACTIVITIES' : 'FOLLOWERS'}
                </Text>
              </View>
              <View style={styles.socialCol}>
                <Text style={styles.socialVal}>{isLiveUser ? activeStats.totalDistanceKm : 314}</Text>
                <Text style={styles.socialLabel}>
                  {isLiveUser ? 'TOTAL KM' : 'FOLLOWING'}
                </Text>
              </View>
              <View style={styles.socialCol}>
                <Text style={styles.socialVal}>{isLiveUser ? activeStats.totalHours : 18}</Text>
                <Text style={styles.socialLabel}>
                  {isLiveUser ? 'HOURS' : 'CLUBS'}
                </Text>
              </View>
            </View>
          </View>

          {/* All-Time Performance Summary */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isLiveUser ? 'Career Milestones (Supabase)' : 'Career Milestones (Sample Data)'}
            </Text>
          </View>

          <View style={styles.allTimeGrid}>
            <View style={styles.allTimeCard}>
              <Text style={styles.allTimeLabel}>TOTAL DISTANCE</Text>
              <View style={styles.allTimeValRow}>
                <Text style={styles.allTimeVal}>{activeStats.totalDistanceKm.toFixed(1)}</Text>
                <Text style={styles.allTimeSub}>km</Text>
              </View>
            </View>

            <View style={styles.allTimeCard}>
              <Text style={styles.allTimeLabel}>ACTIVITIES</Text>
              <View style={styles.allTimeValRow}>
                <Text style={styles.allTimeVal}>{activeStats.totalActivities}</Text>
                <Text style={styles.allTimeSub}>sessions</Text>
              </View>
            </View>

            <View style={styles.allTimeCard}>
              <Text style={styles.allTimeLabel}>TIME SWEATED</Text>
              <View style={styles.allTimeValRow}>
                <Text style={styles.allTimeVal}>{activeStats.totalHours}</Text>
                <Text style={styles.allTimeSub}>hours</Text>
              </View>
            </View>

            <View style={styles.allTimeCard}>
              <Text style={styles.allTimeLabel}>TOTAL ELEVATION</Text>
              <View style={styles.allTimeValRow}>
                <Text style={styles.allTimeVal}>{activeStats.elevationTotalM}</Text>
                <Text style={styles.allTimeSub}>m</Text>
              </View>
            </View>
          </View>

          {/* Personal Records Trophy Case */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trophy Case & PRs</Text>
          </View>

          <View style={styles.prGrid}>
            {mockProfile.personalRecords.map((pr) => (
              <View key={pr.event} style={styles.prCard}>
                <Text style={styles.prIcon}>🏆</Text>
                <View style={styles.prDetails}>
                  <Text style={styles.prEvent}>{pr.event}</Text>
                  <Text style={styles.prDate}>{pr.date}</Text>
                </View>
                <Text style={styles.prTime}>{pr.time}</Text>
              </View>
            ))}
          </View>

          {/* Gear Tracker Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gear & Shoe Tracker</Text>
          </View>

          <View style={styles.gearList}>
            {mockProfile.shoes.map((shoe) => {
              const pct = Math.min(100, Math.round((shoe.distanceKm / shoe.maxKm) * 100));
              return (
                <View key={shoe.name} style={styles.gearCard}>
                  <View style={styles.gearTopRow}>
                    <Text style={styles.gearName}>👟 {shoe.name}</Text>
                    <Text style={styles.gearKm}>
                      {shoe.distanceKm} / {shoe.maxKm} km
                    </Text>
                  </View>
                  <View style={styles.gearTrack}>
                    <View style={[styles.gearFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.gearRemainingText}>
                    {shoe.maxKm - shoe.distanceKm} km remaining before recommended retirement
                  </Text>
                </View>
              );
            })}

            {mockProfile.bikes.map((bike) => (
              <View key={bike.name} style={styles.gearCard}>
                <View style={styles.gearTopRow}>
                  <Text style={styles.gearName}>🚴 {bike.name}</Text>
                  <Text style={styles.gearKm}>{bike.distanceKm} km logged</Text>
                </View>
                <Text style={styles.gearTypeLabel}>Primary Road Machine • Shimano Tiagra Disc</Text>
              </View>
            ))}
          </View>

          {/* Sign Out Action at Bottom for Live Users */}
          {isLiveUser && (
            <Pressable onPress={handleSignOut} style={styles.signOutBottomBtn}>
              <Text style={styles.signOutBottomBtnText}>Sign Out of Spandan</Text>
            </Pressable>
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
    gap: 16,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  signOutHeaderBtn: {
    backgroundColor: '#1C263E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#243354',
  },
  signOutHeaderText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  signInHeaderBtn: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  signInHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  demoBanner: {
    backgroundColor: '#131B2E',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  demoTextGroup: {
    flex: 1,
    minWidth: 200,
    gap: 2,
  },
  demoBannerTitle: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  demoBannerSub: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 15,
  },
  demoActionBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  demoActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  profileCard: {
    backgroundColor: '#131B2E',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 14,
  },
  profileTopRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C263E',
    borderWidth: 2,
    borderColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  athleteName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  proBadge: {
    backgroundColor: '#FF6B00',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  handleText: {
    color: '#FF6B00',
    fontSize: 13,
    fontWeight: '700',
  },
  locationText: {
    color: '#64748B',
    fontSize: 12,
  },
  bioText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  socialStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1C263E',
  },
  socialCol: {
    alignItems: 'center',
    gap: 2,
  },
  socialVal: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  socialLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  allTimeGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  allTimeCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 4,
  },
  allTimeLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  allTimeValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  allTimeVal: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  allTimeSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  prGrid: {
    gap: 10,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2E',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 12,
  },
  prIcon: {
    fontSize: 20,
  },
  prDetails: {
    flex: 1,
  },
  prEvent: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  prDate: {
    color: '#64748B',
    fontSize: 11,
  },
  prTime: {
    color: '#FF6B00',
    fontSize: 16,
    fontWeight: '800',
  },
  gearList: {
    gap: 10,
  },
  gearCard: {
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 8,
  },
  gearTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gearName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  gearKm: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  gearTrack: {
    height: 6,
    backgroundColor: '#1C263E',
    borderRadius: 3,
    overflow: 'hidden',
  },
  gearFill: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 3,
  },
  gearRemainingText: {
    color: '#64748B',
    fontSize: 11,
  },
  gearTypeLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  signOutBottomBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: 8,
  },
  signOutBottomBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
  },
});
