import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface FeaturedChallengeBannerProps {
  title?: string;
  subtitle?: string;
}

export function FeaturedChallengeBanner({
  title = 'VO2 Max Accelerator',
  subtitle = 'FEATURED CHALLENGE',
}: FeaturedChallengeBannerProps) {
  return (
    <Pressable
      onPress={() => router.push('/record' as any)}
      style={({ pressed }) => [styles.bannerCard, pressed && styles.pressed]}>
      {/* Dark Athletic Gradient Atmosphere */}
      <View style={styles.darkAura} />

      <View style={styles.contentRow}>
        <View style={styles.textCol}>
          <View style={styles.subCluster}>
            <View style={styles.pulseDot} />
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.caption}>Target high-output anaerobic intervals</Text>
        </View>

        <View style={styles.playBtn}>
          <Ionicons name="play" size={18} color="#006B5D" style={{ marginLeft: 2 }} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bannerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  darkAura: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0, 184, 162, 0.2)',
  },
  contentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  textCol: {
    flex: 1,
    paddingRight: 12,
  },
  subCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2DD4BF',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2DD4BF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  caption: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
});
