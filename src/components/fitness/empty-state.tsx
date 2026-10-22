import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onRecordPress?: () => void;
  onResetFilter?: () => void;
}

export function EmptyState({
  title = 'No Workouts Yet',
  message = 'Every milestone begins with a single step. Lace up your shoes or prep your ride, and let Spandan track your athletic pulse.',
  onRecordPress,
  onResetFilter,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>⚡</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <View style={styles.buttonGroup}>
        {onRecordPress && (
          <Pressable
            onPress={onRecordPress}
            style={({ pressed }) => [styles.recordButton, pressed && styles.pressed]}>
            <Text style={styles.recordButtonText}>Start Recording</Text>
          </Pressable>
        )}

        {onResetFilter && (
          <Pressable
            onPress={onResetFilter}
            style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
            <Text style={styles.resetButtonText}>View All Activities</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#131B2E',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#243354',
    gap: 12,
    marginVertical: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.3)',
  },
  icon: {
    fontSize: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 400,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  recordButton: {
    backgroundColor: '#FF6B00',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#FF6B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  resetButton: {
    backgroundColor: '#1C263E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#243354',
  },
  resetButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
