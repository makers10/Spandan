import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type Discipline = 'Running' | 'Cycling' | 'Hybrid' | 'Rowing';

const DISCIPLINES: Discipline[] = ['Running', 'Cycling', 'Hybrid', 'Rowing'];

interface DisciplineSelectorProps {
  selected: Discipline;
  onSelect: (d: Discipline) => void;
}

export function DisciplineSelector({ selected, onSelect }: DisciplineSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Primary Athletic Discipline</Text>
      <View style={styles.row}>
        {DISCIPLINES.map((d) => {
          const isSelected = selected === d;
          return (
            <Pressable
              key={d}
              onPress={() => onSelect(d)}
              style={[styles.pill, isSelected && styles.pillSelected]}>
              <Text style={[styles.text, isSelected && styles.textSelected]}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  pillSelected: { backgroundColor: '#006b5d', borderColor: '#006b5d' },
  text: { fontSize: 12, fontWeight: '600', color: '#475569' },
  textSelected: { color: '#ffffff' },
});

