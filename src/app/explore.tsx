import React, { useState, useMemo } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { AtmosphericBackground } from '@/components/ui/atmospheric-background';
import { useAuth } from '@/context/auth-context';

type TimeframeOption = 'day' | 'week' | 'month' | 'season';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<TimeframeOption>('week');

  const bottomPadding = (insets.bottom || 16) + BottomTabInset + Spacing.four;

  // Dynamic values based on timeframe
  const metrics = useMemo(() => {
    switch (timeframe) {
      case 'day':
        return {
          movementQuality: 94,
          grade: 'GRADE A+',
          trend: '+1.8% VS YEST',
          gct: '208',
          oscillation: '6.5',
          acuteRatio: '1.08',
          progression: 'OPTIMAL LOAD',
          weeklyAU: [280, 0, 0, 0, 0, 0, 0],
        };
      case 'month':
        return {
          movementQuality: 91,
          grade: 'GRADE A',
          trend: '+6.5% VS L-MO',
          gct: '215',
          oscillation: '7.0',
          acuteRatio: '1.18',
          progression: 'PROGRESSIVE OVERLOAD',
          weeklyAU: [450, 480, 520, 590, 410, 530, 0],
        };
      case 'season':
        return {
          movementQuality: 93,
          grade: 'GRADE A+',
          trend: '+8.4% VS BASE',
          gct: '210',
          oscillation: '6.7',
          acuteRatio: '1.12',
          progression: 'PEAK TRAINING',
          weeklyAU: [490, 530, 480, 590, 520, 510, 0],
        };
      case 'week':
      default:
        return {
          movementQuality: 92,
          grade: 'GRADE A+',
          trend: '+4.2% VS L-WK',
          gct: '212',
          oscillation: '6.8',
          acuteRatio: '1.14',
          progression: 'SAFE PROGRESSION',
          weeklyAU: [320, 410, 140, 590, 380, 510, 0],
        };
    }
  }, [timeframe]);

  const handleExportReport = async () => {
    try {
      await Share.share({
        title: 'Kinetic Biomechanical Telemetry Report',
        message: `TRACK YOUR MOVEMENT // BIOMECHANICAL REPORT\nMovement Quality: ${metrics.movementQuality}/100 (${metrics.grade})\nGround Contact Time: ${metrics.gct} ms (Elite)\nVertical Oscillation: ${metrics.oscillation} cm (Optimal)\nKinetic Symmetry: 99.6% Symmetric\nAcute:Chronic Workload: ${metrics.acuteRatio} (${metrics.progression})\nExported from TRACK YOUR MOVEMENT.`,
      });
    } catch {
      Alert.alert('Export Notice', 'Biomechanical report generated.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AtmosphericBackground glowTopColor="#e8f5f1" glowMidColor="#edf4f2" />

      {/* Header: TRACK YOUR MOVEMENT */}
      <View style={styles.headerBar}>
        <View style={styles.brandCluster}>
          <View style={styles.logoBadge}>
            <Ionicons name="stats-chart" size={17} color="#006B5D" />
          </View>
          <View style={styles.brandTitleCol}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>TRACK YOUR MOVEMENT</Text>
              <View style={styles.brandStatusDot} />
            </View>
            <Text style={styles.brandSubtitle}>Pulse OS // Analytics</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            aria-label="Sensor Status"
            onPress={() =>
              Alert.alert(
                'Biometric Sensors Connected',
                'IMU 6-Axis Motion Sensor: Calibrated\nGround Reaction Force Array: Active\nOptical Pulse Sensor: Synced'
              )
            }
            style={({ pressed }) => [styles.sensorBtn, pressed && styles.btnPressed]}>
            <Ionicons name="hardware-chip-outline" size={17} color="#475569" />
          </Pressable>

          <Pressable
            onPress={() => router.push('/profile' as any)}
            accessibilityRole="button"
            accessibilityLabel="Athlete Profile"
            style={styles.avatarBox}>
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
          {/* Sub-header / Status Context Pills */}
          <View style={styles.statusContextRow}>
            <View style={styles.syncedPill}>
              <View style={styles.pulseDot} />
              <Text style={styles.syncedText}>BIO-TELEMETRY {'//'} SYNCED</Text>
            </View>

            <View style={styles.imuPill}>
              <Ionicons name="flash" size={13} color="#0d9488" style={{ marginRight: 4 }} />
              <Text style={styles.imuText}>IMU 6-AXIS CALIBRATED</Text>
            </View>
          </View>

          {/* Timeframe Selector */}
          <View style={styles.timeframeContainer}>
            {(['day', 'week', 'month', 'season'] as TimeframeOption[]).map((t) => {
              const isSelected = timeframe === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTimeframe(t)}
                  style={[styles.timeframeBtn, isSelected && styles.timeframeBtnActive]}>
                  <Text
                    style={[
                      styles.timeframeBtnText,
                      isSelected && styles.timeframeBtnTextActive,
                    ]}>
                    {t.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Master Metric: Movement Quality & Form Index */}
          <View style={styles.card}>
            <View style={styles.cardHeaderTop}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.capsSubLabel}>TELEMETRY {'//'} INDEX</Text>
                  <View style={styles.gradeBadge}>
                    <Text style={styles.gradeBadgeText}>{metrics.grade}</Text>
                  </View>
                </View>
                <Text style={styles.cardHeadingMain}>Movement Quality</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                  <Text style={styles.qualityBigScore}>{metrics.movementQuality}</Text>
                  <Text style={styles.qualityScoreSub}>/100</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <Ionicons name="trending-up" size={13} color="#0f766e" />
                  <Text style={styles.trendText}>{metrics.trend}</Text>
                </View>
              </View>
            </View>

            {/* Spider / Radar Visualization */}
            <View style={styles.radarBox}>
              {Platform.OS === 'web' ? (
                <div
                  style={{
                    width: '100%',
                    height: 176,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: `
                      <svg class="w-full h-full max-w-[210px] overflow-visible" viewBox="0 0 200 200" style="overflow: visible; width: 100%; height: 100%;">
                        <polygon fill="none" points="100,20 176,75 147,165 53,165 24,75" stroke="#cbd5e1" stroke-width="1" />
                        <polygon fill="none" points="100,45 151,82 132,143 68,143 49,82" stroke="#e2e8f0" stroke-width="1" />
                        <polygon fill="none" points="100,70 126,89 116,121 84,121 74,89" stroke="#cbd5e1" stroke-dasharray="2 2" stroke-width="1" />
                        <line stroke="#e2e8f0" stroke-width="1" x1="100" x2="100" y1="100" y2="20" />
                        <line stroke="#e2e8f0" stroke-width="1" x1="100" x2="176" y1="100" y2="75" />
                        <line stroke="#e2e8f0" stroke-width="1" x1="100" x2="147" y1="100" y2="165" />
                        <line stroke="#e2e8f0" stroke-width="1" x1="100" x2="53" y1="100" y2="165" />
                        <line stroke="#e2e8f0" stroke-width="1" x1="100" x2="24" y1="100" y2="75" />
                        <polygon fill="rgba(20, 184, 166, 0.22)" points="100,28 168,78 138,155 58,150 32,80" stroke="#0d9488" stroke-width="2.5" />
                        <circle cx="100" cy="28" fill="#0d9488" r="4" stroke="#ffffff" stroke-width="1.5" />
                        <circle cx="168" cy="78" fill="#0d9488" r="4" stroke="#ffffff" stroke-width="1.5" />
                        <circle cx="138" cy="155" fill="#0d9488" r="4" stroke="#ffffff" stroke-width="1.5" />
                        <circle cx="58" cy="150" fill="#0d9488" r="4" stroke="#ffffff" stroke-width="1.5" />
                        <circle cx="32" cy="80" fill="#0d9488" r="4" stroke="#ffffff" stroke-width="1.5" />
                      </svg>
                    `,
                  }}
                />
              ) : (
                <View style={styles.nativeRadarPlaceholder}>
                  <View style={styles.nativeConcentricOuter} />
                  <View style={styles.nativeConcentricMid} />
                  <View style={styles.nativePolygonSim} />
                </View>
              )}

              {/* Dynamic Axis Labels */}
              <Text style={styles.labelCadence}>CADENCE</Text>
              <Text style={styles.labelContact}>CONTACT</Text>
              <Text style={styles.labelBalance}>BALANCE</Text>
              <Text style={styles.labelStiffness}>STIFFNESS</Text>
              <Text style={styles.labelOscillation}>OSCILLATION</Text>
            </View>

            {/* Quick Metrics Grid */}
            <View style={styles.quickMetricsRow}>
              <View style={styles.quickMetricBox}>
                <View style={styles.quickMetricTop}>
                  <Text style={styles.quickMetricLabel}>GCT {'//'} TIME</Text>
                  <View style={styles.eliteBadge}>
                    <Text style={styles.eliteBadgeText}>ELITE</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
                  <Text style={styles.quickMetricValue}>{metrics.gct}</Text>
                  <Text style={styles.quickMetricUnit}>ms</Text>
                </View>
                <Text style={styles.quickMetricSub}>Top 3% percentile</Text>
              </View>

              <View style={styles.quickMetricBox}>
                <View style={styles.quickMetricTop}>
                  <Text style={styles.quickMetricLabel}>VERT OSCILLATION</Text>
                  <View style={[styles.eliteBadge, { backgroundColor: '#e0f2fe' }]}>
                    <Text style={[styles.eliteBadgeText, { color: '#0369a1' }]}>OPTIMAL</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 4 }}>
                  <Text style={styles.quickMetricValue}>{metrics.oscillation}</Text>
                  <Text style={styles.quickMetricUnit}>cm</Text>
                </View>
                <Text style={styles.quickMetricSub}>Efficient kinetic lift</Text>
              </View>
            </View>

            {/* Foot Strike & Left/Right Symmetry Meter */}
            <View style={styles.symmetryBox}>
              <View style={styles.symmetryHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="scale-outline" size={16} color="#0f766e" />
                  <Text style={styles.symmetryTitle}>Kinetic Symmetry</Text>
                </View>
                <Text style={styles.symmetryPillText}>99.6% SYMMETRIC</Text>
              </View>

              {/* Bilateral Percentage Readout */}
              <View style={styles.bilateralRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.lrPrefix}>L:</Text>
                  <Text style={styles.lrVal}>49.8%</Text>
                </View>
                <View style={styles.symmetryDot} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={styles.lrPrefix}>R:</Text>
                  <Text style={[styles.lrVal, { color: '#0d9488' }]}>50.2%</Text>
                </View>
              </View>

              {/* Symmetry Balance Bar */}
              <View style={styles.balanceBarTrack}>
                <View style={[styles.balanceLeft, { width: '49.8%' }]} />
                <View style={styles.balanceDivider} />
                <View style={[styles.balanceRight, { width: '50.2%' }]} />
              </View>

              {/* Foot Strike Micro Grid */}
              <View style={styles.footStrikeRow}>
                <View style={styles.footCard}>
                  <View style={styles.soleIndicator}>
                    <View style={[styles.strikeDot, { backgroundColor: '#fb923c' }]} />
                  </View>
                  <View>
                    <Text style={styles.footSideLabel}>Left Foot</Text>
                    <Text style={styles.footTypeVal}>Midfoot (68%)</Text>
                  </View>
                </View>

                <View style={styles.footCard}>
                  <View style={styles.soleIndicator}>
                    <View style={[styles.strikeDot, { backgroundColor: '#14b8a6' }]} />
                  </View>
                  <View>
                    <Text style={styles.footSideLabel}>Right Foot</Text>
                    <Text style={styles.footTypeVal}>Midfoot (71%)</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Weekly Load & Fatigue Chart Section */}
          <View style={styles.card}>
            <View style={styles.cardHeaderTop}>
              <View>
                <Text style={styles.capsSubLabel}>PHYSIOLOGICAL LOAD</Text>
                <Text style={styles.cardHeadingMain}>Weekly Strain &amp; Fatigue</Text>
              </View>
              <View style={styles.optimalPill}>
                <View style={styles.optimalDot} />
                <Text style={styles.optimalText}>OPTIMAL ZONE</Text>
              </View>
            </View>

            <Text style={styles.loadDescription}>
              Cumulative strain is balanced within the progressive overload band without overreaching.
            </Text>

            {/* Custom Telemetry Bar Chart */}
            <View style={styles.chartContainer}>
              {/* Overreach Threshold Line */}
              <View style={styles.overreachLine}>
                <Text style={styles.overreachText}>Overreach Threshold</Text>
                <Text style={[styles.overreachText, { fontWeight: '800' }]}>650 AU</Text>
              </View>

              {/* Target Zone Shaded Band */}
              <View style={styles.targetZoneBand} />

              {/* Chart Columns */}
              <View style={styles.columnsRow}>
                {[
                  { day: 'M', au: 320, h: 56, isPeak: false },
                  { day: 'T', au: 410, h: 76, isPeak: false },
                  { day: 'W', au: 140, h: 32, isPeak: false, isRest: true },
                  { day: 'T', au: 590, h: 108, isPeak: true },
                  { day: 'F', au: 380, h: 68, isPeak: false },
                  { day: 'S', au: 510, h: 94, isPeak: false, isTeal: true },
                  { day: 'S', au: 0, h: 16, isPeak: false, isPending: true },
                ].map((item, idx) => (
                  <View key={`day-${idx}`} style={styles.barCol}>
                    <Text
                      style={[
                        styles.barValueText,
                        item.isPeak && { color: '#004d43', fontWeight: '800' },
                        item.isPending && { color: '#cbd5e1' },
                      ]}>
                      {item.isPending ? '--' : item.au}
                    </Text>
                    <View
                      style={[
                        styles.barPillar,
                        { height: item.h },
                        item.isPeak
                          ? styles.barPillarPeak
                          : item.isTeal
                          ? styles.barPillarTeal
                          : item.isRest
                          ? styles.barPillarRest
                          : item.isPending
                          ? styles.barPillarPending
                          : styles.barPillarStandard,
                      ]}
                    />
                    <Text
                      style={[
                        styles.barDayText,
                        item.isPeak && { color: '#004d43', fontWeight: '800' },
                      ]}>
                      {item.day}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Load Status Summary */}
            <View style={styles.loadSummaryBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="speedometer-outline" size={17} color="#0f766e" />
                <Text style={styles.acuteRatioText}>
                  Weekly Acute:Chronic Ratio:{' '}
                  <Text style={{ color: '#004d43', fontWeight: '800' }}>{metrics.acuteRatio}</Text>
                </Text>
              </View>
              <View style={styles.safeProgressionBadge}>
                <Text style={styles.safeProgressionText}>{metrics.progression}</Text>
              </View>
            </View>
          </View>

          {/* Kinetic Insights Feed (Tactical Bio-Coaching) */}
          <View style={styles.card}>
            <View style={styles.cardHeaderTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.insightIconBadge}>
                  <Ionicons name="bulb-outline" size={16} color="#0d9488" />
                </View>
                <Text style={styles.cardHeadingMain}>Kinetic Insights</Text>
              </View>
              <Text style={styles.capsSubLabel}>ALGO V4.8</Text>
            </View>

            {/* Critical Insight 1 */}
            <View style={styles.insightItem}>
              <View style={styles.insightTop}>
                <View style={styles.driftBadge}>
                  <Text style={styles.driftBadgeText}>FORM DRIFT DETECTED</Text>
                </View>
                <Text style={styles.insightRangeText}>KM 7.2 — KM 10.0</Text>
              </View>
              <Text style={styles.insightBodyText}>
                Slight degradation in vertical recoil observed after km 7: Ground contact time
                increased by <Text style={{ color: '#0f766e', fontWeight: '800' }}>+18ms</Text>,
                accompanied by lower plantar stiffness.
              </Text>
              <View style={styles.correctiveBox}>
                <Ionicons name="barbell-outline" size={17} color="#0f766e" style={{ marginTop: 2 }} />
                <Text style={styles.correctiveText}>
                  <Text style={{ fontWeight: '800', color: '#0f172a' }}>
                    Corrective Intervention:{' '}
                  </Text>
                  Program 3 sets of eccentric calf loading and 80m cadenced strides at 182 SPM prior
                  to Saturday long tempo.
                </Text>
              </View>
            </View>

            {/* Secondary Positive Insight 2 */}
            <View style={styles.insightItem}>
              <View style={styles.insightTop}>
                <View style={[styles.driftBadge, { backgroundColor: '#ccfbf1', borderColor: '#99f6e4' }]}>
                  <Text style={[styles.driftBadgeText, { color: '#004d43' }]}>
                    CADENCE LOCK STABILITY
                  </Text>
                </View>
                <Text style={styles.insightRangeText}>Z3 CRUISE</Text>
              </View>
              <Text style={styles.insightBodyText}>
                Step frequency held unwavering at{' '}
                <Text style={{ fontWeight: '800', color: '#0f172a' }}>178 ± 1.4 SPM</Text> across all
                interval climbs. Energy leakage reduced by 3.8%.
              </Text>
            </View>
          </View>

          {/* PR & Movement Milestones */}
          <View style={styles.card}>
            <View style={styles.cardHeaderTop}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.insightIconBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                  <Ionicons name="trophy-outline" size={16} color="#d97706" />
                </View>
                <Text style={styles.cardHeadingMain}>Movement Milestones</Text>
              </View>
              <Text style={[styles.capsSubLabel, { color: '#0d9488', fontWeight: '800' }]}>
                NEW ALL-TIME PR
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {/* Milestone 1 */}
              <View style={styles.milestoneItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.milestoneIconWrap, { backgroundColor: '#e6fbf7' }]}>
                    <Ionicons name="timer-outline" size={20} color="#0f766e" />
                  </View>
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.milestoneCategory}>STRIDE VELOCITY</Text>
                      <View style={styles.newRecordPill}>
                        <Text style={styles.newRecordText}>NEW RECORD</Text>
                      </View>
                    </View>
                    <Text style={styles.milestoneTitle}>Fastest 5K Stride Velocity</Text>
                    <Text style={styles.milestoneSub}>Splits average 4:02/km @ 1.42m stride length</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.milestoneScore}>20:14</Text>
                  <Text style={styles.milestoneDiff}>-32s vs prev</Text>
                </View>
              </View>

              {/* Milestone 2 */}
              <View style={styles.milestoneItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.milestoneIconWrap, { backgroundColor: '#fff7ed' }]}>
                    <Ionicons name="flash-outline" size={20} color="#ea580c" />
                  </View>
                  <View>
                    <Text style={styles.milestoneCategory}>FORCE GENERATION</Text>
                    <Text style={styles.milestoneTitle}>Peak Power Output</Text>
                    <Text style={styles.milestoneSub}>Sprint uphill transition at km 4.8</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.milestoneScore}>
                    410<Text style={{ fontSize: 12, color: '#94a3b8' }}>W</Text>
                  </Text>
                  <Text style={[styles.milestoneDiff, { color: '#0d9488', fontWeight: '800' }]}>
                    +24W PEAK
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tactile Action Trigger */}
          <View style={styles.actionBtnWrap}>
            <Pressable
              onPress={handleExportReport}
              style={({ pressed }) => [styles.exportReportBtn, pressed && styles.btnPressed]}>
              <Ionicons name="share-social-outline" size={19} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.exportReportBtnText}>EXPORT TELEMETRY REPORT</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f8f7',
  },
  headerBar: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(244, 248, 247, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
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
  sensorBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    gap: 14,
  },
  statusContextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  syncedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0d9488',
  },
  syncedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.8,
  },
  imuPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6fbf7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccfbf1',
  },
  imuText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e',
    letterSpacing: 0.6,
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(226, 232, 240, 0.55)',
    padding: 3,
    borderRadius: 16,
    gap: 4,
  },
  timeframeBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeframeBtnActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  timeframeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  timeframeBtnTextActive: {
    color: '#004d43',
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    shadowColor: '#006b5d',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
    gap: 12,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  capsSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },
  gradeBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  gradeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  cardHeadingMain: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  qualityBigScore: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -1,
    lineHeight: 38,
  },
  qualityScoreSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
    letterSpacing: 0.3,
  },
  radarBox: {
    height: 180,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  nativeRadarPlaceholder: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeConcentricOuter: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  nativeConcentricMid: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  nativePolygonSim: {
    width: 75,
    height: 75,
    backgroundColor: 'rgba(20, 184, 166, 0.22)',
    borderColor: '#0d9488',
    borderWidth: 2,
    transform: [{ rotate: '45deg' }],
  },
  labelCadence: {
    position: 'absolute',
    top: 8,
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e',
    letterSpacing: 0.6,
  },
  labelContact: {
    position: 'absolute',
    right: 10,
    top: 50,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  labelBalance: {
    position: 'absolute',
    right: 14,
    bottom: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  labelStiffness: {
    position: 'absolute',
    left: 14,
    bottom: 8,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  labelOscillation: {
    position: 'absolute',
    left: 10,
    top: 50,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  quickMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickMetricBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  quickMetricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.6,
  },
  eliteBadge: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  eliteBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f766e',
  },
  quickMetricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  quickMetricUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  quickMetricSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  symmetryBox: {
    backgroundColor: 'rgba(248, 250, 252, 0.7)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  symmetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  symmetryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    letterSpacing: 0.5,
  },
  symmetryPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f766e',
  },
  bilateralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lrPrefix: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  lrVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  symmetryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(20, 184, 166, 0.6)',
  },
  balanceBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  balanceLeft: {
    height: '100%',
    backgroundColor: '#fb923c',
  },
  balanceDivider: {
    width: 2,
    height: '100%',
    backgroundColor: '#ffffff',
  },
  balanceRight: {
    height: '100%',
    backgroundColor: '#0d9488',
  },
  footStrikeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  footCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  soleIndicator: {
    width: 20,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 3,
  },
  strikeDot: {
    width: 10,
    height: 7,
    borderRadius: 3,
  },
  footSideLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  footTypeVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
  },
  optimalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6fbf7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  optimalDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#14b8a6',
  },
  optimalText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e',
  },
  loadDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  chartContainer: {
    height: 140,
    position: 'relative',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  overreachLine: {
    position: 'absolute',
    top: 14,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#fca5a5',
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  overreachText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ef4444',
  },
  targetZoneBand: {
    position: 'absolute',
    top: 36,
    bottom: 24,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20, 184, 166, 0.05)',
    borderRadius: 8,
  },
  columnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingTop: 28,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barValueText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
  },
  barPillar: {
    width: 22,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barPillarStandard: {
    backgroundColor: '#e2e8f0',
  },
  barPillarPeak: {
    backgroundColor: '#0d9488',
  },
  barPillarTeal: {
    backgroundColor: '#2dd4bf',
  },
  barPillarRest: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  barPillarPending: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  barDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  loadSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  acuteRatioText: {
    fontSize: 12,
    color: '#334155',
  },
  safeProgressionBadge: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  safeProgressionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e',
  },
  insightIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#e6fbf7',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 6,
  },
  insightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driftBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  driftBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400e',
  },
  insightRangeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
  insightBodyText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  correctiveBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    marginTop: 4,
  },
  correctiveText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  milestoneIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneCategory: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.6,
  },
  newRecordPill: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  newRecordText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0f766e',
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  milestoneSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  milestoneScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f766e',
  },
  milestoneDiff: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 1,
  },
  actionBtnWrap: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  exportReportBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: '#0d9488',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  exportReportBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.88,
  },
});
