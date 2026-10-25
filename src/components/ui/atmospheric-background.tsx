import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';

interface AtmosphericBackgroundProps {
  glowTopColor?: string;
  glowMidColor?: string;
}

export function AtmosphericBackground({
  glowTopColor = '#e8f5f1',
  glowMidColor = '#edf4f2',
}: AtmosphericBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.glowTop, { backgroundColor: glowTopColor }]} />
      <View style={[styles.glowMid, { backgroundColor: glowMidColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glowTop: {
    position: 'absolute',
    top: -80,
    left: -40,
    width: 360,
    height: 360,
    borderRadius: 180,
    ...Platform.select({
      web: {
        filter: 'blur(90px)',
      },
      default: {
        opacity: 0.7,
      },
    }),
  },
  glowMid: {
    position: 'absolute',
    top: 300,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    ...Platform.select({
      web: {
        filter: 'blur(80px)',
      },
      default: {
        opacity: 0.6,
      },
    }),
  },
});
