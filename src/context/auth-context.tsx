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
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, fullName: string) => Promise<{ user: User | null; requiresEmailConfirmation: boolean }>;
  signInAsAthlete: (fullName?: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setDemoMode: (val: boolean) => void;
  refreshProfile: () => Promise<void>;
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

  const signInAsAthlete = async (fullName?: string, email?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const athleteName = fullName?.trim() || 'Alex Varma';
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
        city: 'Mumbai, India',
        weekly_distance_goal_km: 50,
        unit_preference: 'metric',
      };

      await AsyncStorage.setItem('@track_local_user', JSON.stringify(localUser));
      await AsyncStorage.setItem('@track_local_profile', JSON.stringify(localProfile));

      // Seed starter activities if not already present
      const activitiesKey = `@track_local_activities_${athleteId}`;
      const existingActs = await AsyncStorage.getItem(activitiesKey);
      if (!existingActs || JSON.parse(existingActs).length === 0) {
        const starterActivities = [
          {
            id: `local-act-starter-1`,
            userId: athleteId,
            title: 'Morning Tempo Run',
            type: 'run',
            athlete: {
              name: athleteName,
              avatar: athleteName.substring(0, 2).toUpperCase(),
              badge: 'ACTIVE',
            },
            date: 'Yesterday',
            timeAgo: '1d ago',
            location: 'Marine Promenade Loop',
            distanceKm: 6.8,
            durationFormatted: '33:10',
            durationSeconds: 1990,
            paceOrSpeedFormatted: '4:52',
            paceOrSpeedLabel: 'Avg Pace',
            elevationMeters: 45,
            calories: 440,
            avgHeartRate: 156,
            maxHeartRate: 174,
            kudosCount: 6,
            hasKudoed: false,
            commentsCount: 2,
            visibility: 'public',
            createdAtIso: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: `local-act-starter-2`,
            userId: athleteId,
            title: 'Sunset Coastal Ride',
            type: 'ride',
            athlete: {
              name: athleteName,
              avatar: athleteName.substring(0, 2).toUpperCase(),
              badge: 'ACTIVE',
            },
            date: '3 days ago',
            timeAgo: '3d ago',
            location: 'Coastal Highway Circuit',
            distanceKm: 21.4,
            durationFormatted: '52:15',
            durationSeconds: 3135,
            paceOrSpeedFormatted: '24.6 km/h',
            paceOrSpeedLabel: 'Avg Speed',
            elevationMeters: 165,
            calories: 590,
            avgHeartRate: 138,
            maxHeartRate: 162,
            kudosCount: 9,
            hasKudoed: true,
            commentsCount: 1,
            visibility: 'public',
            createdAtIso: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        await AsyncStorage.setItem(activitiesKey, JSON.stringify(starterActivities));
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
        signIn,
        signUp,
        signInAsAthlete,
        signOut,
        setDemoMode: setIsDemoMode,
        refreshProfile,
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

