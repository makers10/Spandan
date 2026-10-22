import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

export function SkeletonLoader() {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {/* Top Banner Skeleton */}
      <Animated.View style={[styles.skeletonGoal, { opacity: pulseAnim }]} />

      {/* Stats Row Skeletons */}
      <View style={styles.statsRow}>
        <Animated.View style={[styles.skeletonStat, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonStat, { opacity: pulseAnim }]} />
        <Animated.View style={[styles.skeletonStat, { opacity: pulseAnim }]} />
      </View>

      {/* Chart Skeleton */}
      <Animated.View style={[styles.skeletonChart, { opacity: pulseAnim }]} />

      {/* Activity Card Skeletons */}
      <Animated.View style={[styles.skeletonCard, { opacity: pulseAnim }]} />
      <Animated.View style={[styles.skeletonCard, { opacity: pulseAnim }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    width: '100%',
  },
  skeletonGoal: {
    height: 90,
    backgroundColor: '#131B2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#243354',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonStat: {
    flex: 1,
    height: 80,
    backgroundColor: '#131B2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#243354',
  },
  skeletonChart: {
    height: 140,
    backgroundColor: '#131B2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#243354',
  },
  skeletonCard: {
    height: 220,
    backgroundColor: '#131B2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#243354',
  },
});
