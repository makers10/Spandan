import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DailyActivity } from '@/data/mock-fitness-data';

interface WeeklyChartProps {
  days: DailyActivity[];
}

export function WeeklyChart({ days }: WeeklyChartProps) {
  const maxDistance = Math.max(10, ...days.map((d) => d.distanceKm));

  const getBarColor = (type?: string, isToday?: boolean) => {
    if (type === 'run') return '#FF6B00';
    if (type === 'ride') return '#00D2D3';
    if (type === 'walk') return '#10B981';
    return isToday ? '#CBD5E1' : '#E2E8F0';
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Weekly Rhythm</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF6B00' }]} />
            <Text style={styles.legendText}>Run</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00D2D3' }]} />
            <Text style={styles.legendText}>Ride</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Walk</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {days.map((day) => {
          const heightPercent = day.distanceKm > 0
            ? Math.max(15, Math.round((day.distanceKm / maxDistance) * 100))
            : 6;
          const barColor = getBarColor(day.type, day.isToday);

          return (
            <View key={day.dayShort} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: barColor,
                      borderTopLeftRadius: 4,
                      borderTopRightRadius: 4,
                    },
                  ]}
                />
              </View>
              {day.distanceKm > 0 && (
                <Text style={styles.kmLabel}>{day.distanceKm.toFixed(0)}</Text>
              )}
              <Text style={[styles.dayLabel, day.isToday && styles.todayLabel]}>
                {day.dayShort}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barTrack: {
    width: 14,
    height: 80,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
  },
  kmLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  dayLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  todayLabel: {
    color: '#4FA99A',
    fontWeight: '800',
  },
});
