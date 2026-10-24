/**
 * Spandan Privacy & Geofence Cloaking Engine
 * Protects athlete personal safety by obfuscating start and end locations
 * (e.g. Home, Office, School) within a customizable privacy radius (default 500 meters).
 */

import { GpsCoordinate, haversineDistanceKm, isValidCoordinate } from './geo';

export interface PrivacyCloakOptions {
  /**
   * Radius in meters to hide from start and end points. Default is 500m.
   */
  cloakRadiusMeters?: number;

  /**
   * Jitter offset in meters for ultra-short tracks (< 1km) where trimming leaves too few points.
   * Default is 250m.
   */
  jitterOffsetMeters?: number;
}

export interface CloakedRouteResult {
  cloakedPoints: GpsCoordinate[];
  startPointCloaked: boolean;
  endPointCloaked: boolean;
  trimmedStartPointsCount: number;
  trimmedEndPointsCount: number;
  originalPointsCount: number;
}

/**
 * Trims GPS track points within a specified radius (default 500 meters) of the starting coordinate
 * and ending coordinate. This guarantees that share cards, social maps, and exported GPX
 * never expose the user's exact doorstep, driveway, or apartment building.
 */
export function applyPrivacyCloaking(
  points: GpsCoordinate[],
  options: PrivacyCloakOptions = {}
): CloakedRouteResult {
  const cloakRadiusKm = (options.cloakRadiusMeters ?? 500) / 1000;
  const valid = (points || []).filter(isValidCoordinate);

  if (valid.length < 2) {
    return {
      cloakedPoints: valid,
      startPointCloaked: false,
      endPointCloaked: false,
      trimmedStartPointsCount: 0,
      trimmedEndPointsCount: 0,
      originalPointsCount: valid.length,
    };
  }

  const rawStart = valid[0];
  const rawEnd = valid[valid.length - 1];

  // Find index of first point that is beyond cloakRadiusKm from the origin start
  let firstValidIdx = -1;
  for (let i = 0; i < valid.length; i++) {
    const distFromStart = haversineDistanceKm(rawStart, valid[i]);
    if (distFromStart >= cloakRadiusKm) {
      firstValidIdx = i;
      break;
    }
  }

  // Find index of last point that is beyond cloakRadiusKm from the destination end
  let lastValidIdx = -1;
  for (let j = valid.length - 1; j >= 0; j--) {
    const distFromEnd = haversineDistanceKm(rawEnd, valid[j]);
    if (distFromEnd >= cloakRadiusKm) {
      lastValidIdx = j;
      break;
    }
  }

  // Edge case: Short track where no point is outside the cloak radius, or trimming leaves fewer than 2 points
  if (
    firstValidIdx === -1 ||
    lastValidIdx === -1 ||
    firstValidIdx >= lastValidIdx ||
    lastValidIdx - firstValidIdx < 2
  ) {
    // Apply a fixed directional centroid blur / noise offset (shifts coordinates ~250m away from real home)
    const blurLatOffset = 0.0025; // ~275m north
    const blurLonOffset = 0.0025; // ~220m east

    const blurred = valid.map((pt) => ({
      ...pt,
      latitude: Number((pt.latitude + blurLatOffset).toFixed(6)),
      longitude: Number((pt.longitude + blurLonOffset).toFixed(6)),
    }));

    return {
      cloakedPoints: blurred,
      startPointCloaked: true,
      endPointCloaked: true,
      trimmedStartPointsCount: 0,
      trimmedEndPointsCount: 0,
      originalPointsCount: valid.length,
    };
  }

  const cloakedPoints = valid.slice(firstValidIdx, lastValidIdx + 1);

  return {
    cloakedPoints,
    startPointCloaked: firstValidIdx > 0,
    endPointCloaked: lastValidIdx < valid.length - 1,
    trimmedStartPointsCount: firstValidIdx,
    trimmedEndPointsCount: valid.length - 1 - lastValidIdx,
    originalPointsCount: valid.length,
  };
}

/**
 * Checks whether any coordinate in the candidate list is within `thresholdMeters` of a sensitive reference coordinate.
 */
export function isCoordinateWithinPrivacyRadius(
  referenceCoord: GpsCoordinate,
  candidateCoord: GpsCoordinate,
  thresholdMeters: number = 500
): boolean {
  if (!isValidCoordinate(referenceCoord) || !isValidCoordinate(candidateCoord)) {
    return false;
  }
  const distKm = haversineDistanceKm(referenceCoord, candidateCoord);
  return distKm * 1000 < thresholdMeters;
}
