/**
 * Spandan Cross-Platform GPS Location Service
 * Provides real GPS location tracking on Android, iOS, and Web (via browser Geolocation API).
 * Never fabricates fake coordinates.
 */

import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { GpsCoordinate, isValidCoordinate } from '@/utils/geo';

export interface LocationPermissionState {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export const locationService = {
  /**
   * Check if location tracking is physically supported on this platform/device.
   */
  isSupported(): boolean {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'geolocation' in navigator;
    }
    return true;
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
          const status = res.state === 'granted' ? 'granted' : res.state === 'denied' ? 'denied' : 'undetermined';
          return { granted: status === 'granted', canAskAgain: status !== 'denied', status };
        } catch {
          // Fallback if permissions query fails
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
      console.warn('Error checking location permission:', err.message);
      return { granted: false, canAskAgain: true, status: 'undetermined' };
    }
  },

  /**
   * Request foreground location permission from the athlete.
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
              canAskAgain: err.code !== 1, // 1 = PERMISSION_DENIED
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
      console.warn('Error requesting location permission:', err.message);
      return { granted: false, canAskAgain: false, status: 'denied' };
    }
  },

  /**
   * Acquire a single accurate current location fix.
   */
  async getCurrentPosition(): Promise<GpsCoordinate | null> {
    if (Platform.OS === 'web') {
      if (!this.isSupported()) return null;
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coord: GpsCoordinate = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              altitude: pos.coords.altitude,
              accuracy: pos.coords.accuracy,
              speed: pos.coords.speed,
              timestamp: pos.timestamp,
            };
            resolve(isValidCoordinate(coord) ? coord : null);
          },
          (err) => reject(new Error(`Web Geolocation error (${err.code}): ${err.message}`)),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
        );
      });
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const coord: GpsCoordinate = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      altitude: pos.coords.altitude,
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed,
      timestamp: pos.timestamp,
    };
    return isValidCoordinate(coord) ? coord : null;
  },

  /**
   * Start live GPS tracking subscription.
   * Returns an unsubscribe function that must be called to stop hardware sensor tracking.
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
          distanceInterval: 2, // 2 meters
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
};
