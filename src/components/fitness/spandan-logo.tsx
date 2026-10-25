import { Platform, StyleSheet, Text, View } from 'react-native';

interface SpandanLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

export function SpandanLogo({ size = 'medium', showTagline = true }: SpandanLogoProps) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const markSize = isSmall ? 28 : isLarge ? 42 : 32;
  const textSize = isSmall ? 16 : isLarge ? 24 : 19;
  const taglineSize = isSmall ? 8 : isLarge ? 10.5 : 9;
  const dotScale = isSmall ? 0.8 : isLarge ? 1.2 : 1;

  return (
    <View style={styles.container}>
      {/* Apple Health style minimalist pulse mark */}
      <View
        style={[
          styles.markContainer,
          {
            width: markSize,
            height: markSize,
            borderRadius: isSmall ? 8 : isLarge ? 12 : 10,
          },
        ]}>
        <View style={styles.pulseWave}>
          <View style={styles.pulseLine} />
          <View style={styles.pulsePeak} />
          <View style={styles.pulseValley} />
          <View style={styles.pulseDot} />
        </View>
      </View>

      {/* Brand Typography Lockup */}
      <View style={styles.textContainer}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandName, { fontSize: textSize }]}>Spandan</Text>
          <View style={[styles.dotWrapper, { transform: [{ scale: dotScale }] }]}>
            <View style={styles.dotAura} />
            <View style={styles.dotCore} />
          </View>
        </View>
        {showTagline && (
          <Text style={[styles.tagline, { fontSize: taglineSize }]}>ATHLETE PULSE</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  markContainer: {
    backgroundColor: '#4FA99A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4FA99A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  pulseWave: {
    width: 20,
    height: 14,
    position: 'relative',
    justifyContent: 'center',
  },
  pulseLine: {
    position: 'absolute',
    left: 1,
    top: 6,
    width: 4,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  pulsePeak: {
    position: 'absolute',
    left: 5,
    top: 1,
    width: 2,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  pulseValley: {
    position: 'absolute',
    left: 8,
    top: 4,
    width: 2,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  pulseDot: {
    position: 'absolute',
    right: 2,
    top: 5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
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
    color: '#000000',
    fontWeight: '800',
    letterSpacing: -0.5,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    includeFontPadding: false,
  },
  dotWrapper: {
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 1,
  },
  dotAura: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(79, 169, 154, 0.25)',
  },
  dotCore: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4FA99A',
  },
  tagline: {
    color: '#8E8E93',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 1,
    includeFontPadding: false,
  },
});
