import React, { useState, useEffect } from 'react';
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
import { router } from 'expo-router';

import { SpandanLogo } from '@/components/fitness/spandan-logo';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { ActivityType } from '@/data/mock-fitness-data';
import { useAuth } from '@/context/auth-context';
import { activityService } from '@/services/activity-service';

export default function RecordScreen() {
  const insets = useSafeAreaInsets();
  const { user, isDemoMode, isConfigured } = useAuth();

  const [selectedSport, setSelectedSport] = useState<ActivityType | 'hike'>('run');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [autoPause, setAutoPause] = useState(true);
  const [audioCues, setAudioCues] = useState(true);

  // Save Modal States
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activityTitle, setActivityTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const isLiveUser = Boolean(user && !isDemoMode && isConfigured);

  // Timer simulation when user presses Start
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  const handleStart = () => {
    setIsRecording(true);
    setIsPaused(false);
    setSaveStatus(null);
  };

  const handlePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleStop = () => {
    setIsPaused(true);
    const timeOfDay = new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening';
    const sportName = selectedSport === 'run' ? 'Run' : selectedSport === 'ride' ? 'Ride' : selectedSport === 'walk' ? 'Walk' : 'Hike';
    setActivityTitle(`${timeOfDay} ${sportName}`);
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const distance = Number((seconds * 0.003).toFixed(2));
      const formattedDuration = formatTimer(seconds);
      const paceVal = selectedSport === 'ride' ? '24.5' : '5:20';

      if (isLiveUser && user) {
        await activityService.createActivity(user.id, {
          title: activityTitle.trim() || `${selectedSport.toUpperCase()} Session`,
          type: selectedSport === 'hike' ? 'walk' : selectedSport,
          distanceKm: distance,
          durationSeconds: seconds,
          durationFormatted: formattedDuration,
          paceOrSpeedFormatted: paceVal,
          elevationMeters: Math.floor(seconds * 0.1),
          calories: Math.max(10, Math.round(distance * 65)),
        });
        setSaveStatus('✅ Activity saved to Supabase PostgreSQL database!');
      } else {
        setSaveStatus('ℹ️ Demo Mode: Workout completed locally. Sign in to save real data to Supabase.');
      }

      setShowSaveModal(false);
      setIsRecording(false);
      setIsPaused(false);
      setSeconds(0);
    } catch (err: any) {
      setSaveStatus(`❌ Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    setShowSaveModal(false);
    setIsRecording(false);
    setIsPaused(false);
    setSeconds(0);
    setSaveStatus(null);
  };

  const sportColor = {
    run: '#FF6B00',
    ride: '#00D2D3',
    walk: '#10B981',
    hike: '#F59E0B',
  }[selectedSport];

  const bottomPadding = (insets.bottom || 16) + BottomTabInset + Spacing.four;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {/* Header */}
          <View style={styles.headerBar}>
            <SpandanLogo size="medium" />
            <View style={styles.gpsStatusBadge}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsStatusText}>GPS READY (3m)</Text>
            </View>
          </View>

          {/* Feedback/Save Status Banner */}
          {saveStatus && (
            <View style={styles.saveStatusBanner}>
              <Text style={styles.saveStatusText}>{saveStatus}</Text>
            </View>
          )}

          {/* Sport Selector */}
          <View style={styles.sportSelector}>
            {[
              { type: 'run' as const, label: 'Run', icon: '🏃' },
              { type: 'ride' as const, label: 'Ride', icon: '🚴' },
              { type: 'walk' as const, label: 'Walk', icon: '🚶' },
              { type: 'hike' as const, label: 'Hike', icon: '🥾' },
            ].map((sport) => {
              const isSelected = selectedSport === sport.type;
              return (
                <Pressable
                  key={sport.type}
                  onPress={() => !isRecording && setSelectedSport(sport.type)}
                  style={[
                    styles.sportBtn,
                    isSelected && { backgroundColor: sportColor, borderColor: sportColor },
                  ]}>
                  <Text style={styles.sportIcon}>{sport.icon}</Text>
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
              <Text style={styles.hudLabel}>ELAPSED TIME</Text>
              <Text style={styles.timerValue}>{formatTimer(seconds)}</Text>
              {isPaused && <Text style={styles.pausedBadge}>PAUSED</Text>}
            </View>

            {/* Split Metrics Grid */}
            <View style={styles.hudGrid}>
              <View style={styles.hudCol}>
                <Text style={styles.hudLabel}>DISTANCE</Text>
                <View style={styles.hudValRow}>
                  <Text style={styles.hudVal}>
                    {isRecording ? (seconds * 0.003).toFixed(2) : '0.00'}
                  </Text>
                  <Text style={styles.hudUnit}>km</Text>
                </View>
              </View>

              <View style={styles.hudCol}>
                <Text style={styles.hudLabel}>
                  {selectedSport === 'ride' ? 'SPEED' : 'PACE'}
                </Text>
                <View style={styles.hudValRow}>
                  <Text style={styles.hudVal}>
                    {isRecording ? (selectedSport === 'ride' ? '24.5' : '5:20') : '--:--'}
                  </Text>
                  <Text style={styles.hudUnit}>
                    {selectedSport === 'ride' ? 'km/h' : '/km'}
                  </Text>
                </View>
              </View>

              <View style={styles.hudCol}>
                <Text style={styles.hudLabel}>ELEVATION</Text>
                <View style={styles.hudValRow}>
                  <Text style={styles.hudVal}>
                    {isRecording ? Math.floor(seconds * 0.1) : '0'}
                  </Text>
                  <Text style={styles.hudUnit}>m</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Recording Controls */}
          <View style={styles.controlsSection}>
            {!isRecording ? (
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
                <Pressable
                  onPress={handlePause}
                  style={({ pressed }) => [styles.pauseBtn, pressed && styles.pressed]}>
                  <Text style={styles.pauseBtnText}>{isPaused ? 'RESUME' : 'PAUSE'}</Text>
                </Pressable>

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
            <Text style={styles.authNoticeTitle}>
              {isLiveUser ? '☁️ SUPABASE CLOUD SYNC ACTIVE' : 'ℹ️ DEMO RECORDING MODE'}
            </Text>
            <Text style={styles.authNoticeText}>
              {isLiveUser
                ? `Logged in as ${user?.email}. Finished sessions will be saved directly into your Supabase activities table.`
                : 'You are currently in Demo Mode. Finished activities are calculated for review but will not persist to PostgreSQL until you sign in.'}
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
          </View>
        </View>
      </ScrollView>

      {/* Save Activity Modal */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Save Completed Workout</Text>
            <Text style={styles.modalSub}>
              {formatTimer(seconds)} • {(seconds * 0.003).toFixed(2)} km
            </Text>

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

            <View style={styles.modalActions}>
              <Pressable onPress={handleDiscard} style={styles.discardBtn}>
                <Text style={styles.discardBtnText}>Discard</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmSave}
                disabled={isSaving}
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}>
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>
                    {isLiveUser ? 'Save to Supabase' : 'Save Demo'}
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
    backgroundColor: '#0B111E',
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
    alignItems: 'center',
    paddingVertical: 8,
  },
  gpsStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    gap: 6,
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
    backgroundColor: '#131B2E',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FF6B00',
  },
  saveStatusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  sportSelector: {
    flexDirection: 'row',
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: '#243354',
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
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  sportLabelSelected: {
    color: '#FFFFFF',
  },
  hudContainer: {
    backgroundColor: '#131B2E',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#243354',
    alignItems: 'center',
    gap: 20,
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
    color: '#FFFFFF',
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
    borderTopColor: '#1C263E',
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
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  hudUnit: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  controlsSection: {
    marginVertical: 4,
  },
  startBtn: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#FF6B00',
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
    color: '#0B111E',
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
    backgroundColor: 'rgba(19, 27, 46, 0.8)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 4,
  },
  authNoticeTitle: {
    color: '#FF6B00',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  authNoticeText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 18,
  },
  preferencesCard: {
    backgroundColor: '#131B2E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 12,
  },
  prefHeading: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  prefSub: {
    color: '#64748B',
    fontSize: 11,
  },
  togglePill: {
    backgroundColor: '#1C263E',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#243354',
  },
  togglePillActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  toggleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#131B2E',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#243354',
    gap: 16,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSub: {
    color: '#FF6B00',
    fontSize: 14,
    fontWeight: '700',
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
    backgroundColor: '#0B111E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#243354',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  discardBtn: {
    flex: 1,
    backgroundColor: '#1C263E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#243354',
  },
  discardBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.4,
    backgroundColor: '#FF6B00',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
