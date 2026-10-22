import React, { useState } from 'react';
import {
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'segments' | 'challenges' | 'clubs'>('segments');

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
              placeholder="Search segments, routes, clubs..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Section Navigation Tabs */}
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => setSelectedTab('segments')}
              style={[styles.tabItem, selectedTab === 'segments' && styles.tabItemActive]}>
              <Text style={[styles.tabText, selectedTab === 'segments' && styles.tabTextActive]}>
                Segments
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedTab('challenges')}
              style={[styles.tabItem, selectedTab === 'challenges' && styles.tabItemActive]}>
              <Text style={[styles.tabText, selectedTab === 'challenges' && styles.tabTextActive]}>
                Challenges
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedTab('clubs')}
              style={[styles.tabItem, selectedTab === 'clubs' && styles.tabItemActive]}>
              <Text style={[styles.tabText, selectedTab === 'clubs' && styles.tabTextActive]}>
                Clubs
              </Text>
            </Pressable>
          </View>

          {/* Featured Challenge Banner */}
          <View style={styles.challengeCard}>
            <View style={styles.challengeBadge}>
              <Text style={styles.challengeBadgeText}>OCTOBER CHALLENGE</Text>
            </View>
            <Text style={styles.challengeTitle}>Spandan 100K Cycling Odyssey</Text>
            <Text style={styles.challengeDesc}>
              Ride 100 km this month and earn the official Spandan Autumn Finisher digital badge.
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
  headerTitle: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131B2E',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 10,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#131B2E',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#243354',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#1C263E',
  },
  tabText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FF6B00',
  },
  challengeCard: {
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FF6B00',
    gap: 8,
  },
  challengeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 107, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  challengeBadgeText: {
    color: '#FF6B00',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  challengeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  challengeDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  challengeStats: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  joinBtn: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
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
    marginTop: 6,
  },
  sectionHeading: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  sectionBadge: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  segmentList: {
    gap: 12,
  },
  segmentCard: {
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 6,
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
    fontSize: 9,
    fontWeight: '800',
  },
  segDistance: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  segElev: {
    color: '#94A3B8',
    fontSize: 12,
  },
  komBadge: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
  },
  segName: {
    color: '#FFFFFF',
    fontSize: 16,
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
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1C263E',
  },
  komHolderText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  viewRouteBtn: {
    paddingVertical: 2,
  },
  viewRouteBtnText: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '700',
  },
});
