import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Activity,
  ActivityType,
  ActivityVisibility,
  WeeklyStats,
  DailyActivity,
} from '@/types/fitness';
import {
  GpsCoordinate,
  MinifiedTelemetryPoint,
  compressTelemetry,
  decompressTelemetry,
} from '@/utils/geo';

/**
 * Explicit column projection for feed, dashboard, and list views.
 * Deliberately EXCLUDES the heavy `gps_telemetry` JSONB and `route_path` columns
 * to guarantee instantaneous queries, fast rendering, and low bandwidth usage.
 */
export const ACTIVITY_FEED_COLUMNS = [
  'id',
  'user_id',
  'title',
  'type',
  'distance_km',
  'duration_formatted',
  'duration_seconds',
  'pace_or_speed_formatted',
  'pace_or_speed_label',
  'elevation_meters',
  'calories',
  'avg_heart_rate',
  'max_heart_rate',
  'cadence_or_steps',
  'location',
  'gear_name',
  'polyline_preview',
  'visibility',
  'created_at',
  'profiles:profiles(full_name, avatar_text)',
].join(', ');

export interface CreateActivityInput {
  title: string;
  type: ActivityType;
  distanceKm: number;
  durationSeconds: number;
  durationFormatted: string;
  paceOrSpeedFormatted: string;
  paceOrSpeedLabel?: string;
  elevationMeters?: number;
  floorsClimbed?: number;
  calories?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  cadenceOrSteps?: string;
  location?: string;
  gearName?: string;
  polylinePreview?: string;
  visibility?: ActivityVisibility;
  routePoints?: GpsCoordinate[];
  gpsTelemetry?: MinifiedTelemetryPoint[];
}

