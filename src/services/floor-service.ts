/**
 * Track your movement - Floor Climbing & Sensor Fusion Service
 *
 * Implements the Apple Health / iPhone standard for floor climbing:
 * 1. Barometer (Air-pressure sensor):
 *    - Measures micro-atmospheric pressure fluctuations (~0.35 hPa per 3 meters).
 *    - On iOS, uses CoreMotion CMAltimeter relativeAltitude directly.
 *    - On Android, converts ambient pressure (hPa) to elevation via the barometric hypsometric equation.
 * 2. Motion Sensors (Pedometer / Accelerometer):
 *    - Tracks human step cadence and vertical locomotion frequency.
 *    - Prompts runtime permissions (ACTIVITY_RECOGNITION on Android & Motion on iOS).
 *    - Acts as an anti-elevator gate (distinguishes stair climbing from elevators/vehicles).
 * 3. Sensor Fusion Fallback:
 *    - Computes real-time steps dynamically via hardware pedometer, fused with stride-length
 *      distance estimation when pedometer sensor is missing (web browser) or delayed.
 * 4. Software Fusion Engine:
 *    - Apple Health standard: 1 floor / flight = 3.0 meters (10 feet / ~16 stairs) of vertical gain
 *      accompanied by active step cadence.
 */

import { Platform } from 'react-native';
import { Barometer, Pedometer } from 'expo-sensors';
import {
  METERS_PER_FLOOR,
  MIN_STEPS_PER_FLOOR,
  MAX_NATURAL_ASCENT_RATE_MPS,
  calculateHypsometricAltitude,
  isElevatorAscent,
  calculateFloorsFromElevation,
  estimateStepsFromDistance,
  calculateCadenceSpm,
} from '@/utils/floor-math';

export {
  METERS_PER_FLOOR,
  MIN_STEPS_PER_FLOOR,
  MAX_NATURAL_ASCENT_RATE_MPS,
  calculateHypsometricAltitude,
  isElevatorAscent,
  calculateFloorsFromElevation,
  estimateStepsFromDistance,
  calculateCadenceSpm,
};

export interface FloorMetrics {
  floorsClimbed: number;
  currentAscentMeters: number;
  totalBarometricGainM: number;
  totalStepsInAscent: number;
  liveSteps: number; // Total physical steps recorded during active workout
  cadenceSpm: number; // Live steps per minute
  currentPressureHpa: number | null;
  relativeAltitudeM: number;
  isBarometerAvailable: boolean;
  isPedometerAvailable: boolean;
  isElevatorDetected: boolean;
  sensorSource: 'barometer_cma' | 'barometer_hpa' | 'gps_fallback' | 'manual';
}

export interface FloorServiceSubscriber {
  (metrics: FloorMetrics): void;
}

class FloorClimbingService {
  private barometerSub: any = null;
  private pedometerSub: any = null;
  private subscribers = new Set<FloorServiceSubscriber>();

  private baselinePressureHpa: number | null = null;
  private lastPressureHpa: number | null = null;
  private initialRelativeAltitudeM: number | null = null;
  private lastRelativeAltitudeM = 0;

  private accumulatedElevationM = 0;
  private lastAscentTimestamp = 0;
  private stepsAtFloorStart = 0;

  // Step tracking states
  private sessionHardwareSteps = 0;
  private sessionGpsEstimatedSteps = 0;
  private liveSteps = 0;
  private cadenceSpm = 0;
  private lastMovingSeconds = 0;

  private floorsClimbed = 0;
  private totalBarometricGainM = 0;
  private isElevatorDetected = false;

  private isBarometerAvailable = false;
  private isPedometerAvailable = false;
  private isPedometerPermissionGranted = false;
  private sensorSource: FloorMetrics['sensorSource'] = 'manual';

  // Fallback altitude tracker for GPS
  private lastGpsAltitude: number | null = null;

  constructor() {
    this.checkSensorAvailability();
  }

