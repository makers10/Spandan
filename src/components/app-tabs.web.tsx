import React from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { SpandanLogo } from '@/components/fitness/spandan-logo';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function AppTabs() {
  return (
    <Tabs style={styles.tabsRoot}>
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton>Explore</TabButton>
          </TabTrigger>
          <TabTrigger name="record" href="/record" asChild>
            <TabButton>Record</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
      <TabSlot style={styles.tabSlot} />
    </Tabs>
  );
}

export const TabButton = React.forwardRef<any, TabTriggerSlotProps>(function TabButton(
  { children, isFocused, ...props },
  ref
) {
  return (
    <Pressable
      ref={ref}
      {...props}
      style={({ pressed }) => [styles.pressableWrapper, pressed && styles.pressed]}>
      <View
        style={[
          styles.tabButtonView,
          isFocused ? styles.tabButtonViewActive : styles.tabButtonViewInactive,
        ]}>
        <Text style={[styles.tabButtonText, isFocused && styles.tabButtonTextActive]}>
          {children}
        </Text>
      </View>
    </Pressable>
  );
});

export function CustomTabList(props: TabListProps) {
  const { user, profile, isDemoMode, isConfigured, openAuthModal } = useAuth();
  const isLiveUser = Boolean(user && !isDemoMode);

  const avatar = isLiveUser
    ? profile?.avatar_text || user?.email?.substring(0, 2).toUpperCase() || 'ME'
    : null;

  return (
    <View {...props} style={styles.tabListContainer}>
      <View style={styles.innerContainer}>
        <View style={styles.brandWrapper}>
          <SpandanLogo size="small" showTagline />
        </View>

        <View style={styles.navGroup}>{props.children}</View>

        <View style={styles.rightCluster}>
          {isLiveUser ? (
            <Pressable
              onPress={() => router.push('/profile' as any)}
              style={styles.userBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.userBadgeText}>Cloud Sync</Text>
              <View style={styles.userAvatarMini}>
                <Text style={styles.userAvatarMiniText}>{avatar}</Text>
              </View>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => openAuthModal('login')}
              style={styles.signInBtn}>
              <Text style={styles.signInBtnText}>Sign In</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRoot: {
    height: '100%',
    backgroundColor: '#0B111E',
  },
  tabSlot: {
    height: '100%',
    backgroundColor: '#F8FAF9',
  },
  tabListContainer: {
    position: 'sticky' as any,
    top: 0,
    zIndex: 100,
    width: '100%',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  innerContainer: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.two,
  },
  brandWrapper: {
    marginRight: 'auto',
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pressableWrapper: {
    outlineStyle: 'none' as any,
  },
  tabButtonView: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonViewActive: {
    backgroundColor: '#4FA99A',
  },
  tabButtonViewInactive: {
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 'auto',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 3,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  userBadgeText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '700',
  },
  userAvatarMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4FA99A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarMiniText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  signInBtn: {
    backgroundColor: '#4FA99A',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
