import React from 'react';
import { Platform, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './session-activity-ring.styles';

interface SessionActivityRingProps {
  calories: number;
  calorieGoal?: number;
  activeMinutes: number;
  minuteGoal?: number;
  elevationM: number;
  elevationGoal?: number;
}

export function SessionActivityRing({
  calories = 0, calorieGoal = 500, activeMinutes = 0,
  minuteGoal = 45, elevationM = 0, elevationGoal = 200,
}: SessionActivityRingProps) {
  const movePct = Math.min(1, Math.max(0.04, calories / calorieGoal));
  const exercisePct = Math.min(1, Math.max(0.04, activeMinutes / minuteGoal));
  const elevPct = Math.min(1, Math.max(0.04, elevationM / elevationGoal));
  const c1 = 276.46; const c2 = 201.06; const c3 = 125.66;
  const off1 = c1 * (1 - movePct);
  const off2 = c2 * (1 - exercisePct);
  const off3 = c3 * (1 - elevPct);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="pie-chart-outline" size={15} color="#008a79" />
          <Text style={styles.titleCaps}>KINETIC ACTIVITY RINGS</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>SYNCED</Text>
        </View>
      </View>
      <View style={styles.contentRow}>
        <View style={styles.ringBox}>
          {Platform.OS === 'web' ? (
            <div
              style={{ width: 108, height: 108 }}
              dangerouslySetInnerHTML={{
                __html: `<svg width="108" height="108" viewBox="0 0 108 108" style="transform: rotate(-90deg);">
                  <circle cx="54" cy="54" r="44" stroke="#ffedd5" stroke-width="7" fill="none" opacity="0.6"/>
                  <circle cx="54" cy="54" r="44" stroke="#ff6b4a" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${c1}" stroke-dashoffset="${off1}"/>
                  <circle cx="54" cy="54" r="32" stroke="#ccfbf1" stroke-width="7" fill="none" opacity="0.6"/>
                  <circle cx="54" cy="54" r="32" stroke="#00b8a2" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${c2}" stroke-dashoffset="${off2}"/>
                  <circle cx="54" cy="54" r="20" stroke="#e0f2fe" stroke-width="7" fill="none" opacity="0.6"/>
                  <circle cx="54" cy="54" r="20" stroke="#00d2d3" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="${c3}" stroke-dashoffset="${off3}"/>
                </svg>`,
              }}
            />
          ) : (
            <View style={{ width: 108, height: 108, borderRadius: 54, borderWidth: 7, borderColor: '#ff6b4a' }} />
          )}
        </View>
        <View style={styles.legendCol}>
          <View style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: '#ff6b4a' }]} />
              <Text style={styles.legendLabel}>MOVE</Text>
            </View>
            <View style={styles.legendValRow}>
              <Text style={styles.legendVal}>{calories}</Text>
              <Text style={styles.legendTarget}>/{calorieGoal} kcal</Text>
            </View>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: '#00b8a2' }]} />
              <Text style={styles.legendLabel}>EXERCISE</Text>
            </View>
            <View style={styles.legendValRow}>
              <Text style={styles.legendVal}>{activeMinutes}</Text>
              <Text style={styles.legendTarget}>/{minuteGoal} min</Text>
            </View>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View style={[styles.legendDot, { backgroundColor: '#00d2d3' }]} />
              <Text style={styles.legendLabel}>ELEVATION</Text>
            </View>
            <View style={styles.legendValRow}>
              <Text style={styles.legendVal}>{elevationM}</Text>
              <Text style={styles.legendTarget}>/{elevationGoal} m</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
