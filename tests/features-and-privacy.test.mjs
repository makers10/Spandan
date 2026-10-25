/**
 * Spandan Fitness Tracking App - Features, Edge Cases & Privacy Security Test Suite
 *
 * Test Suites:
 * Phase 1.1: Math & Edge Cases (Last partial km split, 0 distance, GPS jitter, auto-pause moving time)
 * Phase 1.2: Streaks Logic (11:59 PM vs 12:01 AM, Timezones, Multiple workouts in single day, Broken streaks)
 * Phase 1.3: Row Level Security (RLS) & Privacy (Private & Followers activities isolation, Challenges, Blocks)
 * Phase 1.4: Privacy Cloaking (500m start/end point masking for share cards)
 */

import assert from 'node:assert';


console.log('🚀 Starting Spandan Phase 1 Automated Test Suite: Edge Cases, Streaks, RLS & Cloaking...\n');

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
    if (err.stack) {
      console.error(err.stack.split('\n').slice(1, 3).join('\n'));
    }
  }
}

// ====================================================================
// Pure Reference Implementations for Testing
// ====================================================================

const EARTH_RADIUS_KM = 6371.0088;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
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

function calculateKilometerSplits(points, sportType = 'run', fallbackDistanceKm = 0, fallbackDurationSec = 0) {
  const valid = (points || []).filter(isValidCoordinate);

  if (valid.length >= 2) {
    const splits = [];
    let currentSplitDist = 0;
    let splitStartTime = valid[0].timestamp;
    let splitIndex = 1;

    for (let i = 1; i < valid.length; i++) {
      const stepDist = haversineDistanceKm(valid[i - 1], valid[i]);
      currentSplitDist += stepDist;

      if (currentSplitDist >= 1.0) {
        const splitDurationSec = Math.max(1, Math.round((valid[i].timestamp - splitStartTime) / 1000));
        splits.push({
          splitNumber: splitIndex,
          distanceKm: 1.0,
          durationSeconds: splitDurationSec,
        });
        splitIndex++;
        currentSplitDist = 0;
        splitStartTime = valid[i].timestamp;
      }
    }

    // Remaining fractional split (e.g. 0.35 km at the end of 5.35 km)
    if (currentSplitDist >= 0.05) {
      const lastPoint = valid[valid.length - 1];
      const remainingSec = Math.max(1, Math.round((lastPoint.timestamp - splitStartTime) / 1000));
      splits.push({
        splitNumber: splitIndex,
        distanceKm: Number(currentSplitDist.toFixed(2)),
        durationSeconds: remainingSec,
      });
    }
    if (splits.length > 0) return splits;
  }

  // Fallback calculation
  if (fallbackDistanceKm > 0 && fallbackDurationSec > 0) {
    const fullKmCount = Math.floor(fallbackDistanceKm);
    const remainder = Number((fallbackDistanceKm - fullKmCount).toFixed(2));
    const avgSecPerKm = fallbackDurationSec / fallbackDistanceKm;
    const splits = [];

    for (let k = 1; k <= fullKmCount; k++) {
      splits.push({
        splitNumber: k,
        distanceKm: 1.0,
        durationSeconds: Math.round(avgSecPerKm),
      });
    }
    if (remainder >= 0.05) {
      splits.push({
        splitNumber: fullKmCount + 1,
        distanceKm: remainder,
        durationSeconds: Math.round(avgSecPerKm * remainder),
      });
    }
    return splits;
  }

  return [];
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

function getLocalDateString(timestamp, timeZone = 'UTC') {
  const date = typeof timestamp === 'number' || typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) return '';
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

function calculateDailyStreak(workouts, options = {}) {
  const timeZone = options.timeZone || 'UTC';
  const refDate = options.referenceDate ? new Date(options.referenceDate) : new Date();
  const todayStr = getLocalDateString(refDate, timeZone);

  const yesterdayDate = new Date(refDate.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = getLocalDateString(yesterdayDate, timeZone);

  if (!Array.isArray(workouts) || workouts.length === 0) {
    return { currentStreakDays: 0, longestStreakDays: 0, isActiveToday: false, totalActiveDays: 0 };
  }

  const activeDaysSet = new Set();
  for (const w of workouts) {
    const dStr = getLocalDateString(w.timestamp, timeZone);
    if (dStr) activeDaysSet.add(dStr);
  }

  const sortedDays = Array.from(activeDaysSet).sort((a, b) => b.localeCompare(a));
  if (sortedDays.length === 0) {
    return { currentStreakDays: 0, longestStreakDays: 0, isActiveToday: false, totalActiveDays: 0 };
  }

  const isActiveToday = activeDaysSet.has(todayStr);
  const isActiveYesterday = activeDaysSet.has(yesterdayStr);
  const isStreakAlive = isActiveToday || isActiveYesterday;

  let currentStreak = 0;
  if (isStreakAlive) {
    let expectedDate = isActiveToday ? new Date(refDate) : yesterdayDate;
    while (true) {
      const expStr = getLocalDateString(expectedDate, timeZone);
      if (activeDaysSet.has(expStr)) {
        currentStreak++;
        expectedDate = new Date(expectedDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  // Longest streak
  const ascDays = Array.from(activeDaysSet).sort((a, b) => a.localeCompare(b));
  let longestStreak = 0;
  let tempStreak = 0;
  let prevTime = null;

  for (const dStr of ascDays) {
    const [y, m, d] = dStr.split('-').map(Number);
    const currTime = Date.UTC(y, m - 1, d);
    if (prevTime === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((currTime - prevTime) / (24 * 60 * 60 * 1000));
      if (diffDays === 1) tempStreak++;
      else tempStreak = 1;
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    prevTime = currTime;
  }

  return {
    currentStreakDays: currentStreak,
    longestStreakDays: Math.max(longestStreak, currentStreak),
    isActiveToday,
    totalActiveDays: sortedDays.length,
  };
}

function applyPrivacyCloaking(points, options = {}) {
  const cloakRadiusKm = (options.cloakRadiusMeters ?? 500) / 1000;
  const valid = (points || []).filter(isValidCoordinate);

  if (valid.length < 2) {
    return { cloakedPoints: valid, startPointCloaked: false, endPointCloaked: false };
  }

  const rawStart = valid[0];
  const rawEnd = valid[valid.length - 1];

  let firstValidIdx = -1;
  for (let i = 0; i < valid.length; i++) {
    const dist = haversineDistanceKm(rawStart, valid[i]);
    if (dist >= cloakRadiusKm) {
      firstValidIdx = i;
      break;
    }
  }

  let lastValidIdx = -1;
  for (let j = valid.length - 1; j >= 0; j--) {
    const dist = haversineDistanceKm(rawEnd, valid[j]);
    if (dist >= cloakRadiusKm) {
      lastValidIdx = j;
      break;
    }
  }

  if (
    firstValidIdx === -1 ||
    lastValidIdx === -1 ||
    firstValidIdx >= lastValidIdx ||
    lastValidIdx - firstValidIdx < 2
  ) {
    // Offset blur for ultra-short loops
    const blurred = valid.map((pt) => ({
      ...pt,
      latitude: Number((pt.latitude + 0.003).toFixed(6)),
      longitude: Number((pt.longitude + 0.003).toFixed(6)),
    }));
    return { cloakedPoints: blurred, startPointCloaked: true, endPointCloaked: true };
  }

  const cloakedPoints = valid.slice(firstValidIdx, lastValidIdx + 1);
  return {
    cloakedPoints,
    startPointCloaked: firstValidIdx > 0,
    endPointCloaked: lastValidIdx < valid.length - 1,
    trimmedStartPoints: firstValidIdx,
    trimmedEndPoints: valid.length - 1 - lastValidIdx,
  };
}

// ====================================================================
// TEST SUITE 1: Math & Edge Cases
// ====================================================================

runTest('Splits: Correctly calculates full km segments and last partial kilometer split', () => {
  // Test 1: Fallback prorated 5.35 km workout
  const splits = calculateKilometerSplits([], 'run', 5.35, 1605); // 5.35 km in 26:45 (300 sec/km)
  assert.strictEqual(splits.length, 6, '5.35 km workout must produce 6 splits (5 full + 1 partial)');

  // Verify full splits (1-5)
  for (let i = 0; i < 5; i++) {
    assert.strictEqual(splits[i].splitNumber, i + 1);
    assert.strictEqual(splits[i].distanceKm, 1.0);
    assert.strictEqual(splits[i].durationSeconds, 300);
  }

  // Verify last partial split (split 6)
  const lastSplit = splits[5];
  assert.strictEqual(lastSplit.splitNumber, 6);
  assert.strictEqual(lastSplit.distanceKm, 0.35, 'Last split distance must exactly be 0.35 km');
  assert.strictEqual(lastSplit.durationSeconds, Math.round(300 * 0.35)); // ~105 sec

  // Test 2: Sub-threshold remainder (< 0.05 km, e.g. 5.02 km) should not generate an insignificant noise split
  const noNoiseSplit = calculateKilometerSplits([], 'run', 5.02, 1500);
  assert.strictEqual(noNoiseSplit.length, 5, 'Remainder < 50 meters should not create an extra split');
});

runTest('Edge Case: Zero distance workouts handle math safely without NaN or crashes', () => {
  const zeroSplits = calculateKilometerSplits([], 'run', 0, 0);
  assert.deepStrictEqual(zeroSplits, [], '0 distance should return empty splits array');

  const zeroTrackDist = calculateTrackDistanceKm([]);
  assert.strictEqual(zeroTrackDist, 0, 'Empty track coordinates should yield 0 distance');

  const zeroMovingTime = calculateMovingTimeSeconds(null, Date.now(), 0, false, null);
  assert.strictEqual(zeroMovingTime, 0, 'Null start time should yield 0 moving time');
});

runTest('GPS Jitter & Noise Filter: Discards stationary jitter (< 1.5m) and coarse accuracy (> 35m)', () => {
  // Generate points where athlete is sitting in their living room:
  // Points have tiny GPS drift (< 1m) or very poor accuracy (> 45m)
  const baseLat = 19.0760;
  const baseLng = 72.8777;
  const now = Date.now();

  const jitterPoints = [
    { latitude: baseLat, longitude: baseLng, accuracy: 5, timestamp: now },
    // Tiny jitter 0.4 meters away
    { latitude: baseLat + 0.000003, longitude: baseLng + 0.000003, accuracy: 8, timestamp: now + 1000 },
    // Another tiny jitter 0.2 meters away
    { latitude: baseLat - 0.000002, longitude: baseLng + 0.000001, accuracy: 12, timestamp: now + 2000 },
    // Bad accuracy fix (e.g. 65 meters accuracy from cell tower)
    { latitude: baseLat + 0.001, longitude: baseLng + 0.001, accuracy: 65, timestamp: now + 3000 },
    // Real purposeful step (> 2.5 meters away with high accuracy 6m)
    { latitude: baseLat + 0.00003, longitude: baseLng + 0.00003, accuracy: 6, timestamp: now + 4000 },
  ];

  const filteredDistance = calculateTrackDistanceKm(jitterPoints, {
    minDeltaMeters: 1.5,
    maxAcceptableAccuracyM: 35,
  });

  // Only the purposeful step should be counted, not the coarse 65m jump or tiny sub-meter drifts
  assert.ok(filteredDistance < 0.01, `Filtered distance should be minimal and unaffected by 65m jump (was ${filteredDistance} km)`);
});

runTest('Auto-Pause & Moving Time: Correctly tracks moving time across active and resumed pauses', () => {
  const start = 1000000;

  // Case 1: 60s active run, no pause
  const t1 = calculateMovingTimeSeconds(start, start + 60000, 0, false, null);
  assert.strictEqual(t1, 60, '60s active run should equal 60 moving seconds');

  // Case 2: 120s total elapsed, with 30s completed pause in the past
  const t2 = calculateMovingTimeSeconds(start, start + 120000, 30000, false, null);
  assert.strictEqual(t2, 90, '120s elapsed - 30s pause = 90 moving seconds');

  // Case 3: Currently in an ACTIVE pause (paused 20s ago, previously had 10s pause)
  // Total elapsed 100s. PausedDurationMs = 10000. Pause started at start + 80000. Now is start + 100000.
  // Active pause duration = 20s. Total pause = 30s. Moving time = 100 - 30 = 70s.
  const t3 = calculateMovingTimeSeconds(start, start + 100000, 10000, true, start + 80000);
  assert.strictEqual(t3, 70, 'Moving time must subtract both historic pause and currently active pause duration');
});

// ====================================================================
// TEST SUITE 2: Streaks Logic & Timezone Scenarios
// ====================================================================

runTest('Streaks: 11:59 PM (Day N) vs 12:01 AM (Day N+1) are strictly distinct consecutive days', () => {
  // Midnight boundary test:
  // Workout 1: Oct 20, 2026 at 23:59:00 UTC
  // Workout 2: Oct 21, 2026 at 00:01:00 UTC
  const w1 = { timestamp: '2026-10-20T23:59:00.000Z', distanceKm: 5.0 };
  const w2 = { timestamp: '2026-10-21T00:01:00.000Z', distanceKm: 4.2 };

  const streak = calculateDailyStreak([w1, w2], {
    timeZone: 'UTC',
    referenceDate: '2026-10-21T12:00:00.000Z',
  });

  assert.strictEqual(streak.isActiveToday, true, 'User worked out today (Oct 21)');
  assert.strictEqual(streak.totalActiveDays, 2, 'Two distinct calendar days active');
  assert.strictEqual(streak.currentStreakDays, 2, 'Streak must increment to 2 days across the midnight boundary');
});

runTest('Streaks: Multiple workouts on the same day are idempotent (count as 1 active day)', () => {
  // Athlete does morning run, afternoon walk, and evening workout on same calendar day
  const sameDayWorkouts = [
    { timestamp: '2026-10-21T07:00:00.000Z', distanceKm: 5.0 },
    { timestamp: '2026-10-21T13:30:00.000Z', distanceKm: 2.1 },
    { timestamp: '2026-10-21T19:45:00.000Z', distanceKm: 3.5 },
  ];

  const streak = calculateDailyStreak(sameDayWorkouts, {
    timeZone: 'UTC',
    referenceDate: '2026-10-21T21:00:00.000Z',
  });

  assert.strictEqual(streak.totalActiveDays, 1, 'Multiple same-day workouts must deduplicate to 1 active day');
  assert.strictEqual(streak.currentStreakDays, 1, 'Current streak must be 1 day, not 3');
});

runTest('Streaks: Timezone awareness correctly buckets workouts into local dates', () => {
  // Workout at 2026-10-20T19:00:00.000Z:
  // In UTC: 2026-10-20 (7:00 PM)
  // In Asia/Kolkata (UTC +5:30): 2026-10-21 (00:30 AM next day!)
  const workout = { timestamp: '2026-10-20T19:00:00.000Z' };

  const utcDay = getLocalDateString(workout.timestamp, 'UTC');
  const istDay = getLocalDateString(workout.timestamp, 'Asia/Kolkata');

  assert.strictEqual(utcDay, '2026-10-20', 'In UTC, workout occurred on Oct 20');
  assert.strictEqual(istDay, '2026-10-21', 'In IST, workout crossed midnight into Oct 21');

  // Verify streak evaluation under IST
  const streakIST = calculateDailyStreak([workout], {
    timeZone: 'Asia/Kolkata',
    referenceDate: '2026-10-21T10:00:00.000Z', // Oct 21 in IST
  });
  assert.strictEqual(streakIST.isActiveToday, true, 'Workout at 00:30 IST is active today in IST');
});

runTest('Streaks: Skipped day breaks the active streak and maintains longest streak record', () => {
  // Active on Day 1, Day 2, Day 3, skipped Day 4, active on Day 5 (today)
  const workouts = [
    { timestamp: '2026-10-15T08:00:00.000Z' },
    { timestamp: '2026-10-16T08:00:00.000Z' },
    { timestamp: '2026-10-17T08:00:00.000Z' },
    // 2026-10-18 was skipped!
    { timestamp: '2026-10-19T08:00:00.000Z' },
  ];

  const streak = calculateDailyStreak(workouts, {
    timeZone: 'UTC',
    referenceDate: '2026-10-19T12:00:00.000Z',
  });

  assert.strictEqual(streak.currentStreakDays, 1, 'Current streak reset to 1 due to skipped day (Oct 18)');
  assert.strictEqual(streak.longestStreakDays, 3, 'Historical longest streak of 3 days preserved');
});

// ====================================================================
// TEST SUITE 3: Row Level Security (RLS) & Privacy Simulation
// ====================================================================

runTest('RLS & Privacy: Querying Private or Followers-only workouts with stranger token returns 0 rows', () => {
  // Realistic mock database table state
  const activitiesTable = [
    { id: 'act-1', user_id: 'athlete-alice', title: 'Private Morning Run', visibility: 'private' },
    { id: 'act-2', user_id: 'athlete-alice', title: 'Followers Evening Ride', visibility: 'followers' },
    { id: 'act-3', user_id: 'athlete-alice', title: 'Public Park Walk', visibility: 'public' },
  ];

  const followsTable = [
    { follower_id: 'athlete-bob', following_id: 'athlete-alice' }, // Bob follows Alice
  ];

  const blocksTable = [
    { blocker_id: 'athlete-alice', blocked_id: 'athlete-eve' }, // Alice blocks Eve
  ];

  // Postgres RLS SELECT Policy Implementation for activities
  const executeSelectActivities = (callerUserId) => {
    return activitiesTable.filter((act) => {
      // 1. Owner can always view own
      if (callerUserId === act.user_id) return true;

      // Check if caller is blocked by the owner
      const isBlocked = blocksTable.some(
        (b) => b.blocker_id === act.user_id && b.blocked_id === callerUserId
      );
      if (isBlocked) return false;

      // 2. Public is visible unless blocked
      if (act.visibility === 'public') return true;

      // 3. Followers-only visible if caller follows the owner
      if (act.visibility === 'followers') {
        const isFollower = followsTable.some(
          (f) => f.following_id === act.user_id && f.follower_id === callerUserId
        );
        return isFollower;
      }

      // Private is hidden to everyone else
      return false;
    });
  };

  // 1. Stranger (Charlie) queries Alice's activities
  const charlieResults = executeSelectActivities('athlete-charlie');
  assert.strictEqual(charlieResults.length, 1, 'Stranger can ONLY see 1 activity (the public one)');
  assert.strictEqual(charlieResults[0].id, 'act-3');
  assert.ok(!charlieResults.some((a) => a.visibility === 'private'), 'Private activity must NEVER return to stranger');
  assert.ok(!charlieResults.some((a) => a.visibility === 'followers'), 'Followers activity must NEVER return to stranger');

  // 2. Follower (Bob) queries Alice's activities
  const bobResults = executeSelectActivities('athlete-bob');
  assert.strictEqual(bobResults.length, 2, 'Follower can see Public and Followers-only activities');
  assert.ok(bobResults.some((a) => a.id === 'act-2'), 'Follower must see followers-only activity');
  assert.ok(!bobResults.some((a) => a.id === 'act-1'), 'Follower must NOT see private activity');

  // 3. Blocked User (Eve) queries Alice's activities
  const eveResults = executeSelectActivities('athlete-eve');
  assert.strictEqual(eveResults.length, 0, 'Blocked user must receive 0 rows, even for public activities');

  // 4. Owner (Alice) queries own activities
  const aliceResults = executeSelectActivities('athlete-alice');
  assert.strictEqual(aliceResults.length, 3, 'Owner must see all 3 of their own activities');
});

runTest('RLS & Privacy: Challenges and User Blocks tables enforce strict caller isolation', () => {
  // Test Challenges RLS
  const challenges = [
    { id: 'ch-1', creator_id: 'alice', is_private: false, title: 'October 50k Public Challenge' },
    { id: 'ch-2', creator_id: 'alice', is_private: true, title: 'Private Club Invite Only' },
  ];
  const challengeMembers = [
    { challenge_id: 'ch-2', user_id: 'alice' },
    { challenge_id: 'ch-2', user_id: 'bob' },
  ];

  const canViewChallenge = (callerId, ch) => {
    if (!ch.is_private) return true;
    if (ch.creator_id === callerId) return true;
    return challengeMembers.some((m) => m.challenge_id === ch.id && m.user_id === callerId);
  };

  assert.strictEqual(canViewChallenge('charlie', challenges[0]), true, 'Stranger can view public challenge');
  assert.strictEqual(canViewChallenge('charlie', challenges[1]), false, 'Stranger cannot view private challenge');
  assert.strictEqual(canViewChallenge('bob', challenges[1]), true, 'Invited member can view private challenge');

  // Test User Blocks RLS: A user can only view rows where blocker_id = caller (cannot spy on other users blocks)
  const canViewBlockRecord = (callerId, blockRow) => callerId === blockRow.blocker_id;
  assert.strictEqual(canViewBlockRecord('alice', { blocker_id: 'alice', blocked_id: 'eve' }), true);
  assert.strictEqual(canViewBlockRecord('eve', { blocker_id: 'alice', blocked_id: 'eve' }), false, 'Blocked user cannot view block record');
});

// ====================================================================
// TEST SUITE 4: Privacy Cloaking (500m Start/End Point Masking)
// ====================================================================

runTest('Privacy Cloaking: Share card route masks exact start and end points within 500m radius', () => {
  // Create a realistic 6 km linear route:
  // Start: (19.0000, 72.8000)
  // Each step is ~0.001 deg lat (~111 meters)
  const startCoord = { latitude: 19.0000, longitude: 72.8000, timestamp: 1000000 };
  const routePoints = [startCoord];

  for (let i = 1; i <= 60; i++) {
    routePoints.push({
      latitude: Number((19.0000 + i * 0.001).toFixed(4)),
      longitude: 72.8000,
      timestamp: 1000000 + i * 30000,
    });
  }

  const endCoord = routePoints[routePoints.length - 1];
  const totalRawDistance = haversineDistanceKm(startCoord, endCoord);
  assert.ok(totalRawDistance > 6.0, 'Total route should be > 6 km');

  // Apply privacy cloaking with 500m radius
  const cloakedResult = applyPrivacyCloaking(routePoints, { cloakRadiusMeters: 500 });

  assert.strictEqual(cloakedResult.startPointCloaked, true, 'Start point must be cloaked');
  assert.strictEqual(cloakedResult.endPointCloaked, true, 'End point must be cloaked');
  assert.ok(cloakedResult.cloakedPoints.length < routePoints.length, 'Cloaked points must trim start and end coordinates');

  // CRITICAL SECURITY ASSERTION:
  // No coordinate in cloakedPoints must be within 500m of startCoord or endCoord!
  for (const pt of cloakedResult.cloakedPoints) {
    const distFromStart = haversineDistanceKm(startCoord, pt);
    const distFromEnd = haversineDistanceKm(endCoord, pt);

    assert.ok(
      distFromStart >= 0.50,
      `Every cloaked point must be >= 500m away from the true start (was ${Math.round(distFromStart * 1000)}m)`
    );
    assert.ok(
      distFromEnd >= 0.50,
      `Every cloaked point must be >= 500m away from the true end (was ${Math.round(distFromEnd * 1000)}m)`
    );
  }
});

runTest('Privacy Cloaking: Short residential loop (< 1km) applies centroid blur to prevent empty tracks', () => {
  // Athlete runs an 800m loop starting and ending at home
  const homeCoord = { latitude: 19.0500, longitude: 72.8500, timestamp: 1000000 };
  const shortLoop = [
    homeCoord,
    { latitude: 19.0510, longitude: 72.8510, timestamp: 1000060 },
    { latitude: 19.0520, longitude: 72.8500, timestamp: 1000120 },
    { latitude: 19.0505, longitude: 72.8490, timestamp: 1000180 },
    { latitude: 19.0500, longitude: 72.8500, timestamp: 1000240 },
  ];

  const result = applyPrivacyCloaking(shortLoop, { cloakRadiusMeters: 500 });
  assert.strictEqual(result.startPointCloaked, true);
  assert.strictEqual(result.endPointCloaked, true);
  assert.strictEqual(result.cloakedPoints.length, shortLoop.length, 'Short loop should retain shape via centroid blur');

  // The first point should have been blurred away from home
  const blurredStart = result.cloakedPoints[0];
  const distFromRealHome = haversineDistanceKm(homeCoord, blurredStart);
  assert.ok(
    distFromRealHome > 0.15,
    `Centroid blur must shift point away from exact home (shift was ${Math.round(distFromRealHome * 1000)}m)`
  );
});

// ====================================================================
// Summary Report
// ====================================================================
console.log(`\n======================================================`);
console.log(`📊 Phase 1 Test Summary: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log(`======================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
