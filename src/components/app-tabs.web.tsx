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
import { usePathname } from 'expo-router';

export type TabIconType =
  | 'dashboard'
  | 'summary'
  | 'session'
  | 'record'
  | 'analytics'
  | 'explore'
  | 'profile';

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
            <TabButton icon="dashboard" label="DASHBOARD" href="/" />
          </TabTrigger>
          <TabTrigger name="record" href="/record" asChild>
            <TabButton icon="session" label="SESSION" href="/record" />
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon="analytics" label="ANALYTICS" href="/explore" />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="profile" label="PROFILE" href="/profile" />
          </TabTrigger>
        </ModernTabBar>
      </TabList>
    </Tabs>
  );
}

export function ModernTabBar(props: TabListProps) {
  return (
    <View
      {...props}
      {...({ suppressHydrationWarning: true } as any)}
      style={[styles.tabBarContainer, styles.tabBarLight]}>
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

  const activeIconColor = '#00b8a2';
  const activeTextColor = '#006b5d';
  const inactiveColor = '#94a3b8';

  const iconColor = active ? activeIconColor : inactiveColor;
  const textColor = active ? activeTextColor : inactiveColor;

  return (
    <Pressable
      ref={ref}
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.tabButton,
        active && styles.tabButtonActiveLight,
        pressed && styles.tabButtonPressed,
      ]}>
      <View style={[styles.tabIconWrapper, active && styles.tabIconWrapperActive]}>
        <TabGlyph icon={icon} color={iconColor} active={active} />
      </View>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.tabLabel,
          { color: textColor },
          active && styles.tabLabelActive,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
});

function TabGlyph({
  icon,
  color,
  active: _active,
}: {
  icon: TabIconType;
  color: string;
  active: boolean;
}) {
  switch (icon) {
    case 'dashboard':
    case 'summary':
      // Material Symbols donut_large
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z" />
        </svg>
      );
    case 'session':
    case 'record':
      // Material Symbols bolt
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
          <path d="M11 21h-1l1-7H7.5c-.88 0-.33-.75-.31-.78C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-6 10.49z" />
        </svg>
      );
    case 'analytics':
    case 'explore':
      // Material Symbols analytics
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
        </svg>
      );
    case 'profile':
      // Material Symbols person
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      );
    default:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={color}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

const styles = StyleSheet.create({
  tabsRoot: {
    height: '100%',
    backgroundColor: '#f4f8f7',
  },
  tabSlot: {
    height: '100%',
    backgroundColor: '#f4f8f7',
  },
  tabBarContainer: {
    position: 'fixed' as any,
    bottom: 16,
    left: '4%',
    right: '4%',
    width: '92%',
    maxWidth: 480,
    marginHorizontal: 'auto' as any,
    height: 64,
    zIndex: 1000,
    borderRadius: 36,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBarLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(226, 232, 240, 0.9)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  } as any,
  tabBarDark: {
    backgroundColor: 'rgba(19, 27, 46, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  } as any,
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    height: '100%',
    paddingHorizontal: 6,
  },
  tabButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    cursor: 'pointer',
    transition: 'all 0.18s ease-in-out',
  } as any,
  tabButtonActiveLight: {
    backgroundColor: 'rgba(0, 184, 162, 0.10)',
  } as any,
  tabButtonActiveDark: {
    backgroundColor: 'rgba(0, 184, 162, 0.16)',
  } as any,
  tabButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  tabIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.18s ease-in-out',
  } as any,
  tabIconWrapperActive: {
    transform: [{ scale: 1.06 }],
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textAlign: 'center',
    textTransform: 'uppercase',
    userSelect: 'none',
  } as any,
  tabLabelActive: {
    fontWeight: '700',
  },
});
