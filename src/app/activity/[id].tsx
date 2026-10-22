import React, { useEffect, useState, useMemo } from 'react';
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
import { useLocalSearchParams, router } from 'expo-router';

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  Activity,
  ActivityComment,
  ActivitySplit,
  ActivityType,
  ActivityVisibility,
  getMockActivities,
} from '@/data/mock-fitness-data';
import { useAuth } from '@/context/auth-context';
import { activityService } from '@/services/activity-service';
import { socialService } from '@/services/social-service';
import {
  GpsCoordinate,
  calculateElevationStats,
  calculateKilometerSplits,
  generateSvgPathFromCoordinates,
} from '@/utils/geo';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user, isDemoMode, isConfigured } = useAuth();

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

  const isLiveUser = Boolean(user && !isDemoMode && isConfigured);
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
        if (isLiveUser) {
          loadedAct = await activityService.fetchActivityById(id);
        }

        // Fallback to mock activity if not found in database or in demo mode
        if (!loadedAct) {
          const allMocks = getMockActivities();
          loadedAct = allMocks.find((a) => a.id === id) || null;
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

  const sportColor = activity
    ? {
        run: '#FF6B00',
        ride: '#00D2D3',
        walk: '#10B981',
      }[activity.type]
    : '#FF6B00';

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
        // Local demo comment
        const demoComment: ActivityComment = {
          id: `demo-${Date.now()}`,
          activityId: activity.id,
          userId: 'demo-user',
          userName: 'You (Demo)',
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
      if (window.confirm('Are you sure you want to delete this activity? This cannot be undone.')) {
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

  const bottomPadding = (insets.bottom || 16) + BottomTabInset + Spacing.four;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Loading workout telemetry...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Text style={styles.notFoundTitle}>Workout Not Found</Text>
          <Text style={styles.notFoundSub}>
            This activity may have been deleted or is set to private.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backButtonAction}>
            <Text style={styles.backButtonText}>← Return to Feed</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const startCoord = routePoints.length > 0 ? routePoints[0] : null;
  const finishCoord = routePoints.length > 0 ? routePoints[routePoints.length - 1] : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* Navigation Bar */}
          <View style={styles.navBar}>
            <Pressable onPress={() => router.back()} style={styles.backNavBtn}>
              <Text style={styles.backNavText}>← Back</Text>
            </Pressable>

            {/* Sport & Visibility Badges */}
            <View style={styles.headerBadges}>
              <View style={[styles.sportPill, { backgroundColor: `${sportColor}20`, borderColor: sportColor }]}>
                <Text style={[styles.sportPillText, { color: sportColor }]}>
                  {activity.type.toUpperCase()}
                </Text>
              </View>
              {activity.visibility && (
                <View style={styles.visibilityPill}>
                  <Text style={styles.visibilityText}>
                    {activity.visibility === 'public'
                      ? '🌐 Public'
                      : activity.visibility === 'followers'
                      ? '👥 Followers'
                      : '🔒 Private'}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Athlete Header */}
          <View style={styles.athleteCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{activity.athlete.avatar}</Text>
            </View>
            <View style={styles.athleteDetails}>
              <Text style={styles.athleteName}>{activity.athlete.name}</Text>
              <Text style={styles.activityDate}>
                {activity.date} • {activity.timeAgo} • {activity.location}
              </Text>
            </View>

            {/* Owner Actions */}
            {isOwner && (
              <View style={styles.ownerActions}>
                <Pressable onPress={() => setShowEditModal(true)} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
                <Pressable onPress={handleDeleteActivity} style={styles.deleteBtn}>
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>

          {/* Title Card */}
          <View style={styles.titleCard}>
            <Text style={styles.titleText}>{activity.title}</Text>
            {activity.gearName && <Text style={styles.gearText}>👟 {activity.gearName}</Text>}
          </View>

          {/* Primary Telemetry Grid */}
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>DISTANCE</Text>
              <View style={styles.telemetryValueRow}>
                <Text style={styles.telemetryValue}>{activity.distanceKm.toFixed(2)}</Text>
                <Text style={styles.telemetryUnit}>km</Text>
              </View>
            </View>

            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>MOVING TIME</Text>
              <Text style={styles.telemetryValue}>{activity.durationFormatted}</Text>
            </View>

            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>
                {activity.type === 'ride' ? 'AVG SPEED' : 'AVG PACE'}
              </Text>
              <View style={styles.telemetryValueRow}>
                <Text style={styles.telemetryValue}>{activity.paceOrSpeedFormatted}</Text>
                <Text style={styles.telemetryUnit}>
                  {activity.type === 'ride' ? 'km/h' : '/km'}
                </Text>
              </View>
            </View>

            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>ELEVATION</Text>
              <View style={styles.telemetryValueRow}>
                <Text style={styles.telemetryValue}>
                  {activity.elevationMeters || elevationStats.gainMeters}
                </Text>
                <Text style={styles.telemetryUnit}>m</Text>
              </View>
            </View>
          </View>

          {/* GPS Route Map & Track Rendering Card */}
          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapSectionTitle}>🗺️ GPS ROUTE GEOMETRY</Text>
              <Text style={styles.mapSubtitle}>
                {pointsLoading
                  ? 'Loading coordinates...'
                  : routePoints.length > 0
                  ? `${routePoints.length} GPS Fixes Recorded`
                  : 'Track geometry stored'}
              </Text>
            </View>

            <View style={styles.routeVisualBox}>
              {/* Route Map Header with Start/End markers */}
              {startCoord && finishCoord && (
                <View style={styles.mapMarkersRow}>
                  <View style={styles.markerBadge}>
                    <Text style={styles.startDot}>🟢</Text>
                    <Text style={styles.markerText}>
                      Start: {startCoord.latitude.toFixed(4)}, {startCoord.longitude.toFixed(4)}
                    </Text>
                  </View>
                  <View style={styles.markerBadge}>
                    <Text style={styles.finishDot}>🏁</Text>
                    <Text style={styles.markerText}>
                      End: {finishCoord.latitude.toFixed(4)}, {finishCoord.longitude.toFixed(4)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Web SVG polyline route preview */}
              {Platform.OS === 'web' && activity.polylinePreview ? (
                <div
                  style={{ width: '100%', height: 120, padding: 8 }}
                  dangerouslySetInnerHTML={{
                    __html: `<svg width="100%" height="100%" viewBox="0 0 320 80" style="overflow: visible;">
                      <defs>
                        <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stop-color="#22C55E" />
                          <stop offset="100%" stop-color="${sportColor}" />
                        </linearGradient>
                      </defs>
                      <path d="${activity.polylinePreview}" fill="none" stroke="url(#routeGrad)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>`,
                  }}
                />
              ) : (
                <View style={styles.nativeRouteVisual}>
                  <View style={[styles.routePathLine, { borderColor: sportColor }]} />
                  <Text style={styles.routeVisualCaption}>
                    WGS84 High-Precision GPS Track Polyline
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Kilometer Splits Breakdown */}
          {splits.length > 0 && (
            <View style={styles.splitsCard}>
              <Text style={styles.sectionHeading}>Split Breakdown (Per Kilometer)</Text>
              <View style={styles.splitsTable}>
                <View style={styles.splitRowHeader}>
                  <Text style={[styles.splitColHeader, { flex: 0.8 }]}>KM</Text>
                  <Text style={[styles.splitColHeader, { flex: 1.2 }]}>PACE / SPEED</Text>
                  <Text style={[styles.splitColHeader, { flex: 1 }]}>TIME</Text>
                  <Text style={[styles.splitColHeader, { flex: 1, textAlign: 'right' }]}>
                    ELEV
                  </Text>
                </View>

                {splits.map((split) => (
                  <View key={`split-${split.splitNumber}`} style={styles.splitRow}>
                    <View style={[styles.splitNumBadge, { backgroundColor: `${sportColor}20` }]}>
                      <Text style={[styles.splitNumText, { color: sportColor }]}>
                        {split.splitNumber}
                      </Text>
                    </View>
                    <Text style={[styles.splitColVal, { flex: 1.2 }]}>
                      {activity.type === 'ride'
                        ? `${split.speedFormatted} km/h`
                        : `${split.paceFormatted} /km`}
                    </Text>
                    <Text style={[styles.splitColVal, { flex: 1 }]}>
                      {Math.floor(split.durationSeconds / 60)}:
                      {String(split.durationSeconds % 60).padStart(2, '0')}
                    </Text>
                    <Text style={[styles.splitColVal, { flex: 1, textAlign: 'right', color: '#94A3B8' }]}>
                      {split.elevationDeltaM >= 0
                        ? `+${split.elevationDeltaM}m`
                        : `${split.elevationDeltaM}m`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Social Feedback Section: Kudos & Comments */}
          <View style={styles.socialCard}>
            <View style={styles.kudosRow}>
              <Pressable
                onPress={handleToggleKudos}
                style={[styles.kudosBtn, hasKudoed && styles.kudosBtnActive]}>
                <Text style={styles.kudosIcon}>{hasKudoed ? '🧡' : '🤍'}</Text>
                <Text style={[styles.kudosCountText, hasKudoed && styles.kudosCountActive]}>
                  {kudosCount} {kudosCount === 1 ? 'Kudo' : 'Kudos'}
                </Text>
              </Pressable>
              <Text style={styles.commentCountSummary}>
                💬 {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
              </Text>
            </View>

            {/* Comment Input */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentTextInput}
                placeholder="Congratulate the athlete..."
                placeholderTextColor="#64748B"
                value={newCommentText}
                onChangeText={setNewCommentText}
                maxLength={500}
              />
              <Pressable
                onPress={handleAddComment}
                disabled={!newCommentText.trim() || isPostingComment}
                style={[
                  styles.sendCommentBtn,
                  (!newCommentText.trim() || isPostingComment) && styles.sendCommentBtnDisabled,
                ]}>
                {isPostingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendCommentText}>Post</Text>
                )}
              </Pressable>
            </View>

            {/* Comments List */}
            {comments.length > 0 && (
              <View style={styles.commentsList}>
                {comments.map((c) => (
                  <View key={c.id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>{c.userAvatar}</Text>
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{c.userName}</Text>
                        <Text style={styles.commentTimeAgo}>{c.timeAgo}</Text>
                      </View>
                      <Text style={styles.commentText}>{c.commentText}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
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
                style={styles.textInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Activity Title"
                placeholderTextColor="#64748B"
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
                      editType === t && { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
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
                      editVisibility === v && { backgroundColor: '#243354', borderColor: '#FF6B00' },
                    ]}>
                    <Text style={[styles.typeBtnText, editVisibility === v && styles.typeBtnTextActive]}>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  notFoundTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  notFoundSub: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
  backButtonAction: {
    marginTop: 12,
    backgroundColor: '#1C263E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '700',
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  backNavBtn: {
    backgroundColor: '#131B2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243354',
  },
  backNavText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sportPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  sportPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  visibilityPill: {
    backgroundColor: '#131B2E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243354',
  },
  visibilityText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  athleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C263E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B00',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  athleteDetails: {
    flex: 1,
    gap: 2,
  },
  athleteName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  activityDate: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: '#1C263E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#243354',
  },
  editBtnText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  titleCard: {
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 4,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  gearText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 12,
  },
  telemetryItem: {
    width: '47%',
    padding: 10,
    backgroundColor: '#0B111E',
    borderRadius: 10,
    gap: 4,
  },
  telemetryLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  telemetryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  telemetryValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  telemetryUnit: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  mapCard: {
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 12,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapSectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mapSubtitle: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '700',
  },
  routeVisualBox: {
    backgroundColor: '#0B111E',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  mapMarkersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  markerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startDot: {
    fontSize: 10,
  },
  finishDot: {
    fontSize: 10,
  },
  markerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  nativeRouteVisual: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  routePathLine: {
    width: '90%',
    height: 4,
    borderBottomWidth: 3,
    borderBottomColor: '#FF6B00',
    borderRadius: 2,
  },
  routeVisualCaption: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  splitsCard: {
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 12,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  splitsTable: {
    gap: 8,
  },
  splitRowHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1C263E',
  },
  splitColHeader: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#131B2E',
  },
  splitNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  splitNumText: {
    fontSize: 11,
    fontWeight: '800',
  },
  splitColVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  socialCard: {
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 16,
  },
  kudosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kudosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C263E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#243354',
  },
  kudosBtnActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    borderColor: '#FF6B00',
  },
  kudosIcon: {
    fontSize: 15,
  },
  kudosCountText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  kudosCountActive: {
    color: '#FF6B00',
  },
  commentCountSummary: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: '#0B111E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#243354',
  },
  sendCommentBtn: {
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendCommentBtnDisabled: {
    opacity: 0.5,
  },
  sendCommentText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  commentsList: {
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1C263E',
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C263E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#243354',
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  commentBody: {
    flex: 1,
    backgroundColor: '#0B111E',
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthor: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  commentTimeAgo: {
    color: '#64748B',
    fontSize: 11,
  },
  commentText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#131B2E',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
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
    backgroundColor: '#0B111E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#243354',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#0B111E',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#243354',
  },
  typeBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1C263E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#243354',
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.4,
    backgroundColor: '#FF6B00',
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
