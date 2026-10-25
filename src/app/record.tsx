import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
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

import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { ActivityType, ActivityVisibility } from '@/types/fitness';
import { useAuth } from '@/context/auth-context';
import { activityService } from '@/services/activity-service';
import {
  GpsCoordinate,
  calculateTrackDistanceKm,
  formatDuration,
  calculatePace,
  calculateSpeed,
  calculateMovingTimeSeconds,
  generateSvgPathFromCoordinates,
} from '@/utils/geo';
import { locationService } from '@/services/location-service';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

type RecordingState = 'idle' | 'recording' | 'paused';
type GpsStatus = 'idle' | 'checking' | 'acquiring' | 'locked' | 'paused' | 'denied' | 'error' | 'unsupported';

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const { user, isDemoMode } = useAuth();

  // Sport selector
  const [selectedSport, setSelectedSport] = useState<ActivityType | 'hike'>('run');
  const [activityVisibility, setActivityVisibility] = useState<ActivityVisibility>('public');

  // Tracking state
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Real GPS coordinate points recorded during active session
  const [routePoints, setRoutePoints] = useState<GpsCoordinate[]>([]);
  const routePointsRef = useRef<GpsCoordinate[]>([]);
  const unsubscribeGpsRef = useRef<(() => void) | null>(null);

  // Time & Distance telemetry
  const [startTimeMs, setStartTimeMs] = useState<number | null>(null);
  const [pausedDurationMs, setPausedDurationMs] = useState<number>(0);
  const [pauseStartMs, setPauseStartMs] = useState<number | null>(null);
  const [movingSeconds, setMovingSeconds] = useState<number>(0);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [elevationGainM, setElevationGainM] = useState<number>(0);
  const [currentPaceOrSpeed, setCurrentPaceOrSpeed] = useState<string>('--:--');

  // Settings
  const [autoPause, setAutoPause] = useState(true);
  const [audioCues, setAudioCues] = useState(true);

  // Save Modal States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activityTitle, setActivityTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDuplicateSaveLocked, setIsDuplicateSaveLocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const isLiveUser = Boolean(user && !isDemoMode);

  // Check hardware and permission state on initial mount
  useEffect(() => {
    let isMounted = true;

    async function initialCheck() {
      if (!locationService.isSupported()) {
        if (isMounted) {
          setGpsStatus('unsupported');
          setGpsErrorMsg('GPS location sensor is not supported in this browser or device environment.');
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
          setGpsErrorMsg('Location permission is denied. Enable location in device settings to record real GPS routes.');
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

  // Moving timer ticker (recalculates every 1 second during recording)
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

        // Update live pace or speed based on current track distance and moving time
        const currentDistance = calculateTrackDistanceKm(routePointsRef.current);
        setDistanceKm(currentDistance);

        if (selectedSport === 'ride') {
          setCurrentPaceOrSpeed(calculateSpeed(currentDistance, movingSec));
        } else {
          setCurrentPaceOrSpeed(calculatePace(currentDistance, movingSec));
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [recordingState, startTimeMs, pausedDurationMs, selectedSport]);

  // Handle incoming GPS location fixes
  const handleLocationFix = useCallback(
    (fix: GpsCoordinate) => {
      setGpsStatus('locked');
      if (fix.accuracy !== null && fix.accuracy !== undefined) {
        setGpsAccuracy(Math.round(fix.accuracy));
      }

      // Only accumulate track points when actively recording (not paused or idle)
      if (recordingState === 'recording') {
        const currentPoints = routePointsRef.current;
        const prevPoint = currentPoints.length > 0 ? currentPoints[currentPoints.length - 1] : null;

        // Calculate elevation gain if altitude is provided
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

        const updated = [...currentPoints, fix];
        routePointsRef.current = updated;
        setRoutePoints(updated);

        const newDist = calculateTrackDistanceKm(updated);
        setDistanceKm(newDist);
      }
    },
    [recordingState]
  );

  // Handle GPS errors from sensor
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

  // Request permission explicitly
  const handleRequestPermission = async () => {
    setGpsErrorMsg(null);
    setGpsStatus('checking');
    const perm = await locationService.requestPermission();
    if (perm.granted) {
      setGpsStatus('idle');
      setGpsErrorMsg(null);
    } else {
      setGpsStatus('denied');
      setGpsErrorMsg('Location permission was denied. Please check your browser or device settings.');
    }
  };

  // Start activity tracking
  const handleStart = async () => {
    setGpsErrorMsg(null);
    setSaveStatus(null);

    if (!locationService.isSupported()) {
      setGpsStatus('unsupported');
      setGpsErrorMsg('GPS location tracking is not supported on this device/browser.');
      return;
    }

    // Check permission before initiating tracking
    const permState = await locationService.checkPermission();
    if (!permState.granted) {
      const reqState = await locationService.requestPermission();
      if (!reqState.granted) {
        setGpsStatus('denied');
        setGpsErrorMsg('Location permission is required to track your route. Please grant location access.');
        return;
      }
    }

    // Reset session metrics
    routePointsRef.current = [];
    setRoutePoints([]);
    setDistanceKm(0);
    setElevationGainM(0);
    setMovingSeconds(0);
    setPausedDurationMs(0);
    setPauseStartMs(null);

    const now = Date.now();
    setStartTimeMs(now);
    setRecordingState('recording');
    setGpsStatus('acquiring');

    // Subscribe to hardware GPS stream
    try {
      if (unsubscribeGpsRef.current) {
        unsubscribeGpsRef.current();
      }
      const unsubscribe = await locationService.startTracking(handleLocationFix, handleLocationError);
      unsubscribeGpsRef.current = unsubscribe;

      if (locationService.isBackgroundSupported()) {
        locationService.startBackgroundTracking(handleLocationFix, handleLocationError).catch(() => {});
      }
    } catch (err: any) {
      setGpsStatus('error');
      setGpsErrorMsg(`Could not start GPS tracking: ${err.message}`);
    }
  };

  // Pause tracking
  const handlePause = () => {
    if (recordingState === 'recording') {
      setRecordingState('paused');
      setPauseStartMs(Date.now());
      setGpsStatus('paused');
    }
  };

  // Resume tracking
  const handleResume = () => {
    if (recordingState === 'paused') {
      const now = Date.now();
      const extraPaused = pauseStartMs ? now - pauseStartMs : 0;
      setPausedDurationMs((prev) => prev + extraPaused);
      setPauseStartMs(null);
      setRecordingState('recording');
      setGpsStatus('locked');
    }
  };

  // Stop / Finish activity
  const handleStop = () => {
    // Teardown GPS subscription
    if (unsubscribeGpsRef.current) {
      unsubscribeGpsRef.current();
      unsubscribeGpsRef.current = null;
    }
    if (locationService.isBackgroundSupported()) {
      locationService.stopBackgroundTracking().catch(() => {});
    }

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

    const finalDistance = calculateTrackDistanceKm(routePointsRef.current);
    setDistanceKm(finalDistance);

    setRecordingState('idle');
    setGpsStatus('idle');

    // Suggest default title
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    const sportName =
      selectedSport === 'run'
        ? 'Run'
        : selectedSport === 'ride'
        ? 'Ride'
        : selectedSport === 'walk'
        ? 'Walk'
        : 'Hike';
    setActivityTitle(`${timeOfDay} ${sportName}`);

    setIsDuplicateSaveLocked(false);
    setShowSaveModal(true);
  };

  // Confirm save
  const handleConfirmSave = async () => {
    if (isSaving || isDuplicateSaveLocked) {
      return; // Prevent duplicate rapid clicks
    }

    setIsSaving(true);
    setIsDuplicateSaveLocked(true);

    try {
      const pts = routePointsRef.current;
      const finalDistance = calculateTrackDistanceKm(pts);
      const formattedDuration = formatDuration(movingSeconds);
      const paceVal =
        selectedSport === 'ride'
          ? calculateSpeed(finalDistance, movingSeconds)
          : calculatePace(finalDistance, movingSeconds);
      const speedOrPaceLabel = selectedSport === 'ride' ? 'Avg Speed' : 'Avg Pace';
      const polylineSvg = generateSvgPathFromCoordinates(pts, 320, 80, 8);

      if (isLiveUser && user) {
        await activityService.createActivity(user.id, {
          title: activityTitle.trim() || `${selectedSport.toUpperCase()} Session`,
          type: selectedSport === 'hike' ? 'walk' : selectedSport,
          distanceKm: finalDistance,
          durationSeconds: movingSeconds,
          durationFormatted: formattedDuration,
          paceOrSpeedFormatted: paceVal,
          paceOrSpeedLabel: speedOrPaceLabel,
          elevationMeters: elevationGainM,
          calories: Math.max(10, Math.round(finalDistance * 65)),
          location: pts.length > 0 ? 'Outdoor GPS Session' : 'Manual Entry',
          polylinePreview: polylineSvg,
          visibility: activityVisibility,
          routePoints: pts,
        });
        setSaveStatus(
          `Saved ${finalDistance} km (${pts.length} GPS points) to your training log!`
        );
      } else {
        setSaveStatus(
          `Demo Mode: Workout completed locally (${finalDistance} km, ${pts.length} points). Sign in to persist activities.`
        );
      }

      setShowSaveModal(false);
      setRecordingState('idle');
      routePointsRef.current = [];
      setRoutePoints([]);
      setDistanceKm(0);
      setMovingSeconds(0);
      setElevationGainM(0);
    } catch (err: any) {
      console.error('Error saving activity:', err);
      setSaveStatus(`Failed to save: ${err.message}`);
      setIsDuplicateSaveLocked(false); // allow retry on error
    } finally {
      setIsSaving(false);
    }
  };

  // Discard recorded workout
  const handleDiscard = () => {
    if (unsubscribeGpsRef.current) {
      unsubscribeGpsRef.current();
      unsubscribeGpsRef.current = null;
    }
    setShowSaveModal(false);
    setRecordingState('idle');
    setGpsStatus('idle');
    routePointsRef.current = [];
    setRoutePoints([]);
    setDistanceKm(0);
    setMovingSeconds(0);
    setElevationGainM(0);
    setSaveStatus(null);
    setGpsErrorMsg(null);
    setIsDuplicateSaveLocked(false);
  };

  const sportColor = {
    run: '#FF6B00',
    ride: '#00D2D3',
    walk: '#10B981',
    hike: '#F59E0B',
  }[selectedSport];

  const bottomPadding = (insets.bottom || 16) + BottomTabInset + Spacing.four;

  // GPS Badge styling
  const renderGpsBadge = () => {
    if (gpsStatus === 'denied') {
      return (
        <Pressable onPress={handleRequestPermission} style={[styles.gpsStatusBadge, styles.gpsDeniedBadge]}>
          <View style={[styles.gpsDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.gpsStatusText, { color: '#EF4444' }]}>GPS DENIED (TAP TO FIX)</Text>
        </Pressable>
      );
    }
    if (gpsStatus === 'unsupported') {
      return (
        <View style={[styles.gpsStatusBadge, styles.gpsDeniedBadge]}>
          <View style={[styles.gpsDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.gpsStatusText, { color: '#F59E0B' }]}>GPS UNSUPPORTED</Text>
        </View>
      );
    }
    if (gpsStatus === 'acquiring') {
      return (
        <View style={[styles.gpsStatusBadge, styles.gpsAcquiringBadge]}>
          <ActivityIndicator size="small" color="#F59E0B" />
          <Text style={[styles.gpsStatusText, { color: '#F59E0B' }]}>SEARCHING SATELLITES...</Text>
        </View>
      );
    }
    if (gpsStatus === 'locked') {
      return (
        <View style={styles.gpsStatusBadge}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsStatusText}>
            GPS LOCKED {gpsAccuracy !== null ? `(±${gpsAccuracy}m)` : ''}
          </Text>
        </View>
      );
    }
    if (gpsStatus === 'paused') {
      return (
        <View style={[styles.gpsStatusBadge, styles.gpsPausedBadge]}>
          <View style={[styles.gpsDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.gpsStatusText, { color: '#F59E0B' }]}>GPS PAUSED</Text>
        </View>
      );
    }
    return (
      <View style={[styles.gpsStatusBadge, styles.gpsIdleBadge]}>
        <View style={[styles.gpsDot, { backgroundColor: '#64748B' }]} />
        <Text style={[styles.gpsStatusText, { color: '#94A3B8' }]}>GPS STANDBY</Text>
      </View>
    );
  };

  const isRecordingActive = recordingState === 'recording';
  const isRecordingPaused = recordingState === 'paused';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* Apple Large Title Navigation Header */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <Text style={styles.subtitleHeader}>WORKOUT</Text>
              <Text style={styles.largeTitle}>Record</Text>
            </View>
            <View style={styles.headerRight}>
              {renderGpsBadge()}
            </View>
          </View>

          {/* Feedback/Save Status Banner */}
          {saveStatus && (
            <View style={styles.saveStatusBanner}>
              <Text style={styles.saveStatusText}>{saveStatus}</Text>
            </View>
          )}

          {/* GPS Error or Permission Alert Banner */}
          {gpsErrorMsg && (
            <View style={styles.gpsErrorBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="warning-outline" size={16} color="#FF9500" />
                <Text style={styles.gpsErrorTitle}>Location Notice</Text>
              </View>
              <Text style={styles.gpsErrorText}>{gpsErrorMsg}</Text>
              {gpsStatus === 'denied' && (
                <Pressable onPress={handleRequestPermission} style={styles.permissionActionBtn}>
                  <Text style={styles.permissionActionBtnText}>Grant Location Permission</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Sport Selector */}
          <View style={styles.sportSelector}>
            {[
              { type: 'run' as const, label: 'Run', iconName: 'fitness-outline' as const },
              { type: 'ride' as const, label: 'Ride', iconName: 'bicycle-outline' as const },
              { type: 'walk' as const, label: 'Walk', iconName: 'walk-outline' as const },
              { type: 'hike' as const, label: 'Hike', iconName: 'trail-sign-outline' as const },
            ].map((sport) => {
              const isSelected = selectedSport === sport.type;
              return (
                <Pressable
                  key={sport.type}
                  onPress={() => recordingState === 'idle' && setSelectedSport(sport.type)}
                  style={[
                    styles.sportBtn,
                    isSelected && { backgroundColor: sportColor, borderColor: sportColor },
                    recordingState !== 'idle' && !isSelected && { opacity: 0.5 },
                  ]}>
                  <Ionicons
                    name={sport.iconName}
                    size={20}
                    color={isSelected ? '#FFFFFF' : '#8E8E93'}
                  />
                  <Text style={[styles.sportLabel, isSelected && styles.sportLabelSelected]}>
                    {sport.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* HUD Metric Display */}
          <View style={styles.hudContainer}>
            {/* Main Timer Display */}
            <View style={styles.timerBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                {recordingState === 'recording' && (
                  <MotiView
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.4, 1],
                    }}
                    transition={{
                      type: 'timing',
                      duration: 1000,
                      loop: true,
                    } as any}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#FF3B30',
                    }}
                  />
                )}
                <Text style={styles.hudLabel}>ELAPSED MOVING TIME</Text>
              </View>
              <Text style={styles.timerValue}>{formatDuration(movingSeconds)}</Text>
              {isRecordingPaused && <Text style={styles.pausedBadge}>PAUSED</Text>}
            </View>

            {/* Split Metrics Grid */}
            <View style={styles.hudGrid}>
              <View style={styles.hudCol}>
                <Text style={styles.hudLabel}>DISTANCE</Text>
                <View style={styles.hudValRow}>
                  <Text style={styles.hudVal}>{distanceKm.toFixed(2)}</Text>
                  <Text style={styles.hudUnit}>km</Text>
                </View>
              </View>

              <View style={styles.hudCol}>
                <Text style={styles.hudLabel}>
                  {selectedSport === 'ride' ? 'SPEED' : 'PACE'}
                </Text>
                <View style={styles.hudValRow}>
                  <Text style={styles.hudVal}>{currentPaceOrSpeed}</Text>
                  <Text style={styles.hudUnit}>
                    {selectedSport === 'ride' ? 'km/h' : '/km'}
                  </Text>
                </View>
              </View>

              <View style={styles.hudCol}>
                <Text style={styles.hudLabel}>ELEV GAIN</Text>
                <View style={styles.hudValRow}>
                  <Text style={styles.hudVal}>{elevationGainM}</Text>
                  <Text style={styles.hudUnit}>m</Text>
                </View>
              </View>
            </View>

            {/* Live Telemetry Status Bar */}
            <View style={styles.telemetryBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {recordingState !== 'idle' && (
                  <MotiView
                    animate={{
                      scale: [1, 1.25, 1],
                    }}
                    transition={{
                      type: 'timing',
                      duration: 1200,
                      loop: true,
                    } as any}>
                    <Ionicons name="radio" size={13} color="#4FA99A" />
                  </MotiView>
                )}
                <Text style={styles.telemetryText}>
                  {recordingState !== 'idle'
                    ? `${routePoints.length} GPS Points • Live Tracking`
                    : 'Ready to track with device GPS'}
                </Text>
              </View>
            </View>
          </View>

          {/* Route Preview Card when points are recorded */}
          {routePoints.length >= 2 && (
            <View style={styles.routePreviewCard}>
              <View style={styles.routePreviewHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="navigate-outline" size={14} color="#4FA99A" />
                  <Text style={styles.routePreviewTitle}>RECORDED ROUTE TRACK</Text>
                </View>
                <Text style={styles.routePreviewSubtitle}>
                  {routePoints.length} ordered GPS fixes
                </Text>
              </View>
              <View style={styles.routeTrackVisual}>
                <Text style={styles.routeTrackCoords}>
                  Start: {routePoints[0].latitude.toFixed(4)}, {routePoints[0].longitude.toFixed(4)}
                </Text>
                <Text style={styles.routeTrackCoords}>
                  Latest: {routePoints[routePoints.length - 1].latitude.toFixed(4)},{' '}
                  {routePoints[routePoints.length - 1].longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          )}

          {/* Recording Controls */}
          <View style={styles.controlsSection}>
            {recordingState === 'idle' ? (
              <Pressable
                onPress={handleStart}
                style={({ pressed }) => [
                  styles.startBtn,
                  { backgroundColor: sportColor },
                  pressed && styles.pressed,
                ]}>
                <Text style={styles.startBtnText}>START {selectedSport.toUpperCase()}</Text>
              </Pressable>
            ) : (
              <View style={styles.activeControlsRow}>
                {isRecordingActive ? (
                  <Pressable
                    onPress={handlePause}
                    style={({ pressed }) => [styles.pauseBtn, pressed && styles.pressed]}>
                    <Text style={styles.pauseBtnText}>PAUSE</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleResume}
                    style={({ pressed }) => [styles.resumeBtn, pressed && styles.pressed]}>
                    <Text style={styles.resumeBtnText}>RESUME</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={handleStop}
                  style={({ pressed }) => [styles.stopBtn, pressed && styles.pressed]}>
                  <Text style={styles.stopBtnText}>FINISH & SAVE</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Cloud Persistence Notice */}
          <View style={styles.authNoticeCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons
                name={isLiveUser ? 'cloud-done-outline' : 'information-circle-outline'}
                size={16}
                color="#4FA99A"
              />
              <Text style={styles.authNoticeTitle}>
                {isLiveUser ? 'SUPABASE CLOUD SYNC ACTIVE' : 'DEMO RECORDING MODE'}
              </Text>
            </View>
            <Text style={styles.authNoticeText}>
              {isLiveUser
                ? `Logged in as ${user?.email}. Finished sessions will be saved directly into your Supabase activities table with compressed GPS telemetry and PostGIS route path.`
                : 'You are currently in Demo Mode. Finished activities calculate real device GPS telemetry, but will not persist to PostgreSQL until you sign in.'}
            </Text>
          </View>

          {/* Sensor Settings & Preferences */}
          <View style={styles.preferencesCard}>
            <Text style={styles.prefHeading}>Session Settings</Text>

            <Pressable onPress={() => setAutoPause((p) => !p)} style={styles.prefRow}>
              <View style={styles.prefTextGroup}>
                <Text style={styles.prefTitle}>Auto-Pause when stopped</Text>
                <Text style={styles.prefSub}>Pauses timer during traffic lights and rest</Text>
              </View>
              <View style={[styles.togglePill, autoPause && styles.togglePillActive]}>
                <Text style={styles.toggleText}>{autoPause ? 'ON' : 'OFF'}</Text>
              </View>
            </Pressable>

            <Pressable onPress={() => setAudioCues((c) => !c)} style={styles.prefRow}>
              <View style={styles.prefTextGroup}>
                <Text style={styles.prefTitle}>Audio Feedback Cues</Text>
                <Text style={styles.prefSub}>Announce split pace and distance every 1 km</Text>
              </View>
              <View style={[styles.togglePill, audioCues && styles.togglePillActive]}>
                <Text style={styles.toggleText}>{audioCues ? 'ON' : 'OFF'}</Text>
              </View>
            </Pressable>
            {Platform.OS === 'web' && (
              <View style={styles.webNoticeCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="globe-outline" size={15} color="#007AFF" />
                  <Text style={styles.webNoticeTitle}>Web Browser GPS Notice</Text>
                </View>
                <Text style={styles.webNoticeText}>
                  Web browsers suspend location tracking when this browser tab is inactive or mobile screens lock. To record runs with your screen locked, use Spandan on Android with native foreground service background tracking.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Save Activity Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save Completed Workout</Text>
            <Text style={styles.modalSub}>
              {formatDuration(movingSeconds)} • {distanceKm.toFixed(2)} km • {elevationGainM}m Elev
            </Text>

            {distanceKm === 0 && (
              <View style={styles.emptyTrackWarning}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="alert-circle-outline" size={16} color="#FF9500" />
                  <Text style={styles.emptyTrackWarningText}>
                    0.00 km recorded. If you just tested stationary recording, this session will save without distance.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>ACTIVITY TITLE</Text>
              <TextInput
                style={styles.modalInput}
                value={activityTitle}
                onChangeText={setActivityTitle}
                placeholder="Give your workout a name"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>VISIBILITY</Text>
              <View style={styles.visibilityRow}>
                {(['public', 'followers', 'private'] as ActivityVisibility[]).map((v) => {
                  const iconName: keyof typeof Ionicons.glyphMap =
                    v === 'public'
                      ? 'globe-outline'
                      : v === 'followers'
                      ? 'people-outline'
                      : 'lock-closed-outline';
                  const label = v.charAt(0).toUpperCase() + v.slice(1);
                  return (
                    <Pressable
                      key={v}
                      onPress={() => setActivityVisibility(v)}
                      style={[
                        styles.visBtn,
                        activityVisibility === v && styles.visBtnActive,
                      ]}>
                      <Ionicons
                        name={iconName}
                        size={14}
                        color={activityVisibility === v ? '#FFFFFF' : '#8E8E93'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.visBtnText,
                          activityVisibility === v && styles.visBtnTextActive,
                        ]}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                onPress={handleDiscard}
                disabled={isSaving}
                style={[styles.discardBtn, isSaving && styles.btnDisabled]}>
                <Text style={styles.discardBtnText}>Discard</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmSave}
                disabled={isSaving || isDuplicateSaveLocked}
                style={[styles.saveBtn, (isSaving || isDuplicateSaveLocked) && styles.saveBtnDisabled]}>
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {isLiveUser ? 'Save to Supabase' : 'Complete Demo'}
                  </Text>
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
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.select({ web: Spacing.four, default: Spacing.two }),
  },
  contentWrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: 16,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerLeft: {
    gap: 2,
  },
  headerRight: {
    marginBottom: 4,
  },
  subtitleHeader: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  largeTitle: {
    color: '#000000',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    paddingBottom: 2,
  },
  gpsStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    gap: 6,
  },
  gpsIdleBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
  },
  gpsAcquiringBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  gpsPausedBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  gpsDeniedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  gpsStatusText: {
    color: '#22C55E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  saveStatusBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4FA99A',
  },
  saveStatusText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  gpsErrorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    gap: 6,
  },
  gpsErrorTitle: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
  gpsErrorText: {
    color: '#F87171',
    fontSize: 12,
    lineHeight: 18,
  },
  permissionActionBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  permissionActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  sportSelector: {
    flexDirection: 'row',
    backgroundColor: '#EEEEF0',
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    gap: 6,
  },
  sportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sportIcon: {
    fontSize: 14,
  },
  sportLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  sportLabelSelected: {
    color: '#000000',
  },
  hudContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  timerBox: {
    alignItems: 'center',
    gap: 4,
  },
  hudLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timerValue: {
    color: '#000000',
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  pausedBadge: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  hudGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  hudCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  hudValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  hudVal: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '800',
  },
  hudUnit: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  telemetryBar: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    width: '100%',
    alignItems: 'center',
  },
  telemetryText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  routePreviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    gap: 8,
  },
  routePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routePreviewTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  routePreviewSubtitle: {
    color: '#4FA99A',
    fontSize: 11,
    fontWeight: '700',
  },
  routeTrackVisual: {
    backgroundColor: '#F8FAF9',
    borderRadius: 8,
    padding: 10,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  routeTrackCoords: {
    color: '#64748B',
    fontSize: 11,
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
  },
  controlsSection: {
    marginVertical: 4,
  },
  startBtn: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#4FA99A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  activeControlsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseBtn: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  pauseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  resumeBtn: {
    flex: 1,
    backgroundColor: '#22C55E',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  resumeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  stopBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  stopBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  authNoticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    gap: 4,
  },
  authNoticeTitle: {
    color: '#4FA99A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  authNoticeText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
  },
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    gap: 12,
  },
  prefHeading: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  prefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  prefTextGroup: {
    flex: 1,
    marginRight: 10,
    gap: 2,
  },
  prefTitle: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '600',
  },
  prefSub: {
    color: '#64748B',
    fontSize: 11,
  },
  togglePill: {
    backgroundColor: '#EEEEF0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  togglePillActive: {
    backgroundColor: '#4FA99A',
    borderColor: '#4FA99A',
  },
  toggleText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSub: {
    color: '#4FA99A',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyTrackWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  emptyTrackWarningText: {
    color: '#F59E0B',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  modalInputGroup: {
    gap: 6,
  },
  modalInputLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: '#F8FAF9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#000000',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  discardBtn: {
    flex: 1,
    backgroundColor: '#EEEEF0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  discardBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.4,
    backgroundColor: '#4FA99A',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  visBtn: {
    flex: 1,
    backgroundColor: '#F8FAF9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  visBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#4FA99A',
  },
  visBtnText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  visBtnTextActive: {
    color: '#4FA99A',
  },
  webNoticeCard: {
    backgroundColor: '#EEEEF0',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
    gap: 4,
    marginTop: 4,
  },
  webNoticeTitle: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  webNoticeText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