function mapDatabaseRowToActivity(item: any, fallbackAthleteName: string = 'Athlete'): Activity {
  const createdAt = new Date(item.created_at);
  const now = new Date();
  const diffHours = Math.max(1, Math.round((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)));
  const timeAgo = diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;

  const athleteName = item.profiles?.full_name || fallbackAthleteName;
  const avatar = item.profiles?.avatar_text || athleteName.substring(0, 2).toUpperCase();

  return {
    id: item.id,
    userId: item.user_id,
    title: item.title,
    type: item.type as ActivityType,
    athlete: {
      name: athleteName,
      avatar,
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
    durationSeconds: Number(item.duration_seconds || 0),
    paceOrSpeedFormatted: item.pace_or_speed_formatted,
    paceOrSpeedLabel: item.pace_or_speed_label || 'Avg Pace',
    elevationMeters: Number(item.elevation_meters || 0),
    floorsClimbed: item.floors_climbed !== undefined && item.floors_climbed !== null
      ? Number(item.floors_climbed)
      : Math.floor(Number(item.elevation_meters || 0) / 3.0),
    calories: Number(item.calories || 0),
    avgHeartRate: item.avg_heart_rate ? Number(item.avg_heart_rate) : undefined,
    maxHeartRate: item.max_heart_rate ? Number(item.max_heart_rate) : undefined,
    cadenceOrSteps: item.cadenceOrSteps || undefined,
    kudosCount: 0,
    hasKudoed: false,
    commentsCount: 0,
    gearName: item.gear_name || undefined,
    polylinePreview: item.polyline_preview || undefined,
    visibility: (item.visibility as ActivityVisibility) || 'public',
    createdAtIso: item.created_at,
  };
}

export const activityService = {
  /**
   * Fetches an athlete's personal activities using lightweight column projection.
   * Excludes `gps_telemetry` JSONB to optimize feed scrolling.
   */
  /**
   * Fetches an athlete's personal activities using lightweight column projection.
   * Excludes `gps_telemetry` JSONB to optimize feed scrolling.
   * Gracefully merges local activities with remote Supabase data and falls back safely.
   */
  async fetchUserActivities(
    userId: string,
    filterType?: ActivityType,
    athleteName: string = 'Athlete'
  ): Promise<Activity[]> {
    // 1. Read locally stored activities
    let localActivities: Activity[] = [];
    try {
      const storageKey = `@track_local_activities_${userId}`;
      const raw = await AsyncStorage.getItem(storageKey);
      if (raw) {
        localActivities = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Error reading local activities cache:', err);
    }

    // 2. Query Supabase if configured and user is not purely local
    let remoteActivities: Activity[] = [];
    if (isSupabaseConfigured() && !userId.startsWith('athlete-')) {
      try {
        let query = supabase
          .from('activities')
          .select(ACTIVITY_FEED_COLUMNS)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (filterType) {
          query = query.eq('type', filterType);
        }

        const { data, error } = await query;
        if (!error && data) {
          remoteActivities = data.map((item) => mapDatabaseRowToActivity(item, athleteName));
        } else if (error) {
          console.warn('Supabase activities fetch fallback to local cache:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase activities query network error, using local data:', err.message);
      }
    }

    // 3. Merge both sources without duplicate IDs
    const activityMap = new Map<string, Activity>();
    for (const act of localActivities) {
      activityMap.set(act.id, act);
    }
    for (const act of remoteActivities) {
      activityMap.set(act.id, act);
    }

    let merged = Array.from(activityMap.values());
    merged.sort((a, b) => {
      const timeA = new Date(a.createdAtIso || 0).getTime();
      const timeB = new Date(b.createdAtIso || 0).getTime();
      return timeB - timeA;
    });

    if (filterType) {
      merged = merged.filter((a) => a.type === filterType);
    }

    return merged;
  },

  /**
   * Fetches a single activity metadata by ID (lightweight).
   * Checks Supabase first, falls back to local AsyncStorage.
   */
  async fetchActivityById(activityId: string): Promise<Activity | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select(ACTIVITY_FEED_COLUMNS)
          .eq('id', activityId)
          .single();

        if (!error && data) {
          return mapDatabaseRowToActivity(data);
        }
      } catch {
        // continue to local fallback
      }
    }

    // Fallback search across local athlete activity storage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const actKeys = keys.filter((k) => k.startsWith('@track_local_activities_'));
      for (const k of actKeys) {
        const raw = await AsyncStorage.getItem(k);
        if (raw) {
          const list: Activity[] = JSON.parse(raw);
          const found = list.find((a) => a.id === activityId);
          if (found) return found;
        }
      }
    } catch (err) {
      console.warn('Error reading local activity by ID:', err);
    }

    return null;
  },

  /**
   * Dedicated Deferred Query: Selectively fetches the full `gps_telemetry` JSONB data block
   * for a specific activity on demand (e.g. when opening granular charts or spatial splits).
   * Supports downsampling to avoid mobile UI thread lockup, with local GPS coordinates fallback.
   */
  async fetchActivityTelemetry(
    activityId: string,
    options: { downsampleFactor?: number; maxPoints?: number } = {}
  ): Promise<{ points: GpsCoordinate[]; isDownsampled: boolean; totalPoints: number }> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('activities')
          .select('id, gps_telemetry')
          .eq('id', activityId)
          .single();

        if (!error && data && Array.isArray(data.gps_telemetry) && data.gps_telemetry.length > 0) {
          const rawPoints = decompressTelemetry(data.gps_telemetry as MinifiedTelemetryPoint[]);
          const totalPoints = rawPoints.length;

          const factor = options.downsampleFactor || (options.maxPoints && totalPoints > options.maxPoints
            ? Math.ceil(totalPoints / options.maxPoints)
            : 1);

          if (factor > 1) {
            const downsampled: GpsCoordinate[] = [];
            for (let i = 0; i < rawPoints.length; i += factor) {
              downsampled.push(rawPoints[i]);
            }
            if (downsampled[downsampled.length - 1] !== rawPoints[rawPoints.length - 1]) {
              downsampled.push(rawPoints[rawPoints.length - 1]);
            }
            return { points: downsampled, isDownsampled: true, totalPoints };
          }

          return { points: rawPoints, isDownsampled: false, totalPoints };
        }
      } catch {
        // continue to local fallback
      }
    }

    // Fallback: Check local telemetry points cached in AsyncStorage
    try {
      const raw = await AsyncStorage.getItem(`@track_local_telemetry_${activityId}`);
      if (raw) {
        const rawPoints: GpsCoordinate[] = JSON.parse(raw);
        const totalPoints = rawPoints.length;
        const factor = options.downsampleFactor || (options.maxPoints && totalPoints > options.maxPoints
          ? Math.ceil(totalPoints / options.maxPoints)
          : 1);

        if (factor > 1) {
          const downsampled: GpsCoordinate[] = [];
          for (let i = 0; i < rawPoints.length; i += factor) {
            downsampled.push(rawPoints[i]);
          }
          return { points: downsampled, isDownsampled: true, totalPoints };
        }
        return { points: rawPoints, isDownsampled: false, totalPoints };
      }
    } catch (err) {
      console.warn('Error reading local telemetry:', err);
    }

    return { points: [], isDownsampled: false, totalPoints: 0 };
  },

  /**
   * Fetches social feed: activities created by followed athletes plus public activities.
   * Excludes `gps_telemetry` JSONB to keep memory footprint minimal.
   */
  async fetchSocialFeed(currentUserId?: string, filterType?: ActivityType): Promise<Activity[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    try {
      let query = supabase
        .from('activities')
        .select(ACTIVITY_FEED_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(30);

      if (filterType) {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('Error fetching social feed:', error.message);
        return [];
      }

      if (!data) return [];
      return data.map((item) => mapDatabaseRowToActivity(item));
    } catch (err: any) {
      console.warn('Error querying social feed:', err.message);
      return [];
    }
  },

  /**
   * Creates an activity with hybrid JSONB telemetry storage.
   * Automatically persists locally to AsyncStorage so user workouts are never lost
   * if the database table is unreachable or offline!
   */
  async createActivity(userId: string, input: CreateActivityInput): Promise<Activity> {
    const localId = `local-act-${Date.now()}`;
    const nowIso = new Date().toISOString();

    // Minify telemetry points into compressed JSONB array
    let telemetryPayload: MinifiedTelemetryPoint[] = [];
    if (input.gpsTelemetry && input.gpsTelemetry.length > 0) {
      telemetryPayload = input.gpsTelemetry;
    } else if (input.routePoints && input.routePoints.length > 0) {
      telemetryPayload = compressTelemetry(input.routePoints, {
        coordinatePrecision: 6,
        minDistanceMeters: 1.0,
      });
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
      polyline_preview: input.polylinePreview || null,
      visibility: input.visibility || 'public',
      gps_telemetry: telemetryPayload, // Stored as single JSONB array
    };

    let savedActivity: Activity | null = null;

    // Attempt Supabase insert if configured and not local athlete ID
    if (isSupabaseConfigured() && !userId.startsWith('athlete-')) {
      try {
        const { data, error } = await supabase
          .from('activities')
          .insert(payload)
          .select(ACTIVITY_FEED_COLUMNS)
          .single();

        if (!error && data) {
          savedActivity = mapDatabaseRowToActivity(data, 'You');
        } else if (error) {
          console.warn('Supabase activity insert fallback to local storage:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase activity insert network error, saving locally:', err.message);
      }
    }

    // Fallback if Supabase was unconfigured, table missing, or user is local athlete
    if (!savedActivity) {
      savedActivity = {
        id: localId,
        userId,
        title: input.title,
        type: input.type,
        athlete: {
          name: 'You',
          avatar: 'YOU',
          badge: 'ACTIVE',
        },
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        timeAgo: 'Just now',
        location: input.location || 'Outdoor GPS Session',
        distanceKm: Number(input.distanceKm),
        durationFormatted: input.durationFormatted,
        durationSeconds: Number(input.durationSeconds || 0),
        paceOrSpeedFormatted: input.paceOrSpeedFormatted,
        paceOrSpeedLabel: input.paceOrSpeedLabel || (input.type === 'ride' ? 'Avg Speed' : 'Avg Pace'),
        elevationMeters: Number(input.elevationMeters || 0),
        floorsClimbed: Number(input.floorsClimbed || Math.floor((input.elevationMeters || 0) / 3.0)),
        calories: Number(input.calories || 0),
        avgHeartRate: input.avgHeartRate,
        maxHeartRate: input.maxHeartRate,
        cadenceOrSteps: input.cadenceOrSteps,
        kudosCount: 0,
        hasKudoed: false,
        commentsCount: 0,
        gearName: input.gearName,
        polylinePreview: input.polylinePreview,
        visibility: input.visibility || 'public',
        createdAtIso: nowIso,
      };
    }

    // Persist to local AsyncStorage activities collection for this user
    try {
      const storageKey = `@track_local_activities_${userId}`;
      const raw = await AsyncStorage.getItem(storageKey);
      const list: Activity[] = raw ? JSON.parse(raw) : [];
      list.unshift(savedActivity);
      await AsyncStorage.setItem(storageKey, JSON.stringify(list));

      // Cache raw GPS coordinates for map and telemetry analysis
      if (input.routePoints && input.routePoints.length > 0) {
        await AsyncStorage.setItem(
          `@track_local_telemetry_${savedActivity.id}`,
          JSON.stringify(input.routePoints)
        );
      }
    } catch (err) {
      console.warn('Error persisting activity to local storage:', err);
    }

    return savedActivity;
  },

  /**
   * Updates an existing activity (ownership enforced by RLS).
   */
  async updateActivity(
    userId: string,
    activityId: string,
    updates: {
      title?: string;
      type?: ActivityType;
      visibility?: ActivityVisibility;
      gearName?: string;
    }
  ): Promise<Activity> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.visibility !== undefined) payload.visibility = updates.visibility;
    if (updates.gearName !== undefined) payload.gear_name = updates.gearName;

    const { data, error } = await supabase
      .from('activities')
      .update(payload)
      .eq('id', activityId)
      .eq('user_id', userId)
      .select('*, profiles(full_name, avatar_text)')
      .single();

    if (error) {
      console.error('Error updating activity in Supabase:', error.message);
      throw error;
    }

    return mapDatabaseRowToActivity(data);
  },

  /**
   * Deletes an activity and its cascade dependencies (ownership enforced by RLS).
   */
  async deleteActivity(userId: string, activityId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured.');
    }

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting activity from Supabase:', error.message);
      throw error;
    }

    return true;
  },

  /**
   * Fetches ordered GPS route coordinates for an activity.
   */
  async fetchActivityRoutePoints(activityId: string): Promise<GpsCoordinate[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const { data, error } = await supabase
      .from('activity_points')
      .select('*')
      .eq('activity_id', activityId)
      .order('point_order', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((pt) => ({
      latitude: Number(pt.latitude),
      longitude: Number(pt.longitude),
      altitude: pt.altitude !== null ? Number(pt.altitude) : undefined,
      accuracy: pt.accuracy !== null ? Number(pt.accuracy) : undefined,
      speed: pt.speed !== null ? Number(pt.speed) : undefined,
      timestamp: new Date(pt.recorded_at).getTime(),
    }));
  },

  /**
   * Computes weekly training volume and day-of-week distribution.
   */
  calculateWeeklyStats(activities: Activity[], goalKm: number = 50.0): WeeklyStats {
    const totalDistance = activities.reduce((sum, a) => sum + a.distanceKm, 0);
    const totalElev = activities.reduce((sum, a) => sum + a.elevationMeters, 0);
    const totalFloors = activities.reduce((sum, a) => sum + (a.floorsClimbed || Math.floor(a.elevationMeters / 3.0)), 0);
    const totalCalories = activities.reduce((sum, a) => sum + a.calories, 0);

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
    const fullDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0

    const dayBuckets: { distanceKm: number; activeMinutes: number; type?: ActivityType }[] =
      dayNames.map(() => ({ distanceKm: 0, activeMinutes: 0 }));

    for (const act of activities) {
      const actDate = act.createdAtIso ? new Date(act.createdAtIso) : new Date();
      const dayIdx = (actDate.getDay() + 6) % 7;

      const parts = act.durationFormatted.split(':').map(Number);
      let durationMins = 30;
      if (parts.length === 3) durationMins = parts[0] * 60 + parts[1];
      else if (parts.length === 2) durationMins = parts[0];

      dayBuckets[dayIdx].distanceKm += act.distanceKm;
      dayBuckets[dayIdx].activeMinutes += durationMins;
      if (!dayBuckets[dayIdx].type) dayBuckets[dayIdx].type = act.type;
    }

    const dailyActivities: DailyActivity[] = dayNames.map((short, idx) => ({
      dayName: fullDayNames[idx],
      dayShort: short,
      dateStr: '',
      distanceKm: Number(dayBuckets[idx].distanceKm.toFixed(1)),
      activeMinutes: dayBuckets[idx].activeMinutes,
      type: dayBuckets[idx].type,
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
      floorsClimbedTotal: totalFloors,
      caloriesBurned: totalCalories,
      prevWeekDistanceKm: 0,
      distanceChangePercent: 100,
      streakWeeks: activities.length > 0 ? 1 : 0,
      dailyActivities,
    };
  },
};
