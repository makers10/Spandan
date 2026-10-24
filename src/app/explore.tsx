import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SpandanLogo } from '@/components/fitness/spandan-logo';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Activity, getMockActivities } from '@/data/mock-fitness-data';
import { ActivityCard } from '@/components/fitness/activity-card';
import { useAuth } from '@/context/auth-context';
import { activityService } from '@/services/activity-service';
import { socialService } from '@/services/social-service';

interface SegmentItem {
  id: string;
  name: string;
  location: string;
  distanceKm: number;
  elevationM: number;
  type: 'run' | 'ride';
  komTime: string;
  komHolder: string;
}

interface CommunityAthlete {
  id: string;
  name: string;
  handle: string;
  city: string;
  avatarText: string;
  bio?: string;
  isFollowing?: boolean;
}

const POPULAR_SEGMENTS: SegmentItem[] = [
  {
    id: 'seg-1',
    name: 'Marine Drive Coastal Sprint',
    location: 'South Mumbai',
    distanceKm: 2.4,
    elevationM: 4,
    type: 'run',
    komTime: '7:42',
    komHolder: 'Rahul S.',
  },
  {
    id: 'seg-2',
    name: 'Worli Sea Link Overpass Climb',
    location: 'Worli',
    distanceKm: 5.8,
    elevationM: 64,
    type: 'ride',
    komTime: '9:14',
    komHolder: 'Vikram M.',
  },
  {
    id: 'seg-3',
    name: 'National Park Pine Trail Loop',
    location: 'Borivali',
    distanceKm: 4.1,
    elevationM: 82,
    type: 'run',
    komTime: '16:50',
    komHolder: 'Ananya D.',
  },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { user, isDemoMode, isConfigured } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'feed' | 'athletes' | 'segments'>('feed');

  // Community Feed State
  const [feedActivities, setFeedActivities] = useState<Activity[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(false);

  // Athletes Directory State
  const [athletes, setAthletes] = useState<CommunityAthlete[]>([]);
  const [isAthletesLoading, setIsAthletesLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const isLiveUser = Boolean(user && !isDemoMode);

  // Load Community Feed
  useEffect(() => {
    let isMounted = true;

    async function loadFeed() {
      if (selectedTab !== 'feed') return;
      setIsFeedLoading(true);

      try {
        if (isLiveUser) {
          const acts = await activityService.fetchSocialFeed(user?.id);
          if (isMounted) setFeedActivities(acts.length > 0 ? acts : getMockActivities());
        } else {
          const mocks = getMockActivities();
          if (isMounted) setFeedActivities(mocks);
        }
      } catch (err: any) {
        console.warn('Error loading social feed:', err.message);
        if (isMounted) setFeedActivities(getMockActivities());
      } finally {
        if (isMounted) setIsFeedLoading(false);
      }
    }

    loadFeed();

    return () => {
      isMounted = false;
    };
  }, [selectedTab, isLiveUser, user]);

  // Load Athletes Directory
  useEffect(() => {
    let isMounted = true;

    async function loadAthletes() {
      if (selectedTab !== 'athletes') return;
      setIsAthletesLoading(true);

      try {
        const list = await socialService.searchAthletes(searchQuery, user?.id);
        if (isMounted) {
          setAthletes(list);

          // Check follow status for each athlete
          if (isLiveUser && user) {
            const map: Record<string, boolean> = {};
            await Promise.all(
              list.map(async (ath) => {
                const isFollowed = await socialService.isFollowingAthlete(user.id, ath.id);
                map[ath.id] = isFollowed;
              })
            );
            if (isMounted) setFollowingMap(map);
          }
        }
      } catch (err: any) {
        console.warn('Error loading athletes:', err.message);
      } finally {
        if (isMounted) setIsAthletesLoading(false);
      }
    }

    loadAthletes();

    return () => {
      isMounted = false;
    };
  }, [selectedTab, searchQuery, isLiveUser, user]);

  // Toggle Follow
  const handleToggleFollow = async (athleteId: string) => {
    if (!isLiveUser || !user) {
      Alert.alert('Demo Mode', 'Sign in to follow athletes and customize your feed.');
      return;
    }

    const currentlyFollowing = Boolean(followingMap[athleteId]);
    const nextState = !currentlyFollowing;

    setFollowingMap((prev) => ({ ...prev, [athleteId]: nextState }));

    try {
      if (nextState) {
        await socialService.followAthlete(user.id, athleteId);
      } else {
        await socialService.unfollowAthlete(user.id, athleteId);
      }
    } catch (err: any) {
      // Revert on failure
      setFollowingMap((prev) => ({ ...prev, [athleteId]: currentlyFollowing }));
      Alert.alert('Error', err.message || 'Could not update follow status.');
    }
  };

  // Block Athlete
  const handleBlockAthlete = async (athleteId: string, athleteName: string) => {
    if (!isLiveUser || !user) return;

    Alert.alert(
      'Block Athlete',
      `Are you sure you want to block ${athleteName}? They will no longer be able to see your public activities or interact with you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            await socialService.blockUser(user.id, athleteId);
            setAthletes((prev) => prev.filter((a) => a.id !== athleteId));
          },
        },
      ]
    );
  };

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
            <Text style={styles.headerTitle}>Explore Community</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={
                selectedTab === 'athletes'
                  ? 'Search athletes by name...'
                  : selectedTab === 'feed'
                  ? 'Search community workouts...'
                  : 'Search segments, routes, climbs...'
              }
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Section Navigation Tabs */}
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => setSelectedTab('feed')}
              style={[styles.tabItem, selectedTab === 'feed' && styles.tabItemActive]}>
              <Text style={[styles.tabText, selectedTab === 'feed' && styles.tabTextActive]}>
                Community Feed
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedTab('athletes')}
              style={[styles.tabItem, selectedTab === 'athletes' && styles.tabItemActive]}>
              <Text style={[styles.tabText, selectedTab === 'athletes' && styles.tabTextActive]}>
                Athletes
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setSelectedTab('segments')}
              style={[styles.tabItem, selectedTab === 'segments' && styles.tabItemActive]}>
              <Text style={[styles.tabText, selectedTab === 'segments' && styles.tabTextActive]}>
                Segments
              </Text>
            </Pressable>
          </View>

          {/* TAB 1: COMMUNITY FEED */}
          {selectedTab === 'feed' && (
            <View style={styles.feedSection}>
              {isFeedLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FF6B00" />
                  <Text style={styles.loadingText}>Fetching community pulse...</Text>
                </View>
              ) : feedActivities.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🏃</Text>
                  <Text style={styles.emptyTitle}>No Activities in Feed Yet</Text>
                  <Text style={styles.emptySub}>
                    Be the first to record an activity or follow other athletes to populate your stream!
                  </Text>
                </View>
              ) : (
                feedActivities.map((act) => (
                  <ActivityCard key={act.id} activity={act} />
                ))
              )}
            </View>
          )}

          {/* TAB 2: ATHLETES DIRECTORY */}
          {selectedTab === 'athletes' && (
            <View style={styles.athletesSection}>
              {isAthletesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FF6B00" />
                  <Text style={styles.loadingText}>Searching community directory...</Text>
                </View>
              ) : athletes.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>👥</Text>
                  <Text style={styles.emptyTitle}>No Athletes Found</Text>
                  <Text style={styles.emptySub}>
                    Try searching with another name or check your connection.
                  </Text>
                </View>
              ) : (
                athletes.map((ath) => {
                  const isFollowed = Boolean(followingMap[ath.id]);
                  return (
                    <View key={ath.id} style={styles.athleteRowCard}>
                      <View style={styles.athleteAvatar}>
                        <Text style={styles.athleteAvatarText}>{ath.avatarText}</Text>
                      </View>

                      <View style={styles.athleteTextGroup}>
                        <Text style={styles.athleteRowName}>{ath.name}</Text>
                        <Text style={styles.athleteRowHandle}>{ath.handle} • {ath.city}</Text>
                        {ath.bio && <Text style={styles.athleteRowBio} numberOfLines={1}>{ath.bio}</Text>}
                      </View>

                      <View style={styles.athleteRowActions}>
                        <Pressable
                          onPress={() => handleToggleFollow(ath.id)}
                          style={[
                            styles.followBtn,
                            isFollowed && styles.followBtnActive,
                          ]}>
                          <Text
                            style={[
                              styles.followBtnText,
                              isFollowed && styles.followBtnTextActive,
                            ]}>
                            {isFollowed ? 'Following' : '+ Follow'}
                          </Text>
                        </Pressable>

                        {isLiveUser && (
                          <Pressable
                            onPress={() => handleBlockAthlete(ath.id, ath.name)}
                            style={styles.blockBtn}>
                            <Text style={styles.blockBtnText}>🚫</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 3: POPULAR SEGMENTS */}
          {selectedTab === 'segments' && (
            <View style={styles.segmentsSection}>
              {/* Featured Challenge Banner */}
              <View style={styles.challengeCard}>
                <View style={styles.challengeBadge}>
                  <Text style={styles.challengeBadgeText}>OCTOBER CHALLENGE</Text>
                </View>
                <Text style={styles.challengeTitle}>100K Movement Odyssey</Text>
                <Text style={styles.challengeDesc}>
                  Ride 100 km this month and earn the official Track your movement Finisher digital badge.
                </Text>
                <View style={styles.challengeFooter}>
                  <Text style={styles.challengeStats}>👥 1,842 Athletes Joined</Text>
                  <Pressable style={styles.joinBtn}>
                    <Text style={styles.joinBtnText}>Join Challenge</Text>
                  </Pressable>
                </View>
              </View>

              {/* Segments List */}
              <View style={styles.sectionHeadingRow}>
                <Text style={styles.sectionHeading}>Popular Segments Near You</Text>
                <Text style={styles.sectionBadge}>📍 Within 25 km</Text>
              </View>

              <View style={styles.segmentList}>
                {POPULAR_SEGMENTS.map((seg) => (
                  <View key={seg.id} style={styles.segmentCard}>
                    <View style={styles.segTopRow}>
                      <View style={styles.segBadgeRow}>
                        <View
                          style={[
                            styles.segTypeTag,
                            { backgroundColor: seg.type === 'run' ? '#FF6B00' : '#00D2D3' },
                          ]}>
                          <Text style={styles.segTypeTagText}>
                            {seg.type === 'run' ? '🏃 RUN' : '🚴 RIDE'}
                          </Text>
                        </View>
                        <Text style={styles.segDistance}>{seg.distanceKm} km</Text>
                        <Text style={styles.segElev}>+{seg.elevationM} m</Text>
                      </View>
                      <Text style={styles.komBadge}>👑 {seg.komTime}</Text>
                    </View>

                    <Text style={styles.segName}>{seg.name}</Text>
                    <Text style={styles.segLoc}>{seg.location}</Text>

                    <View style={styles.segFooter}>
                      <Text style={styles.komHolderText}>CR / KOM: {seg.komHolder}</Text>
                      <Pressable style={styles.viewRouteBtn}>
                        <Text style={styles.viewRouteBtnText}>View Segment →</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
  headerTitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    paddingVertical: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#4FA99A',
  },
  feedSection: {
    gap: 14,
  },
  athletesSection: {
    gap: 10,
  },
  segmentsSection: {
    gap: 16,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  athleteRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  athleteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4FA99A',
  },
  athleteAvatarText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  athleteTextGroup: {
    flex: 1,
    gap: 2,
  },
  athleteRowName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  athleteRowHandle: {
    color: '#64748B',
    fontSize: 11,
  },
  athleteRowBio: {
    color: '#475569',
    fontSize: 12,
  },
  athleteRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followBtn: {
    backgroundColor: '#4FA99A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  followBtnActive: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  followBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  followBtnTextActive: {
    color: '#64748B',
  },
  blockBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  blockBtnText: {
    fontSize: 12,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  challengeBadge: {
    backgroundColor: 'rgba(79, 169, 154, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  challengeBadgeText: {
    color: '#4FA99A',
    fontSize: 10,
    fontWeight: '900',
  },
  challengeTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  challengeDesc: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  challengeStats: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  joinBtn: {
    backgroundColor: '#4FA99A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeading: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionBadge: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  segmentList: {
    gap: 12,
  },
  segmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  segTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  segTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  segTypeTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  segDistance: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  segElev: {
    color: '#64748B',
    fontSize: 12,
  },
  komBadge: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  segName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  segLoc: {
    color: '#64748B',
    fontSize: 12,
  },
  segFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  komHolderText: {
    color: '#64748B',
    fontSize: 11,
  },
  viewRouteBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewRouteBtnText: {
    color: '#4FA99A',
    fontSize: 11,
    fontWeight: '700',
  },
});
