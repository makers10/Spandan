import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Circle, Path } from 'react-native-svg';
import { GpsCoordinate, generateSvgPathFromCoordinates } from '@/utils/geo';
import { OverleapMapLayer } from './overleap-map-html';

interface NativeMapProps {
  lat: number;
  lng: number;
  layer: OverleapMapLayer;
  routePoints: GpsCoordinate[];
}

export function getTileCoords(lat: number, lon: number, zoom: number = 15) {
  const n = Math.pow(2, zoom);
  const xF = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const yF = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  const x = Math.floor(xF);
  const y = Math.floor(yF);
  const offX = Math.floor((xF - x) * 256);
  const offY = Math.floor((yF - y) * 256);
  return { x, y, offX, offY };
}

const OFFSETS = [
  { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
  { dx: -1, dy: 0 },  { dx: 0, dy: 0 },  { dx: 1, dy: 0 },
  { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 },
];

export function OverleapNativeMap({ lat, lng, layer, routePoints }: NativeMapProps) {
  const { x, y, offX, offY } = getTileCoords(lat, lng, 15);
  const cX = 180;
  const cY = 128;
  const baseX = cX - offX;
  const baseY = cY - offY;

  const tileBase =
    layer === 'satellite'
      ? 'https://a.tile.openstreetmap.fr/hot/15'
      : 'https://tile.openstreetmap.de/15';

  return (
    <View style={StyleSheet.absoluteFill}>
      {OFFSETS.map(({ dx, dy }) => {
        const tx = x + dx;
        const ty = y + dy;
        return (
          <Image
            key={`${tx}-${ty}`}
            source={{
              uri: `${tileBase}/${tx}/${ty}.png`,
              headers: { 'User-Agent': 'TrackYourMovement/1.0' },
            }}
            style={{
              position: 'absolute',
              left: baseX + dx * 256,
              top: baseY + dy * 256,
              width: 256,
              height: 256,
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        );
      })}

      {layer === 'tactical' && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(9, 13, 22, 0.45)' }]} />
      )}

      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 360 256">
        {routePoints.length >= 2 && (
          <Path
            d={generateSvgPathFromCoordinates(routePoints, 360, 256, 16)}
            stroke="#00b8a2"
            strokeWidth={4.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        <Circle cx={cX} cy={cY} r={7} fill="#00b8a2" stroke="#ffffff" strokeWidth={2.5} />
        <Circle cx={cX} cy={cY} r={16} fill="none" stroke="#00f5d4" strokeWidth={1.5} opacity={0.7} />
      </Svg>
    </View>
  );
}
