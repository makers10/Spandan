import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpandanLogo } from '@/components/fitness/spandan-logo';
import { authModalStyles as styles } from './auth-modal-styles';

interface AuthModalHeaderProps {
  activeTab: 'login' | 'register';
  onSelectTab: (tab: 'login' | 'register') => void;
  onClose: () => void;
}

export function AuthModalHeader({ activeTab, onSelectTab, onClose }: AuthModalHeaderProps) {
  return (
    <>
      <View style={styles.topBar}>
        <SpandanLogo size="medium" showTagline />
        <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close auth dialog">
          <Ionicons name="close" size={20} color="#8E8E93" />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>
          {activeTab === 'login' ? 'Athlete Sign In' : 'Join Track your movement'}
        </Text>
        <Text style={styles.subTitle}>
          {activeTab === 'login'
            ? 'Log your miles, analyze GPS routes, and conquer milestones.'
            : 'Create your athlete profile to start recording GPS activities.'}
        </Text>
      </View>

      <View style={styles.segmentedRow}>
        <Pressable
          onPress={() => onSelectTab('login')}
          style={[styles.segmentTab, activeTab === 'login' && styles.segmentTabActive]}>
          <Text style={[styles.segmentTabText, activeTab === 'login' && styles.segmentTabTextActive]}>
            Sign In
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onSelectTab('register')}
          style={[styles.segmentTab, activeTab === 'register' && styles.segmentTabActive]}>
          <Text style={[styles.segmentTabText, activeTab === 'register' && styles.segmentTabTextActive]}>
            Create Account
          </Text>
        </Pressable>
      </View>
    </>
  );
}

