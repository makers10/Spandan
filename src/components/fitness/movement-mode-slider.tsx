import React, { useState, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOVEMENT_MODES, MovementMode } from '@/types/movement-modes';
import { styles } from './movement-mode-slider.styles';

const CATEGORIES = [
  { id: 'all', label: 'ALL (34)' },
  { id: 'endurance', label: 'ENDURANCE' },
  { id: 'cycles', label: 'CYCLES' },
  { id: 'fitness', label: 'FITNESS' },
  { id: 'outdoor', label: 'OUTDOOR' },
  { id: 'water', label: 'WATER' },
  { id: 'court', label: 'COURT' },
] as const;

interface MovementModeSliderProps {
  selectedModeId: string;
  onSelectMode: (mode: MovementMode) => void;
  disabled?: boolean;
}

export function MovementModeSlider({ selectedModeId, onSelectMode, disabled = false }: MovementModeSliderProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredModes = useMemo(() => {
    if (activeCategory === 'all') return MOVEMENT_MODES;
    return MOVEMENT_MODES.filter((m) => m.category === activeCategory);
  }, [activeCategory]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="flame-outline" size={15} color="#008a79" />
          <Text style={styles.sectionTitle}>MOVEMENT MODES</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{MOVEMENT_MODES.length} MODES</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            disabled={disabled}
            onPress={() => setActiveCategory(cat.id)}
            style={[styles.categoryPill, activeCategory === cat.id && styles.categoryPillActive]}>
            <Text style={[styles.categoryText, activeCategory === cat.id && styles.categoryTextActive]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderScroll}>
        {filteredModes.map((mode) => {
          const isSelected = selectedModeId === mode.id;
          return (
            <Pressable
              key={mode.id}
              disabled={disabled}
              onPress={() => onSelectMode(mode)}
              style={[styles.modeCard, isSelected && styles.modeCardActive]}>
              <View style={[styles.iconBox, isSelected && styles.iconBoxActive]}>
                <Ionicons name={mode.icon as any} size={19} color={isSelected ? '#ffffff' : '#475569'} />
              </View>
              <Text style={[styles.modeLabel, isSelected && styles.modeLabelActive]} numberOfLines={1}>
                {mode.label}
              </Text>
              <Text style={[styles.telemetryPill, isSelected && styles.telemetryPillActive]} numberOfLines={1}>
                {mode.telemetryBadge}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
