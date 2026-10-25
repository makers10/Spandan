import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';

interface AtmosphericBackgroundProps {
  glowTopColor?: string;
  glowMidColor?: string;
}

export function AtmosphericBackground({
  glowTopColor = 'rgba(79, 169, 154, 0.12)',
  glowMidColor = 'rgba(0, 210, 211, 0.07)',
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
    top: -90,
    right: -50,
    width: 320,
    height: 320,
    borderRadius: 160,
    ...Platform.select({
      web: {
        filter: 'blur(80px)',
      },
      default: {
        opacity: 0.55,
      },
    }),
  },
  glowMid: {
    position: 'absolute',
    top: 240,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    ...Platform.select({
      web: {
        filter: 'blur(75px)',
      },
      default: {
        opacity: 0.45,
      },
    }),
  },
});
