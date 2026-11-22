import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GpsCoordinate } from '@/utils/geo';
import { locationService } from '@/services/location-service';
import { generateMapLibreHtml, OverleapMapLayer } from './overleap-map-html';
import { OverleapNativeMap } from './overleap-native-map';
import { styles } from './overleap-map.styles';

export type { OverleapMapLayer };

interface OverleapSessionMapProps {
  routePoints: GpsCoordinate[]; distanceKm: number; paceOrSpeed: string;
  elevationM: number; bearing?: number; gpsAccuracy?: number | null;
  splitNum?: number; currentLocation?: GpsCoordinate | null;
}

export function OverleapSessionMap({
  routePoints, distanceKm, paceOrSpeed, elevationM,
  bearing = 142, gpsAccuracy, splitNum = 1, currentLocation,
}: OverleapSessionMapProps) {
  const [mapLayer, setMapLayer] = useState<OverleapMapLayer>('tactical');
  const [internalLoc, setInternalLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let active = true;
    locationService.getCurrentPosition().then((pos) => {
      if (active && pos) setInternalLoc({ lat: pos.latitude, lng: pos.longitude });
    });
    return () => { active = false; };
  }, []);

  const last = routePoints.length > 0 ? routePoints[routePoints.length - 1] : null;
  const activeLat = last?.latitude ?? currentLocation?.latitude ?? internalLoc?.lat ?? 28.6139;
  const activeLng = last?.longitude ?? currentLocation?.longitude ?? internalLoc?.lng ?? 77.209;
  const mapHtml = generateMapLibreHtml(routePoints, mapLayer, activeLat, activeLng);

  return (
    <View style={styles.container}>
      <View style={styles.mapCanvas}>
        {Platform.OS === 'web' ? (
          <iframe
            key={`${mapLayer}-${activeLat.toFixed(3)}-${activeLng.toFixed(3)}-${routePoints.length}`}
            title="Overleap Map"
            srcDoc={mapHtml}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <OverleapNativeMap
            lat={activeLat}
            lng={activeLng}
            layer={mapLayer}
            routePoints={routePoints}
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
        <Text style={styles.bearingText}>{bearing}° • {gpsAccuracy ? `±${gpsAccuracy}m` : 'FIX'}</Text>
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
        <Pressable
          onPress={() => {
            locationService.getCurrentPosition().then((pos) => {
              if (pos) setInternalLoc({ lat: pos.latitude, lng: pos.longitude });
            });
          }}
          style={styles.recenterBtn}>
          <Ionicons name="locate" size={15} color="#00b8a2" />
        </Pressable>
      </View>
    </View>
  );
}
