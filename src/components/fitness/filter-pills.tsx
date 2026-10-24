import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ActivityType } from '@/data/mock-fitness-data';

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
  const options: { label: string; value: FilterValue; count: number; icon: string }[] = [
    { label: 'All', value: 'all', count: counts.all, icon: '⚡' },
    { label: 'Runs', value: 'run', count: counts.run, icon: '🏃' },
    { label: 'Rides', value: 'ride', count: counts.ride, icon: '🚴' },
    { label: 'Walks', value: 'walk', count: counts.walk, icon: '🚶' },
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
            <Text style={styles.icon}>{option.icon}</Text>
            <Text style={[styles.label, isSelected && styles.labelSelected]}>
              {option.label}
            </Text>
            <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
              <Text style={[styles.countText, isSelected && styles.countTextSelected]}>
                {option.count}
              </Text>
            </View>
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
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  pillSelected: {
    backgroundColor: '#4FA99A',
    borderColor: '#4FA99A',
  },
  pressed: {
    opacity: 0.8,
  },
  icon: {
    fontSize: 12,
  },
  label: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#F1F5F4',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  countText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  countTextSelected: {
    color: '#FFFFFF',
  },
});
