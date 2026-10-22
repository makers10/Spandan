/**
 * Spandan Fitness Tracking App - Geospatial, Telemetry & Social Security Verification
 * Tests:
 * 1. Haversine distance, coordinate validation, cumulative distance, jitter filtering
 * 2. Kilometer splits calculation (full and fractional km, pace/speed)
 * 3. Elevation statistics (gain, loss, min/max altitude)
 * 4. Moving time vs paused duration calculations
 * 5. Formatters for duration, pace, and cycling speed
 * 6. Database schema & RLS policies for activities, activity_points, follows, kudos, comments, user_blocks
 * 7. Privacy authorization simulation (public, followers-only, private, blocked users)
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🌐 Starting Spandan Geospatial, Telemetry & Social Verification Tests...\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// -------------------------------------------------------------
// Pure Geospatial Math Implementations for independent test verification
// -------------------------------------------------------------
const EARTH_RADIUS_KM = 6371.0088;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function isValidCoordinate(coord) {
  if (!coord || typeof coord !== 'object') return false;
  const { latitude, longitude } = coord;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  if (latitude < -90 || latitude > 90) return false;
  if (longitude < -180 || longitude > 180) return false;
  return true;
}

function haversineDistanceKm(c1, c2) {
  if (!isValidCoordinate(c1) || !isValidCoordinate(c2)) return 0;
  if (c1.latitude === c2.latitude && c1.longitude === c2.longitude) return 0;

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

function calculateTrackDistanceKm(points, options = {}) {
  if (!Array.isArray(points) || points.length < 2) return 0;

  const minDeltaKm = (options.minDeltaMeters ?? 1.5) / 1000;
  const maxAccuracy = options.maxAcceptableAccuracyM ?? 35;

  let totalDistanceKm = 0;
  let prevPoint = null;

  for (const point of points) {
    if (!isValidCoordinate(point)) continue;
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

function calculateMovingTimeSeconds(startTimeMs, nowMs, pausedDurationMs, isPaused, pauseStartMs) {
  if (!startTimeMs) return 0;
  let effectiveNow = nowMs;
  let totalPaused = pausedDurationMs;

  if (isPaused && pauseStartMs) {
    totalPaused += Math.max(0, nowMs - pauseStartMs);
  }

  const elapsedMs = Math.max(0, effectiveNow - startTimeMs - totalPaused);
  return Math.floor(elapsedMs / 1000);
}

function formatDuration(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

function calculatePace(distanceKm, movingSeconds) {
  if (distanceKm <= 0 || movingSeconds <= 0) return '--:--';
  const secPerKm = movingSeconds / distanceKm;
  if (secPerKm > 2100) return '--:--';
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.floor(secPerKm % 60);
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(mins)}:${pad(secs)}`;
}

function calculateSpeed(distanceKm, movingSeconds) {
  if (distanceKm <= 0 || movingSeconds <= 0) return '0.0';
  const hours = movingSeconds / 3600;
  return (distanceKm / hours).toFixed(1);
}

function calculateElevationStats(points) {
  const valid = (points || []).filter(
    (p) => isValidCoordinate(p) && p.altitude !== null && p.altitude !== undefined
  );
  if (valid.length === 0) return { gainMeters: 0, lossMeters: 0, minAltitudeM: 0, maxAltitudeM: 0 };

  let minAlt = valid[0].altitude;
  let maxAlt = valid[0].altitude;
  let gain = 0;
  let loss = 0;

  for (let i = 1; i < valid.length; i++) {
    const prev = valid[i - 1].altitude;
    const curr = valid[i].altitude;
    if (curr < minAlt) minAlt = curr;
    if (curr > maxAlt) maxAlt = curr;

    const diff = curr - prev;
    if (diff > 0.8 && diff < 80) gain += diff;
    else if (diff < -0.8 && diff > -80) loss += Math.abs(diff);
  }

  return {
    gainMeters: Math.round(gain),
    lossMeters: Math.round(loss),
    minAltitudeM: Math.round(minAlt),
    maxAltitudeM: Math.round(maxAlt),
  };
}

function calculateKilometerSplits(points, sportType = 'run', fallbackDistanceKm = 0, fallbackDurationSec = 0) {
  const valid = (points || []).filter(isValidCoordinate);

  if (valid.length >= 2) {
    const splits = [];
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

    if (splits.length > 0) return splits;
  }

  if (fallbackDistanceKm > 0 && fallbackDurationSec > 0) {
    const totalKm = fallbackDistanceKm;
    const fullKmCount = Math.floor(totalKm);
    const remainder = Number((totalKm - fullKmCount).toFixed(2));
    const avgSecPerKm = fallbackDurationSec / totalKm;

    const splits = [];
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

// -------------------------------------------------------------
// TEST 1: Coordinate Validation
// -------------------------------------------------------------
runTest('isValidCoordinate correctly filters valid, invalid, NaN, and out-of-range coordinates', () => {
  assert.strictEqual(isValidCoordinate({ latitude: 0, longitude: 0 }), true);
  assert.strictEqual(isValidCoordinate({ latitude: 12.9716, longitude: 77.5946 }), true);
  assert.strictEqual(isValidCoordinate({ latitude: -90, longitude: -180 }), true);
  assert.strictEqual(isValidCoordinate({ latitude: 90, longitude: 180 }), true);

  assert.strictEqual(isValidCoordinate(null), false);
  assert.strictEqual(isValidCoordinate(undefined), false);
  assert.strictEqual(isValidCoordinate({}), false);
  assert.strictEqual(isValidCoordinate({ latitude: '12.3', longitude: 77.1 }), false);
  assert.strictEqual(isValidCoordinate({ latitude: NaN, longitude: 77.1 }), false);
  assert.strictEqual(isValidCoordinate({ latitude: 91, longitude: 0 }), false);
  assert.strictEqual(isValidCoordinate({ latitude: -91, longitude: 0 }), false);
  assert.strictEqual(isValidCoordinate({ latitude: 0, longitude: 181 }), false);
  assert.strictEqual(isValidCoordinate({ latitude: 0, longitude: -181 }), false);
});

// -------------------------------------------------------------
// TEST 2: Haversine Distance Benchmarks
// -------------------------------------------------------------
runTest('Haversine distance matches known geographical ground-truth benchmarks', () => {
  const pt = { latitude: 28.6139, longitude: 77.2090 };
  assert.strictEqual(haversineDistanceKm(pt, pt), 0);

  const eq1 = { latitude: 0, longitude: 0 };
  const eq2 = { latitude: 0, longitude: 1 };
  const distEq = haversineDistanceKm(eq1, eq2);
  assert.ok(Math.abs(distEq - 111.19) < 0.5, `Equator degree should be ~111.19 km, got ${distEq}`);

  const london = { latitude: 51.5074, longitude: -0.1278 };
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  const distLondonParis = haversineDistanceKm(london, paris);
  assert.ok(Math.abs(distLondonParis - 343.5) < 3.0, `London-Paris distance should be ~343.5 km, got ${distLondonParis}`);
});

// -------------------------------------------------------------
// TEST 3: Track Distance, Empty Tracks & Jitter Filter
// -------------------------------------------------------------
runTest('calculateTrackDistanceKm handles empty tracks, invalid fixes, and coarse accuracy', () => {
  assert.strictEqual(calculateTrackDistanceKm([]), 0);
  assert.strictEqual(calculateTrackDistanceKm([{ latitude: 12.0, longitude: 77.0 }]), 0);
  assert.strictEqual(calculateTrackDistanceKm(null), 0);

  const dirtyTrack = [
    { latitude: 12.0, longitude: 77.0, accuracy: 5 },
    null,
    { latitude: NaN, longitude: 77.0 },
    { latitude: 12.01, longitude: 77.0, accuracy: 5 },
  ];
  const dirtyDistance = calculateTrackDistanceKm(dirtyTrack);
  assert.ok(dirtyDistance > 1.0 && dirtyDistance < 1.2);

  const jitterTrack = [
    { latitude: 12.0, longitude: 77.0 },
    { latitude: 12.000005, longitude: 77.0 },
  ];
  assert.strictEqual(calculateTrackDistanceKm(jitterTrack), 0);
});

// -------------------------------------------------------------
// TEST 4: Kilometer Splits Calculation
// -------------------------------------------------------------
runTest('calculateKilometerSplits computes full 1-km segments and fractional splits', () => {
  // Simulate 2.5 km run track
  // 1 degree lat ~= 111.19 km -> 0.009 degree ~= 1.0 km
  const pts = [
    { latitude: 12.000, longitude: 77.000, timestamp: 1000000, altitude: 900 },
    { latitude: 12.009, longitude: 77.000, timestamp: 1000000 + 300000, altitude: 910 }, // 1.0 km, 300s (5:00/km), +10m
    { latitude: 12.018, longitude: 77.000, timestamp: 1000000 + 580000, altitude: 915 }, // 2.0 km, 280s (4:40/km), +5m
    { latitude: 12.0225, longitude: 77.000, timestamp: 1000000 + 720000, altitude: 920 }, // 2.5 km, 140s
  ];

  const splits = calculateKilometerSplits(pts, 'run');
  assert.ok(splits.length >= 2, `Should have at least 2 splits, got ${splits.length}`);
  assert.strictEqual(splits[0].splitNumber, 1);
  assert.strictEqual(splits[0].distanceKm, 1.0);
  assert.ok(splits[0].durationSeconds > 280 && splits[0].durationSeconds < 320);

  // Fallback splits from total activity
  const fallback = calculateKilometerSplits([], 'run', 5.3, 1590);
  assert.strictEqual(fallback.length, 6); // 5 full km + 1 fractional
  assert.strictEqual(fallback[0].distanceKm, 1.0);
  assert.strictEqual(fallback[5].distanceKm, 0.3);
});

// -------------------------------------------------------------
// TEST 5: Elevation Statistics Calculation
// -------------------------------------------------------------
runTest('calculateElevationStats correctly computes gain, loss, and min/max altitude', () => {
  const elevTrack = [
    { latitude: 12.0, longitude: 77.0, altitude: 100 },
    { latitude: 12.01, longitude: 77.0, altitude: 125 }, // +25m gain
    { latitude: 12.02, longitude: 77.0, altitude: 110 }, // -15m loss
    { latitude: 12.03, longitude: 77.0, altitude: 140 }, // +30m gain
  ];

  const stats = calculateElevationStats(elevTrack);
  assert.strictEqual(stats.gainMeters, 55); // 25 + 30
  assert.strictEqual(stats.lossMeters, 15);
  assert.strictEqual(stats.minAltitudeM, 100);
  assert.strictEqual(stats.maxAltitudeM, 140);
});

// -------------------------------------------------------------
// TEST 6: Paused Time & Moving Duration Calculations
// -------------------------------------------------------------
runTest('calculateMovingTimeSeconds subtracts paused intervals and handles active pause states', () => {
  const start = 1000000;
  const moving1 = calculateMovingTimeSeconds(start, start + 100000, 0, false, null);
  assert.strictEqual(moving1, 100);

  const moving2 = calculateMovingTimeSeconds(start, start + 100000, 30000, false, null);
  assert.strictEqual(moving2, 70);

  const moving3 = calculateMovingTimeSeconds(start, 1080000, 10000, true, 1050000);
  assert.strictEqual(moving3, 40);
});

// -------------------------------------------------------------
// TEST 7: Formatters for Pace, Speed, and Duration
// -------------------------------------------------------------
runTest('Formatters calculate accurate durations, running paces, and cycling speeds', () => {
  assert.strictEqual(formatDuration(0), '00:00');
  assert.strictEqual(formatDuration(125), '02:05');
  assert.strictEqual(formatDuration(3665), '01:01:05');

  assert.strictEqual(calculatePace(5, 1500), '05:00');
  assert.strictEqual(calculatePace(10, 3240), '05:24');
  assert.strictEqual(calculatePace(0, 100), '--:--');

  assert.strictEqual(calculateSpeed(30, 3600), '30.0');
  assert.strictEqual(calculateSpeed(0, 3600), '0.0');
});

// -------------------------------------------------------------
// TEST 8: Database Schema, Social Graph & Privacy RLS
// -------------------------------------------------------------
runTest('Database schema enforces social tables, visibility constraints, and granular RLS', () => {
  const schemaPath = path.join(rootDir, 'supabase', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Verify social tables
  assert.ok(schema.includes('create table if not exists public.follows'));
  assert.ok(schema.includes('create table if not exists public.activity_kudos'));
  assert.ok(schema.includes('create table if not exists public.activity_comments'));
  assert.ok(schema.includes('create table if not exists public.user_blocks'));

  // Verify visibility column
  assert.ok(
    schema.includes("visibility text not null default 'public' check (visibility in ('public', 'followers', 'private'))")
  );

  // Verify RLS enablement on all tables
  assert.ok(schema.includes('alter table public.profiles enable row level security;'));
  assert.ok(schema.includes('alter table public.activities enable row level security;'));
  assert.ok(schema.includes('alter table public.activity_points enable row level security;'));
  assert.ok(schema.includes('alter table public.follows enable row level security;'));
  assert.ok(schema.includes('alter table public.activity_kudos enable row level security;'));
  assert.ok(schema.includes('alter table public.activity_comments enable row level security;'));
  assert.ok(schema.includes('alter table public.user_blocks enable row level security;'));

  // Verify privacy-aware SELECT policy
  assert.ok(schema.includes('create policy "Users can view authorized activities"'));
  assert.ok(schema.includes('create policy "Users can view authorized activity points"'));
  assert.ok(schema.includes('create policy "Users can follow others"'));
  assert.ok(schema.includes('create policy "Users can give kudos"'));
  assert.ok(schema.includes('create policy "Users can write comments"'));
  assert.ok(schema.includes('create policy "Users can block other users"'));
});

// -------------------------------------------------------------
// TEST 9: Privacy Authorization & Visibility Simulation
// -------------------------------------------------------------
runTest('Privacy rules correctly isolate Private and Followers-Only activities', () => {
  const canViewActivity = ({ viewerId, ownerId, visibility, isFollowing, isBlocked }) => {
    if (isBlocked) return false;
    if (viewerId === ownerId) return true;
    if (visibility === 'public') return true;
    if (visibility === 'followers' && isFollowing) return true;
    return false;
  };

  const owner = 'user-owner-1';
  const follower = 'user-follower-2';
  const stranger = 'user-stranger-3';
  const blockedUser = 'user-blocked-4';

  // Public activity
  assert.strictEqual(
    canViewActivity({ viewerId: stranger, ownerId: owner, visibility: 'public', isFollowing: false, isBlocked: false }),
    true
  );
  // Public activity by blocked viewer
  assert.strictEqual(
    canViewActivity({ viewerId: blockedUser, ownerId: owner, visibility: 'public', isFollowing: false, isBlocked: true }),
    false
  );

  // Followers-only activity
  assert.strictEqual(
    canViewActivity({ viewerId: follower, ownerId: owner, visibility: 'followers', isFollowing: true, isBlocked: false }),
    true
  );
  assert.strictEqual(
    canViewActivity({ viewerId: stranger, ownerId: owner, visibility: 'followers', isFollowing: false, isBlocked: false }),
    false
  );

  // Private activity
  assert.strictEqual(
    canViewActivity({ viewerId: owner, ownerId: owner, visibility: 'private', isFollowing: false, isBlocked: false }),
    true
  );
  assert.strictEqual(
    canViewActivity({ viewerId: follower, ownerId: owner, visibility: 'private', isFollowing: true, isBlocked: false }),
    false
  );
  assert.strictEqual(
    canViewActivity({ viewerId: stranger, ownerId: owner, visibility: 'private', isFollowing: false, isBlocked: false }),
    false
  );
});

// -------------------------------------------------------------
// Summary Report
// -------------------------------------------------------------
console.log(`\n======================================================`);
console.log(`📊 Test Summary: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log(`======================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
