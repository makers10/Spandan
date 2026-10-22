import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Activity, ActivityType, WeeklyStats, DailyActivity } from '@/data/mock-fitness-data';

export interface CreateActivityInput {
  title: string;
  type: ActivityType;
  distanceKm: number;
  durationSeconds: number;
  durationFormatted: string;
  paceOrSpeedFormatted: string;
  paceOrSpeedLabel?: string;
  elevationMeters?: number;
  calories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  cadenceOrSteps?: string;
  location?: string;
  gearName?: string;
}

export const activityService = {
  async fetchUserActivities(
    userId: string,
    filterType?: ActivityType,
    athleteName: string = 'Athlete'
  ): Promise<Activity[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    let query = supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filterType) {
      query = query.eq('type', filterType);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Error fetching Supabase activities:', error.message);
      throw error;
    }

    if (!data) return [];

    return data.map((item) => {
      const createdAt = new Date(item.created_at);
      const now = new Date();
      const diffHours = Math.max(1, Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)));
      const timeAgo = diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;

      return {
        id: item.id,
        title: item.title,
        type: item.type as ActivityType,
        athlete: {
          name: athleteName,
          avatar: athleteName.substring(0, 2).toUpperCase(),
          badge: 'ACTIVE',
        },
        date: createdAt.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        timeAgo,
        location: item.location || 'Outdoor Track',
        distanceKm: Number(item.distance_km),
        durationFormatted: item.duration_formatted,
        paceOrSpeedFormatted: item.pace_or_speed_formatted,
        paceOrSpeedLabel: item.pace_or_speed_label || 'Avg Pace',
        elevationMeters: Number(item.elevation_meters || 0),
        calories: Number(item.calories || 0),
        avgHeartRate: item.avg_heart_rate ? Number(item.avg_heart_rate) : undefined,
        maxHeartRate: item.max_heart_rate ? Number(item.max_heart_rate) : undefined,
        cadenceOrSteps: item.cadence_or_steps || undefined,
        kudosCount: 0,
        hasKudoed: false,
        commentsCount: 0,
        gearName: item.gear_name || undefined,
      };
    });
  },

  async createActivity(userId: string, input: CreateActivityInput): Promise<Activity> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Activity cannot be persisted to database.');
    }

    const payload = {
      user_id: userId,
      title: input.title,
      type: input.type,
      distance_km: input.distanceKm,
      duration_seconds: input.durationSeconds,
      duration_formatted: input.durationFormatted,
      pace_or_speed_formatted: input.paceOrSpeedFormatted,
      pace_or_speed_label: input.paceOrSpeedLabel || (input.type === 'ride' ? 'Avg Speed' : 'Avg Pace'),
      elevation_meters: input.elevationMeters || 0,
      calories: input.calories || Math.round(input.distanceKm * 65),
      avg_heart_rate: input.avgHeartRate || null,
      max_heart_rate: input.maxHeartRate || null,
      cadence_or_steps: input.cadenceOrSteps || null,
      location: input.location || 'GPS Tracked Activity',
      gear_name: input.gearName || null,
    };

    const { data, error } = await supabase
      .from('activities')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error inserting activity to Supabase:', error.message);
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      type: data.type as ActivityType,
      athlete: {
        name: 'You',
        avatar: 'ME',
        badge: 'ACTIVE',
      },
      date: 'Just now',
      timeAgo: 'Just now',
      location: data.location,
      distanceKm: Number(data.distance_km),
      durationFormatted: data.duration_formatted,
      paceOrSpeedFormatted: data.pace_or_speed_formatted,
      paceOrSpeedLabel: data.pace_or_speed_label,
      elevationMeters: Number(data.elevation_meters),
      calories: Number(data.calories),
      avgHeartRate: data.avg_heart_rate ? Number(data.avg_heart_rate) : undefined,
      maxHeartRate: data.max_heart_rate ? Number(data.max_heart_rate) : undefined,
      cadenceOrSteps: data.cadence_or_steps || undefined,
      kudosCount: 0,
      hasKudoed: false,
      commentsCount: 0,
      gearName: data.gear_name || undefined,
    };
  },

  calculateWeeklyStats(activities: Activity[], goalKm: number = 50.0): WeeklyStats {
    const totalDistance = activities.reduce((sum, a) => sum + a.distanceKm, 0);
    const totalElev = activities.reduce((sum, a) => sum + a.elevationMeters, 0);
    const totalCalories = activities.reduce((sum, a) => sum + a.calories, 0);

    // Approximate active minutes
    const totalMinutes = activities.reduce((sum, a) => {
      const parts = a.durationFormatted.split(':').map(Number);
      if (parts.length === 3) return sum + parts[0] * 60 + parts[1];
      if (parts.length === 2) return sum + parts[0];
      return sum + 30;
    }, 0);

    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const activeTimeFormatted = `${hrs}h ${mins}m`;

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

    const dailyActivities: DailyActivity[] = dayNames.map((short, idx) => ({
      dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx],
      dayShort: short,
      dateStr: '',
      distanceKm: idx === todayIndex && activities.length > 0 ? Number((totalDistance / Math.max(1, activities.length)).toFixed(1)) : 0,
      activeMinutes: idx === todayIndex ? 45 : 0,
      type: activities[0]?.type,
      isToday: idx === todayIndex,
    }));

    return {
      weekLabel: 'Current Training Week',
      totalDistanceKm: Number(totalDistance.toFixed(1)),
      distanceGoalKm: goalKm,
      activeTimeFormatted,
      activeTimeMinutes: totalMinutes,
      activitiesCount: activities.length,
      elevationGainM: totalElev,
      caloriesBurned: totalCalories,
      prevWeekDistanceKm: 0,
      distanceChangePercent: 100,
      streakWeeks: activities.length > 0 ? 1 : 0,
      dailyActivities,
    };
  },
};
