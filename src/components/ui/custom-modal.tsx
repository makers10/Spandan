import React, { useEffect, useState } from 'react';
import {
  Animated, BackHandler, KeyboardAvoidingView, Platform,
  Pressable, StyleProp, StyleSheet, View, ViewStyle,
} from 'react-native';

interface CustomModalProps {
  visible: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  variant?: 'center' | 'fullscreen' | 'bottom-sheet';
  dismissable?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export function CustomModal({
  visible, onClose, children, variant = 'center', dismissable = true, contentStyle,
}: CustomModalProps) {
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) {
      anim.setValue(0);
      return;
    }
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onClose) { onClose(); return true; }
      return false;
    });
    return () => back.remove();
  }, [visible, onClose, anim]);

  if (!visible) return null;
  const isFullscreen = variant === 'fullscreen';
  const isBottomSheet = variant === 'bottom-sheet';

  return (
    <View
      style={styles.overlay}
      accessibilityRole={Platform.OS === 'web' ? ('dialog' as any) : undefined}
      accessibilityViewIsModal
      aria-modal={true}>
      {!isFullscreen && (
        <Animated.View style={[styles.backdrop, { opacity: anim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={dismissable ? onClose : undefined} />
        </Animated.View>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={!isFullscreen && Platform.OS === 'ios'}
        style={[styles.container, isBottomSheet && styles.bottomContainer, isFullscreen && styles.fullscreenContainer]}>
        <Animated.View
          style={[
            styles.card,
            isBottomSheet && styles.bottomCard,
            isFullscreen && styles.fullscreenCard,
            contentStyle,
            {
              opacity: anim,
              transform: [{
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [isBottomSheet ? 260 : isFullscreen ? 40 : 20, 0],
                }),
              }],
            },
          ]}>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 9999, elevation: 9999,
  },
  backdrop: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  bottomContainer: { justifyContent: 'flex-end', padding: 0 },
  fullscreenContainer: { justifyContent: 'flex-start', alignItems: 'stretch', padding: 0, width: '100%', height: '100%' },
  card: {
    width: '100%', maxWidth: 460, backgroundColor: '#FFFFFF', borderRadius: 24,
    borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.8)', padding: 24,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.16,
    shadowRadius: 20, elevation: 12,
  },
  bottomCard: { maxWidth: '100%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  fullscreenCard: { flex: 1, width: '100%', height: '100%', maxWidth: '100%', borderRadius: 0, borderWidth: 0, padding: 0, alignSelf: 'stretch' },
});
