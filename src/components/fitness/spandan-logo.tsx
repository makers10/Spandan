import { Platform, StyleSheet, Text, View } from 'react-native';

interface SpandanLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

export function SpandanLogo({ size = 'medium', showTagline = true }: SpandanLogoProps) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const markSize = isSmall ? 28 : isLarge ? 46 : 34;
  const textSize = isSmall ? 15 : isLarge ? 24 : 19;
  const taglineSize = isSmall ? 8 : isLarge ? 11 : 9.5;
  const dotScale = isSmall ? 0.8 : isLarge ? 1.3 : 1;

  return (
    <View style={styles.container}>
      {/* Athletic Kinetic Movement Brand Mark */}
      <View
        style={[
          styles.markContainer,
          {
            width: markSize,
            height: markSize,
            borderRadius: isSmall ? 8 : isLarge ? 13 : 10,
          },
        ]}>
        <View style={styles.markInner}>
          {/* Forward velocity movement trail */}
          <View style={[styles.velocityTrail, { transform: [{ rotate: '45deg' }] }]} />
          {/* Primary dynamic track arrow */}
          <View style={styles.leadChevron}>
            <View style={styles.chevronArmUp} />
            <View style={styles.chevronArmDown} />
          </View>
          {/* Live GPS tracking node */}
          <View style={styles.beaconDot} />
        </View>
      </View>

      {/* Brand Typography Lockup */}
      <View style={styles.textContainer}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandName, { fontSize: textSize }]}>Track</Text>
          <View style={[styles.dotWrapper, { transform: [{ scale: dotScale }] }]}>
            <View style={styles.dotAura} />
            <View style={styles.dotCore} />
          </View>
        </View>
        {showTagline && (
          <Text style={[styles.tagline, { fontSize: taglineSize }]}>YOUR MOVEMENT</Text>
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
    backgroundColor: '#4FA99A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4FA99A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  markInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  velocityTrail: {
    position: 'absolute',
    left: '26%',
    width: '24%',
    height: '24%',
    borderRightWidth: 2.2,
    borderTopWidth: 2.2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: 2,
  },
  leadChevron: {
    position: 'absolute',
    left: '38%',
    width: '32%',
    height: '48%',
    justifyContent: 'center',
  },
  chevronArmUp: {
    width: '100%',
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    transform: [{ rotate: '42deg' }, { translateY: -2 }],
    transformOrigin: 'right center',
  },
  chevronArmDown: {
    width: '100%',
    height: 2.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
    transform: [{ rotate: '-42deg' }, { translateY: 2 }],
    transformOrigin: 'right center',
  },
  beaconDot: {
    position: 'absolute',
    right: '22%',
    top: '32%',
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
    gap: 5,
  },
  brandName: {
    color: '#0F172A',
    fontWeight: '900',
    letterSpacing: -0.6,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif' }),
    includeFontPadding: false,
  },
  dotWrapper: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 1,
  },
  dotAura: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(79, 169, 154, 0.25)',
  },
  dotCore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#4FA99A',
  },
  tagline: {
    color: '#4FA99A',
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 1,
    includeFontPadding: false,
  },
});
