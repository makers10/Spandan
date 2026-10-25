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
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  pillSelected: {
    backgroundColor: '#4FA99A',
    borderColor: '#4FA99A',
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
