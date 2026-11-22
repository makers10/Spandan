import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GpsCoordinate, generateSvgPathFromCoordinates } from '@/utils/geo';
import { styles } from './overleap-map.styles';

export type OverleapMapLayer = 'tactical' | 'satellite' | 'terrain';

interface OverleapSessionMapProps {
  routePoints: GpsCoordinate[];
  distanceKm: number;
  paceOrSpeed: string;
  elevationM: number;
  bearing?: number;
  gpsAccuracy?: number | null;
  splitNum?: number;
}

export function OverleapSessionMap({
  routePoints, distanceKm, paceOrSpeed, elevationM,
  bearing = 142, gpsAccuracy, splitNum = 1,
}: OverleapSessionMapProps) {
  const [mapLayer, setMapLayer] = useState<OverleapMapLayer>('tactical');
  const hasRoute = routePoints.length >= 2;
  const bg = mapLayer === 'satellite' ? '#090d16' : mapLayer === 'terrain' ? '#042f2e' : '#020617';

  return (
    <View style={styles.container}>
      <View style={[styles.mapCanvas, { backgroundColor: bg }]}>
        {Platform.OS === 'web' && (
          <div
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
            dangerouslySetInnerHTML={{
              __html: `<svg width="100%" height="100%" viewBox="0 0 380 256" preserveAspectRatio="none" style="position: absolute; inset: 0;">
                <defs>
                  <pattern id="overleap-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                    <path d="M 28 0 L 0 0 0 28" fill="none" stroke="${mapLayer === 'terrain' ? '#2dd4bf' : '#38bdf8'}" stroke-opacity="0.15" stroke-width="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#overleap-grid)" />
                ${hasRoute ? `
                  <path d="${generateSvgPathFromCoordinates(routePoints, 380, 256, 16)}" stroke="#00b8a2" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                  <circle cx="190" cy="128" r="6" fill="#00b8a2" stroke="#ffffff" stroke-width="2" />
                  <circle cx="190" cy="128" r="14" fill="none" stroke="#00b8a2" stroke-width="1.5" opacity="0.6" />
                ` : `
                  <circle cx="190" cy="128" r="7" fill="#00b8a2" stroke="#ffffff" stroke-width="2" />
                  <circle cx="190" cy="128" r="16" fill="none" stroke="#00b8a2" stroke-width="1.5" opacity="0.6" />
                  <text x="50%" y="72%" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="700" letter-spacing="1">OVERLEAP SATELLITE HUD • TRACKING READY</text>
                `}
              </svg>`,
            }}
          />
        )}
      </View>

      <View style={styles.layerSwitcherRow}>
        {(['tactical', 'satellite', 'terrain'] as OverleapMapLayer[]).map((l) => (
          <Pressable
            key={l}
            onPress={() => setMapLayer(l)}
            style={[styles.layerPill, mapLayer === l && styles.layerPillActive]}>
            <Text style={[styles.layerText, mapLayer === l && styles.layerTextActive]}>{l.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.topRightHUD}>
        <Ionicons name="navigate" size={12} color="#34d399" />
        <Text style={styles.bearingText}>{bearing}° SE • {gpsAccuracy ? `±${gpsAccuracy}m` : 'RTK'}</Text>
      </View>

      <View style={styles.bottomOverlayBar}>
        <View style={styles.metricGroup}>
          <Text style={styles.metricLabelCaps}>SPLIT {String(splitNum).padStart(2, '0')}</Text>
          <Text style={styles.metricValueBold}>{distanceKm.toFixed(2)} km</Text>
        </View>
        <View style={styles.metricGroup}>
          <Text style={styles.metricLabelCaps}>PACE</Text>
          <Text style={styles.metricValueBold}>{paceOrSpeed}</Text>
        </View>
        <View style={styles.metricGroup}>
          <Text style={styles.metricLabelCaps}>ELEV</Text>
          <Text style={styles.metricValueBold}>+{elevationM}m</Text>
        </View>
        <Pressable style={styles.recenterBtn}>
          <Ionicons name="locate" size={15} color="#00b8a2" />
        </Pressable>
      </View>
    </View>
  );
}
