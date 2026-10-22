/**
 * Spandan Geospatial & Activity Telemetry Engine
 * Robust distance, pace, speed, and track processing with zero external dependencies.
 */

export interface GpsCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
  timestamp: number; // epoch ms
}

const EARTH_RADIUS_KM = 6371.0088; // WGS84 mean earth radius in km

/**
 * Validates whether a coordinate object has valid physical latitude and longitude numbers.
 */
export function isValidCoordinate(coord: any): coord is GpsCoordinate {
  if (!coord || typeof coord !== 'object') return false;
  const { latitude, longitude } = coord;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}

/**
 * Converts degrees to radians.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculates the great-circle distance between two GPS coordinates using the Haversine formula.
 * Returns distance in kilometers (km).
 */
export function haversineDistanceKm(c1: GpsCoordinate, c2: GpsCoordinate): number {
  if (!isValidCoordinate(c1) || !isValidCoordinate(c2)) {
    return 0;
  }

  // Exact same point
  if (c1.latitude === c2.latitude && c1.longitude === c2.longitude) {
    return 0;
  }

  const dLat = toRadians(c2.latitude - c1.latitude);
  const dLon = toRadians(c2.longitude - c1.longitude);
  const lat1 = toRadians(c1.latitude);
  const lat2 = toRadians(c2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Calculates the total cumulative distance of an ordered GPS track in kilometers.
 * Ignores GPS noise jitter (< 1.5 meters) when accuracy is coarse (> 35 meters).
 */
export function calculateTrackDistanceKm(
  points: GpsCoordinate[],
  options: { minDeltaMeters?: number; maxAcceptableAccuracyM?: number } = {}
): number {
  if (!Array.isArray(points) || points.length < 2) {
    return 0;
  }

  const minDeltaKm = (options.minDeltaMeters ?? 1.5) / 1000;
  const maxAccuracy = options.maxAcceptableAccuracyM ?? 35;

  let totalDistanceKm = 0;
  let prevPoint: GpsCoordinate | null = null;

  for (const point of points) {
    if (!isValidCoordinate(point)) continue;

    // Filter out low-accuracy GPS fixes if accuracy is provided
    if (point.accuracy !== null && point.accuracy !== undefined && point.accuracy > maxAccuracy) {
      continue;
    }

    if (prevPoint) {
      const stepDistanceKm = haversineDistanceKm(prevPoint, point);
      if (stepDistanceKm >= minDeltaKm) {
        totalDistanceKm += stepDistanceKm;
        prevPoint = point;
      }
    } else {
      prevPoint = point;
    }
  }

  return Number(totalDistanceKm.toFixed(3));
}

/**
 * Formats seconds into HH:MM:SS or MM:SS string.
 */
export function formatDuration(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Calculates running or walking pace in "MM:SS /km".
 */
export function calculatePace(distanceKm: number, movingSeconds: number): string {
  if (distanceKm <= 0 || movingSeconds <= 0) {
    return '--:--';
  }

  const secPerKm = movingSeconds / distanceKm;
  // If moving very slowly (> 35 min/km), display capped
  if (secPerKm > 2100) return '--:--';

  const mins = Math.floor(secPerKm / 60);
  const secs = Math.floor(secPerKm % 60);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * Calculates cycling speed in "km/h".
 */
export function calculateSpeed(distanceKm: number, movingSeconds: number): string {
  if (distanceKm <= 0 || movingSeconds <= 0) {
    return '0.0';
  }
  const hours = movingSeconds / 3600;
  return (distanceKm / hours).toFixed(1);
}

/**
 * Calculates moving elapsed time excluding paused duration periods.
 */
export function calculateMovingTimeSeconds(
  startTimeMs: number | null,
  nowMs: number,
  pausedDurationMs: number,
  isPaused: boolean,
  pauseStartMs: number | null
): number {
  if (!startTimeMs) return 0;
  let effectiveNow = nowMs;
  let totalPaused = pausedDurationMs;

  if (isPaused && pauseStartMs) {
    totalPaused += Math.max(0, nowMs - pauseStartMs);
  }

  const elapsedMs = Math.max(0, effectiveNow - startTimeMs - totalPaused);
  return Math.floor(elapsedMs / 1000);
}

/**
 * Generates an SVG path string from an array of GPS coordinates normalized to fit within width x height.
 */
export function generateSvgPathFromCoordinates(
  points: GpsCoordinate[],
  width: number = 320,
  height: number = 80,
  padding: number = 10
): string {
  const validPoints = (points || []).filter(isValidCoordinate);
  if (validPoints.length < 2) {
    return `M 10 ${height / 2} Q ${width / 2} 10 ${width - 10} ${height / 2}`;
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  for (const p of validPoints) {
    if (p.latitude < minLat) minLat = p.latitude;
    if (p.latitude > maxLat) maxLat = p.latitude;
    if (p.longitude < minLon) minLon = p.longitude;
    if (p.longitude > maxLon) maxLon = p.longitude;
  }

  const latSpan = Math.max(0.00001, maxLat - minLat);
  const lonSpan = Math.max(0.00001, maxLon - minLon);

  const drawableW = width - padding * 2;
  const drawableH = height - padding * 2;

  const svgCoords = validPoints.map((p) => {
    const x = padding + ((p.longitude - minLon) / lonSpan) * drawableW;
    // Invert Y because latitude goes north (up), SVG Y goes down
    const y = padding + (1 - (p.latitude - minLat) / latSpan) * drawableH;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  return `M ${svgCoords.join(' L ')}`;
}

export interface ElevationStats {
  gainMeters: number;
  lossMeters: number;
  minAltitudeM: number;
  maxAltitudeM: number;
}

/**
 * Calculates elevation gain, loss, and min/max altitudes from GPS track coordinates.
 */
export function calculateElevationStats(points: GpsCoordinate[]): ElevationStats {
  const valid = (points || []).filter(
    (p) => isValidCoordinate(p) && p.altitude !== null && p.altitude !== undefined
  );

  if (valid.length === 0) {
    return { gainMeters: 0, lossMeters: 0, minAltitudeM: 0, maxAltitudeM: 0 };
  }

  let minAlt = valid[0].altitude!;
  let maxAlt = valid[0].altitude!;
  let gain = 0;
  let loss = 0;

  for (let i = 1; i < valid.length; i++) {
    const prev = valid[i - 1].altitude!;
    const curr = valid[i].altitude!;

    if (curr < minAlt) minAlt = curr;
    if (curr > maxAlt) maxAlt = curr;

    const diff = curr - prev;
    if (diff > 0.8 && diff < 80) {
      gain += diff;
    } else if (diff < -0.8 && diff > -80) {
      loss += Math.abs(diff);
    }
  }

  return {
    gainMeters: Math.round(gain),
    lossMeters: Math.round(loss),
    minAltitudeM: Math.round(minAlt),
    maxAltitudeM: Math.round(maxAlt),
  };
}

/**
 * Calculates 1-kilometer splits from GPS coordinates or prorates from overall activity metrics.
 */
export function calculateKilometerSplits(
  points: GpsCoordinate[],
  sportType: 'run' | 'ride' | 'walk' = 'run',
  fallbackDistanceKm: number = 0,
  fallbackDurationSec: number = 0
): Array<{
  splitNumber: number;
  distanceKm: number;
  durationSeconds: number;
  paceFormatted: string;
  speedFormatted?: string;
  elevationDeltaM: number;
}> {
  const valid = (points || []).filter(isValidCoordinate);

  // If we have actual GPS track points with at least 1 km traveled
  if (valid.length >= 2) {
    const splits: Array<{
      splitNumber: number;
      distanceKm: number;
      durationSeconds: number;
      paceFormatted: string;
      speedFormatted?: string;
      elevationDeltaM: number;
    }> = [];

    let currentSplitDist = 0;
    let splitStartTime = valid[0].timestamp;
    let splitStartAlt = valid[0].altitude || 0;
    let splitIndex = 1;

    for (let i = 1; i < valid.length; i++) {
      const stepDist = haversineDistanceKm(valid[i - 1], valid[i]);
      currentSplitDist += stepDist;

      if (currentSplitDist >= 1.0) {
        const splitDurationSec = Math.max(1, Math.round((valid[i].timestamp - splitStartTime) / 1000));
        const elevDelta = Math.round((valid[i].altitude || 0) - splitStartAlt);

        splits.push({
          splitNumber: splitIndex,
          distanceKm: 1.0,
          durationSeconds: splitDurationSec,
          paceFormatted: calculatePace(1.0, splitDurationSec),
          speedFormatted: calculateSpeed(1.0, splitDurationSec),
          elevationDeltaM: elevDelta,
        });

        splitIndex++;
        currentSplitDist = 0;
        splitStartTime = valid[i].timestamp;
        splitStartAlt = valid[i].altitude || 0;
      }
    }

    // Remaining fractional split (e.g. 0.42 km at the end)
    if (currentSplitDist >= 0.05) {
      const lastPoint = valid[valid.length - 1];
      const remainingSec = Math.max(1, Math.round((lastPoint.timestamp - splitStartTime) / 1000));
      const remainingElev = Math.round((lastPoint.altitude || 0) - splitStartAlt);

      splits.push({
        splitNumber: splitIndex,
        distanceKm: Number(currentSplitDist.toFixed(2)),
        durationSeconds: remainingSec,
        paceFormatted: calculatePace(currentSplitDist, remainingSec),
        speedFormatted: calculateSpeed(currentSplitDist, remainingSec),
        elevationDeltaM: remainingElev,
      });
    }

    if (splits.length > 0) {
      return splits;
    }
  }

  // Fallback: Calculate splits from total distance and duration
  if (fallbackDistanceKm > 0 && fallbackDurationSec > 0) {
    const totalKm = fallbackDistanceKm;
    const fullKmCount = Math.floor(totalKm);
    const remainder = Number((totalKm - fullKmCount).toFixed(2));
    const avgSecPerKm = fallbackDurationSec / totalKm;

    const splits: Array<{
      splitNumber: number;
      distanceKm: number;
      durationSeconds: number;
      paceFormatted: string;
      speedFormatted?: string;
      elevationDeltaM: number;
    }> = [];

    for (let k = 1; k <= fullKmCount; k++) {
      const splitSec = Math.round(avgSecPerKm);
      splits.push({
        splitNumber: k,
        distanceKm: 1.0,
        durationSeconds: splitSec,
        paceFormatted: calculatePace(1.0, splitSec),
        speedFormatted: calculateSpeed(1.0, splitSec),
        elevationDeltaM: 0,
      });
    }

    if (remainder >= 0.05) {
      const remSec = Math.round(avgSecPerKm * remainder);
      splits.push({
        splitNumber: fullKmCount + 1,
        distanceKm: remainder,
        durationSeconds: remSec,
        paceFormatted: calculatePace(remainder, remSec),
        speedFormatted: calculateSpeed(remainder, remSec),
        elevationDeltaM: 0,
      });
    }

    return splits;
  }

  return [];
}
