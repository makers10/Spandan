import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityType } from '@/types/fitness';

export type FilterValue = 'all' | ActivityType;

interface FilterPillsProps {
  selected: FilterValue;
  onSelect: (value: FilterValue) => void;
  counts: {
    all: number;
    run: number;
    ride: number;
    walk: number;
  };
}

export function FilterPills({ selected, onSelect, counts }: FilterPillsProps) {
  const options: { label: string; value: FilterValue; count: number }[] = [
    { label: 'All', value: 'all', count: counts.all },
    { label: 'Runs', value: 'run', count: counts.run },
    { label: 'Rides', value: 'ride', count: counts.ride },
    { label: 'Walks', value: 'walk', count: counts.walk },
  ];

  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => [
              styles.pill,
              isSelected && styles.pillSelected,
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
            <Text style={[styles.count, isSelected && styles.countSelected]}>
              {option.count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
    shadowColor: '#17332C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(79, 169, 154, 0.1)',
  },
  pillSelected: {
    backgroundColor: '#4FA99A',
    borderColor: '#4FA99A',
    shadowColor: '#4FA99A',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  label: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  labelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  count: {
    color: '#AEAEB2',
    fontSize: 12,
    fontWeight: '700',
  },
  countSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  pressed: {
    opacity: 0.75,
  },
});
