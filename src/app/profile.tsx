import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { SpandanLogo } from '@/components/fitness/spandan-logo';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { getMockAthleteProfile } from '@/data/mock-fitness-data';
import { useAuth } from '@/context/auth-context';
import { activityService } from '@/services/activity-service';
import { socialService } from '@/services/social-service';
import { authService } from '@/services/auth-service';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, isDemoMode, isConfigured, signOut, refreshProfile } = useAuth();

  const [realStats, setRealStats] = useState<{
    totalActivities: number;
    totalDistanceKm: number;
    totalHours: number;
    elevationTotalM: number;
  } | null>(null);

  const [followCounts, setFollowCounts] = useState<{ followers: number; following: number }>({
    followers: 142,
    following: 89,
  });

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editGoalKm, setEditGoalKm] = useState('50');
  const [unitPref, setUnitPref] = useState<'metric' | 'imperial'>('metric');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

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

          // Fetch follow counts
          const counts = await socialService.getFollowCounts(user.id);
          setFollowCounts(counts);

          // Populate edit modal fields
          if (profile) {
            setEditFullName(profile.full_name || '');
            setEditBio(profile.bio || '');
            setEditCity(profile.city || '');
            setEditGoalKm(String(profile.weekly_distance_goal_km || 50));
            setUnitPref(profile.unit_preference || 'metric');
          }
        } catch (err: any) {
          console.warn('Failed to calculate live profile stats:', err.message);
        }
      }
    }
    loadUserStats();
  }, [isLiveUser, user, profile]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/' as any);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsUpdatingProfile(true);

    try {
      await authService.updateProfile(user.id, {
        full_name: editFullName.trim(),
        bio: editBio.trim(),
        city: editCity.trim(),
        weekly_distance_goal_km: Number(editGoalKm) || 50,
        unit_preference: unitPref,
      });

      await refreshProfile();
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUnitToggle = async (newPref: 'metric' | 'imperial') => {
    setUnitPref(newPref);
    if (isLiveUser && user) {
      try {
        await authService.updateProfile(user.id, { unit_preference: newPref });
        await refreshProfile();
      } catch (err: any) {
        console.warn('Failed to update unit preference:', err.message);
      }
    }
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

  const displayMemberSince =
    isLiveUser && user?.created_at
      ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : mockProfile.memberSince;

  const activeStats = isLiveUser && realStats ? realStats : mockProfile.stats;

  // Convert distance if Imperial is selected
  const distanceUnit = unitPref === 'imperial' ? 'mi' : 'km';
  const displayTotalDistance =
    unitPref === 'imperial'
      ? (activeStats.totalDistanceKm * 0.621371).toFixed(1)
      : activeStats.totalDistanceKm.toFixed(1);

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

            <View style={styles.headerRightActions}>
              {isLiveUser && (
                <Pressable onPress={() => setShowEditModal(true)} style={styles.editProfileHeaderBtn}>
                  <Text style={styles.editProfileHeaderText}>Edit Profile</Text>
                </Pressable>
              )}

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

            {/* Social Follower & Activity Counters */}
            <View style={styles.socialStatsRow}>
              <View style={styles.socialCol}>
                <Text style={styles.socialVal}>{activeStats.totalActivities}</Text>
                <Text style={styles.socialLabel}>ACTIVITIES</Text>
              </View>
              <View style={styles.socialCol}>
                <Text style={styles.socialVal}>{followCounts.followers}</Text>
                <Text style={styles.socialLabel}>FOLLOWERS</Text>
              </View>
              <View style={styles.socialCol}>
                <Text style={styles.socialVal}>{followCounts.following}</Text>
                <Text style={styles.socialLabel}>FOLLOWING</Text>
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
                <Text style={styles.allTimeVal}>{displayTotalDistance}</Text>
                <Text style={styles.allTimeSub}>{distanceUnit}</Text>
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

          {/* Unit Preferences & Settings */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Preferences & Units</Text>
          </View>

          <View style={styles.preferencesCard}>
            <View style={styles.prefRow}>
              <View style={styles.prefTextGroup}>
                <Text style={styles.prefTitle}>Distance & Elevation Units</Text>
                <Text style={styles.prefSub}>
                  Currently using {unitPref === 'metric' ? 'Metric (Kilometers & Meters)' : 'Imperial (Miles & Feet)'}
                </Text>
              </View>
              <View style={styles.unitToggleGroup}>
                <Pressable
                  onPress={() => handleUnitToggle('metric')}
                  style={[styles.unitBtn, unitPref === 'metric' && styles.unitBtnActive]}>
                  <Text style={[styles.unitBtnText, unitPref === 'metric' && styles.unitBtnTextActive]}>
                    KM
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleUnitToggle('imperial')}
                  style={[styles.unitBtn, unitPref === 'imperial' && styles.unitBtnActive]}>
                  <Text style={[styles.unitBtnText, unitPref === 'imperial' && styles.unitBtnTextActive]}>
                    MI
                  </Text>
                </Pressable>
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
          </View>

          {/* Sign Out Action at Bottom for Live Users */}
          {isLiveUser && (
            <Pressable onPress={handleSignOut} style={styles.signOutBottomBtn}>
              <Text style={styles.signOutBottomBtnText}>Sign Out of Spandan</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Athlete Profile</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput
                style={styles.textInput}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Your Athlete Name"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BIO / MOTTO</Text>
              <TextInput
                style={[styles.textInput, { height: 64 }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="What keeps you moving?"
                placeholderTextColor="#64748B"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CITY & REGION</Text>
              <TextInput
                style={styles.textInput}
                value={editCity}
                onChangeText={setEditCity}
                placeholder="City, Country"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>WEEKLY DISTANCE GOAL (KM)</Text>
              <TextInput
                style={styles.textInput}
                value={editGoalKm}
                onChangeText={setEditGoalKm}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowEditModal(false)}
                disabled={isUpdatingProfile}
                style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveProfile}
                disabled={isUpdatingProfile}
                style={[styles.saveBtn, isUpdatingProfile && styles.saveBtnDisabled]}>
                {isUpdatingProfile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF9',
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editProfileHeaderBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editProfileHeaderText: {
    color: '#4FA99A',
    fontSize: 12,
    fontWeight: '700',
  },
  signOutHeaderBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  signOutHeaderText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  signInHeaderBtn: {
    backgroundColor: '#4FA99A',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#4FA99A',
    gap: 12,
  },
  demoTextGroup: {
    flex: 1,
    gap: 2,
  },
  demoBannerTitle: {
    color: '#4FA99A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  demoBannerSub: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  demoActionBtn: {
    backgroundColor: '#4FA99A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  demoActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4FA99A',
  },
  avatarLargeText: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  athleteName: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  proBadge: {
    backgroundColor: 'rgba(79, 169, 154, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(79, 169, 154, 0.3)',
  },
  proBadgeText: {
    color: '#4FA99A',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  handleText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  locationText: {
    color: '#64748B',
    fontSize: 12,
  },
  bioText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 18,
  },
  socialStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  socialCol: {
    alignItems: 'center',
    gap: 2,
  },
  socialVal: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  socialLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    paddingTop: 6,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  allTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  allTimeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  allTimeLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  allTimeValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  allTimeVal: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
  },
  allTimeSub: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefTextGroup: {
    flex: 1,
    marginRight: 12,
    gap: 2,
  },
  prefTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  prefSub: {
    color: '#64748B',
    fontSize: 12,
  },
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unitBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  unitBtnTextActive: {
    color: '#4FA99A',
  },
  prGrid: {
    gap: 8,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  prIcon: {
    fontSize: 18,
  },
  prDetails: {
    flex: 1,
    gap: 2,
  },
  prEvent: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  prDate: {
    color: '#64748B',
    fontSize: 11,
  },
  prTime: {
    color: '#4FA99A',
    fontSize: 15,
    fontWeight: '800',
  },
  gearList: {
    gap: 10,
  },
  gearCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  gearTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gearName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  gearKm: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  gearTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  gearFill: {
    height: '100%',
    backgroundColor: '#4FA99A',
    borderRadius: 3,
  },
  gearRemainingText: {
    color: '#64748B',
    fontSize: 11,
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
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAF9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#0F172A',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.4,
    backgroundColor: '#4FA99A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
