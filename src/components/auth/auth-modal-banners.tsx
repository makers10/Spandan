import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authModalStyles as styles } from './auth-modal-styles';

interface AuthModalBannersProps {
  isConfigured: boolean;
  successNotice: string | null;
  errorMessage: string | null;
  onBypass: () => void;
}

export function AuthModalBanners({ isConfigured, successNotice, errorMessage, onBypass }: AuthModalBannersProps) {
  return (
    <>
      {!isConfigured && (
        <View style={styles.unconfiguredBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ionicons name="warning-outline" size={16} color="#FF9500" />
            <Text style={styles.unconfiguredTitle}>SUPABASE SETUP REQUIRED</Text>
          </View>
          <Text style={styles.unconfiguredText}>
            Your project URL is configured, but the Anon Key is missing in `.env`.
            You can explore in Demo Mode or use One-Tap Sign In.
          </Text>
        </View>
      )}

      {successNotice && (
        <View style={styles.successBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="mail-outline" size={16} color="#34C759" />
            <Text style={styles.successText}>{successNotice}</Text>
          </View>
          <Pressable onPress={onBypass} style={styles.bypassBtn}>
            <Text style={styles.bypassBtnText}>Enter App Immediately</Text>
          </Pressable>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="alert-circle-outline" size={16} color="#FF3B30" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
          <Pressable onPress={onBypass} style={styles.bypassBtn}>
            <Text style={styles.bypassBtnText}>Bypass & Enter as Active Athlete</Text>
          </Pressable>
        </View>
      )}
    </>
  );
}

