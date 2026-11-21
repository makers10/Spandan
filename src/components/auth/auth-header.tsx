import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface AuthHeaderProps {
  title: string;
}

export function AuthHeader({ title }: AuthHeaderProps) {
  return (
    <View style={styles.headerBar}>
      <Pressable
        aria-label="Go Back"
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backBtn, pressed && styles.btnPressed]}>
        <Ionicons name="arrow-back" size={22} color="#131b2e" />
      </Pressable>

      <View style={styles.headerTitleCenter}>
        <Text style={styles.kineticBrandCaps}>KINETIC</Text>
        <Text style={styles.screenHeading}>{title}</Text>
      </View>

      <View style={styles.profileCircle}>
        <Ionicons name="person" size={16} color="#ffffff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  btnPressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  headerTitleCenter: { alignItems: 'center' },
  kineticBrandCaps: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: '#006b5d' },
  screenHeading: { fontSize: 16, fontWeight: '700', color: '#131b2e' },
  profileCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#006b5d', alignItems: 'center', justifyContent: 'center' },
});

