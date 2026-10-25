import React from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { usePathname } from 'expo-router';

type TabIconType = 'summary' | 'explore' | 'record' | 'profile';

interface TabButtonProps extends TabTriggerSlotProps {
  icon: TabIconType;
  label: string;
  href: string;
}

export default function AppTabs() {
  return (
    <Tabs activityEnabled={true} style={styles.tabsRoot}>
      <TabSlot detachInactiveScreens={false} style={styles.tabSlot} />
      <TabList asChild>
        <ModernTabBar>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="summary" label="Summary" href="/" />
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon="explore" label="Explore" href="/explore" />
          </TabTrigger>
          <TabTrigger name="record" href="/record" asChild>
            <TabButton icon="record" label="Record" href="/record" />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="profile" label="Profile" href="/profile" />
          </TabTrigger>
        </ModernTabBar>
      </TabList>
    </Tabs>
  );
}

export function ModernTabBar(props: TabListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      {...props}
      style={[
        styles.tabBarContainer,
        isDark ? styles.tabBarDark : styles.tabBarLight,
      ]}>
      <View style={styles.tabBarInner}>{props.children}</View>
    </View>
  );
}

export const TabButton = React.forwardRef<any, TabButtonProps>(function TabButton(
  { icon, label, href, isFocused: propIsFocused, ...props },
  ref
) {
  const pathname = usePathname();
  const isCurrent =
    href === '/'
      ? pathname === '/' || pathname === '/index' || pathname === ''
      : pathname.startsWith(href);
  const active = Boolean(propIsFocused || isCurrent);

  const activeColor = '#4FA99A';
  const inactiveColor = '#8E8E93';
  const color = active ? activeColor : inactiveColor;

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.tabButton,
        active && styles.tabButtonActive,
        pressed && styles.tabButtonPressed,
      ]}>
      <View style={[styles.tabIconWrapper, active && styles.tabIconWrapperActive]}>
        <TabGlyph icon={icon} color={color} active={active} />
      </View>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.tabLabel,
          { color },
          active && styles.tabLabelActive,
        ]}>
        {label}
      </Text>
      <View style={active ? styles.activeDot : styles.inactiveDot} />
    </Pressable>
  );
});

function TabGlyph({
  icon,
  color,
  active,
}: {
  icon: TabIconType;
  color: string;
  active: boolean;
}) {
  switch (icon) {
    case 'summary':
      return active ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" />
        </svg>
      );
    case 'explore':
      return active ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon
            points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
            fill={color}
            stroke={color}
            strokeWidth="1"
          />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'record':
      return active ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.2" />
          <circle cx="12" cy="12" r="5" fill={color} />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4.5" />
        </svg>
      );
    case 'profile':
      return active ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill={color}>
          <circle cx="12" cy="7" r="4" fill={color} />
          <path d="M12 13c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5z" fill={color} />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round">
          <circle cx="12" cy="7" r="4" />
          <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
        </svg>
      );
  }
}

const styles = StyleSheet.create({
  tabsRoot: {
    height: '100%',
    backgroundColor: '#F2F2F7',
  },
  tabSlot: {
    height: '100%',
    backgroundColor: '#F2F2F7',
  },
  tabBarContainer: {
    position: 'fixed' as any,
    bottom: 12,
    left: '2%',
    right: '2%',
    width: '96%',
    maxWidth: 500,
    height: 64,
    marginHorizontal: 'auto' as any,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBarLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(30px) saturate(200%)' as any,
  },
  tabBarDark: {
    backgroundColor: 'rgba(24, 24, 27, 0.92)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(30px) saturate(200%)' as any,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    gap: 2,
  },
  tabButton: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 0,
    borderRadius: 22,
    outlineStyle: 'none' as any,
    userSelect: 'none' as any,
    cursor: 'pointer' as any,
    gap: 2,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(79, 169, 154, 0.12)',
  },
  tabButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.93 }],
  },
  tabIconWrapper: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapperActive: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: '500',
    letterSpacing: 0,
    textAlign: 'center',
    marginTop: 1,
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#4FA99A',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4FA99A',
    marginTop: 1,
  },
  inactiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginTop: 1,
  },
});