  /**
   * Request native pedometer and motion permissions (required on Android 10+ and iOS)
   */
  async requestPedometerPermission(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      const current = await Pedometer.getPermissionsAsync();
      if (current.granted) {
        this.isPedometerPermissionGranted = true;
        return true;
      }
      const requested = await Pedometer.requestPermissionsAsync();
      this.isPedometerPermissionGranted = requested.granted;
      return requested.granted;
    } catch (err) {
      console.warn('Track your movement: Pedometer permission request error:', err);
      return false;
    }
  }

  /**
   * Check hardware availability on device
   */
  async checkSensorAvailability(): Promise<{ barometer: boolean; pedometer: boolean }> {
    if (Platform.OS === 'web') {
      this.isBarometerAvailable = false;
      this.isPedometerAvailable = false;
      this.sensorSource = 'gps_fallback';
      return { barometer: false, pedometer: false };
    }

    try {
      const [baroOk, pedoOk] = await Promise.all([
        Barometer.isAvailableAsync().catch(() => false),
        Pedometer.isAvailableAsync().catch(() => false),
      ]);
      this.isBarometerAvailable = Boolean(baroOk);
      this.isPedometerAvailable = Boolean(pedoOk);
      this.sensorSource = this.isBarometerAvailable
        ? Platform.OS === 'ios'
          ? 'barometer_cma'
          : 'barometer_hpa'
        : 'gps_fallback';
      return { barometer: this.isBarometerAvailable, pedometer: this.isPedometerAvailable };
    } catch {
      this.isBarometerAvailable = false;
      this.isPedometerAvailable = false;
      this.sensorSource = 'gps_fallback';
      return { barometer: false, pedometer: false };
    }
  }

  /**
   * Start tracking barometric pressure and motion sensor step cadence
   */
  async startTracking(): Promise<boolean> {
    if (Platform.OS !== 'web') {
      await this.requestPedometerPermission().catch(() => {});
    }
    await this.checkSensorAvailability();

    // 1. Subscribe to Barometer if hardware sensor exists
    if (this.isBarometerAvailable && !this.barometerSub) {
      try {
        Barometer.setUpdateInterval(1000); // 1-second interval
        this.barometerSub = Barometer.addListener((data: { pressure: number; relativeAltitude?: number }) => {
          this.handleBarometerUpdate(data);
        });
      } catch (err) {
        console.warn('Track your movement: failed to start barometer subscription:', err);
      }
    }

    // 2. Subscribe to Pedometer if hardware sensor exists and permission is granted
    if (this.isPedometerAvailable && !this.pedometerSub) {
      try {
        this.pedometerSub = Pedometer.watchStepCount((result: { steps: number }) => {
          this.handlePedometerUpdate(result.steps);
        });
      } catch (err) {
        console.warn('Track your movement: failed to start pedometer subscription:', err);
      }
    }

    this.notify();
    return true;
  }

  /**
   * Process live barometer reading (iOS CoreMotion relativeAltitude or Android ambient pressure)
   */
  private handleBarometerUpdate(data: { pressure: number; relativeAltitude?: number }) {
    const now = Date.now();
    const pressure = data.pressure;

    // A. iOS CoreMotion CMAltimeter relative altitude in meters
    if (typeof data.relativeAltitude === 'number' && !Number.isNaN(data.relativeAltitude)) {
      if (this.initialRelativeAltitudeM === null) {
        this.initialRelativeAltitudeM = data.relativeAltitude;
        this.lastRelativeAltitudeM = data.relativeAltitude;
        this.lastAscentTimestamp = now;
        return;
      }

      const delta = data.relativeAltitude - this.lastRelativeAltitudeM;
      this.lastRelativeAltitudeM = data.relativeAltitude;

      if (delta > 0.05) {
        this.processAscentGain(delta, now);
      }
      return;
    }

    // B. Android / Hypsometric formula from hPa pressure
    if (pressure && pressure > 300 && pressure < 1100) {
      this.lastPressureHpa = pressure;
      if (this.baselinePressureHpa === null) {
        this.baselinePressureHpa = pressure;
        this.lastAscentTimestamp = now;
        return;
      }

      const calculatedAltitude = calculateHypsometricAltitude(pressure, this.baselinePressureHpa);
      const delta = calculatedAltitude - this.accumulatedElevationM;

      if (delta > 0.1 && delta < 50.0) {
        this.processAscentGain(delta, now);
      }
    }
  }

  /**
   * Process live hardware pedometer step update
   */
  private handlePedometerUpdate(liveSteps: number) {
    this.sessionHardwareSteps = Math.max(0, liveSteps);
    this.liveSteps = Math.max(this.sessionHardwareSteps, this.sessionGpsEstimatedSteps);
    if (this.lastMovingSeconds > 0) {
      this.cadenceSpm = calculateCadenceSpm(this.liveSteps, this.lastMovingSeconds);
    }
    this.notify();
  }

  /**
   * Ingest distance, sport type, and moving time from GPS/Workout loop
   * Ensures steps increase dynamically when walking or running outdoors or indoors
   */
  ingestDistanceAndSpeed(distanceKm: number, sport: string, movingSeconds: number) {
    this.lastMovingSeconds = movingSeconds;

    if (sport === 'ride') {
      // Cycling does not produce foot steps
      this.cadenceSpm = 0;
      this.notify();
      return;
    }

    // Compute estimated steps based on standard stride length (fallback for web / missing sensor)
    this.sessionGpsEstimatedSteps = estimateStepsFromDistance(distanceKm, sport);
    this.liveSteps = Math.max(this.sessionHardwareSteps, this.sessionGpsEstimatedSteps);
    this.cadenceSpm = calculateCadenceSpm(this.liveSteps, movingSeconds);
    this.notify();
  }

  /**
   * For testing or demo environments (e.g. desktop web browser testing),
   * simulate foot strikes to verify UI telemetry and step-gated floor climbing
   */
  simulateSteps(count: number = 25) {
    this.sessionHardwareSteps += count;
    this.liveSteps = Math.max(this.sessionHardwareSteps, this.sessionGpsEstimatedSteps);
    if (this.lastMovingSeconds > 0) {
      this.cadenceSpm = calculateCadenceSpm(this.liveSteps, this.lastMovingSeconds);
    }
    this.notify();
  }

  /**
   * Ingest GPS altitude as fallback when Barometer sensor is not present
   */
  ingestGpsAltitude(altitudeMeters: number | null | undefined) {
    if (this.isBarometerAvailable || altitudeMeters === null || altitudeMeters === undefined) return;
    if (Number.isNaN(altitudeMeters)) return;

    const now = Date.now();
    if (this.lastGpsAltitude === null) {
      this.lastGpsAltitude = altitudeMeters;
      this.lastAscentTimestamp = now;
      return;
    }

    const delta = altitudeMeters - this.lastGpsAltitude;
    this.lastGpsAltitude = altitudeMeters;

    // Filter GPS jitter: only count climbs between 0.3m and 15m
    if (delta >= 0.3 && delta <= 15.0) {
      this.processAscentGain(delta, now);
    }
  }

  /**
   * Evaluate ascent gain against the 3.0m floor standard with anti-elevator gating
   */
  private processAscentGain(deltaMeters: number, timestamp: number) {
    const elapsedSeconds = this.lastAscentTimestamp > 0 ? (timestamp - this.lastAscentTimestamp) / 1000 : 1;
    this.lastAscentTimestamp = timestamp;

    const ascentRateMps = elapsedSeconds > 0 ? deltaMeters / elapsedSeconds : 0;
    const stepsDuringCurrentAscent = this.liveSteps - this.stepsAtFloorStart;

    // Check elevator filter
    if (isElevatorAscent(ascentRateMps, stepsDuringCurrentAscent)) {
      this.isElevatorDetected = true;
      // Do not count elevator ride towards physical floor climbing
      this.notify();
      return;
    }

    this.isElevatorDetected = false;
    this.accumulatedElevationM += deltaMeters;
    this.totalBarometricGainM += deltaMeters;

    // Check if a full 3.0m floor has been completed with sufficient steps
    while (this.accumulatedElevationM >= METERS_PER_FLOOR) {
      // If pedometer is active, check minimum step gate
      if (this.isPedometerAvailable && stepsDuringCurrentAscent < MIN_STEPS_PER_FLOOR) {
        // Pausing completion until step cadence confirms stair walking
        break;
      }

      this.floorsClimbed += 1;
      this.accumulatedElevationM -= METERS_PER_FLOOR;
      this.stepsAtFloorStart = this.liveSteps;
    }

    this.notify();
  }

  /**
   * Stop active sensors
   */
  stopTracking() {
    if (this.barometerSub) {
      try {
        this.barometerSub.remove();
      } catch {}
      this.barometerSub = null;
    }

    if (this.pedometerSub) {
      try {
        this.pedometerSub.remove();
      } catch {}
      this.pedometerSub = null;
    }
  }

  /**
   * Reset session counters
   */
  reset() {
    this.stopTracking();
    this.baselinePressureHpa = null;
    this.lastPressureHpa = null;
    this.initialRelativeAltitudeM = null;
    this.lastRelativeAltitudeM = 0;
    this.accumulatedElevationM = 0;
    this.lastAscentTimestamp = 0;
    this.stepsAtFloorStart = 0;
    this.sessionHardwareSteps = 0;
    this.sessionGpsEstimatedSteps = 0;
    this.liveSteps = 0;
    this.cadenceSpm = 0;
    this.lastMovingSeconds = 0;
    this.floorsClimbed = 0;
    this.totalBarometricGainM = 0;
    this.isElevatorDetected = false;
    this.lastGpsAltitude = null;
    this.notify();
  }

  /**
   * Get snapshot of current metrics
   */
  getMetrics(): FloorMetrics {
    return {
      floorsClimbed: this.floorsClimbed,
      currentAscentMeters: Math.round(this.accumulatedElevationM * 10) / 10,
      totalBarometricGainM: Math.round(this.totalBarometricGainM * 10) / 10,
      totalStepsInAscent: this.liveSteps,
      liveSteps: this.liveSteps,
      cadenceSpm: this.cadenceSpm,
      currentPressureHpa: this.lastPressureHpa ? Math.round(this.lastPressureHpa * 10) / 10 : null,
      relativeAltitudeM: Math.round(this.lastRelativeAltitudeM * 10) / 10,
      isBarometerAvailable: this.isBarometerAvailable,
      isPedometerAvailable: this.isPedometerAvailable,
      isElevatorDetected: this.isElevatorDetected,
      sensorSource: this.sensorSource,
    };
  }

  /**
   * Subscribe to live floor updates
   */
  subscribe(callback: FloorServiceSubscriber): () => void {
    this.subscribers.add(callback);
    callback(this.getMetrics());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify() {
    const metrics = this.getMetrics();
    for (const sub of this.subscribers) {
      try {
        sub(metrics);
      } catch (err) {
        console.warn('Floor subscriber error:', err);
      }
    }
  }
}

export const floorService = new FloorClimbingService();
