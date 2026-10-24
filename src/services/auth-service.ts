import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  avatar_text: string | null;
  bio: string | null;
  city: string | null;
  weekly_distance_goal_km: number;
  unit_preference?: 'metric' | 'imperial';
}

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please add your EXPO_PUBLIC_SUPABASE_ANON_KEY to .env or use Demo Mode.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please add your EXPO_PUBLIC_SUPABASE_ANON_KEY to .env or use Demo Mode.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!isSupabaseConfigured()) {
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('Error fetching Supabase session:', error.message);
      return null;
    }
    return data.session;
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (userId.startsWith('athlete-')) {
      try {
        const raw = await AsyncStorage.getItem('@track_local_profile');
        if (raw) return JSON.parse(raw);
      } catch (err) {
        console.warn('Error fetching local athlete profile:', err);
      }
    }

    if (!isSupabaseConfigured()) {
      try {
        const raw = await AsyncStorage.getItem('@track_local_profile');
        if (raw) return JSON.parse(raw);
      } catch {
        // ignore
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching athlete profile from Supabase, checking local cache:', error.message);
        const raw = await AsyncStorage.getItem('@track_local_profile');
        if (raw) return JSON.parse(raw);
        return null;
      }
      return data as UserProfile | null;
    } catch {
      const raw = await AsyncStorage.getItem('@track_local_profile');
      if (raw) return JSON.parse(raw);
      return null;
    }
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    // Update local profile cache first
    let localProfile: UserProfile = {
      id: userId,
      email: null,
      full_name: null,
      username: null,
      avatar_text: null,
      bio: null,
      city: null,
      weekly_distance_goal_km: 50,
      ...updates,
    };

    try {
      const raw = await AsyncStorage.getItem('@track_local_profile');
      if (raw) {
        const current = JSON.parse(raw);
        localProfile = { ...current, ...updates };
      }
      await AsyncStorage.setItem('@track_local_profile', JSON.stringify(localProfile));
    } catch (err) {
      console.warn('Error updating local profile cache:', err);
    }

    if (!isSupabaseConfigured() || userId.startsWith('athlete-')) {
      return localProfile;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.warn('Supabase profile update fallback to local storage:', error.message);
        return localProfile;
      }
      return data as UserProfile;
    } catch {
      return localProfile;
    }
  },
};
