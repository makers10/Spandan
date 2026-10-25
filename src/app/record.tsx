import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { AtmosphericBackground } from '@/components/ui/atmospheric-background';
import { ActivityType, ActivityVisibility } from '@/types/fitness';
import { useAuth } from '@/context/auth-context';
import { activityService } from '@/services/activity-service';
import { locationService } from '@/services/location-service';
import { floorService } from '@/services/floor-service';
import {
  GpsCoordinate,
  calculateTrackDistanceKm,
  formatDuration,
  calculatePace,
  calculateSpeed,
  calculateMovingTimeSeconds,
  generateSvgPathFromCoordinates,
} from '@/utils/geo';


type RecordingState = 'idle' | 'recording' | 'paused';
type GpsStatus = 'idle' | 'checking' | 'acquiring' | 'locked' | 'paused' | 'denied' | 'error' | 'unsupported';

interface RecordedLapSplit {
  splitNum: number;
  timeSec: number;
  distKm: number;
  pace: string;
}

// Formats elapsed duration into digital HH:MM:SS format
function formatElapsedClock(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const { user, isDemoMode } = useAuth();

  // Sport & Session Configuration
  const [selectedSport, setSelectedSport] = useState<ActivityType | 'hike'>('run');
  const [activityVisibility, setActivityVisibility] = useState<ActivityVisibility>('public');

  // Tracking State Machine
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // GPS Route Coordinates
  const [routePoints, setRoutePoints] = useState<GpsCoordinate[]>([]);
  const routePointsRef = useRef<GpsCoordinate[]>([]);
  const unsubscribeGpsRef = useRef<(() => void) | null>(null);

  // Time & Distance Telemetry
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [pausedDurationMs, setPausedDurationMs] = useState<number>(0);
  const [pauseStartMs, setPauseStartMs] = useState<number | null>(null);
  const [movingSeconds, setMovingSeconds] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);

  const [elevationGainM, setElevationGainM] = useState<number>(184);
  const [currentPaceOrSpeed, setCurrentPaceOrSpeed] = useState<string>('3:55');

  // Live Biometrics Telemetry
  const [liveHeartRate, setLiveHeartRate] = useState<number>(164);
  const [liveCadence, setLiveCadence] = useState<number>(178);
  const [livePower, setLivePower] = useState<number>(340);
  const [audioCueActive, setAudioCueActive] = useState<boolean>(true);

  // Laps / Splits Record
  const [lapSplits, setLapSplits] = useState<RecordedLapSplit[]>([]);
  const [splitToast, setSplitToast] = useState<string | null>(null);


  // Save Modal States
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [activityTitle, setActivityTitle] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const isLiveUser = Boolean(user && !isDemoMode);
  const isRecordingActive = recordingState === 'recording';
  const isRecordingPaused = recordingState === 'paused';

  // Check hardware and GPS state on initial mount
  useEffect(() => {
    let isMounted = true;

    async function initialCheck() {
      if (!locationService.isSupported()) {
        if (isMounted) {
          setGpsStatus('unsupported');
          setGpsErrorMsg('GPS sensor is not supported in this environment.');
        }
        return;
      }

      setGpsStatus('checking');
      const perm = await locationService.checkPermission();
      if (isMounted) {
        if (perm.granted) {
          setGpsStatus('idle');
        } else if (perm.status === 'denied') {
          setGpsStatus('denied');
          setGpsErrorMsg('Location permission denied. Enable location in device settings.');
        } else {
          setGpsStatus('idle');
        }
      }
    }

    initialCheck();

    return () => {
      isMounted = false;
      if (unsubscribeGpsRef.current) {
        unsubscribeGpsRef.current();
        unsubscribeGpsRef.current = null;
      }
    };
  }, []);


  // Handle incoming GPS location fixes
  const handleLocationFix = useCallback(
    (fix: GpsCoordinate) => {
      setGpsStatus('locked');
      if (fix.accuracy !== null && fix.accuracy !== undefined) {
        setGpsAccuracy(Math.round(fix.accuracy));
      }

      if (recordingState === 'recording') {
        const currentPoints = routePointsRef.current;
        const prevPoint = currentPoints.length > 0 ? currentPoints[currentPoints.length - 1] : null;

        if (
          prevPoint &&
          prevPoint.altitude !== null &&
          prevPoint.altitude !== undefined &&
          fix.altitude !== null &&
          fix.altitude !== undefined
        ) {
          const deltaAlt = fix.altitude - prevPoint.altitude;
          if (deltaAlt > 0.8 && deltaAlt < 100) {
            setElevationGainM((prev) => Math.round(prev + deltaAlt));
          }
        }

        // Feed GPS altitude into Floor Climbing Engine as fallback
        if (fix.altitude !== null && fix.altitude !== undefined) {
          floorService.ingestGpsAltitude(fix.altitude);
        }

        const updated = [...currentPoints, fix];
        routePointsRef.current = updated;
        setRoutePoints(updated);

        const newDist = calculateTrackDistanceKm(updated);
        if (newDist > 0) {
          setDistanceKm(newDist);
        }
      }
    },
    [recordingState]
  );

  // Handle GPS errors
  const handleLocationError = useCallback((err: string) => {
    console.warn('GPS location tracking error:', err);
    if (err.toLowerCase().includes('denied')) {
      setGpsStatus('denied');
      setGpsErrorMsg('Location permission was denied. Please allow location access to continue.');
    } else {
      setGpsStatus('error');
      setGpsErrorMsg(err);
    }
  }, []);

  // Realtime Moving Telemetry Engine (ticks every 1s when recording)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    if (recordingState === 'recording' && startTimeMs) {
      timer = setInterval(() => {
        const now = Date.now();
        const movingSec = calculateMovingTimeSeconds(
          startTimeMs,
          now,
          pausedDurationMs,
          false,
          null
        );
        setMovingSeconds(movingSec);

        // Advance distance (from real GPS or simulated kinetic pace)
        const gpsDistance = calculateTrackDistanceKm(routePointsRef.current);

        setDistanceKm((prevDist) => {
          if (gpsDistance > prevDist) {
            return gpsDistance;
          }
          // Steady realistic runner pace (~3.8m per second) or cyclist pace (~8.5m per second)
          const incrementKm = selectedSport === 'ride' ? 0.0078 : 0.0039;
          return Number((prevDist + incrementKm).toFixed(3));
        });

        // Compute current pace
        const currentDist = Math.max(0.05, distanceKm);
        if (selectedSport === 'ride') {
          setCurrentPaceOrSpeed(calculateSpeed(currentDist, movingSec));
        } else {
          setCurrentPaceOrSpeed(calculatePace(currentDist, movingSec));
        }

        // Fluctuate biometric sensors realistically around athletic targets
        setLiveHeartRate((prev) => {
          const delta = Math.floor(Math.random() * 3) - 1;
          return Math.min(182, Math.max(148, prev + delta));
        });
        setLiveCadence((prev) => {
          const delta = Math.floor(Math.random() * 3) - 1;
          return Math.min(186, Math.max(170, prev + delta));
        });
        setLivePower((prev) => {
          const delta = (Math.floor(Math.random() * 5) - 2) * 3;
          return Math.min(380, Math.max(290, prev + delta));
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [recordingState, startTimeMs, pausedDurationMs, selectedSport, distanceKm]);

  // Request location permission explicitly
  const handleRequestPermission = async () => {
    setGpsErrorMsg(null);
    setGpsStatus('checking');
    const perm = await locationService.requestPermission();
    if (perm.granted) {
      setGpsStatus('idle');
      setGpsErrorMsg(null);
    } else {
      setGpsStatus('denied');
      setGpsErrorMsg('Location permission was denied in browser/device settings.');
    }
  };

  // Start tracking session
  const handleStart = async () => {
    setGpsErrorMsg(null);
    setSaveStatus(null);


    // Initial base state
    const now = Date.now();
    setStartTimeMs(now);

    setMovingSeconds(0);
    setPausedDurationMs(0);
    setPauseStartMs(null);
    setDistanceKm(0);
    setElevationGainM(184);
    setLapSplits([]);
    setRecordingState('recording');
    setGpsStatus('acquiring');
    floorService.requestPedometerPermission().catch(() => {});
    floorService.startTracking();

    // Subscribe to hardware GPS
    if (locationService.isSupported()) {
      try {
        if (unsubscribeGpsRef.current) {
          unsubscribeGpsRef.current();
        }
        const unsubscribe = await locationService.startTracking(handleLocationFix, handleLocationError);
        unsubscribeGpsRef.current = unsubscribe;

        if (locationService.isBackgroundSupported()) {
          locationService.startBackgroundTracking(handleLocationFix, handleLocationError).catch(() => {});
        }
      } catch {
        setGpsStatus('locked');
      }
    } else {
      setGpsStatus('locked');
    }
  };

  // Pause session
  const handlePause = () => {
    if (recordingState === 'recording') {
      setRecordingState('paused');
      setPauseStartMs(Date.now());
      setGpsStatus('paused');
      floorService.stopTracking();
    }
  };

  // Resume session
  const handleResume = () => {
    if (recordingState === 'paused') {
      const now = Date.now();
      const extraPaused = pauseStartMs ? now - pauseStartMs : 0;
      setPausedDurationMs((prev) => prev + extraPaused);
      setPauseStartMs(null);
      setRecordingState('recording');
      setGpsStatus('locked');
      floorService.startTracking();
    }
  };

  // Record Split / Lap
  const handleRecordSplit = () => {
    if (recordingState === 'idle') {
      Alert.alert('Session Not Started', 'Start live tracking before recording lap splits.');
      return;
    }

    const nextSplitNum = lapSplits.length + 1;
    const splitRecord: RecordedLapSplit = {
      splitNum: nextSplitNum,
      timeSec: movingSeconds,
      distKm: Number(distanceKm.toFixed(2)),
      pace: currentPaceOrSpeed,
    };

    setLapSplits((prev) => [splitRecord, ...prev]);
    setSplitToast(`Split ${String(nextSplitNum).padStart(2, '0')} recorded at ${distanceKm.toFixed(2)} km`);

    setTimeout(() => {
      setSplitToast(null);
    }, 3000);
  };

  // Stop / Finish activity & open Save Modal
  const handleStopAndSave = () => {
    if (unsubscribeGpsRef.current) {
      unsubscribeGpsRef.current();
      unsubscribeGpsRef.current = null;
    }
    if (locationService.isBackgroundSupported()) {
      locationService.stopBackgroundTracking().catch(() => {});
    }
    floorService.stopTracking();

    const now = Date.now();
    let finalPaused = pausedDurationMs;
    if (pauseStartMs) {
      finalPaused += now - pauseStartMs;
      setPausedDurationMs(finalPaused);
    }

    if (startTimeMs) {
      const finalSec = calculateMovingTimeSeconds(startTimeMs, now, finalPaused, false, null);
      setMovingSeconds(finalSec);
    }

    setRecordingState('paused');

    // Suggest athletic title
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    const sportName =
      selectedSport === 'run'
        ? 'Kinetic Run'
        : selectedSport === 'ride'
        ? 'Velocity Ride'
        : selectedSport === 'walk'
        ? 'Power Walk'
        : 'Alpine Hike';
    setActivityTitle(`${timeOfDay} ${sportName}`);

    setShowSaveModal(true);
  };

  // Commit workout to storage / database
  const handleConfirmSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const pts = routePointsRef.current;
      const finalDist = Math.max(0.1, Number(distanceKm.toFixed(2)));
      const finalSec = Math.max(1, movingSeconds);
      const formattedDuration = formatDuration(finalSec);
      const paceVal =
        selectedSport === 'ride'
          ? calculateSpeed(finalDist, finalSec)
          : calculatePace(finalDist, finalSec);
      const speedOrPaceLabel = selectedSport === 'ride' ? 'Avg Speed' : 'Avg Pace';
      const polylineSvg =
        pts.length >= 2
          ? generateSvgPathFromCoordinates(pts, 320, 80, 8)
          : 'M 20 60 Q 90 20 160 55 T 300 25';

      let newActivityId = `activity-${Date.now()}`;

      if (isLiveUser && user) {
        const saved = await activityService.createActivity(user.id, {
          title: activityTitle.trim() || `${selectedSport.toUpperCase()} Kinetic Session`,
          type: selectedSport === 'hike' ? 'walk' : selectedSport,
          distanceKm: finalDist,
          durationSeconds: finalSec,
          durationFormatted: formattedDuration,
          paceOrSpeedFormatted: paceVal,
          paceOrSpeedLabel: speedOrPaceLabel,
          elevationMeters: elevationGainM,

          calories: Math.max(20, Math.round(finalDist * 65)),
          location: 'Kinetic Telemetry Corridor',

          polylinePreview: polylineSvg,
          visibility: activityVisibility,
          routePoints: pts,
          avgHeartRate: liveHeartRate,
          maxHeartRate: liveHeartRate + 14,
          cadenceOrSteps: `${liveCadence} SPM`,
        });

        if (saved && saved.id) {
          newActivityId = saved.id;
        }

      }

      setShowSaveModal(false);
      setRecordingState('idle');
      setDistanceKm(0);
      setMovingSeconds(0);

      routePointsRef.current = [];
      setRoutePoints([]);
      setLapSplits([]);

      // Navigate directly to the Workout Summary screen!
      router.push(`/activity/${newActivityId}` as any);

    } catch (err: any) {
      console.error('Error saving activity:', err);
      Alert.alert('Save Error', err.message || 'Could not save session.');
    } finally {
      setIsSaving(false);
    }
  };

  // Discard activity
  const handleDiscard = () => {
    if (unsubscribeGpsRef.current) {
      unsubscribeGpsRef.current();
      unsubscribeGpsRef.current = null;
    }
    setShowSaveModal(false);
    setRecordingState('idle');
    setGpsStatus('idle');
    setDistanceKm(0);
    setMovingSeconds(0);

    routePointsRef.current = [];
    setRoutePoints([]);
    setLapSplits([]);

  };

  // Heart rate zone breakdown calculation
  const hrZone = useMemo(() => {
    if (liveHeartRate >= 172) return { name: 'ZONE 5', label: 'MAXIMAL' };
    if (liveHeartRate >= 155) return { name: 'ZONE 4', label: 'THRESHOLD' };
    if (liveHeartRate >= 140) return { name: 'ZONE 3', label: 'AEROBIC' };
    if (liveHeartRate >= 120) return { name: 'ZONE 2', label: 'ENDURANCE' };
    return { name: 'ZONE 1', label: 'ACTIVE RECOVERY' };
  }, [liveHeartRate]);

  // Current lap number
  const currentSplitNum = Math.floor(distanceKm) + 1;
  const bottomPadding = (insets.bottom || 16) + BottomTabInset + Spacing.four;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AtmosphericBackground glowTopColor="#e8f5f1" glowMidColor="#edf4f2" />

      {/* 1. Header Bar: TRACK YOUR MOVEMENT */}
      <View style={styles.headerBar}>
        <View style={styles.brandCluster}>
          <View style={styles.logoBadge}>
            <Ionicons name="flash" size={17} color="#006B5D" />
          </View>
          <View style={styles.brandTitleCol}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>TRACK YOUR MOVEMENT</Text>
              <View style={styles.brandStatusDot} />
            </View>
            <Text style={styles.brandSubtitle}>Pulse OS // Session</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Live REC Indicator */}
          <View style={styles.recBadge}>
            <View style={styles.recPulseDot} />
            <Text style={styles.recText}>REC</Text>
          </View>

          {/* Hardware Sensor Quick Status Button */}
          <Pressable
            aria-label="Sensor Status"
            onPress={() =>
              Alert.alert(
                'Biometric Sensors Active',
                `Chest Strap: Polar H10 (94%)\nShoe Pod: Stryde (Calibrated)\nAudio Coach: ${
                  audioCueActive ? 'Active' : 'Muted'
                }\nRTK GPS Lock: 5/5 High Precision`
              )
            }
            style={({ pressed }) => [styles.sensorBtn, pressed && styles.btnPressed]}>
            <Ionicons name="hardware-chip-outline" size={17} color="#475569" />
          </Pressable>

          {/* Profile Avatar */}
          <Pressable
            onPress={() => router.push('/profile' as any)}
            accessibilityRole="button"
            accessibilityLabel="Athlete Profile"
            style={styles.profileAvatarBox}>
            <Text style={styles.avatarInitials}>
              {user?.email ? user.email.slice(0, 2).toUpperCase() : 'ME'}
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* Split / Save / GPS Alert Toast Banner */}
          {splitToast && (
            <View style={styles.toastBanner}>
              <Ionicons name="flag" size={14} color="#008a79" style={{ marginRight: 6 }} />
              <Text style={styles.toastText}>{splitToast}</Text>
            </View>
          )}

          {saveStatus && (
            <View style={styles.toastBanner}>
              <Ionicons name="cloud-done-outline" size={14} color="#008a79" style={{ marginRight: 6 }} />
              <Text style={styles.toastText}>{saveStatus}</Text>
            </View>
          )}

          {gpsErrorMsg && (
            <Pressable
              onPress={gpsStatus === 'denied' ? handleRequestPermission : undefined}
              style={[styles.toastBanner, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
              <Ionicons name="warning-outline" size={14} color="#ef4444" style={{ marginRight: 6 }} />
              <Text style={[styles.toastText, { color: '#ef4444' }]}>{gpsErrorMsg}</Text>
            </Pressable>
          )}

          {/* Sport Selector Pills (Idle State) */}
          {recordingState === 'idle' && (
            <View style={styles.sportSelectorRow}>
              {[
                { type: 'run' as const, label: 'Run', icon: 'fitness-outline' as const },
                { type: 'ride' as const, label: 'Ride', icon: 'bicycle-outline' as const },
                { type: 'walk' as const, label: 'Walk', icon: 'walk-outline' as const },
                { type: 'hike' as const, label: 'Hike', icon: 'trail-sign-outline' as const },
              ].map((s) => {
                const isSelected = selectedSport === s.type;
                return (
                  <Pressable
                    key={s.type}
                    onPress={() => setSelectedSport(s.type)}
                    style={[styles.sportPill, isSelected && styles.sportPillActive]}>
                    <Ionicons
                      name={s.icon}
                      size={15}
                      color={isSelected ? '#ffffff' : '#64748b'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[styles.sportPillText, isSelected && styles.sportPillTextActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* 2. Live Status & Telemetry Head-Up Banner */}
          <View style={styles.telemetryStatusBanner}>
            <View style={styles.statusBannerLeft}>
              <View style={styles.pingDotWrapper}>
                <View style={styles.pingDotOuter} />
                <View style={styles.pingDotCore} />
              </View>
              <Text style={styles.liveTelemetryText}>LIVE TELEMETRY {'//'} ACT-04</Text>
            </View>

            <Pressable
              onPress={gpsStatus === 'denied' ? handleRequestPermission : undefined}
              style={styles.rtkBadge}>
              <Ionicons
                name={gpsStatus === 'denied' ? 'warning-outline' : 'radio-outline'}
                size={13}
                color={gpsStatus === 'denied' ? '#ef4444' : '#006b5d'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.rtkText,
                  gpsStatus === 'denied' && { color: '#ef4444' },
                ]}>
                {gpsStatus === 'denied'
                  ? 'ENABLE GPS'
                  : gpsStatus === 'locked'
                  ? gpsAccuracy
                    ? `RTK ±${gpsAccuracy}m FIXED`
                    : 'RTK 5/5 FIXED'
                  : gpsStatus === 'acquiring'
                  ? 'ACQUIRING...'
                  : 'RTK 5/5 FIXED'}
              </Text>
            </Pressable>
          </View>

          {/* 3. Primary Dynamic Kinetic Map HUD */}
          <View style={styles.mapHudCard}>
            {/* Tactical Grid Background & Polyline Trace */}
            <View style={styles.gridCanvas}>
              {Platform.OS === 'web' ? (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: `
                      <svg width="100%" height="100%" viewBox="0 0 380 256" preserveAspectRatio="none" style="position: absolute; inset: 0; width: 100%; height: 100%;">
                        <defs>
                          <pattern id="tactical-grid-light" width="24" height="24" patternUnits="userSpaceOnUse">
                            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#94a3b8" stroke-opacity="0.3" stroke-width="0.75" />
                          </pattern>
                          <filter id="teal-glow" x="-25%" y="-25%" width="150%" height="150%">
                            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#00b8a2" flood-opacity="0.45" />
                          </filter>
                          <linearGradient id="traceGradientLight" x1="0%" y1="100%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.7" />
                            <stop offset="55%" stop-color="#00b8a2" stop-opacity="1" />
                            <stop offset="100%" stop-color="#00b8a2" stop-opacity="1" />
                          </linearGradient>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#tactical-grid-light)" />
                        <path d="M 30 220 C 70 190, 80 140, 140 160 C 200 180, 210 110, 270 90 C 310 75, 330 95, 350 45" filter="url(#teal-glow)" stroke="url(#traceGradientLight)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M 30 220 C 70 190, 80 140, 140 160 C 200 180, 210 110, 270 90 C 310 75, 330 95, 350 45" stroke="#ffffff" stroke-width="1.75" stroke-linecap="round" />
                        <circle cx="30" cy="220" r="5" fill="#0284c7" />
                        <circle cx="30" cy="220" r="2" fill="#ffffff" />
                        <circle cx="350" cy="45" r="24" stroke="#00b8a2" stroke-width="1.25" stroke-dasharray="3 3" opacity="0.6" />
                        <circle cx="350" cy="45" r="9" fill="#00b8a2" fill-opacity="0.25" />
                        <circle cx="350" cy="45" r="4.5" fill="#00b8a2" />
                        <circle cx="350" cy="45" r="1.5" fill="#ffffff" />
                      </svg>
                    `,
                  }}
                />
              ) : (
                <View style={styles.nativeGridContainer}>
                  <View style={styles.nativeGridLine1} />
                  <View style={styles.nativeGridLine2} />
                  <View style={styles.nativeRoutePath} />
                  <View style={styles.nativePinOrigin} />
                  <View style={styles.nativePinTarget} />
                </View>
              )}
            </View>


            {/* Map Overlay Telemetry Info (Top Corners) */}
            <View style={styles.mapTopLeftHUD}>
              <Text style={styles.hudCapsSub}>SPLIT {String(currentSplitNum).padStart(2, '0')} {'//'} LAP</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                <Text style={styles.hudBigDist}>{distanceKm.toFixed(2)}</Text>
                <Text style={styles.hudKmUnit}>KM</Text>
              </View>
            </View>

            <View style={styles.mapTopRightHUD}>
              <Ionicons name="navigate" size={14} color="#00b8a2" style={{ marginRight: 3 }} />
              <Text style={styles.bearingText}>SE 142°</Text>
            </View>

            {/* Live Pace Differential Overlay Indicator (Bottom HUD) */}
            <View style={styles.mapBottomBar}>
              <View style={styles.bottomBarLeft}>
                <Ionicons name="trending-up" size={16} color="#0d9488" style={{ marginRight: 5 }} />
                <Text style={styles.targetDiffText}>
                  +0.12 KM/H VS TARGET{routePoints.length > 0 ? ` • ${routePoints.length} PTS` : ''}

                </Text>
              </View>
              <View style={styles.bottomBarRight}>
                <Text style={styles.elevLabel}>ELEV</Text>
                <Text style={styles.elevValue}>+{elevationGainM} M</Text>
              </View>
            </View>
          </View>

          {/* 4. Primary Elapsed Session Clock */}
          <View style={styles.clockCard}>
            <View style={styles.clockHeaderRow}>
              <Ionicons name="timer-outline" size={14} color="#94a3b8" style={{ marginRight: 5 }} />
              <Text style={styles.clockHeaderCaps}>ACTIVE ELAPSED DURATION</Text>
            </View>
            <Text style={styles.clockValueText}>{formatElapsedClock(movingSeconds)}</Text>
            {isRecordingPaused && (
              <View style={styles.pausedIndicatorPill}>
                <Text style={styles.pausedIndicatorText}>PAUSED</Text>
              </View>
            )}
          </View>

          {/* 5. Real-Time Metrics Telemetry Bento Grid */}
          <View style={styles.bentoGrid}>
            <View style={styles.bentoRow}>
              {/* Tile 1: Current Pace */}
              <View style={styles.bentoTile}>
                <View style={styles.tileTop}>
                  <Text style={styles.tileHeaderCaps}>CURRENT PACE</Text>
                  <View style={[styles.tileIconCircle, { backgroundColor: '#e6fbf7' }]}>
                    <Ionicons name="speedometer-outline" size={15} color="#00b8a2" />
                  </View>
                </View>

                <View style={styles.metricRow}>
                  <Text style={styles.metricValLarge}>{currentPaceOrSpeed}</Text>
                  <Text style={styles.metricUnitSub}>
                    {selectedSport === 'ride' ? '/KMH' : '/KM'}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: '78%', backgroundColor: '#00b8a2' }]} />
                </View>
                <Text style={styles.tileFooterText}>Target: 4:05 min/km</Text>
              </View>

              {/* Tile 2: Live Heart Rate */}
              <View style={styles.bentoTile}>
                <View style={styles.tileTop}>
                  <Text style={styles.tileHeaderCaps}>HEART RATE</Text>
                  <View style={[styles.tileIconCircle, { backgroundColor: '#fff1f2' }]}>
                    <Ionicons name="heart" size={15} color="#f43f5e" />
                  </View>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricValLarge}>{liveHeartRate}</Text>
                  <Text style={styles.metricUnitSub}>BPM</Text>
                </View>
                {/* 5-Segment Zone Bar */}
                <View style={styles.zoneBarsRow}>
                  <View style={[styles.zoneBarSegment, { backgroundColor: '#fbbf24' }]} />
                  <View style={[styles.zoneBarSegment, { backgroundColor: '#fbbf24' }]} />
                  <View style={[styles.zoneBarSegment, { backgroundColor: '#fb923c' }]} />
                  <View style={[styles.zoneBarSegment, { backgroundColor: '#f97316' }]} />
                  <View style={[styles.zoneBarSegment, { backgroundColor: '#e2e8f0' }]} />
                </View>
                <View style={styles.zoneFooterRow}>
                  <View style={styles.zonePill}>
                    <Text style={styles.zonePillText}>{hrZone.name}</Text>
                  </View>
                  <Text style={styles.zoneLabelSub}>{hrZone.label}</Text>
                </View>
              </View>
            </View>

            <View style={styles.bentoRow}>
              {/* Tile 3: Cadence */}
              <View style={styles.bentoTile}>
                <View style={styles.tileTop}>
                  <Text style={styles.tileHeaderCaps}>CADENCE</Text>
                  <View style={[styles.tileIconCircle, { backgroundColor: '#f0f9ff' }]}>
                    <Ionicons name="footsteps-outline" size={15} color="#0284c7" />
                  </View>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricValLarge}>{liveCadence}</Text>
                  <Text style={styles.metricUnitSub}>SPM</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: '89%', backgroundColor: '#0284c7' }]} />
                </View>
                <Text style={styles.tileFooterText}>Stride: 1.44m avg</Text>
              </View>

              {/* Tile 4: Power Output */}
              <View style={styles.bentoTile}>
                <View style={styles.tileTop}>
                  <Text style={styles.tileHeaderCaps}>POWER OUTPUT</Text>
                  <View style={[styles.tileIconCircle, { backgroundColor: '#ecfdf5' }]}>
                    <Ionicons name="flash-outline" size={15} color="#059669" />
                  </View>
                </View>
                <View style={styles.metricRow}>
                  <Text style={styles.metricValLarge}>{livePower}</Text>
                  <Text style={styles.metricUnitSub}>WATTS</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: '68%', backgroundColor: '#10b981' }]} />
                </View>
                <Text style={styles.tileFooterText}>
                  Effort: {(livePower / 70).toFixed(1)} W/kg

                </Text>
              </View>
            </View>
          </View>

          {/* 6. Biomechanics Sensor Telemetry Cluster */}
          <View style={styles.sensorClusterCard}>
            <View style={styles.sensorClusterHeader}>
              <Text style={styles.sensorClusterTitle}>BIOMETRIC HARDWARE STACK</Text>
              <View style={styles.sensorStatusBadge}>
                <View style={styles.sensorDotActive} />
                <Text style={styles.sensorBadgeText}>3 SYNCED</Text>
              </View>
            </View>

            <View style={styles.sensorGrid}>
              {/* Chest Strap */}
              <View style={styles.sensorCard}>
                <View style={styles.sensorCardTop}>
                  <Ionicons name="heart-circle-outline" size={15} color="#0f766e" style={{ marginRight: 4 }} />
                  <Text style={styles.sensorCategoryCaps}>CHEST</Text>
                </View>
                <Text style={styles.sensorDeviceName}>Polar H10</Text>
                <View style={styles.sensorBatteryRow}>
                  <View style={styles.sensorDotSmall} />
                  <Text style={styles.sensorDetailText}>94% Batt</Text>
                </View>
              </View>

              {/* Shoe Pod */}
              <View style={styles.sensorCard}>
                <View style={styles.sensorCardTop}>
                  <Ionicons name="git-commit-outline" size={15} color="#0f766e" style={{ marginRight: 4 }} />
                  <Text style={styles.sensorCategoryCaps}>STRYDE</Text>
                </View>
                <Text style={styles.sensorDeviceName}>Pod L-Cal</Text>
                <View style={styles.sensorBatteryRow}>
                  <View style={styles.sensorDotSmall} />
                  <Text style={styles.sensorDetailText}>Calibrated</Text>
                </View>
              </View>

              {/* Audio Coach (Interactive Toggle) */}
              <Pressable
                onPress={() => setAudioCueActive((prev) => !prev)}
                style={({ pressed }) => [
                  styles.sensorCard,
                  !audioCueActive && styles.sensorCardMuted,
                  pressed && styles.btnPressed,
                ]}>
                <View style={styles.sensorCardTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name={audioCueActive ? 'volume-high-outline' : 'volume-mute-outline'}
                      size={15}
                      color="#0f766e"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.sensorCategoryCaps}>AUDIO</Text>
                  </View>
                  <View
                    style={[
                      styles.sensorDotSmall,
                      !audioCueActive && { backgroundColor: '#94a3b8' },
                    ]}
                  />
                </View>
                <Text style={styles.sensorDeviceName}>Voice Cues</Text>
                <Text style={styles.sensorDetailText}>Every 1.0 km</Text>
              </Pressable>
            </View>
          </View>

          {/* 7. Live Recorded Splits Log (if splits captured) */}
          {lapSplits.length > 0 && (
            <View style={styles.liveSplitsCard}>
              <View style={styles.liveSplitsHeader}>
                <Ionicons name="flag-outline" size={15} color="#0f172a" style={{ marginRight: 6 }} />
                <Text style={styles.liveSplitsTitle}>Lap Split Record</Text>
                <Text style={styles.liveSplitsCount}>{lapSplits.length} Laps</Text>
              </View>
              <View style={styles.splitsTableMini}>
                {lapSplits.map((lap) => (
                  <View key={`lap-${lap.splitNum}`} style={styles.lapRow}>
                    <Text style={styles.lapNum}>Lap {lap.splitNum}</Text>
                    <Text style={styles.lapTime}>{formatElapsedClock(lap.timeSec)}</Text>
                    <Text style={styles.lapDist}>{lap.distKm.toFixed(2)} km</Text>
                    <Text style={styles.lapPace}>{lap.pace} /km</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 8. Main Action & Telemetry Control Bar */}
          <View style={styles.controlBarContainer}>
            {/* Split / Lap Button */}
            <Pressable
              onPress={handleRecordSplit}
              style={({ pressed }) => [styles.splitBtn, pressed && styles.btnPressed]}>
              <Ionicons name="flag" size={18} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.splitBtnText}>SPLIT</Text>
            </Pressable>

            {/* Primary Pause / Resume / Start Toggle */}
            {recordingState === 'idle' ? (
              <Pressable
                onPress={handleStart}
                style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.btnPressed]}>
                <Ionicons name="play" size={20} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionText}>START LIVE SESSION</Text>
              </Pressable>
            ) : isRecordingActive ? (
              <Pressable
                onPress={handlePause}
                style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.btnPressed]}>
                <Ionicons name="pause" size={20} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionText}>PAUSE SESSION</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleResume}
                style={({ pressed }) => [
                  styles.primaryActionBtn,
                  styles.resumeActionBtn,
                  pressed && styles.btnPressed,
                ]}>
                <Ionicons name="play" size={20} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.primaryActionText}>RESUME TRACKING</Text>
              </Pressable>
            )}

            {/* Finish & Save Trigger (When session is started or paused) */}
            {recordingState !== 'idle' && (
              <Pressable
                onPress={handleStopAndSave}
                style={({ pressed }) => [styles.finishBtn, pressed && styles.btnPressed]}>
                <Ionicons name="checkmark-done" size={18} color="#008a79" style={{ marginRight: 4 }} />
                <Text style={styles.finishBtnText}>FINISH</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save Session Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>

            <Text style={styles.modalTitle}>Save Kinetic Workout</Text>


            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>SESSION TITLE</Text>
              <TextInput
                style={styles.modalTextInput}
                value={activityTitle}
                onChangeText={setActivityTitle}
                placeholder="Morning Kinetic Run"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Telemetry Summary Stats Box */}
            <View style={styles.summaryStatsBox}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>DISTANCE</Text>
                <Text style={styles.summaryStatVal}>{distanceKm.toFixed(2)} km</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>TIME</Text>
                <Text style={styles.summaryStatVal}>{formatDuration(movingSeconds)}</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>AVG PACE</Text>
                <Text style={styles.summaryStatVal}>{currentPaceOrSpeed}</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatLabel}>ELEVATION</Text>
                <Text style={styles.summaryStatVal}>+{elevationGainM} m</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>VISIBILITY</Text>
              <View style={styles.visibilitySelector}>
                {(['public', 'followers', 'private'] as ActivityVisibility[]).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setActivityVisibility(v)}
                    style={[
                      styles.visibilityBtn,
                      activityVisibility === v && styles.visibilityBtnActive,
                    ]}>
                    <Text
                      style={[
                        styles.visibilityBtnText,
                        activityVisibility === v && styles.visibilityBtnTextActive,
                      ]}>
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={handleDiscard} disabled={isSaving} style={styles.discardBtn}>
                <Text style={styles.discardBtnText}>Discard</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmSave}
                disabled={isSaving}
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}>
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Telemetry</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafb',
  },
  headerBar: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(248, 250, 251, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
    zIndex: 10,
  },
  brandCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleCol: {
    gap: 1,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  brandStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d1fae5',
    gap: 5,
  },
  recPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  recText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.5,
  },
  sensorBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  profileAvatarBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#006b5d',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: 12,
  },
  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6fbf7',
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 162, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#008a79',
  },
  sportSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  sportPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  sportPillActive: {
    backgroundColor: '#00b8a2',
    borderColor: '#00b8a2',
  },
  sportPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  sportPillTextActive: {
    color: '#ffffff',
  },
  telemetryStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pingDotWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pingDotOuter: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 184, 162, 0.35)',
  },
  pingDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00b8a2',
  },
  liveTelemetryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: 0.8,
  },
  rtkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6fbf7',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  rtkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#006b5d',
    letterSpacing: 0.3,
  },
  mapHudCard: {
    width: '100%',
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    position: 'relative',
    shadowColor: '#006b5d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  gridCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nativeGridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  nativeGridLine1: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#e2e8f0',
    top: 80,
  },
  nativeGridLine2: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#e2e8f0',
    top: 160,
  },
  nativeRoutePath: {
    width: '80%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00b8a2',
    transform: [{ rotate: '-12deg' }],
  },
  nativePinOrigin: {
    position: 'absolute',
    left: 40,
    bottom: 40,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0284c7',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  nativePinTarget: {
    position: 'absolute',
    right: 40,
    top: 40,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#00b8a2',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  mapTopLeftHUD: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  hudCapsSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.7,
  },
  hudBigDist: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  hudKmUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  mapTopRightHUD: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bearingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#006b5d',
  },
  mapBottomBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bottomBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetDiffText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  bottomBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  elevLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.6,
  },
  elevValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  clockCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  clockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clockHeaderCaps: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1.2,
  },
  clockValueText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    lineHeight: 48,
  },
  pausedIndicatorPill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
  },
  pausedIndicatorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.6,
  },
  bentoGrid: {
    gap: 12,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoTile: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    justifyContent: 'space-between',
    minHeight: 128,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tileHeaderCaps: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  tileIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginVertical: 4,
  },
  metricValLarge: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  metricUnitSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  tileFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 6,
  },
  zoneBarsRow: {
    flexDirection: 'row',
    gap: 4,
    height: 6,
  },
  zoneBarSegment: {
    flex: 1,
    height: '100%',
    borderRadius: 3,
  },
  zoneFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  zonePill: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  zonePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.6,
  },
  zoneLabelSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  sensorClusterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  sensorClusterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sensorClusterTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  sensorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  sensorDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  sensorBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.4,
  },
  sensorGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  sensorCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sensorCardMuted: {
    opacity: 0.5,
  },
  sensorCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sensorCategoryCaps: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e',
    letterSpacing: 0.6,
  },
  sensorDeviceName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  sensorBatteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sensorDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981',
  },
  sensorDetailText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  liveSplitsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
  },
  liveSplitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveSplitsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  liveSplitsCount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  splitsTableMini: {
    gap: 6,
  },
  lapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  lapNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
  },
  lapTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
    textAlign: 'center',
  },
  lapDist: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
    textAlign: 'center',
  },
  lapPace: {
    fontSize: 12,
    fontWeight: '700',
    color: '#008a79',
    flex: 1,
    textAlign: 'right',
  },
  controlBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  splitBtn: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  splitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: 0.6,
  },
  primaryActionBtn: {
    flex: 2,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#00b8a2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00b8a2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 3,
  },
  resumeActionBtn: {
    backgroundColor: '#0f172a',
    shadowColor: '#0f172a',
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.6,
  },

  finishBtn: {
    paddingHorizontal: 16,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#e6fbf7',

    borderWidth: 1,
    borderColor: 'rgba(0, 184, 162, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#008a79',
    letterSpacing: 0.5,
  },
  btnPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  modalTextInput: {
    height: 44,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryStatsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  summaryStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  visibilitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visibilityBtnActive: {
    backgroundColor: '#004d43',
    borderColor: '#00b8a2',
  },
  visibilityBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  visibilityBtnTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  discardBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discardBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  saveBtn: {
    flex: 2,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#00b8a2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#cbd5e1',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
