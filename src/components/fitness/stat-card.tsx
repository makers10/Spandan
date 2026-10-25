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
    <View style={styles.card}>
      {/* Apple Health Top Header with Category Icon */}
      <View style={styles.topRow}>
        <View style={styles.categoryCluster}>
          {iconSymbol && (
            <View style={[styles.iconBadge, { backgroundColor: `${accentColor}18` }]}>
              <Text style={[styles.iconText, { color: accentColor }]}>{iconSymbol}</Text>
            </View>
          )}
          <Text style={styles.label}>{label.toUpperCase()}</Text>
        </View>
      </View>

      {/* Main Metric Value */}
      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        {unit && <Text style={styles.unit}>{unit}</Text>}
      </View>

      {/* Apple Health Trend Footer */}
      {deltaText && (
        <View style={styles.deltaRow}>
          <Text
            style={[
              styles.deltaText,
              { color: isPositiveDelta ? '#34C759' : '#8E8E93' },
            ]}>
            {isPositiveDelta ? '↑ ' : '↓ '}
            {deltaText}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flex: 1,
    minWidth: 140,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  label: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  iconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    color: '#000000',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  unit: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  deltaRow: {
    marginTop: 6,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
