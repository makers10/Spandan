import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DailyActivity } from '@/data/mock-fitness-data';

interface WeeklyChartProps {
  days: DailyActivity[];
}

export function WeeklyChart({ days }: WeeklyChartProps) {
  const maxDistance = Math.max(10, ...days.map((d) => d.distanceKm));
  const totalWeeklyKm = days.reduce((sum, d) => sum + d.distanceKm, 0);

  const getBarColor = (type?: string, isToday?: boolean) => {
    if (type === 'run') return '#FF6B00';
    if (type === 'ride') return '#00D2D3';
    if (type === 'walk') return '#10B981';
    return isToday ? 'rgba(79, 169, 154, 0.4)' : '#4FA99A';
  };

  return (
    <View style={styles.card}>
      {/* Apple Health Chart Header */}
      <View style={styles.header}>
        <View style={styles.categoryCluster}>
          <View style={styles.iconBadge}>
            <Text style={styles.iconText}>📊</Text>
          </View>
          <Text style={styles.categoryTitle}>WEEKLY RHYTHM</Text>
        </View>

        <Text style={styles.totalText}>{totalWeeklyKm.toFixed(1)} km total</Text>
      </View>

      {/* Bar Chart Area */}
      <View style={styles.chartArea}>
        {days.map((day) => {
          const heightPercent = day.distanceKm > 0
            ? Math.max(12, Math.round((day.distanceKm / maxDistance) * 100))
            : 4;
          const barColor = day.distanceKm > 0 ? getBarColor(day.type, day.isToday) : '#E5E5EA';

          return (
            <View key={day.dayShort} style={styles.barCol}>
              <View style={styles.track}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>

              {/* Day Label with Today dot indicator */}
              <View style={styles.dayLabelRow}>
                <Text style={[styles.dayLabel, day.isToday && styles.todayLabel]}>
                  {day.dayShort.substring(0, 1)}
                </Text>
                {day.isToday && <View style={styles.todayIndicatorDot} />}
              </View>
            </View>
          );
        })}
      </View>

      {/* Subtle Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B00' }]} />
          <Text style={styles.legendLabel}>Run</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#00D2D3' }]} />
          <Text style={styles.legendLabel}>Ride</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendLabel}>Walk</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(79, 169, 154, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 11,
  },
  categoryTitle: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  totalText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 110,
    paddingHorizontal: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  track: {
    width: 10,
    height: 80,
    backgroundColor: '#F2F2F7',
    borderRadius: 5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 5,
  },
  dayLabelRow: {
    alignItems: 'center',
    marginTop: 8,
    minHeight: 20,
  },
  dayLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  todayLabel: {
    color: '#000000',
    fontWeight: '800',
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4FA99A',
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
  },
});
