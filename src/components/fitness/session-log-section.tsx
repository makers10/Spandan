import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FilterPills, FilterValue } from '@/components/fitness/filter-pills';
import { TelemetrySessionCard } from '@/components/fitness/telemetry-session-card';
import { ActivityCard } from '@/components/fitness/activity-card';
import { Activity } from '@/types/fitness';

interface SessionLogSectionProps {
  rawActivities: Activity[];
  todayFormatted: string;
}

export function SessionLogSection({ rawActivities, todayFormatted }: SessionLogSectionProps) {
  const [filter, setFilter] = useState<FilterValue>('all');

  const filtered = filter === 'all'
    ? rawActivities
    : rawActivities.filter((a) => a.type === filter);

  const counts = {
    all: rawActivities.length,
    run: rawActivities.filter((a) => a.type === 'run').length,
    ride: rawActivities.filter((a) => a.type === 'ride').length,
    walk: rawActivities.filter((a) => a.type === 'walk').length,
  };

  const topSession = rawActivities[0];

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>SESSION LOG // TELEMETRY</Text>
        <Text style={styles.sectionSubText}>{todayFormatted}</Text>
      </View>

      {topSession ? (
        <TelemetrySessionCard
          title={topSession.title}
          time={topSession.timeAgo}
          efficiencyScore={topSession.location || 'Outdoor Session'}
          tag={topSession.type.toUpperCase()}
          distanceKm={topSession.distanceKm}
          pace={topSession.paceOrSpeedFormatted}
          calories={topSession.calories}
          maxHr={topSession.maxHeartRate || 0}
          peakSpeed={`${topSession.paceOrSpeedFormatted} ${topSession.type === 'ride' ? 'km/h' : '/km'}`}
        />
      ) : (
        <View style={styles.emptySessionBox}>
          <Ionicons name="footsteps-outline" size={28} color="#006B5D" style={{ marginBottom: 6 }} />
          <Text style={styles.emptyTitle}>No Sessions Recorded Yet</Text>
          <Text style={styles.emptySub}>
            All telemetry starts from zero. Tap SESSION below to begin your first workout!
          </Text>
        </View>
      )}

      {rawActivities.length > 0 && (
        <FilterPills selected={filter} onSelect={setFilter} counts={counts} />
      )}

      {filtered.length > 0 && (
        <View style={styles.activitiesList}>
          {filtered.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: { gap: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', letterSpacing: 0.8 },
  sectionSubText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  emptySessionBox: {
    padding: 20, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20,
    marginVertical: 8, borderWidth: 1, borderColor: '#E2E8F0',
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 },
  activitiesList: { gap: 12, marginTop: 4 },
});

