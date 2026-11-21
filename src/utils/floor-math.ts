/**
 * Track your movement - Floor Climbing & Barometric Telemetry Math Engine
 * Zero external dependencies. Fully portable across React Native, Node.js, and Web.
 */

export const METERS_PER_FLOOR = 3.0; // Apple Health standard: 3.0 meters (approx 10 feet) per flight
export const MIN_STEPS_PER_FLOOR = 8; // At least 8 steps required per 3.0m ascent to eliminate elevator rides
export const MAX_NATURAL_ASCENT_RATE_MPS = 1.8; // > 1.8 m/s vertical rise without rapid steps is an elevator

/**
 * Calculates altitude difference in meters from atmospheric pressure changes using the
 * International Standard Atmosphere (ISA) barometric formula:
 * h = 44330 * (1 - (P / P0)^(1 / 5.255))
 */
export function calculateHypsometricAltitude(pressureHpa: number, baselinePressureHpa: number): number {
  if (!pressureHpa || !baselinePressureHpa || baselinePressureHpa <= 0) return 0;
  if (pressureHpa <= 0) return 0;
  const ratio = pressureHpa / baselinePressureHpa;
  const altitudeDelta = 44330 * (1 - Math.pow(ratio, 0.190263));
  return Math.round(altitudeDelta * 100) / 100;
}

/**
 * Checks whether an ascent profile matches an elevator or motorized vehicle rather than human stair climbing.
 * Human stair ascent: 0.2 - 0.7 m/s with 1.2 - 2.5 steps/sec.
 * Elevator: rapid pressure drop (> 1.2 m/s) with near-zero steps.
 */
export function isElevatorAscent(ascentRateMps: number, stepCountDuringAscent: number): boolean {
  if (ascentRateMps > MAX_NATURAL_ASCENT_RATE_MPS && stepCountDuringAscent < 4) {
    return true;
  }
  if (ascentRateMps > 1.0 && stepCountDuringAscent === 0) {
    return true;
  }
  return false;
}

/**
 * Calculates total completed floors and remaining meter progression from elevation and steps.
 */
export function calculateFloorsFromElevation(
  elevationMeters: number, stepsTaken?: number
): { floors: number; remainderMeters: number } {
  if (!elevationMeters || elevationMeters <= 0) return { floors: 0, remainderMeters: 0 };
  const rawFloors = Math.floor(elevationMeters / METERS_PER_FLOOR);
  const remainderMeters = Math.round((elevationMeters % METERS_PER_FLOOR) * 10) / 10;
  if (typeof stepsTaken === 'number') {
    const floors = Math.min(rawFloors, Math.max(0, Math.floor(stepsTaken / MIN_STEPS_PER_FLOOR)));
    return { floors, remainderMeters };
  }
  return { floors: rawFloors, remainderMeters };
}

export const STRIDE_LENGTH_METERS: Record<string, number> = {
  walk: 0.75, run: 0.88, hike: 0.70, ride: 0,
};

/**
 * Calculates estimated physical foot steps from distance and sport type.
 */
export function estimateStepsFromDistance(distanceKm: number, sport: string): number {
  if (!distanceKm || distanceKm <= 0) return 0;
  const stride = STRIDE_LENGTH_METERS[sport.toLowerCase()] || 0.75;
  if (stride <= 0) return 0;
  return Math.round((distanceKm * 1000) / stride);
}

/**
 * Calculates estimated distance (km) from physical foot steps and sport type.
 * Enables live indoor/walking distance advancement even when GPS is weak or zero.
 */
export function estimateDistanceFromSteps(steps: number, sport: string): number {
  if (!steps || steps <= 0) return 0;
  const stride = STRIDE_LENGTH_METERS[sport.toLowerCase()] || 0.75;
  if (stride <= 0) return 0;
  return Number(((steps * stride) / 1000).toFixed(3));
}

/**
 * Calculates steps per minute (SPM cadence).
 */
export function calculateCadenceSpm(steps: number, movingSeconds: number): number {
  if (!steps || steps <= 0 || !movingSeconds || movingSeconds < 5) return 0;
  const spm = Math.round((steps / movingSeconds) * 60);
  return Math.min(260, Math.max(0, spm));
}
