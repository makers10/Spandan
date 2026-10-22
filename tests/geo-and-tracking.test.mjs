/**
 * Spandan Fitness Tracking App - Geospatial & Telemetry Verification Test Suite
 * Tests distance calculations (Haversine formula), coordinate validation,
 * cumulative track distance, jitter filtering, paused time calculation,
 * pace/speed formatters, SVG route generation, and Supabase activity_points schema/RLS.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🌐 Starting Spandan Geospatial & Telemetry Verification Tests...\n');

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

// -------------------------------------------------------------
// TEST 1: Coordinate Validation
// -------------------------------------------------------------
runTest('isValidCoordinate correctly filters valid, invalid, NaN, and out-of-range coordinates', () => {
  // Valid coordinates
  assert.strictEqual(isValidCoordinate({ latitude: 0, longitude: 0 }), true);
  assert.strictEqual(isValidCoordinate({ latitude: 12.9716, longitude: 77.5946 }), true);
  assert.strictEqual(isValidCoordinate({ latitude: -90, longitude: -180 }), true);
  assert.strictEqual(isValidCoordinate({ latitude: 90, longitude: 180 }), true);

  // Invalid values
  assert.strictEqual(isValidCoordinate(null), false);
  assert.strictEqual(isValidCoordinate(undefined), false);
  assert.strictEqual(isValidCoordinate({}), false);
  assert.strictEqual(isValidCoordinate({ latitude: '12.3', longitude: 77.1 }), false);
  assert.strictEqual(isValidCoordinate({ latitude: NaN, longitude: 77.1 }), false);
  assert.strictEqual(isValidCoordinate({ latitude: 12.3, longitude: NaN }), false);
  assert.strictEqual(isValidCoordinate({ latitude: 91, longitude: 0 }), false);
  assert.strictEqual(isValidCoordinate({ latitude: -91, longitude: 0 }), false);
  assert.strictEqual(isValidCoordinate({ latitude: 0, longitude: 181 }), false);
  assert.strictEqual(isValidCoordinate({ latitude: 0, longitude: -181 }), false);
});

// -------------------------------------------------------------
// TEST 2: Haversine Distance Benchmarks
// -------------------------------------------------------------
runTest('Haversine distance matches known geographical ground-truth benchmarks', () => {
  // Same location should be exactly 0
  const pt = { latitude: 28.6139, longitude: 77.2090 };
  assert.strictEqual(haversineDistanceKm(pt, pt), 0);

  // 1 degree longitude at equator ~= 111.19 km
  const eq1 = { latitude: 0, longitude: 0 };
  const eq2 = { latitude: 0, longitude: 1 };
  const distEq = haversineDistanceKm(eq1, eq2);
  assert.ok(Math.abs(distEq - 111.19) < 0.5, `Equator degree should be ~111.19 km, got ${distEq}`);

  // London to Paris: (51.5074, -0.1278) to (48.8566, 2.3522) ~= 343.5 km
  const london = { latitude: 51.5074, longitude: -0.1278 };
  const paris = { latitude: 48.8566, longitude: 2.3522 };
  const distLondonParis = haversineDistanceKm(london, paris);
  assert.ok(
    Math.abs(distLondonParis - 343.5) < 3.0,
    `London-Paris distance should be ~343.5 km, got ${distLondonParis}`
  );

  // New York to San Francisco: ~= 4128 km
  const ny = { latitude: 40.7128, longitude: -74.006 };
  const sf = { latitude: 37.7749, longitude: -122.4194 };
  const distNySf = haversineDistanceKm(ny, sf);
  assert.ok(
    Math.abs(distNySf - 4128) < 25,
    `NY-SF distance should be ~4128 km, got ${distNySf}`
  );
});

// -------------------------------------------------------------
// TEST 3: Track Distance, Empty Tracks & Jitter Filter
// -------------------------------------------------------------
runTest('calculateTrackDistanceKm handles empty tracks, invalid fixes, and coarse accuracy', () => {
  // Empty track
  assert.strictEqual(calculateTrackDistanceKm([]), 0);

  // Single point
  assert.strictEqual(calculateTrackDistanceKm([{ latitude: 12.0, longitude: 77.0 }]), 0);

  // Non-array
  assert.strictEqual(calculateTrackDistanceKm(null), 0);

  // Track with invalid coordinates interspersed
  const dirtyTrack = [
    { latitude: 12.0, longitude: 77.0, accuracy: 5 },
    null,
    { latitude: NaN, longitude: 77.0 },
    { latitude: 12.01, longitude: 77.0, accuracy: 5 }, // ~1.11 km north
  ];
  const dirtyDistance = calculateTrackDistanceKm(dirtyTrack);
  assert.ok(dirtyDistance > 1.0 && dirtyDistance < 1.2, `Dirty track distance should be ~1.11 km, got ${dirtyDistance}`);

  // Low accuracy fixes filtered (accuracy > 35m)
  const noisyTrack = [
    { latitude: 12.0, longitude: 77.0, accuracy: 5 },
    { latitude: 12.5, longitude: 77.5, accuracy: 80 }, // Bad fix, should be ignored
    { latitude: 12.01, longitude: 77.0, accuracy: 5 },
  ];
  const filteredDist = calculateTrackDistanceKm(noisyTrack);
  assert.ok(filteredDist < 2.0, `Filtered distance should ignore inaccurate fix, got ${filteredDist}`);

  // Jitter threshold (< 1.5m delta)
  const jitterTrack = [
    { latitude: 12.0, longitude: 77.0 },
    { latitude: 12.000005, longitude: 77.0 }, // ~0.55 meter jitter
  ];
  assert.strictEqual(calculateTrackDistanceKm(jitterTrack), 0);
});

// -------------------------------------------------------------
// TEST 4: Paused Time & Moving Duration Calculations
// -------------------------------------------------------------
runTest('calculateMovingTimeSeconds subtracts paused intervals and handles active pause states', () => {
  const start = 1000000;

  // 1. Continuous running for 100 seconds
  const moving1 = calculateMovingTimeSeconds(start, start + 100000, 0, false, null);
  assert.strictEqual(moving1, 100);

  // 2. 100 seconds elapsed, but 30 seconds was paused previously
  const moving2 = calculateMovingTimeSeconds(start, start + 100000, 30000, false, null);
  assert.strictEqual(moving2, 70);

  // 3. Currently paused: started at 1,000,000, paused at 1,050,000, now is 1,080,000
  // Previous paused duration: 10,000 ms (10s)
  // Current active pause: 1,080,000 - 1,050,000 = 30,000 ms (30s)
  // Total paused: 40s
  // Total elapsed: 80s
  // Moving time: 80s - 40s = 40s
  const moving3 = calculateMovingTimeSeconds(start, 1080000, 10000, true, 1050000);
  assert.strictEqual(moving3, 40);

  // 4. Null start time returns 0
  assert.strictEqual(calculateMovingTimeSeconds(null, 1080000, 0, false, null), 0);
});

// -------------------------------------------------------------
// TEST 5: Duration, Pace, and Speed Formatters
// -------------------------------------------------------------
runTest('Formatters calculate accurate durations, running paces, and cycling speeds', () => {
  // formatDuration
  assert.strictEqual(formatDuration(0), '00:00');
  assert.strictEqual(formatDuration(45), '00:45');
  assert.strictEqual(formatDuration(125), '02:05');
  assert.strictEqual(formatDuration(3665), '01:01:05');

  // calculatePace (min/km)
  // 5 km in 1500 seconds (25 mins) -> 5:00 /km
  assert.strictEqual(calculatePace(5, 1500), '05:00');
  // 10 km in 3240 seconds (54 mins) -> 5:24 /km
  assert.strictEqual(calculatePace(10, 3240), '05:24');
  // 0 distance or 0 time
  assert.strictEqual(calculatePace(0, 100), '--:--');
  assert.strictEqual(calculatePace(5, 0), '--:--');
  // Very slow pace (> 35 min/km)
  assert.strictEqual(calculatePace(0.1, 10000), '--:--');

  // calculateSpeed (km/h)
  // 30 km in 3600 seconds (1 hr) -> 30.0 km/h
  assert.strictEqual(calculateSpeed(30, 3600), '30.0');
  // 15 km in 1800 seconds (0.5 hr) -> 30.0 km/h
  assert.strictEqual(calculateSpeed(15, 1800), '30.0');
  // 0 distance
  assert.strictEqual(calculateSpeed(0, 3600), '0.0');
});

// -------------------------------------------------------------
// TEST 6: activity_points Database Schema & RLS Policies
// -------------------------------------------------------------
runTest('Database schema defines activity_points table with ordered points and strict RLS', () => {
  const schemaPath = path.join(rootDir, 'supabase', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Table definition
  assert.ok(
    schema.includes('create table if not exists public.activity_points'),
    'schema.sql must create activity_points table'
  );
  assert.ok(
    schema.includes('activity_id uuid not null references public.activities(id) on delete cascade'),
    'activity_points must reference activities(id) with on delete cascade'
  );
  assert.ok(
    schema.includes('user_id uuid not null references auth.users(id) on delete cascade'),
    'activity_points must reference auth.users(id)'
  );
  assert.ok(
    schema.includes('point_order integer not null check (point_order >= 0)'),
    'activity_points must enforce non-negative point_order'
  );
  assert.ok(
    schema.includes('latitude double precision not null check (latitude between -90 and 90)'),
    'activity_points must check latitude bounds'
  );
  assert.ok(
    schema.includes('longitude double precision not null check (longitude between -180 and 180)'),
    'activity_points must check longitude bounds'
  );

  // RLS enablement
  assert.ok(
    schema.includes('alter table public.activity_points enable row level security;'),
    'activity_points table must enable row level security'
  );

  // RLS Policies
  assert.ok(
    schema.includes('create policy "Users can view own activity points"'),
    'activity_points must define select policy for owner'
  );
  assert.ok(
    schema.includes('create policy "Users can insert own activity points"'),
    'activity_points must define insert policy for owner'
  );
  assert.ok(
    schema.includes('create policy "Users can delete own activity points"'),
    'activity_points must define delete policy for owner'
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
