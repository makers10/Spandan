/**
 * Track your movement - Floor Climbing & Barometer Sensor Fusion Test Suite
 *
 * Verifies:
 * 1. Apple Health / iPhone standard 3.0m per flight calculation.
 * 2. Barometer hypsometric equation accuracy against physics benchmarks.
 * 3. Step gating & anti-elevator filter (distinguishing stair climbing from elevators/cars).
 * 4. Partial floor remainders and edge cases (0 elevation, downhill/negative elevation).
 */

import assert from 'node:assert';

// Import pure logic functions from floor-math.ts
import {
  METERS_PER_FLOOR,
  MIN_STEPS_PER_FLOOR,
  MAX_NATURAL_ASCENT_RATE_MPS,
  calculateHypsometricAltitude,
  isElevatorAscent,
  calculateFloorsFromElevation,
} from '../src/utils/floor-math.ts';

console.log('🪜 Starting Floor Climbing & Barometer Sensor Fusion Tests...\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ PASS: ${name}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     ${err.message}\n`);
  }
}

// -------------------------------------------------------------
// Test 1: Apple Health Standard (3.0 meters / flight)
// -------------------------------------------------------------
runTest('Floors: 3.0 meters elevation calculates exactly 1 floor', () => {
  assert.strictEqual(METERS_PER_FLOOR, 3.0);
  const result = calculateFloorsFromElevation(3.0);
  assert.strictEqual(result.floors, 1);
  assert.strictEqual(result.remainderMeters, 0);
});

runTest('Floors: 12.0 meters elevation calculates exactly 4 floors', () => {
  const result = calculateFloorsFromElevation(12.0);
  assert.strictEqual(result.floors, 4);
  assert.strictEqual(result.remainderMeters, 0);
});

runTest('Floors: Partial ascent retains fractional remainder toward next floor', () => {
  const result = calculateFloorsFromElevation(7.5);
  // 7.5m / 3.0m = 2 full floors + 1.5m remainder
  assert.strictEqual(result.floors, 2);
  assert.strictEqual(result.remainderMeters, 1.5);
});

// -------------------------------------------------------------
// Test 2: Edge Cases (0 elevation, negative elevation / descent)
// -------------------------------------------------------------
runTest('Edge Case: 0 elevation gain produces 0 floors without error', () => {
  const result = calculateFloorsFromElevation(0);
  assert.strictEqual(result.floors, 0);
  assert.strictEqual(result.remainderMeters, 0);
});

runTest('Edge Case: Negative elevation (descent) does not count as upward climbed floors', () => {
  const result = calculateFloorsFromElevation(-15.0);
  assert.strictEqual(result.floors, 0);
  assert.strictEqual(result.remainderMeters, 0);
});

// -------------------------------------------------------------
// Test 3: Motion Sensor Step Gating (Anti-Elevator Protection)
// -------------------------------------------------------------
runTest('Step Gating: Elevation with 0 steps taken yields 0 credited floors (elevator rejection)', () => {
  // 30 meters elevation (10 floors) but 0 physical steps taken (elevator ride)
  const result = calculateFloorsFromElevation(30.0, 0);
  assert.strictEqual(result.floors, 0);
});

runTest('Step Gating: Adequate step cadence credits full floors', () => {
  // 30 meters elevation with 160 steps taken (16 steps/floor)
  const result = calculateFloorsFromElevation(30.0, 160);
  assert.strictEqual(result.floors, 10);
});

runTest('Step Gating: Partial step count caps credited floors to physical effort', () => {
  // 15 meters elevation (5 theoretical floors), but only 18 steps taken (enough for only 2 floors @ 8 steps/floor)
  const result = calculateFloorsFromElevation(15.0, 18);
  assert.strictEqual(result.floors, 2);
});

// -------------------------------------------------------------
// Test 4: Anti-Elevator Velocity Filter
// -------------------------------------------------------------
runTest('Elevator Filter: Rapid ascent (> 1.8 m/s) with minimal steps flags elevator', () => {
  const isElevator = isElevatorAscent(2.5, 1);
  assert.strictEqual(isElevator, true);
});

runTest('Elevator Filter: Steady climb (0.35 m/s) with human step cadence is accepted as stairs', () => {
  const isElevator = isElevatorAscent(0.35, 15);
  assert.strictEqual(isElevator, false);
});

runTest('Elevator Filter: Vehicle climbing mountain road (> 3 m/s) with zero steps is rejected', () => {
  const isElevator = isElevatorAscent(4.0, 0);
  assert.strictEqual(isElevator, true);
});

// -------------------------------------------------------------
// Test 5: Barometric Hypsometric Pressure-to-Altitude Formula
// -------------------------------------------------------------
runTest('Barometer: Sea-level benchmark (1013.25 hPa) produces 0m delta against itself', () => {
  const altitude = calculateHypsometricAltitude(1013.25, 1013.25);
  assert.strictEqual(altitude, 0);
});

runTest('Barometer: 0.36 hPa pressure drop corresponds to ~3.0m vertical elevation (1 floor)', () => {
  // At sea level, ~12 Pa (0.12 hPa) per meter => ~0.36 hPa for 3.0m
  const altitude = calculateHypsometricAltitude(1012.89, 1013.25);
  assert.ok(altitude >= 2.8 && altitude <= 3.2, `Expected ~3.0m, got ${altitude}m`);
});

runTest('Barometer: 3.5 hPa pressure drop corresponds to ~29-30m vertical elevation (~10 floors)', () => {
  const altitude = calculateHypsometricAltitude(1009.75, 1013.25);
  assert.ok(altitude >= 28.5 && altitude <= 30.5, `Expected ~29-30m, got ${altitude}m`);
});

runTest('Barometer: Invalid or zero pressures handle safely without NaN', () => {
  assert.strictEqual(calculateHypsometricAltitude(0, 1013.25), 0);
  assert.strictEqual(calculateHypsometricAltitude(1013.25, 0), 0);
});

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n=============================================');
console.log(`📊 Floor Climbing Test Summary: ${passedTests} / ${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('=============================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
