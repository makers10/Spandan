import React from 'react';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import { MotiView } from 'moti';
import { MaterialIcons } from '@expo/vector-icons';

export type TabIconType =
  | 'dashboard'
  | 'summary'
  | 'session'
  | 'record'
  | 'analytics'
  | 'explore'
  | 'profile';

function TabIcon({
  icon,
  active,
  color,
}: {
  icon: TabIconType;
  active: boolean;
  color: string;
}) {
  let name: keyof typeof MaterialIcons.glyphMap;

  switch (icon) {
    case 'dashboard':
    case 'summary':
      name = 'donut-large';
      break;
    case 'session':
    case 'record':
      name = 'bolt';
      break;
    case 'analytics':
    case 'explore':
      name = 'analytics';
      break;
    case 'profile':
      name = active ? 'person' : 'person-outline';
      break;
    default:
      name = 'donut-large';
  }

  return <MaterialIcons name={name} size={22} color={color} />;
}

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
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[
        styles.tabBarContainer,
        { bottom: Math.max(14, insets.bottom) },
        styles.tabBarLight,
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

  // Active / inactive kinetic color palette (Light Theme)
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
      style={styles.tabPressable}>
      {({ pressed }) => (
        <MotiView
          animate={{
            scale: pressed ? 0.94 : 1,
            backgroundColor: active ? 'rgba(0, 184, 162, 0.10)' : 'transparent',
          }}
          transition={{
            type: 'spring',
            damping: 14,
            stiffness: 220,
          } as any}
          style={styles.tabButton}>
          <MotiView
            animate={{
              scale: active ? 1.06 : 1,
            }}
            transition={{
              type: 'spring',
              damping: 14,
            } as any}
            style={styles.tabIconWrapper}>
            <TabIcon icon={icon} active={active} color={iconColor} />
          </MotiView>
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
        </MotiView>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
    height: '100%',
    backgroundColor: '#f4f8f7',
  },
  tabSlot: {
    flex: 1,
    height: '100%',
    backgroundColor: '#f4f8f7',
  },
  tabBarContainer: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    bottom: 14,
    left: 16,
    right: 16,
    width: '92%',
    maxWidth: 480,
    alignSelf: 'center',
    marginHorizontal: 'auto' as any,
    borderRadius: 36,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1000,
  },
  tabBarLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(226, 232, 240, 0.9)',
  },
  tabBarDark: {
    backgroundColor: 'rgba(19, 27, 46, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    height: 62,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  tabPressable: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 2,
  },
  tabIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '400',
    letterSpacing: 0.6,
    textAlign: 'center',
    includeFontPadding: false,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    fontWeight: '700',
    color: '#006b5d',
  },
});
