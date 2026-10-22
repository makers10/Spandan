import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
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
      if (!isConfigured) {
        if (isMounted) {
          setIsLoading(false);
          setIsDemoMode(true);
        }
        return;
      }

      try {
        const initialSession = await authService.getSession();
        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            setIsDemoMode(false);
            const userProfile = await authService.getProfile(initialSession.user.id);
            if (isMounted) setProfile(userProfile);
          } else {
            setIsDemoMode(true);
          }
        }
      } catch (err: any) {
        console.warn('Supabase auth initialization error:', err.message);
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
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          setIsDemoMode(false);
          const p = await authService.getProfile(newSession.user.id);
          if (isMounted) setProfile(p);
        } else {
          setProfile(null);
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

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
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
      setProfile(p);
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
