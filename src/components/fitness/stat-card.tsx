import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  deltaText?: string;
  isPositiveDelta?: boolean;
  accentColor?: string;
  iconSymbol?: string;
}

export function StatCard({
  label,
  value,
  unit,
  deltaText,
  isPositiveDelta = true,
  accentColor = '#4FA99A',
  iconSymbol,
}: StatCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: accentColor, borderLeftWidth: 3 }]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label.toUpperCase()}</Text>
        {iconSymbol && (
          <View style={[styles.iconBadge, { backgroundColor: `${accentColor}20` }]}>
            <Text style={[styles.iconText, { color: accentColor }]}>{iconSymbol}</Text>
          </View>
        )}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {deltaText && (
        <View style={styles.deltaRow}>
          <View
            style={[
              styles.deltaBadge,
              { backgroundColor: isPositiveDelta ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
            ]}>
            <Text
              style={[
                styles.deltaText,
                { color: isPositiveDelta ? '#22C55E' : '#EF4444' },
              ]}>
              {isPositiveDelta ? '▲ ' : '▼ '}
              {deltaText}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#131B2E',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#243354',
    flex: 1,
    minWidth: 140,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  unit: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  deltaRow: {
    marginTop: 6,
    flexDirection: 'row',
  },
  deltaBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deltaText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
