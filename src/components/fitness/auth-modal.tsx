import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthModalBanners } from '@/components/auth/auth-modal-banners';
import { AuthModalForm } from '@/components/auth/auth-modal-form';
import { AuthModalHeader } from '@/components/auth/auth-modal-header';
import { authModalStyles as styles } from '@/components/auth/auth-modal-styles';
import { CustomModal } from '@/components/ui/custom-modal';
import { useAuth } from '@/context/auth-context';

export function AuthModal() {
  const {
    isAuthModalVisible, authModalMode, closeAuthModal,
    signIn, signUp, signInAsAthlete, setDemoMode, isConfigured,
  } = useAuth();

  const [selectedTab, setSelectedTab] = useState<'login' | 'register' | null>(null);
  const activeTab = selectedTab ?? authModalMode ?? 'login';
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleClose = () => {
    setSelectedTab(null);
    setErrorMessage(null);
    setSuccessNotice(null);
    closeAuthModal();
  };

  const handleOneTap = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const userEmail = email.trim() || 'athlete@trackyourmovement.app';
      const rawName = fullName.trim() || (userEmail.includes('@') ? userEmail.split('@')[0] : 'Alex Vance');
      const formatted = rawName.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await signInAsAthlete(formatted, userEmail);
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not sign in as athlete.');
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);
    if (!email.trim() || !email.includes('@') || !email.includes('.')) return setErrorMessage('Please enter a valid email address.');
    if (password.length < 6) return setErrorMessage('Password must be at least 6 characters.');

    setLoading(true);
    try {
      if (activeTab === 'register') {
        if (!fullName.trim()) return setErrorMessage('Please enter your full name.');
        if (password !== confirmPassword) return setErrorMessage('Passwords do not match.');
        const res = await signUp(email.trim(), password, fullName.trim());
        if (res.requiresEmailConfirmation) {
          setSuccessNotice('Account registered! Tap below to enter immediately as an athlete.');
        } else {
          handleClose();
        }
      } else {
        await signIn(email.trim(), password);
        handleClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication error. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthModalVisible) return null;

  return (
    <CustomModal visible={isAuthModalVisible} onClose={handleClose} variant="fullscreen">
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
              <AuthModalHeader activeTab={activeTab} onSelectTab={(t) => { setSelectedTab(t); setErrorMessage(null); setSuccessNotice(null); }} onClose={handleClose} />
              <AuthModalBanners isConfigured={isConfigured} successNotice={successNotice} errorMessage={errorMessage} onBypass={handleOneTap} />
              <AuthModalForm
                activeTab={activeTab} fullName={fullName} setFullName={setFullName} email={email} setEmail={setEmail}
                password={password} setPassword={setPassword} confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
                loading={loading} onSubmit={handleSubmit} onDemo={() => { setDemoMode(true); handleClose(); }} onOneTap={handleOneTap}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </CustomModal>
  );
}
