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
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { usePathname } from 'expo-router';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';

type TabIconType = 'summary' | 'explore' | 'record' | 'profile';

function TabIcon({
  icon,
  active,
  color,
}: {
  icon: TabIconType;
  active: boolean;
  color: string;
}) {
  let name: keyof typeof Ionicons.glyphMap;

  switch (icon) {
    case 'summary':
      name = active ? 'heart' : 'heart-outline';
      break;
    case 'explore':
      name = active ? 'compass' : 'compass-outline';
      break;
    case 'record':
      name = active ? 'radio-button-on' : 'radio-button-off';
      break;
    case 'profile':
      name = active ? 'person' : 'person-outline';
      break;
  }

  return <Ionicons name={name} size={22} color={color} />;
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
      style={styles.tabPressable}>
      {({ pressed }) => (
        <MotiView
          animate={{
            backgroundColor: active ? 'rgba(79, 169, 154, 0.12)' : 'rgba(79, 169, 154, 0)',
            scale: pressed ? 0.94 : 1,
          }}
          transition={{
            type: 'spring',
            damping: 14,
          } as any}
          style={styles.tabButton}>
          <MotiView
            animate={{
              scale: active ? 1.08 : 1,
            }}
            transition={{
              type: 'spring',
              damping: 14,
            } as any}
            style={styles.tabIconWrapper}>
            <TabIcon icon={icon} active={active} color={color} />
          </MotiView>
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
          

        </MotiView>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F2F2F7',
  },
  tabSlot: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F2F2F7',
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 12,
    left: '2%',
    right: '2%',
    width: '96%',
    maxWidth: 500,
    height: 64,
    alignSelf: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  tabBarDark: {
    backgroundColor: 'rgba(24, 24, 27, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    gap: 2,
  },
  tabPressable: {
    flex: 1,
    height: 56,
  },
  tabButton: {
    flex: 1,
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 0,
    borderRadius: 22,
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
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize:8.5,
    lineHeight: 12,
    fontWeight: '500',
    letterSpacing: 0,
    textAlign: 'center',
    includeFontPadding: false,
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
