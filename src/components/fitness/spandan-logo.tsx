import { Text, View } from 'react-native';
import { styles } from './spandan-logo.styles';

interface SpandanLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

export function SpandanLogo({ size = 'medium', showTagline = true }: SpandanLogoProps) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const markSize = isSmall ? 28 : isLarge ? 42 : 32;
  const textSize = isSmall ? 15 : isLarge ? 22 : 18;
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
          <Text style={[styles.brandName, { fontSize: textSize }]} numberOfLines={1}>
            Track your movement
          </Text>
          <View style={[styles.dotWrapper, { transform: [{ scale: dotScale }] }]}>
            <View style={styles.dotAura} />
            <View style={styles.dotCore} />
          </View>
        </View>
        {showTagline && (
          <Text style={[styles.tagline, { fontSize: taglineSize }]}>ATHLETE TRACKER</Text>
        )}
      </View>
    </View>
  );
}

export const AppLogo = SpandanLogo;
