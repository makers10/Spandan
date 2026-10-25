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
import { Ionicons } from '@expo/vector-icons';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { AtmosphericBackground } from '@/components/ui/atmospheric-background';
import { useAuth } from '@/context/auth-context';
import { activityService } from '@/services/activity-service';
import { socialService } from '@/services/social-service';
import { authService } from '@/services/auth-service';
import { Activity } from '@/types/fitness';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, isDemoMode, signOut, refreshProfile, openAuthModal } = useAuth();

  const [realStats, setRealStats] = useState<{
    totalActivities: number;
    totalDistanceKm: number;
    totalHours: number;
    elevationTotalM: number;
  } | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);

  const [followCounts, setFollowCounts] = useState<{ followers: number; following: number }>({
    followers: 0,
    following: 0,
  });

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editGoalKm, setEditGoalKm] = useState('50');
  const [unitPref, setUnitPref] = useState<'metric' | 'imperial'>('metric');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const isLiveUser = Boolean(user && !isDemoMode);

  useEffect(() => {
    async function loadUserStats() {
      if (isLiveUser && user) {
        try {
          const acts = await activityService.fetchUserActivities(user.id);
          setActivities(acts);
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
    : 'Guest Athlete';

  const displayHandle = isLiveUser
    ? `@${profile?.username || user?.email?.split('@')[0] || 'athlete'}`
    : '@guest.athlete';

  const displayAvatar = isLiveUser
    ? profile?.avatar_text || displayName.substring(0, 2).toUpperCase()
    : 'AT';

  const displayBio = isLiveUser
    ? profile?.bio || 'Athlete on Track your movement. Logging miles and reaching milestones.'
    : 'Track your movement with real-time biometric telemetry.';

  const displayCity = isLiveUser ? profile?.city || 'India' : 'India';

  const displayMemberSince =
    isLiveUser && user?.created_at
      ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : '2026';

  const activeStats = realStats || {
    totalActivities: 0,
    totalDistanceKm: 0,
    totalHours: 0,
    elevationTotalM: 0,
  };

  // Convert distance if Imperial is selected
  const distanceUnit = unitPref === 'imperial' ? 'MI' : 'KM';
  const displayTotalDistance =
    unitPref === 'imperial'
      ? (activeStats.totalDistanceKm * 0.621371).toFixed(1)
      : activeStats.totalDistanceKm.toFixed(1);

  // Goal calculations
  const weeklyGoalKm = profile?.weekly_distance_goal_km || 50;
  const currentWeeklyKm = Math.min(weeklyGoalKm, activeStats.totalDistanceKm % weeklyGoalKm || 14.2);
  const goalPercent = Math.min(100, Math.round((currentWeeklyKm / weeklyGoalKm) * 100));

  // Find PRs from real activities if present
  const longestRun = activities.reduce((max, a) => Math.max(max, a.distanceKm), 0);

  const bottomPadding = (insets.bottom || 16) + BottomTabInset + Spacing.four;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AtmosphericBackground glowMidColor="rgba(0, 184, 162, 0.08)" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          
          {/* Top Brand Header */}
          <View style={styles.headerBar}>
            <View style={styles.brandCluster}>
              <View style={styles.logoBadge}>
                <Ionicons name="person" size={17} color="#006B5D" />
              </View>
              <View style={styles.brandTitleCol}>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.brandTitle}>TRACK YOUR MOVEMENT</Text>
                  <View style={styles.brandStatusDot} />
                </View>
                <Text style={styles.brandSubtitle}>Pulse OS // Profile</Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              {isLiveUser ? (
                <>
                  <Pressable
                    onPress={() => setShowEditModal(true)}
                    style={({ pressed }) => [styles.actionPillBtn, pressed && styles.btnPressed]}>
                    <Ionicons name="create-outline" size={14} color="#006b5d" />
                    <Text style={styles.actionPillBtnText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleSignOut}
                    style={({ pressed }) => [styles.signOutPillBtn, pressed && styles.btnPressed]}>
                    <Ionicons name="log-out-outline" size={14} color="#dc2626" />
                    <Text style={styles.signOutPillBtnText}>Sign Out</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  onPress={() => openAuthModal('login')}
                  style={({ pressed }) => [styles.signInGlowingBtn, pressed && styles.btnPressed]}>
                  <Ionicons name="flash" size={13} color="#FFFFFF" />
                  <Text style={styles.signInGlowingBtnText}>Sign In</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Athlete Hero Identity Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileTopRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarRingOuter}>
                  <View style={styles.avatarRingInner}>
                    <Text style={styles.avatarText}>{displayAvatar}</Text>
                  </View>
                </View>
                <View style={styles.avatarVerifiedBadge}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.athleteName}>{displayName}</Text>
                  <View style={styles.proBadge}>
                    <Text style={styles.proBadgeText}>
                      {isLiveUser ? 'VERIFIED RIG' : 'DEMO ATHLETE'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.handleText}>{displayHandle}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={12} color="#64748b" />
                  <Text style={styles.locationText}>
                    {displayCity} • Calibrated {displayMemberSince}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.bioText}>{displayBio}</Text>

            {/* Hardware Telemetry Rig Sync Status */}
            <View style={styles.hardwareBadgeRow}>
              <View style={styles.hardwareChip}>
                <Ionicons name="heart-circle" size={14} color="#00b8a2" />
                <Text style={styles.hardwareChipText}>POLAR H10 // 94%</Text>
              </View>
              <View style={styles.hardwareChip}>
                <Ionicons name="hardware-chip" size={13} color="#00b8a2" />
                <Text style={styles.hardwareChipText}>IMU 6-AXIS // RTK</Text>
              </View>
              <View style={styles.hardwareChip}>
                <Ionicons name="shield-checkmark" size={13} color="#006b5d" />
                <Text style={styles.hardwareChipText}>BIO-LINKED</Text>
              </View>
            </View>

            {/* Social & Telemetry Quick Counts */}
            <View style={styles.socialStatsRow}>
              <View style={styles.socialCol}>
                <Text style={styles.socialVal}>{activeStats.totalActivities}</Text>
                <Text style={styles.socialLabel}>SESSIONS</Text>
              </View>
              <View style={styles.socialDivider} />
              <View style={styles.socialCol}>
                <Text style={styles.socialVal}>{followCounts.followers}</Text>
                <Text style={styles.socialLabel}>FOLLOWERS</Text>
              </View>
              <View style={styles.socialDivider} />
              <View style={styles.socialCol}>
                <Text style={styles.socialVal}>{followCounts.following}</Text>
                <Text style={styles.socialLabel}>FOLLOWING</Text>
              </View>
            </View>
          </View>

          {/* Section: Career Biometric Milestones */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="speedometer-outline" size={16} color="#006b5d" />
              <Text style={styles.sectionTitle}>Career Telemetry</Text>
            </View>
            <Text style={styles.sectionBadge}>ALL-TIME</Text>
          </View>

          <View style={styles.allTimeGrid}>
            <View style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <Text style={styles.bentoLabel}>TOTAL DISTANCE</Text>
                <View style={styles.bentoIconWrapper}>
                  <Ionicons name="navigate-outline" size={14} color="#00b8a2" />
                </View>
              </View>
              <View style={styles.allTimeValRow}>
                <Text style={styles.bentoVal}>{displayTotalDistance}</Text>
                <Text style={styles.bentoSub}>{distanceUnit}</Text>
              </View>
              <Text style={styles.bentoCaption}>Cumulative trajectory</Text>
            </View>

            <View style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <Text style={styles.bentoLabel}>ACTIVE TIME</Text>
                <View style={styles.bentoIconWrapper}>
                  <Ionicons name="time-outline" size={14} color="#00b8a2" />
                </View>
              </View>
              <View style={styles.allTimeValRow}>
                <Text style={styles.bentoVal}>{activeStats.totalHours}</Text>
                <Text style={styles.bentoSub}>HRS</Text>
              </View>
              <Text style={styles.bentoCaption}>Time in dynamic strain</Text>
            </View>

            <View style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <Text style={styles.bentoLabel}>SESSIONS LOGGED</Text>
                <View style={styles.bentoIconWrapper}>
                  <Ionicons name="flash-outline" size={14} color="#00b8a2" />
                </View>
              </View>
              <View style={styles.allTimeValRow}>
                <Text style={styles.bentoVal}>{activeStats.totalActivities}</Text>
                <Text style={styles.bentoSub}>ACTS</Text>
              </View>
              <Text style={styles.bentoCaption}>100% telemetry synced</Text>
            </View>

            <View style={styles.bentoCard}>
              <View style={styles.bentoHeaderRow}>
                <Text style={styles.bentoLabel}>TOTAL ELEVATION</Text>
                <View style={styles.bentoIconWrapper}>
                  <Ionicons name="trending-up-outline" size={14} color="#00b8a2" />
                </View>
              </View>
              <View style={styles.allTimeValRow}>
                <Text style={styles.bentoVal}>{activeStats.elevationTotalM}</Text>
                <Text style={styles.bentoSub}>M</Text>
              </View>
              <Text style={styles.bentoCaption}>Vertical kinetic climb</Text>
            </View>
          </View>

          {/* Section: Weekly Training Goal Progress */}
          <View style={styles.goalCard}>
            <View style={styles.goalTopRow}>
              <View style={styles.goalInfo}>
                <Text style={styles.goalEyebrow}>WEEKLY TARGET</Text>
                <Text style={styles.goalTitle}>
                  {weeklyGoalKm} {distanceUnit} Volume Band
                </Text>
              </View>
              <View style={styles.goalPercentBadge}>
                <Text style={styles.goalPercentText}>{goalPercent}%</Text>
              </View>
            </View>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${goalPercent}%` }]} />
            </View>

            <View style={styles.goalFooterRow}>
              <Text style={styles.goalFooterText}>
                {currentWeeklyKm.toFixed(1)} {distanceUnit} logged this week
              </Text>
              <Text style={styles.goalFooterAccent}>
                {(weeklyGoalKm - currentWeeklyKm).toFixed(1)} {distanceUnit} remaining
              </Text>
            </View>
          </View>

          {/* Section: Telemetry Calibration & Units */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="options-outline" size={16} color="#006b5d" />
              <Text style={styles.sectionTitle}>System Calibration</Text>
            </View>
            <Text style={styles.sectionBadge}>STANDARDS</Text>
          </View>

          <View style={styles.preferencesCard}>
            <View style={styles.prefRow}>
              <View style={styles.prefTextGroup}>
                <Text style={styles.prefTitle}>Measurement Standard</Text>
                <Text style={styles.prefSub}>
                  {unitPref === 'metric' ? 'Metric (Kilometers & Meters)' : 'Imperial (Miles & Feet)'}
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

            <View style={styles.prefDivider} />

            <View style={styles.prefRow}>
              <View style={styles.prefTextGroup}>
                <Text style={styles.prefTitle}>IMU Auto-Calibration</Text>
                <Text style={styles.prefSub}>Calculates force vectors and ground contact balance</Text>
              </View>
              <View style={styles.autoStatusBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#00b8a2" />
                <Text style={styles.autoStatusText}>ACTIVE</Text>
              </View>
            </View>
          </View>

          {/* Section: Movement Milestones & Trophy Case */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="ribbon-outline" size={16} color="#006b5d" />
              <Text style={styles.sectionTitle}>Movement Milestones</Text>
            </View>
            <Text style={styles.sectionBadge}>RECORDS</Text>
          </View>

          <View style={styles.trophyStack}>
            <View style={styles.trophyCard}>
              <View style={styles.trophyIconBox}>
                <Ionicons name="timer-outline" size={20} color="#006b5d" />
              </View>
              <View style={styles.trophyDetails}>
                <Text style={styles.trophyCategory}>STRIDE VELOCITY // 5K</Text>
                <Text style={styles.trophyRecord}>20:14</Text>
                <Text style={styles.trophySub}>Splits average 4:02/km @ 1.42m stride</Text>
              </View>
              <View style={styles.trophyBadge}>
                <Text style={styles.trophyBadgeText}>PR</Text>
              </View>
            </View>

            <View style={styles.trophyCard}>
              <View style={styles.trophyIconBox}>
                <Ionicons name="flame-outline" size={20} color="#006b5d" />
              </View>
              <View style={styles.trophyDetails}>
                <Text style={styles.trophyCategory}>LONGEST SINGLE SESSION</Text>
                <Text style={styles.trophyRecord}>
                  {longestRun > 0 ? `${longestRun.toFixed(1)} ${distanceUnit}` : `21.1 ${distanceUnit}`}
                </Text>
                <Text style={styles.trophySub}>High endurance sustained strain</Text>
              </View>
              <View style={styles.trophyBadge}>
                <Text style={styles.trophyBadgeText}>GOLD</Text>
              </View>
            </View>

            <View style={styles.trophyCard}>
              <View style={styles.trophyIconBox}>
                <Ionicons name="flash" size={20} color="#006b5d" />
              </View>
              <View style={styles.trophyDetails}>
                <Text style={styles.trophyCategory}>PEAK KINETIC POWER</Text>
                <Text style={styles.trophyRecord}>410 WATTS</Text>
                <Text style={styles.trophySub}>Sprint uphill transition effort</Text>
              </View>
              <View style={styles.trophyBadge}>
                <Text style={styles.trophyBadgeText}>PEAK</Text>
              </View>
            </View>
          </View>

          {/* Quick Record Navigation Launch */}
          <Pressable
            onPress={() => router.push('/record' as any)}
            style={({ pressed }) => [styles.quickLaunchSessionBtn, pressed && styles.btnPressed]}>
            <View style={styles.quickLaunchIcon}>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.quickLaunchTextGroup}>
              <Text style={styles.quickLaunchTitle}>START NEW KINETIC SESSION</Text>
              <Text style={styles.quickLaunchSub}>Stream live GPS, cadence & telemetry HUD</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#00b8a2" />
          </Pressable>

          {/* Sign Out Action at Bottom for Live Users */}
          {isLiveUser && (
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [styles.signOutBottomBtn, pressed && styles.btnPressed]}>
              <Ionicons name="log-out-outline" size={16} color="#dc2626" />
              <Text style={styles.signOutBottomBtnText}>Disconnect Telemetry & Sign Out</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleGroup}>
                <Text style={styles.modalEyebrow}>ATHLETE CONFIGURATION</Text>
                <Text style={styles.modalTitle}>Edit Profile Dossier</Text>
              </View>
              <Pressable onPress={() => setShowEditModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>FULL ATHLETE NAME</Text>
              <TextInput
                style={styles.textInput}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Your Athlete Name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>BIO / TRAINING CREED</Text>
              <TextInput
                style={[styles.textInput, { height: 68 }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="What drives your movement?"
                placeholderTextColor="#94a3b8"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PRIMARY LOCATION // REGION</Text>
              <TextInput
                style={styles.textInput}
                value={editCity}
                onChangeText={setEditCity}
                placeholder="City, Country"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>WEEKLY VOLUME TARGET ({distanceUnit})</Text>
              <TextInput
                style={styles.textInput}
                value={editGoalKm}
                onChangeText={setEditGoalKm}
                keyboardType="numeric"
                placeholder="50"
                placeholderTextColor="#94a3b8"
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
                  <Text style={styles.saveBtnText}>Save Changes</Text>
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
    backgroundColor: '#f4f8f7',
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
    paddingTop: 8,
    paddingBottom: 4,
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
    gap: 8,
    marginBottom: 4,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 184, 162, 0.10)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 162, 0.25)',
  },
  actionPillBtnText: {
    color: '#006b5d',
    fontSize: 12,
    fontWeight: '700',
  },
  signOutPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  signOutPillBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  signInGlowingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#00b8a2',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    shadowColor: '#00b8a2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  signInGlowingBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarRingOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2.5,
    backgroundColor: 'rgba(0, 184, 162, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRingInner: {
    width: '100%',
    height: '100%',
    borderRadius: 31,
    backgroundColor: '#006b5d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  avatarVerifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00b8a2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  athleteName: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  proBadge: {
    backgroundColor: 'rgba(0, 184, 162, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 162, 0.3)',
  },
  proBadgeText: {
    color: '#006b5d',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  handleText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    color: '#64748b',
    fontSize: 12,
  },
  bioText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
  },
  hardwareBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hardwareChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  hardwareChipText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  socialStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.7)',
  },
  socialCol: {
    alignItems: 'center',
    gap: 2,
  },
  socialDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(226, 232, 240, 0.8)',
  },
  socialVal: {
    color: '#0f172a',
    fontSize: 19,
    fontWeight: '900',
  },
  socialLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionBadge: {
    color: '#006b5d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    backgroundColor: 'rgba(0, 184, 162, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  allTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bentoCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  bentoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bentoLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bentoIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 184, 162, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allTimeValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bentoVal: {
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '900',
  },
  bentoSub: {
    color: '#006b5d',
    fontSize: 12,
    fontWeight: '800',
  },
  bentoCaption: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  goalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalInfo: {
    gap: 2,
  },
  goalEyebrow: {
    color: '#006b5d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  goalTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  goalPercentBadge: {
    backgroundColor: 'rgba(0, 184, 162, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 162, 0.3)',
  },
  goalPercentText: {
    color: '#006b5d',
    fontSize: 13,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(226, 232, 240, 0.7)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00b8a2',
    borderRadius: 4,
  },
  goalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalFooterText: {
    color: '#64748b',
    fontSize: 11,
  },
  goalFooterAccent: {
    color: '#006b5d',
    fontSize: 11,
    fontWeight: '700',
  },
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prefDivider: {
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.7)',
  },
  prefTextGroup: {
    flex: 1,
    marginRight: 12,
    gap: 2,
  },
  prefTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  prefSub: {
    color: '#64748b',
    fontSize: 12,
  },
  unitToggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  unitBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 7,
  },
  unitBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  unitBtnText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
  },
  unitBtnTextActive: {
    color: '#006b5d',
  },
  autoStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 184, 162, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  autoStatusText: {
    color: '#006b5d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trophyStack: {
    gap: 10,
  },
  trophyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  trophyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 184, 162, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyDetails: {
    flex: 1,
    gap: 2,
  },
  trophyCategory: {
    color: '#006b5d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trophyRecord: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
  },
  trophySub: {
    color: '#64748b',
    fontSize: 11,
  },
  trophyBadge: {
    backgroundColor: 'rgba(0, 184, 162, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 162, 0.25)',
  },
  trophyBadgeText: {
    color: '#006b5d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  quickLaunchSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 162, 0.3)',
    gap: 12,
    shadowColor: '#00b8a2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  quickLaunchIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#00b8a2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLaunchTextGroup: {
    flex: 1,
    gap: 2,
  },
  quickLaunchTitle: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  quickLaunchSub: {
    color: '#64748b',
    fontSize: 11,
  },
  signOutBottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 6,
  },
  signOutBottomBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitleGroup: {
    gap: 2,
  },
  modalEyebrow: {
    color: '#006b5d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  modalTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: '#006b5d',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#0f172a',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  cancelBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.4,
    backgroundColor: '#00b8a2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#00b8a2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  btnPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
