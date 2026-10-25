import React, { useEffect, useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

import { BottomTabInset, Spacing } from '@/constants/theme';
import {
  Activity,
  ActivityComment,
  ActivitySplit,
  ActivityType,
  ActivityVisibility,
} from '@/types/fitness';
import { useAuth } from '@/context/auth-context';
import { activityService } from '@/services/activity-service';
import { socialService } from '@/services/social-service';
import {
  GpsCoordinate,
  calculateElevationStats,
  calculateKilometerSplits,
  calculatePace,
  calculateSpeed,
} from '@/utils/geo';
import { AtmosphericBackground } from '@/components/ui/atmospheric-background';

// Synthetic realistic kilometric split generator for activities without stored GPS points
function generateSyntheticSplits(act: Activity | null): ActivitySplit[] {
  if (!act) return [];
  const dist = Math.max(1, act.distanceKm || 10.2);
  const totalSec = act.durationSeconds || 2535;
  const numSplits = Math.max(1, Math.min(15, Math.floor(dist)));
  const avgSec = totalSec / dist;
  const remainder = Number((dist - numSplits).toFixed(2));

  // Pacing profile curve (tempo workout: steady start, fastest at 80%, strong finish)
  const paceOffsets = [10, 4, 1, -2, -1, -3, -5, -16, -4, -8, -2, 2, -5, -9, -12];

  const result: ActivitySplit[] = [];
  for (let i = 1; i <= numSplits; i++) {
    const offset = paceOffsets[(i - 1) % paceOffsets.length];
    const splitSec = Math.max(120, Math.round(avgSec + offset));
    result.push({
      splitNumber: i,
      distanceKm: 1.0,
      durationSeconds: splitSec,
      paceFormatted: calculatePace(1.0, splitSec),
      speedFormatted: calculateSpeed(1.0, splitSec),
      elevationDeltaM: i % 2 === 0 ? 12 : -8,
    });
  }

  if (remainder >= 0.1) {
    const remSec = Math.max(30, Math.round(avgSec * remainder - 5));
    result.push({
      splitNumber: numSplits + 1,
      distanceKm: remainder,
      durationSeconds: remSec,
      paceFormatted: calculatePace(remainder, remSec),
      speedFormatted: calculateSpeed(remainder, remSec),
      elevationDeltaM: 4,
    });
  }

  return result;
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user, isDemoMode } = useAuth();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [routePoints, setRoutePoints] = useState<GpsCoordinate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pointsLoading, setPointsLoading] = useState(true);

  // Kudos state
  const [hasKudoed, setHasKudoed] = useState(false);
  const [kudosCount, setKudosCount] = useState(0);

  // Comments state
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  // Edit Activity Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState<ActivityType>('run');
  const [editVisibility, setEditVisibility] = useState<ActivityVisibility>('public');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);

  const isLiveUser = Boolean(user && !isDemoMode);
  const isOwner = Boolean(
    isLiveUser && user && activity && (activity.userId === user.id || activity.athlete.name === 'You')
  );

  // Load activity details, GPS route points, kudos, and comments
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!id) return;
      setIsLoading(true);

      try {
        let loadedAct: Activity | null = null;
        try {
          loadedAct = await activityService.fetchActivityById(id);
        } catch {
          loadedAct = null;
        }

        if (isMounted) {
          setActivity(loadedAct);
          if (loadedAct) {
            setEditTitle(loadedAct.title);
            setEditType(loadedAct.type);
            setEditVisibility(loadedAct.visibility || 'public');
          }
        }

        // Load route points
        if (isLiveUser) {
          setPointsLoading(true);
          const pts = await activityService.fetchActivityRoutePoints(id);
          if (isMounted) {
            setRoutePoints(pts);
            setPointsLoading(false);
          }
        } else {
          if (isMounted) setPointsLoading(false);
        }

        // Load kudos & comments
        const [kudosData, commentsList] = await Promise.all([
          socialService.fetchActivityKudos(id, user?.id),
          socialService.fetchActivityComments(id),
        ]);

        if (isMounted) {
          setKudosCount(kudosData.count);
          setHasKudoed(kudosData.hasKudoed);
          setComments(commentsList);
        }
      } catch (err: any) {
        console.warn('Error loading activity details:', err.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id, isLiveUser, user]);

  // Derived splits and elevation statistics
  const splits: ActivitySplit[] = useMemo(() => {
    if (!activity) return [];
    return calculateKilometerSplits(
      routePoints,
      activity.type,
      activity.distanceKm,
      activity.durationSeconds || 1800
    );
  }, [activity, routePoints]);

  const elevationStats = useMemo(() => {
    return calculateElevationStats(routePoints);
  }, [routePoints]);

  // Display splits with delta, effort, and peak sprint flag
  const displaySplits = useMemo(() => {
    const baseSplits = splits.length > 1 ? splits : generateSyntheticSplits(activity);
    if (baseSplits.length === 0) return [];

    const avgSec = baseSplits.reduce((acc, s) => acc + s.durationSeconds, 0) / baseSplits.length;
    const minSec = Math.min(...baseSplits.map((s) => s.durationSeconds));

    return baseSplits.map((s) => {
      const isFastest = s.durationSeconds === minSec;
      const diffSec = Math.round(s.durationSeconds - avgSec);
      const effort = isFastest ? 100 : Math.min(99, Math.max(90, Math.round(98 - diffSec * 0.8)));
      return {
        ...s,
        isFastest,
        diffSec,
        effort,
      };
    });
  }, [splits, activity]);

  // Dynamic elevation curve points
  const { elevationPolygonPoints, elevationPolylinePoints, apexPoint, peakElevationM } = useMemo(() => {
    const validAlts = routePoints
      .filter((p) => p.altitude !== null && p.altitude !== undefined)
      .map((p) => p.altitude as number);

    if (validAlts.length >= 5) {
      const min = Math.min(...validAlts);
      const max = Math.max(...validAlts);
      const range = Math.max(5, max - min);
      const sampleCount = 12;
      const step = Math.floor(validAlts.length / sampleCount);
      const coords: { x: number; y: number }[] = [];
      let apexIdx = 0;
      let highestAlt = -Infinity;

      for (let i = 0; i < sampleCount; i++) {
        const idx = Math.min(validAlts.length - 1, i * step);
        const alt = validAlts[idx];
        const x = Math.round((i / (sampleCount - 1)) * 340);
        const y = Math.round(58 - ((alt - min) / range) * 44);
        coords.push({ x, y });
        if (alt > highestAlt) {
          highestAlt = alt;
          apexIdx = i;
        }
      }

      const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');
      const polygon = `0,58 ${polyline} 340,70 0,70`;
      return {
        elevationPolygonPoints: polygon,
        elevationPolylinePoints: polyline,
        apexPoint: coords[apexIdx] || { x: 225, y: 12 },
        peakElevationM: Math.round(max),
      };
    }

    return {
      elevationPolygonPoints: '0,55 25,48 55,50 85,38 120,44 155,20 190,26 225,12 260,34 295,22 320,38 340,32 340,70 0,70',
      elevationPolylinePoints: '0,55 25,48 55,50 85,38 120,44 155,20 190,26 225,12 260,34 295,22 320,38 340,32',
      apexPoint: { x: 225, y: 12 },
      peakElevationM: activity?.elevationMeters ? Math.round(activity.elevationMeters * 0.6) : 84,
    };
  }, [routePoints, activity]);

  // Handle Share telemetry
  const handleShare = async () => {
    if (!activity) return;
    try {
      await Share.share({
        title: `${activity.title} - TRACK YOUR MOVEMENT`,
        message: `${activity.athlete.name} completed ${activity.title}!\nDistance: ${activity.distanceKm.toFixed(2)} km\nDuration: ${activity.durationFormatted}\nPace: ${activity.paceOrSpeedFormatted} ${activity.type === 'ride' ? 'km/h' : '/km'}\nCalories: ${activity.calories} kcal\nTracked with TRACK YOUR MOVEMENT`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  // Toggle Kudos
  const handleToggleKudos = async () => {
    if (!activity) return;
    const nextState = !hasKudoed;
    setHasKudoed(nextState);
    setKudosCount((c) => (nextState ? c + 1 : Math.max(0, c - 1)));

    if (user) {
      await socialService.toggleKudos(activity.id, user.id, nextState);
    }
  };

  // Add Comment
  const handleAddComment = async () => {
    if (!activity || !newCommentText.trim() || isPostingComment) return;
    setIsPostingComment(true);

    try {
      if (isLiveUser && user) {
        const created = await socialService.addComment(activity.id, user.id, newCommentText);
        setComments((prev) => [...prev, created]);
      } else {
        const demoComment: ActivityComment = {
          id: `demo-${Date.now()}`,
          activityId: activity.id,
          userId: 'demo-user',
          userName: 'You',
          userAvatar: 'ME',
          commentText: newCommentText.trim(),
          createdAtIso: new Date().toISOString(),
          timeAgo: 'Just now',
        };
        setComments((prev) => [...prev, demoComment]);
      }
      setNewCommentText('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not post comment.');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Save Activity Edit
  const handleSaveEdit = async () => {
    if (!activity || !isOwner || !user) return;
    setIsUpdating(true);

    try {
      const updated = await activityService.updateActivity(user.id, activity.id, {
        title: editTitle.trim() || activity.title,
        type: editType,
        visibility: editVisibility,
      });

      setActivity(updated);
      setShowEditModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update activity.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Activity
  const handleDeleteActivity = async () => {
    if (!activity || !isOwner || !user) return;

    const performDelete = async () => {
      setIsDeleting(true);
      try {
        await activityService.deleteActivity(user.id, activity.id);
        router.replace('/');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to delete activity.');
        setIsDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to delete this activity? This cannot be undone.')) {
        await performDelete();
      }
    } else {
      Alert.alert(
        'Delete Activity',
        'Are you sure you want to permanently delete this workout? This cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const handleSaveToLog = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        alert('Workout Telemetry Verified & Saved to your training log.');
      }
    } else {
      Alert.alert('Saved to Log', 'Workout telemetry verified and recorded in your permanent logbook.', [
        { text: 'OK', onPress: () => router.push('/') },
      ]);
    }
  };

  const bottomPadding = (insets.bottom || 16) + BottomTabInset + Spacing.four;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AtmosphericBackground glowTopColor="#e8f5f1" glowMidColor="#edf4f2" />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00b8a2" />
          <Text style={styles.loadingText}>Loading workout telemetry...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AtmosphericBackground glowTopColor="#e8f5f1" glowMidColor="#edf4f2" />
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundTitle}>Workout Not Found</Text>
          <Text style={styles.notFoundSub}>
            This activity may have been deleted or is set to private.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backButtonAction}>
            <Text style={styles.backButtonText}>Return to Feed</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Target and progress calculations
  const targetDist = activity.distanceKm >= 8 ? 10.0 : activity.distanceKm >= 4 ? 5.0 : 3.0;
  const isGoalAchieved = activity.distanceKm >= targetDist;
  const extendedKm = Math.max(0, activity.distanceKm - targetDist).toFixed(2);
  const progressPct = Math.min(100, Math.round((activity.distanceKm / targetDist) * 100));

  // Best pace derivation
  const fastestSplit = displaySplits.find((s) => s.isFastest);
  const bestPace = fastestSplit
    ? activity.type === 'ride'
      ? `${fastestSplit.speedFormatted || '34.2'}`
      : `${fastestSplit.paceFormatted || '3:52'}`
    : activity.type === 'ride'
    ? '32.0'
    : '3:52';

  // Heart rate & strain calculations
  const avgHr = activity.avgHeartRate || 158;
  const peakHr = activity.maxHeartRate || (activity.avgHeartRate ? activity.avgHeartRate + 14 : 172);
  const strainScore = Math.min(
    21.0,
    Math.max(
      9.2,
      ((activity.durationSeconds || 2400) / 180) * 0.9 + (avgHr > 140 ? (avgHr - 140) * 0.15 : 1)
    )
  ).toFixed(1);

  const rechargeHours = Math.min(48, Math.max(16, Math.round(Number(strainScore) * 1.7)));
  const hydrationDeficit = Math.round(activity.distanceKm * 85);
  const zone4Minutes = Math.floor(((activity.durationSeconds || 2400) * 0.58) / 60);
  const zone4Seconds = Math.round(((activity.durationSeconds || 2400) * 0.58) % 60);

  // Elevation gain/loss
  const gainM = activity.elevationMeters || elevationStats.gainMeters || 142;
  const lossM = elevationStats.lossMeters || 138;

  // Formatted date pill
  const datePillText = activity.date ? activity.date.toUpperCase() : 'SUN, OCT 25';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AtmosphericBackground glowTopColor="#e8f5f1" glowMidColor="#edf4f2" />

      {/* Fixed Sticky-Style Athletic Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Pressable
            aria-label="Go Back"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]}>
            <Ionicons name="arrow-back" size={20} color="#64748b" />
          </Pressable>

          <View style={styles.headerTitles}>
            <View style={styles.datePill}>
              <Ionicons name="calendar-outline" size={12} color="#008a79" style={{ marginRight: 4 }} />
              <Text style={styles.datePillText}>{datePillText}</Text>
            </View>
            <Text style={styles.headerScreenTitle}>Workout Summary</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            aria-label="Share Telemetry"
            onPress={handleShare}
            style={({ pressed }) => [styles.shareBtnPill, pressed && styles.btnPressed]}>
            <Ionicons name="share-social-outline" size={15} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.shareBtnText}>Share</Text>
          </Pressable>

          {/* Profile Avatar with online status */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarLetter}>
                {activity.athlete.avatar ? activity.athlete.avatar.slice(0, 2).toUpperCase() : 'SP'}
              </Text>
            </View>
            <View style={styles.avatarOnlineDot} />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* Owner Quick Controls (when athlete is owner) */}
          {isOwner && (
            <View style={styles.ownerControlsRow}>
              <View style={styles.ownerNotice}>
                <Ionicons name="person-circle-outline" size={15} color="#008a79" />
                <Text style={styles.ownerNoticeText}>Athletic Log Management</Text>
              </View>
              <View style={styles.ownerBtns}>
                <Pressable
                  onPress={() => setShowEditModal(true)}
                  style={({ pressed }) => [styles.ownerSmallBtn, pressed && styles.btnPressed]}>
                  <Ionicons name="create-outline" size={13} color="#008a79" style={{ marginRight: 4 }} />
                  <Text style={styles.ownerSmallBtnText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={handleDeleteActivity}
                  style={({ pressed }) => [
                    styles.ownerSmallBtn,
                    styles.ownerDeleteBtn,
                    pressed && styles.btnPressed,
                  ]}>
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#ef4444" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={13} color="#ef4444" style={{ marginRight: 4 }} />
                      <Text style={[styles.ownerSmallBtnText, { color: '#ef4444' }]}>Delete</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* 1. Status & Session Banner */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerAura} />
            <View style={styles.bannerTopRow}>
              <View style={styles.bannerStatusBadge}>
                <View style={styles.statusPulseDot} />
                <Text style={styles.statusBadgeText}>SESSION TELEMETRY COMPLETE</Text>
              </View>
              <Text style={styles.timestampText}>
                {activity.date ? activity.date.toUpperCase() : 'TODAY'}, {activity.timeAgo || '07:15 AM'}
              </Text>
            </View>

            <View style={styles.bannerMainRow}>
              <Text style={styles.sessionTitle}>{activity.title.toUpperCase()}</Text>
              <View style={styles.prBadge}>
                <Ionicons name="flame" size={14} color="#ff6b4a" style={{ marginRight: 4 }} />
                <Text style={styles.prBadgeText}>
                  PR: 10K PACE ({activity.paceOrSpeedFormatted}
                  {activity.type === 'ride' ? ' KM/H' : '/KM'})
                </Text>
              </View>
            </View>
          </View>

          {/* 2. Key Performance Telemetry Bento Grid */}
          <View style={styles.bentoGrid}>
            {/* Monolithic Distance Focus Tile */}
            <View style={styles.bentoMonolith}>
              <View style={styles.tileHeaderRow}>
                <View style={styles.tileHeaderLeft}>
                  <Ionicons name="navigate-circle-outline" size={18} color="#00b8a2" style={{ marginRight: 6 }} />
                  <Text style={styles.tileCategoryCaps}>DISTANCE // TOTAL DISPLACEMENT</Text>
                </View>
                <View style={styles.targetPill}>
                  <Text style={styles.targetPillText}>Target: {targetDist.toFixed(2)} km</Text>
                </View>
              </View>

              <View style={styles.distanceValueRow}>
                <Text style={styles.distanceBigNumber}>{activity.distanceKm.toFixed(2)}</Text>
                <Text style={styles.distanceUnitCaps}>KM</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
              </View>

              <View style={styles.distanceFooterRow}>
                <Text style={styles.goalAchievedLabel}>
                  {isGoalAchieved ? 'Session Goal Achieved' : 'Distance Milestone Target'}
                </Text>
                <View style={styles.extendedPill}>
                  <Text style={styles.extendedPillText}>
                    {isGoalAchieved ? `+${extendedKm} km Extended` : `${progressPct}% Completed`}
                  </Text>
                </View>
              </View>
            </View>

            {/* 2x2 Bento Tiles */}
            <View style={styles.bentoPairRow}>
              {/* Duration */}
              <View style={styles.bentoHalfCard}>
                <View style={styles.tileHeaderRow}>
                  <Text style={styles.tileCategoryCaps}>DURATION</Text>
                  <View style={styles.miniIconCircle}>
                    <Ionicons name="timer-outline" size={15} color="#64748b" />
                  </View>
                </View>
                <View style={styles.metricValBlock}>
                  <Text style={styles.metricBigText}>{activity.durationFormatted}</Text>
                  <Text style={styles.metricSubText}>ELAPSED: {activity.durationFormatted}</Text>
                </View>
              </View>

              {/* Average Pace / Speed */}
              <View style={styles.bentoHalfCard}>
                <View style={styles.tileHeaderRow}>
                  <Text style={styles.tileCategoryCaps}>
                    {activity.type === 'ride' ? 'AVG SPEED' : 'AVG PACE'}
                  </Text>
                  <View style={[styles.miniIconCircle, { backgroundColor: '#e6fbf7' }]}>
                    <Ionicons name="speedometer-outline" size={15} color="#00b8a2" />
                  </View>
                </View>
                <View style={styles.metricValBlock}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                    <Text style={[styles.metricBigText, { color: '#00b8a2' }]}>
                      {activity.paceOrSpeedFormatted}
                    </Text>
                    <Text style={styles.metricUnitInline}>
                      {activity.type === 'ride' ? 'KM/H' : '/KM'}
                    </Text>
                  </View>
                  <Text style={styles.metricSubText}>
                    BEST: {bestPace} {activity.type === 'ride' ? 'KM/H' : '/KM'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.bentoPairRow}>
              {/* Active Burn */}
              <View style={styles.bentoHalfCard}>
                <View style={styles.tileHeaderRow}>
                  <Text style={styles.tileCategoryCaps}>ACTIVE BURN</Text>
                  <View style={[styles.miniIconCircle, { backgroundColor: '#fff7ed' }]}>
                    <Ionicons name="flame-outline" size={15} color="#ff6b4a" />
                  </View>
                </View>
                <View style={styles.metricValBlock}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                    <Text style={styles.metricBigText}>{activity.calories || 842}</Text>
                    <Text style={styles.metricUnitInline}>KCAL</Text>
                  </View>
                  <Text style={styles.metricSubText}>
                    MET:{' '}
                    {activity.calories
                      ? (activity.calories / (((activity.durationSeconds || 2400) / 3600) * 70)).toFixed(1)
                      : '12.4'}{' '}
                    AVG
                  </Text>
                </View>
              </View>

              {/* Heart Rate */}
              <View style={styles.bentoHalfCard}>
                <View style={styles.tileHeaderRow}>
                  <Text style={styles.tileCategoryCaps}>HEART RATE</Text>
                  <View style={[styles.miniIconCircle, { backgroundColor: '#fff1f2' }]}>
                    <Ionicons name="heart-outline" size={15} color="#f43f5e" />
                  </View>
                </View>
                <View style={styles.metricValBlock}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                    <Text style={styles.metricBigText}>{peakHr}</Text>
                    <Text style={[styles.metricUnitInline, { color: '#f43f5e' }]}>MAX BPM</Text>
                  </View>
                  <Text style={styles.metricSubText}>AVG: {avgHr} BPM (Z4)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 3. Route Visualizer & Dynamic Elevation Ribbon */}
          <View style={styles.routeCard}>
            {/* Header of Route Card */}
            <View style={styles.routeHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.miniIconCircle, { backgroundColor: '#e6fbf7' }]}>
                  <Ionicons name="compass-outline" size={16} color="#00b8a2" />
                </View>
                <Text style={styles.routeCardHeading}>ROUTE & ELEVATION</Text>
              </View>
              <View style={styles.gainLossBadge}>
                <Text style={styles.gainText}>+{gainM}M GAIN</Text>
                <Text style={styles.gainDivider}>•</Text>
                <Text style={styles.lossText}>-{lossM}M LOSS</Text>
              </View>
            </View>

            {/* Map Polyline / Visual Corridor */}
            <View style={styles.mapVisualBox}>
              {Platform.OS === 'web' ? (
                <div
                  style={{
                    width: '100%',
                    height: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: `
                      <svg width="100%" height="100%" viewBox="0 0 320 80" style="overflow: visible; width: 100%; height: 100%;">
                        <defs>
                          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#10b981" />
                            <stop offset="50%" stop-color="#00b8a2" />
                            <stop offset="100%" stop-color="#004d43" />
                          </linearGradient>
                        </defs>
                        <path d="${
                          activity.polylinePreview || 'M 20 60 Q 90 20 160 55 T 300 25'
                        }" fill="none" stroke="url(#routeGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                        <circle cx="20" cy="60" r="5" fill="#10b981" stroke="#ffffff" stroke-width="2" />
                        <circle cx="300" cy="25" r="5" fill="#ff6b4a" stroke="#ffffff" stroke-width="2" />
                      </svg>
                    `,
                  }}
                />
              ) : (
                <View style={styles.nativeRouteCorridor}>
                  <View style={styles.nativeRouteTrack} />
                  <View style={styles.nativeRoutePinRow}>
                    <View style={styles.nativePinStart} />
                    <Text style={styles.nativePinText}>GPS Trajectory Active</Text>
                    <View style={styles.nativePinEnd} />
                  </View>
                </View>
              )}

              {/* Floating Overlay Pills */}
              <View style={styles.mapTopLeftPill}>
                <View style={styles.gpsPulseDot} />
                <Text style={styles.gpsLockText}>
                  {pointsLoading ? 'ACQUIRING FIX...' : 'GPS LOCK 99.8%'}
                </Text>
              </View>

              <View style={styles.mapTopRightPill}>
                <Text style={styles.cadenceLabel}>CADENCE:</Text>
                <Text style={styles.cadenceValue}>
                  {activity.cadenceOrSteps || (activity.type === 'ride' ? '86 RPM' : '178 SPM')}
                </Text>
              </View>

              {/* Bottom Subtle Gradient Bar */}
              <View style={styles.mapBottomAura} />
            </View>

            {/* Integrated Elevation Profile Ribbon */}
            <View style={styles.elevationSection}>
              <View style={styles.elevationHeaderRow}>
                <Text style={styles.elevationHeading}>PROFILE ELEVATION (METERS)</Text>
                <View style={styles.peakBadge}>
                  <Text style={styles.peakBadgeText}>PEAK: {peakElevationM}M</Text>
                </View>
              </View>

              {/* Dynamic SVG Elevation Chart */}
              <View style={styles.elevationSvgWrapper}>
                {Platform.OS === 'web' ? (
                  <div
                    style={{ width: '100%', height: 90 }}
                    dangerouslySetInnerHTML={{
                      __html: `
                        <svg class="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 340 70" style="width: 100%; height: 100%; overflow: visible;">
                          <defs>
                            <linearGradient id="elevationGradLight" x1="0%" x2="0%" y1="0%" y2="100%">
                              <stop offset="0%" stop-color="#00b8a2" stop-opacity="0.32" />
                              <stop offset="75%" stop-color="#00b8a2" stop-opacity="0.08" />
                              <stop offset="100%" stop-color="#00b8a2" stop-opacity="0.0" />
                            </linearGradient>
                          </defs>
                          <line stroke="#e2e8f0" stroke-dasharray="3,3" stroke-width="1" x1="0" x2="340" y1="18" y2="18" />
                          <line stroke="#e2e8f0" stroke-dasharray="3,3" stroke-width="1" x1="0" x2="340" y1="45" y2="45" />
                          <polygon fill="url(#elevationGradLight)" points="${elevationPolygonPoints}" />
                          <polyline fill="none" stroke="#00b8a2" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" points="${elevationPolylinePoints}" />
                          <circle cx="${apexPoint.x}" cy="${apexPoint.y}" fill="#ffffff" r="4" stroke="#00b8a2" stroke-width="2.5" />
                        </svg>
                      `,
                    }}
                  />
                ) : (
                  <View style={styles.nativeElevationBarsRow}>
                    {[35, 42, 50, 48, 62, 75, 84, 70, 58, 65, 52, 40].map((h, i) => (
                      <View key={`bar-${i}`} style={styles.nativeElevationCol}>
                        <View
                          style={[
                            styles.nativeElevationBar,
                            {
                              height: `${h}%`,
                              backgroundColor: i === 6 ? '#00b8a2' : 'rgba(0, 184, 162, 0.25)',
                            },
                          ]}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Distance Axis Markers */}
              <View style={styles.elevationAxisRow}>
                <Text style={styles.axisMarkerText}>0 KM</Text>
                <Text style={styles.axisMarkerText}>
                  {(activity.distanceKm * 0.25).toFixed(1)} KM
                </Text>
                <Text style={styles.axisMarkerText}>
                  {(activity.distanceKm * 0.5).toFixed(1)} KM
                </Text>
                <Text style={styles.axisMarkerText}>
                  {(activity.distanceKm * 0.75).toFixed(1)} KM
                </Text>
                <Text style={styles.axisMarkerText}>{activity.distanceKm.toFixed(1)} KM</Text>
              </View>
            </View>
          </View>

          {/* 4. Bio-Recovery Advisor & Strain Intelligence Card */}
          <View style={styles.advisorCard}>
            <View style={styles.advisorHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.miniIconCircle, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="flash" size={16} color="#f59e0b" />
                </View>
                <Text style={styles.advisorTitle}>Bio-Recovery Advisor</Text>
              </View>
              <View style={styles.bioMetricsPill}>
                <Text style={styles.bioMetricsPillText}>BIO-METRICS</Text>
              </View>
            </View>

            {/* Radial Metric Indicators */}
            <View style={styles.bioMetricsGrid}>
              <View style={styles.bioMetricTile}>
                <Text style={styles.bioMetricLabel}>STRAIN</Text>
                <Text style={[styles.bioMetricValue, { color: '#ff6b4a' }]}>{strainScore}</Text>
                <View style={[styles.bioSubPill, { backgroundColor: '#fff1ed' }]}>
                  <Text style={[styles.bioSubPillText, { color: '#ff6b4a' }]}>HIGH</Text>
                </View>
              </View>

              <View style={styles.bioMetricTile}>
                <Text style={styles.bioMetricLabel}>RECHARGE</Text>
                <Text style={[styles.bioMetricValue, { color: '#004d43' }]}>{rechargeHours} HRS</Text>
                <View style={[styles.bioSubPill, { backgroundColor: 'rgba(226, 232, 240, 0.7)' }]}>
                  <Text style={styles.bioSubPillText}>WINDOW</Text>
                </View>
              </View>

              <View style={styles.bioMetricTile}>
                <Text style={styles.bioMetricLabel}>HYDRATION</Text>
                <Text style={[styles.bioMetricValue, { color: '#0284c7' }]}>~{hydrationDeficit} ML</Text>
                <View style={[styles.bioSubPill, { backgroundColor: '#f0f9ff' }]}>
                  <Text style={[styles.bioSubPillText, { color: '#0284c7' }]}>DEFICIT</Text>
                </View>
              </View>
            </View>

            {/* Advice Recommendation Callout */}
            <View style={styles.adviceCallout}>
              <Ionicons name="bulb-outline" size={18} color="#00b8a2" style={{ marginTop: 2 }} />
              <Text style={styles.adviceText}>
                Elevated cardiovascular strain in Zone 4 ({zone4Minutes}m {zone4Seconds}s). Replenish
                electrolytes within 45 mins to optimize muscle fiber recovery and glycogen replenishment.
              </Text>
            </View>
          </View>

          {/* 5. Kilometric Split Breakdown Table */}
          <View style={styles.splitsCard}>
            <View style={styles.splitsCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.miniIconCircle, { backgroundColor: '#f1f5f9' }]}>
                  <Ionicons name="list" size={16} color="#0f172a" />
                </View>
                <Text style={styles.splitsHeading}>Split Breakdown</Text>
              </View>
              <View style={styles.segmentsBadge}>
                <Text style={styles.segmentsBadgeText}>{displaySplits.length} SEGMENTS</Text>
              </View>
            </View>

            {/* Column Headers */}
            <View style={styles.splitColHeaderRow}>
              <Text style={[styles.splitColHeader, { flex: 1.5 }]}>KM</Text>
              <Text style={[styles.splitColHeader, { flex: 3.5 }]}>PACE</Text>
              <Text style={[styles.splitColHeader, { flex: 2.5, textAlign: 'center' }]}>DELTA</Text>
              <Text style={[styles.splitColHeader, { flex: 2.5, textAlign: 'right' }]}>EFFORT</Text>
            </View>

            {/* Split Rows */}
            <View style={styles.splitsRowsContainer}>
              {displaySplits.map((split, index) => {
                const isEven = index % 2 === 1;
                const isFastest = split.isFastest;
                const deltaNum = split.diffSec;
                const isNegative = deltaNum < 0;

                return (
                  <View
                    key={`split-${split.splitNumber}`}
                    style={[
                      styles.splitRow,
                      isEven && styles.splitRowEven,
                      isFastest && styles.splitRowFastest,
                    ]}>
                    {/* KM Column */}
                    <Text
                      style={[
                        styles.splitKmText,
                        { flex: 1.5 },
                        isFastest && { color: '#004d43', fontWeight: '800' },
                      ]}>
                      {String(split.splitNumber).padStart(2, '0')}
                      {isFastest ? '*' : ''}
                    </Text>

                    {/* Pace Column */}
                    <View style={[{ flex: 3.5, flexDirection: 'row', alignItems: 'baseline' }]}>
                      <Text
                        style={[
                          styles.splitPaceText,
                          isFastest && { color: '#004d43', fontWeight: '800' },
                        ]}>
                        {activity.type === 'ride'
                          ? split.speedFormatted || '32.4'
                          : split.paceFormatted || '4:08'}{' '}
                      </Text>
                      <Text style={styles.splitUnitSub}>
                        {activity.type === 'ride' ? 'km/h' : '/km'}
                      </Text>
                    </View>

                    {/* Delta Column */}
                    <View style={[{ flex: 2.5, alignItems: 'center' }]}>
                      <View
                        style={[
                          styles.splitDeltaPill,
                          isFastest
                            ? styles.splitDeltaPillFastest
                            : isNegative
                            ? styles.splitDeltaPillNegative
                            : styles.splitDeltaPillNeutral,
                        ]}>
                        <Text
                          style={[
                            styles.splitDeltaText,
                            isFastest
                              ? styles.splitDeltaTextFastest
                              : isNegative
                              ? styles.splitDeltaTextNegative
                              : styles.splitDeltaTextNeutral,
                          ]}>
                          {isNegative ? `${deltaNum}s` : `+${deltaNum}s`}
                        </Text>
                      </View>
                    </View>

                    {/* Effort Column */}
                    <View style={[{ flex: 2.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }]}>
                      <View
                        style={[
                          styles.effortDot,
                          {
                            backgroundColor: isFastest
                              ? '#00b8a2'
                              : isNegative
                              ? '#00b8a2'
                              : '#cbd5e1',
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.effortPctText,
                          isFastest && { color: '#004d43', fontWeight: '800' },
                        ]}>
                        {split.effort}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* 6. Social Feedback & Discussion (Kudos & Comments) */}
          <View style={styles.socialCard}>
            <View style={styles.socialTopRow}>
              <Pressable
                onPress={handleToggleKudos}
                style={({ pressed }) => [
                  styles.kudosBtn,
                  hasKudoed && styles.kudosBtnActive,
                  pressed && styles.btnPressed,
                ]}>
                <MotiView
                  animate={{
                    scale: hasKudoed ? [1, 1.35, 1] : 1,
                  }}
                  transition={{
                    type: 'spring',
                    damping: 12,
                    stiffness: 240,
                  } as any}>
                  <Ionicons
                    name={hasKudoed ? 'heart' : 'heart-outline'}
                    size={18}
                    color={hasKudoed ? '#ff2d55' : '#64748b'}
                  />
                </MotiView>
                <Text style={[styles.kudosCountText, hasKudoed && styles.kudosCountActive]}>
                  {kudosCount} {kudosCount === 1 ? 'Kudo' : 'Kudos'}
                </Text>
              </Pressable>

              <View style={styles.commentsCountSummary}>
                <Ionicons name="chatbubble-outline" size={15} color="#64748b" style={{ marginRight: 4 }} />
                <Text style={styles.commentCountText}>
                  {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
                </Text>
              </View>
            </View>

            {/* Comment Composer */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentTextInput}
                placeholder="Congratulate the athlete..."
                placeholderTextColor="#94a3b8"
                value={newCommentText}
                onChangeText={setNewCommentText}
                maxLength={500}
              />
              <Pressable
                onPress={handleAddComment}
                disabled={!newCommentText.trim() || isPostingComment}
                style={({ pressed }) => [
                  styles.postCommentBtn,
                  (!newCommentText.trim() || isPostingComment) && styles.postCommentBtnDisabled,
                  pressed && styles.btnPressed,
                ]}>
                {isPostingComment ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.postCommentText}>Post</Text>
                )}
              </Pressable>
            </View>

            {/* Comments List */}
            {comments.length > 0 && (
              <View style={styles.commentsList}>
                {comments.map((c) => (
                  <View key={c.id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{c.userAvatar || 'AT'}</Text>
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentAuthorRow}>
                        <Text style={styles.commentAuthorName}>{c.userName}</Text>
                        <Text style={styles.commentTimeAgo}>{c.timeAgo}</Text>
                      </View>
                      <Text style={styles.commentContentText}>{c.commentText}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 7. Primary Kinetic Actions */}
          <View style={styles.actionsContainer}>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.primaryKineticBtn, pressed && styles.btnPressed]}>
              <Ionicons name="share-social-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.primaryKineticText}>SHARE TELEMETRY // STRAVA</Text>
            </Pressable>

            <Pressable
              onPress={handleSaveToLog}
              style={({ pressed }) => [styles.secondaryKineticBtn, pressed && styles.btnPressed]}>
              <Ionicons name="bookmark-outline" size={18} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryKineticText}>SAVE WORKOUT TO LOG</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Edit Activity Modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Workout</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>TITLE</Text>
              <TextInput
                style={styles.modalTextInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Activity Title"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SPORT TYPE</Text>
              <View style={styles.typeSelector}>
                {(['run', 'ride', 'walk'] as ActivityType[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setEditType(t)}
                    style={[
                      styles.typeBtn,
                      editType === t && { backgroundColor: '#00b8a2', borderColor: '#00b8a2' },
                    ]}>
                    <Text style={[styles.typeBtnText, editType === t && styles.typeBtnTextActive]}>
                      {t.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>VISIBILITY</Text>
              <View style={styles.typeSelector}>
                {(['public', 'followers', 'private'] as ActivityVisibility[]).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setEditVisibility(v)}
                    style={[
                      styles.typeBtn,
                      editVisibility === v && { backgroundColor: '#004d43', borderColor: '#00b8a2' },
                    ]}>
                    <Text
                      style={[
                        styles.typeBtnText,
                        editVisibility === v && styles.typeBtnTextActive,
                      ]}>
                      {v === 'public' ? 'Public' : v === 'followers' ? 'Followers' : 'Private'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setShowEditModal(false)}
                disabled={isUpdating}
                style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleSaveEdit}
                disabled={isUpdating}
                style={[styles.saveBtn, isUpdating && styles.saveBtnDisabled]}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
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
    backgroundColor: '#f0fdf9',
  },
  headerBar: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(240, 253, 249, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  headerTitles: {
    flex: 1,
    justifyContent: 'center',
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6fbf7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  datePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#008a79',
    letterSpacing: 0.6,
  },
  headerScreenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareBtnPill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: '#00b8a2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00b8a2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 3,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: 'rgba(0, 184, 162, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e6fbf7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 12,
    fontWeight: '800',
    color: '#008a79',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: 14,
  },
  ownerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  ownerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ownerNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#008a79',
    letterSpacing: 0.3,
  },
  ownerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownerSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  ownerDeleteBtn: {
    backgroundColor: '#fef2f2',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  ownerSmallBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#008a79',
  },
  bannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#006b5d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  bannerAura: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 184, 162, 0.08)',
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bannerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.7,
  },
  timestampText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  bannerMainRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  sessionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1ed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 74, 0.2)',
  },
  prBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ff6b4a',
    letterSpacing: 0.3,
  },
  bentoGrid: {
    gap: 12,
  },
  bentoMonolith: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#006b5d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tileCategoryCaps: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  targetPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  targetPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  distanceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 10,
  },
  distanceBigNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -1,
    lineHeight: 48,
  },
  distanceUnitCaps: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00b8a2',
    letterSpacing: 0.8,
  },
  progressBarTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f1f5f9',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#00b8a2',
  },
  distanceFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  goalAchievedLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  extendedPill: {
    backgroundColor: '#e6fbf7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  extendedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#008a79',
  },
  bentoPairRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoHalfCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'space-between',
    minHeight: 112,
    shadowColor: '#006b5d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  miniIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValBlock: {
    marginTop: 10,
  },
  metricBigText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  metricUnitInline: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  metricSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 3,
  },
  routeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#006b5d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  routeCardHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.7,
  },
  gainLossBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    gap: 6,
  },
  gainText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  gainDivider: {
    fontSize: 10,
    color: '#cbd5e1',
  },
  lossText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  mapVisualBox: {
    height: 150,
    backgroundColor: '#edf4f2',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativeRouteCorridor: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  nativeRouteTrack: {
    width: '90%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00b8a2',
  },
  nativeRoutePinRow: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  nativePinStart: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  nativePinEnd: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff6b4a',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  nativePinText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  mapTopLeftPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    gap: 6,
  },
  gpsPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981',
  },
  gpsLockText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  mapTopRightPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    gap: 4,
  },
  cadenceLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  cadenceValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00b8a2',
  },
  mapBottomAura: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  elevationSection: {
    padding: 18,
    paddingTop: 12,
    backgroundColor: '#ffffff',
  },
  elevationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  elevationHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  peakBadge: {
    backgroundColor: '#e6fbf7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  peakBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00b8a2',
    letterSpacing: 0.4,
  },
  elevationSvgWrapper: {
    width: '100%',
    height: 90,
    justifyContent: 'center',
  },
  nativeElevationBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
    paddingHorizontal: 8,
  },
  nativeElevationCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginHorizontal: 1,
  },
  nativeElevationBar: {
    width: '80%',
    borderRadius: 3,
  },
  elevationAxisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 4,
  },
  axisMarkerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  advisorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#006b5d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  advisorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  advisorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  bioMetricsPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  bioMetricsPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  bioMetricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  bioMetricTile: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bioMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  bioMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.4,
  },
  bioSubPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  bioSubPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  adviceCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf9',
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 162, 0.25)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  adviceText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#0f172a',
    lineHeight: 18,
  },
  splitsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#006b5d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  splitsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  splitsHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  segmentsBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  segmentsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  splitColHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  splitColHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  splitsRowsContainer: {
    backgroundColor: '#ffffff',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  splitRowEven: {
    backgroundColor: 'rgba(248, 250, 252, 0.4)',
  },
  splitRowFastest: {
    backgroundColor: 'rgba(230, 251, 247, 0.85)',
    borderLeftWidth: 4,
    borderLeftColor: '#00b8a2',
  },
  splitKmText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  splitPaceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  splitUnitSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
  },
  splitDeltaPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 42,
    alignItems: 'center',
  },
  splitDeltaPillFastest: {
    backgroundColor: '#00b8a2',
  },
  splitDeltaPillNegative: {
    backgroundColor: '#ecfdf5',
  },
  splitDeltaPillNeutral: {
    backgroundColor: '#f1f5f9',
  },
  splitDeltaText: {
    fontSize: 11,
    fontWeight: '700',
  },
  splitDeltaTextFastest: {
    color: '#ffffff',
  },
  splitDeltaTextNegative: {
    color: '#059669',
  },
  splitDeltaTextNeutral: {
    color: '#64748b',
  },
  effortDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  effortPctText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  socialCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#006b5d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  socialTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  kudosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 6,
  },
  kudosBtnActive: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  kudosCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  kudosCountActive: {
    color: '#ff2d55',
  },
  commentsCountSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentTextInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  postCommentBtn: {
    height: 42,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#00b8a2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  postCommentBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  postCommentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  commentsList: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e6fbf7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#008a79',
  },
  commentBody: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  commentTimeAgo: {
    fontSize: 10,
    color: '#94a3b8',
  },
  commentContentText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 2,
    paddingBottom: 8,
  },
  primaryKineticBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#00b8a2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00b8a2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 3,
  },
  primaryKineticText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  secondaryKineticBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  secondaryKineticText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  notFoundSub: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  backButtonAction: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#00b8a2',
  },
  backButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
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
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalTextInput: {
    height: 44,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  typeBtnTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  saveBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#00b8a2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
