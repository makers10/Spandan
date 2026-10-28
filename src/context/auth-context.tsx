import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { authService, UserProfile } from '@/services/auth-service';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isConfigured: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  error: string | null;
  isAuthModalVisible: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, fullName: string) => Promise<{ user: User | null; requiresEmailConfirmation: boolean }>;
  signInAsAthlete: (fullName?: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setDemoMode: (val: boolean) => void;
  refreshProfile: () => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(!isSupabaseConfigured());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalVisible, setIsAuthModalVisible] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const isConfigured = isSupabaseConfigured();

  // Load session on startup and subscribe to auth state changes
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        if (isConfigured) {
          const initialSession = await authService.getSession();
          if (isMounted && initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            setIsDemoMode(false);
            const userProfile = await authService.getProfile(initialSession.user.id);
            if (isMounted) setProfile(userProfile);
            return;
          }
        }

        // Check for active local athlete session
        const cachedUserStr = await AsyncStorage.getItem('@track_local_user');
        const cachedProfileStr = await AsyncStorage.getItem('@track_local_profile');
        if (isMounted && cachedUserStr && cachedProfileStr) {
          const cachedUser = JSON.parse(cachedUserStr);
          const cachedProfile = JSON.parse(cachedProfileStr);
          setUser(cachedUser);
          setProfile(cachedProfile);
          setIsDemoMode(false);
        } else if (isMounted) {
          setIsDemoMode(true);
        }
      } catch (err: any) {
        console.warn('Auth initialization error:', err.message);
        if (isMounted) setIsDemoMode(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initAuth();

    if (isConfigured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!isMounted) return;
        if (newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          setIsDemoMode(false);
          const p = await authService.getProfile(newSession.user.id);
          if (isMounted) setProfile(p);
        } else if (_event === 'SIGNED_OUT') {
          // Explicit sign out
          try {
            const cachedUser = await AsyncStorage.getItem('@track_local_user');
            if (!cachedUser && isMounted) {
              setSession(null);
              setUser(null);
              setProfile(null);
              setIsDemoMode(true);
            }
          } catch {
            if (isMounted) {
              setSession(null);
              setUser(null);
              setProfile(null);
              setIsDemoMode(true);
            }
          }
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [isConfigured]);

  const signIn = async (email: string, pass: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await authService.signIn(email, pass);
      setSession(res.session);
      setUser(res.user);
      setIsDemoMode(false);
      if (res.user) {
        const p = await authService.getProfile(res.user.id);
        setProfile(p);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your email and password.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, fullName: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await authService.signUp(email, pass, fullName);
      const requiresEmailConfirmation = !res.session;
      if (res.session) {
        setSession(res.session);
        setUser(res.user);
        setIsDemoMode(false);
        if (res.user) {
          const p = await authService.getProfile(res.user.id);
          setProfile(p);
        }
      }
      return { user: res.user, requiresEmailConfirmation };
    } catch (err: any) {
      setError(err.message || 'Failed to register account.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    setError(null);
    try {
      await authService.resendConfirmationEmail(email);
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email.');
      throw err;
    }
  };

  const signInAsAthlete = async (fullName?: string, email?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const athleteName = fullName?.trim() || 'Athlete';
      const athleteEmail = email?.trim() || 'athlete@trackyourmovement.app';
      const athleteId = 'athlete-active-local';

      const localUser = {
        id: athleteId,
        app_metadata: { provider: 'local' },
        user_metadata: { full_name: athleteName },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: athleteEmail,
      } as unknown as User;

      const localProfile: UserProfile = {
        id: athleteId,
        email: athleteEmail,
        full_name: athleteName,
        username: athleteName.toLowerCase().replace(/\s+/g, '_'),
        avatar_text: athleteName.substring(0, 2).toUpperCase(),
        bio: 'Athlete on Track your movement. Logging miles and reaching new milestones.',
        city: 'India',
        weekly_distance_goal_km: 50,
        unit_preference: 'metric',
      };

      await AsyncStorage.setItem('@track_local_user', JSON.stringify(localUser));
      await AsyncStorage.setItem('@track_local_profile', JSON.stringify(localProfile));

      // Initialize empty activity cache if not already present
      const activitiesKey = `@track_local_activities_${athleteId}`;
      const existingActs = await AsyncStorage.getItem(activitiesKey);
      if (!existingActs) {
        await AsyncStorage.setItem(activitiesKey, JSON.stringify([]));
      }

      setUser(localUser);
      setProfile(localProfile);
      setSession(null);
      setIsDemoMode(false);
    } catch (err: any) {
      console.warn('Error signing in as local athlete:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      await AsyncStorage.removeItem('@track_local_user');
      await AsyncStorage.removeItem('@track_local_profile');
      setSession(null);
      setUser(null);
      setProfile(null);
      setIsDemoMode(true);
    } catch (err: any) {
      console.warn('Sign out error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const p = await authService.getProfile(user.id);
      if (p) setProfile(p);
    }
  };

  const clearError = () => setError(null);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalVisible(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalVisible(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isConfigured,
        isDemoMode,
        isLoading,
        error,
        isAuthModalVisible,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signIn,
        signUp,
        signInAsAthlete,
        signOut,
        setDemoMode: setIsDemoMode,
        refreshProfile,
        resendConfirmationEmail,
        clearError,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

