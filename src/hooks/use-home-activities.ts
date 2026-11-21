import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { activityService } from '@/services/activity-service';
import { Activity, WeeklyStats, createEmptyWeeklyStats } from '@/types/fitness';

export function useHomeActivities() {
  const { user, profile, isDemoMode } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);

  const isLiveUser = Boolean(user && !isDemoMode);
  const athleteName = profile?.full_name || user?.email?.split('@')[0] || 'Athlete';
  const goalKm = profile?.weekly_distance_goal_km || 50.0;

  const loadData = useCallback(async () => {
    if (!isLiveUser || !user) return;
    setIsLoading(true);
    try {
      const fetched = await activityService.fetchUserActivities(user.id, undefined, athleteName);
      setActivities(fetched);
      setWeeklyStats(activityService.calculateWeeklyStats(fetched, goalKm));
    } catch (err: any) {
      console.warn('Failed to load user activities from Supabase:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [isLiveUser, user, athleteName, goalKm]);

  useEffect(() => {
    let ignore = false;
    if (isLiveUser && user) {
      void (async () => {
        await Promise.resolve();
        if (ignore) return;
        void loadData();
      })();
    }
    return () => {
      ignore = true;
    };
  }, [isLiveUser, user, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  return {
    rawActivities: activities,
    activeWeeklyStats: weeklyStats || createEmptyWeeklyStats(),
    isLoading,
    refreshing,
    onRefresh,
    isLiveUser,
  };
}
