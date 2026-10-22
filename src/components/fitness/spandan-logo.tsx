import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SpandanLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

export function SpandanLogo({ size = 'medium', showTagline = false }: SpandanLogoProps) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const markSize = isSmall ? 28 : isLarge ? 48 : 36;
  const textSize = isSmall ? 18 : isLarge ? 28 : 22;

  return (
    <View style={styles.container}>
      <View style={[styles.markContainer, { width: markSize, height: markSize }]}>
        {/* Athletic pulse electrocardiogram stylized symbol */}
        <View style={styles.pulseInner}>
          <View style={styles.pulseLineLeft} />
          <View style={styles.pulsePeakUp} />
          <View style={styles.pulsePeakDown} />
          <View style={styles.pulsePeakUpSmall} />
          <View style={styles.pulseLineRight} />
        </View>
      </View>
      <View style={styles.textContainer}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandName, { fontSize: textSize }]}>SPANDAN</Text>
          <View style={styles.dot} />
        </View>
        {showTagline && (
          <Text style={styles.tagline}>THE ATHLETIC PULSE</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  markContainer: {
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  pulseInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    paddingHorizontal: 2,
  },
  pulseLineLeft: {
    width: 4,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  pulsePeakUp: {
    width: 2.5,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    marginHorizontal: 1,
  },
  pulsePeakDown: {
    width: 2.5,
    height: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    marginHorizontal: 1,
    transform: [{ translateY: 2 }],
  },
  pulsePeakUpSmall: {
    width: 2.5,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    marginHorizontal: 1,
  },
  pulseLineRight: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  textContainer: {
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandName: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 1.5,
    fontFamily: 'sans-serif',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B00',
    marginBottom: 2,
  },
  tagline: {
    color: '#FF6B00',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: -1,
  },
});
