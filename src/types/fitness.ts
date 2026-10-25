/**
 * Spandan Fitness Tracking Application
 * Core Domain Types & Data Contracts
 */

export type ActivityType = 'run' | 'ride' | 'walk';
export type ActivityVisibility = 'public' | 'followers' | 'private';

export interface ActivityMetric {
  label: string;
  value: string;
  unit?: string;
}

export interface ActivityComment {
  id: string;
  activityId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  commentText: string;
  createdAtIso: string;
  timeAgo: string;
}

export interface ActivitySplit {
  splitNumber: number;
  distanceKm: number;
  durationSeconds: number;
  paceFormatted: string;
  speedFormatted?: string;
  elevationDeltaM: number;
}

export interface Activity {
  id: string;
  userId?: string;
  title: string;
  type: ActivityType;
  athlete: {
    name: string;
    avatar: string;
    badge?: string;
  };
  date: string;
  timeAgo: string;
  location: string;
  distanceKm: number;
  durationFormatted: string;
  durationSeconds?: number;
  paceOrSpeedFormatted: string;
  paceOrSpeedLabel: string;
  elevationMeters: number;
  calories: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  cadenceOrSteps?: string;
  kudosCount: number;
  hasKudoed: boolean;
  commentsCount: number;
  gearName?: string;
  polylinePreview?: string;
  visibility?: ActivityVisibility;
  createdAtIso?: string;
}

export interface DailyActivity {
  dayName: string;
  dayShort: string;
  dateStr: string;
  distanceKm: number;
  activeMinutes: number;
  type?: ActivityType;
  isToday: boolean;
}

export interface WeeklyStats {
  weekLabel: string;
  totalDistanceKm: number;
  distanceGoalKm: number;
  activeTimeFormatted: string;
  activeTimeMinutes: number;
  activitiesCount: number;
  elevationGainM: number;
  caloriesBurned: number;
  prevWeekDistanceKm: number;
  distanceChangePercent: number;
  streakWeeks: number;
  dailyActivities: DailyActivity[];
}

export interface AthleteProfile {
  name: string;
  handle: string;
  tagline: string;
  city: string;
  avatarText: string;
  memberSince: string;
  followersCount?: number;
  followingCount?: number;
  unitPreference?: 'metric' | 'imperial';
  weeklyGoalKm?: number;
  stats: {
    totalActivities: number;
    totalDistanceKm: number;
    totalHours: number;
    elevationTotalM: number;
  };
  shoes: {
    name: string;
    brand: string;
    distanceKm: number;
    maxKm: number;
  }[];
  bikes: {
    name: string;
    type: string;
    distanceKm: number;
  }[];
  personalRecords: {
    event: string;
    time: string;
    date: string;
  }[];
}

// ==========================================
// DEFAULT EMPTY DATA FACTORIES
// ==========================================

export function createEmptyWeeklyStats(): WeeklyStats {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayIdx = (new Date().getDay() + 6) % 7; // Monday = 0

  return {
    weekLabel: 'This Week',
    totalDistanceKm: 0,
    distanceGoalKm: 30,
    activeTimeFormatted: '0m',
    activeTimeMinutes: 0,
    activitiesCount: 0,
    elevationGainM: 0,
    caloriesBurned: 0,
    prevWeekDistanceKm: 0,
    distanceChangePercent: 0,
    streakWeeks: 0,
    dailyActivities: dayNames.map((dayShort, idx) => ({
      dayName: fullDays[idx],
      dayShort,
      dateStr: dayShort,
      distanceKm: 0,
      activeMinutes: 0,
      isToday: idx === todayIdx,
    })),
  };
}

export function createEmptyAthleteProfile(): AthleteProfile {
  return {
    name: 'Athlete',
    handle: '@athlete',
    tagline: 'Track your movement and reach your fitness goals.',
    city: 'India',
    avatarText: 'SP',
    memberSince: '2026',
    stats: {
      totalActivities: 0,
      totalDistanceKm: 0,
      totalHours: 0,
      elevationTotalM: 0,
    },
    shoes: [],
    bikes: [],
    personalRecords: [],
  };
}
