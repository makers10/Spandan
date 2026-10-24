/**
 * Spandan Cross-Platform GPS Location Service
 * Provides real GPS location tracking on Android, iOS, and Web (via browser Geolocation API).
 * Supports both high-precision foreground tracking and native Android background tracking
 * via expo-task-manager and persistent foreground services.
 * Never fabricates fake coordinates.
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { GpsCoordinate, isValidCoordinate } from '@/utils/geo';

export const SPANDAN_BACKGROUND_LOCATION_TASK = 'SPANDAN_BACKGROUND_LOCATION_TASK';

export interface LocationPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

// Background coordinate subscriber callbacks
type BackgroundLocationCallback = (fix: GpsCoordinate) => void;
const backgroundListeners = new Set<BackgroundLocationCallback>();

// Register native background location task at module scope
if (Platform.OS !== 'web') {
  try {
    TaskManager.defineTask(SPANDAN_BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
      if (error) {
        console.warn('Spandan background location task error:', error.message);
        return;
      }
      if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        if (locations && Array.isArray(locations)) {
          for (const loc of locations) {
            const coord: GpsCoordinate = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              altitude: loc.coords.altitude,
              accuracy: loc.coords.accuracy,
              speed: loc.coords.speed,
              timestamp: loc.timestamp,
            };
            if (isValidCoordinate(coord)) {
              backgroundListeners.forEach((callback) => callback(coord));
            }
          }
        }
      }
    });
  } catch (err: any) {
    console.warn('Could not register background location task:', err.message);
  }
}

export const locationService = {
  /**
   * Check if location tracking is physically supported on this platform/device.
   */
  isSupported(): boolean {
    if (Platform.OS === 'web') {
      return (
        typeof window !== 'undefined' &&
        typeof navigator !== 'undefined' &&
        'geolocation' in navigator
      );
    }
    return true;
  },

  /**
   * Check whether native background location tracking is supported on this platform.
   * Browsers cannot run background GPS when tabs are sleeping or devices locked.
   */
  isBackgroundSupported(): boolean {
    return Platform.OS !== 'web';
  },

  /**
   * Check current foreground location permission status.
   */
  async checkPermission(): Promise<LocationPermissionState> {
    if (Platform.OS === 'web') {
      if (!this.isSupported()) {
        return { granted: false, canAskAgain: false, status: 'denied' };
      }
      if (typeof navigator.permissions !== 'undefined') {
        try {
          const res = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          const status =
            res.state === 'granted' ? 'granted' : res.state === 'denied' ? 'denied' : 'undetermined';
          return { granted: status === 'granted', canAskAgain: status !== 'denied', status };
        } catch {
          // Fallback if query fails
        }
      }
      return { granted: false, canAskAgain: true, status: 'undetermined' };
    }

    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status:
          status === Location.PermissionStatus.GRANTED
            ? 'granted'
            : status === Location.PermissionStatus.DENIED
            ? 'denied'
            : 'undetermined',
      };
    } catch (err: any) {
      console.warn('Error checking foreground location permission:', err.message);
      return { granted: false, canAskAgain: true, status: 'undetermined' };
    }
  },

  /**
   * Request foreground location permission.
   */
  async requestPermission(): Promise<LocationPermissionState> {
    if (Platform.OS === 'web') {
      if (!this.isSupported()) {
        return { granted: false, canAskAgain: false, status: 'denied' };
      }
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve({ granted: true, canAskAgain: true, status: 'granted' }),
          (err) =>
            resolve({
              granted: false,
              canAskAgain: err.code !== 1,
              status: 'denied',
            }),
          { enableHighAccuracy: true, timeout: 8000 }
        );
      });
    }

    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status:
          status === Location.PermissionStatus.GRANTED
            ? 'granted'
            : status === Location.PermissionStatus.DENIED
            ? 'denied'
            : 'undetermined',
      };
    } catch (err: any) {
      console.warn('Error requesting foreground location permission:', err.message);
      return { granted: false, canAskAgain: false, status: 'denied' };
    }
  },

  /**
   * Request native background location permission (Android 11+ two-step permission).
   */
  async requestBackgroundPermission(): Promise<LocationPermissionState> {
    if (Platform.OS === 'web') {
      return { granted: false, canAskAgain: false, status: 'denied' };
    }

    try {
      // Android requires foreground permission to be granted before background can be requested
      const fgStatus = await this.checkPermission();
      if (!fgStatus.granted) {
        const fgReq = await this.requestPermission();
        if (!fgReq.granted) {
          return { granted: false, canAskAgain: false, status: 'denied' };
        }
      }

      const { status, canAskAgain } = await Location.requestBackgroundPermissionsAsync();
      return {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status:
          status === Location.PermissionStatus.GRANTED
            ? 'granted'
            : status === Location.PermissionStatus.DENIED
            ? 'denied'
            : 'undetermined',
      };
    } catch (err: any) {
      console.warn('Error requesting background location permission:', err.message);
      return { granted: false, canAskAgain: false, status: 'denied' };
    }
  },

  /**
   * Start live GPS foreground tracking subscription.
   */
  async startTracking(
    onLocation: (fix: GpsCoordinate) => void,
    onError: (err: string) => void
  ): Promise<() => void> {
    if (Platform.OS === 'web') {
      if (!this.isSupported()) {
        onError('GPS Geolocation is not supported in this web browser.');
        return () => {};
      }

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coord: GpsCoordinate = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          };
          if (isValidCoordinate(coord)) {
            onLocation(coord);
          }
        },
        (err) => {
          const msg =
            err.code === 1
              ? 'Location permission denied by user.'
              : err.code === 2
              ? 'Position unavailable. Check your device GPS signal.'
              : 'GPS location request timed out.';
          onError(msg);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    }

    // Native Platform (Android / iOS)
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 2,
        },
        (loc) => {
          const coord: GpsCoordinate = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            accuracy: loc.coords.accuracy,
            speed: loc.coords.speed,
            timestamp: loc.timestamp,
          };
          if (isValidCoordinate(coord)) {
            onLocation(coord);
          }
        }
      );

      return () => {
        subscription.remove();
      };
    } catch (err: any) {
      onError(`Failed to start native location sensor: ${err.message}`);
      return () => {};
    }
  },

  /**
   * Start Android native background tracking with foreground service notification.
   */
  async startBackgroundTracking(
    onLocation: (fix: GpsCoordinate) => void,
    onError: (err: string) => void
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      onError('Background tracking is unsupported on Web. Browser tabs pause execution when backgrounded.');
      return false;
    }

    try {
      // Check if task is already running
      const isRegistered = await TaskManager.isTaskRegisteredAsync(SPANDAN_BACKGROUND_LOCATION_TASK);
      backgroundListeners.add(onLocation);

      if (isRegistered) {
        return true;
      }

      await Location.startLocationUpdatesAsync(SPANDAN_BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 2,
        foregroundService: {
          notificationTitle: 'Spandan Activity Tracker',
          notificationBody: 'Recording your GPS workout in the background',
          notificationColor: '#4FA99A',
        },
        pausesUpdatesAutomatically: false,
      });

      return true;
    } catch (err: any) {
      console.warn('Failed to start native background location:', err.message);
      onError(`Background location setup failed: ${err.message}`);
      return false;
    }
  },

  /**
   * Stop Android native background tracking.
   */
  async stopBackgroundTracking(): Promise<void> {
    backgroundListeners.clear();
    if (Platform.OS === 'web') return;

    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(SPANDAN_BACKGROUND_LOCATION_TASK);
      if (isRegistered) {
        await Location.stopLocationUpdatesAsync(SPANDAN_BACKGROUND_LOCATION_TASK);
      }
    } catch (err: any) {
      console.warn('Error stopping background location task:', err.message);
    }
  },

  /**
   * Check if native background location task is actively registered.
   */
  async isBackgroundTrackingActive(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    try {
      return await TaskManager.isTaskRegisteredAsync(SPANDAN_BACKGROUND_LOCATION_TASK);
    } catch {
      return false;
    }
  },
};
