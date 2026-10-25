import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export function QuickLaunchBar() {
  const launches = [
    {
      id: 'sprint',
      title: 'SPRINT INTERVALS',
      icon: 'flash' as const,
      isFeatured: true,
      sport: 'run',
    },
    {
      id: 'trail',
      title: 'TRAIL RUN',
      icon: 'trail-sign-outline' as const,
      isFeatured: false,
      sport: 'run',
    },
    {
      id: 'hyrox',
      title: 'HYROX',
      icon: 'barbell-outline' as const,
      isFeatured: false,
      sport: 'ride',
    },
    {
      id: 'hiit',
      title: 'HIIT',
      icon: 'timer-outline' as const,
      isFeatured: false,
      sport: 'walk',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.metaLabel}>QUICK LAUNCH</Text>
        <Pressable onPress={() => router.push('/record' as any)}>
          <Text style={styles.configLink}>Config All</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}>
        {launches.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => router.push('/record' as any)}
            style={({ pressed }) => [
              styles.pill,
              item.isFeatured ? styles.featuredPill : styles.standardPill,
              pressed && styles.pressed,
            ]}>
            <Ionicons
              name={item.icon}
              size={16}
              color={item.isFeatured ? '#FFFFFF' : '#006B5D'}
            />
            <Text
              style={[
                styles.pillText,
                item.isFeatured ? styles.featuredPillText : styles.standardPillText,
              ]}>
              {item.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  configLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006B5D',
  },
  scrollList: {
    gap: 8,
    paddingVertical: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
  },
  featuredPill: {
    backgroundColor: '#006B5D',
    shadowColor: '#006B5D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  standardPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  featuredPillText: {
    color: '#FFFFFF',
  },
  standardPillText: {
    color: '#334155',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
});
