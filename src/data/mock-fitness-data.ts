/**
 * Spandan Fitness Tracking Application
 * Mock Data Layer (Milestone 1)
 *
 * NOTE: This mock data is strictly separated from real user data.
 * When real local database (SQLite/AsyncStorage) or backend API is integrated
 * in future milestones, replace these helper getters with real data queries.
 */

export type ActivityType = 'run' | 'ride' | 'walk';

export interface ActivityMetric {
  label: string;
  value: string;
  unit?: string;
}

export interface Activity {
  id: string;
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
  distanceChangePercent: number; // positive = increased
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
  stats: {
    totalActivities: number;
    totalDistanceKm: number;
    totalHours: number;
    elevationTotalM: number;
  };
  shoes: Array<{
    name: string;
    brand: string;
    distanceKm: number;
    maxKm: number;
  }>;
  bikes: Array<{
    name: string;
    type: string;
    distanceKm: number;
  }>;
  personalRecords: Array<{
    event: string;
    time: string;
    date: string;
  }>;
}

// ==========================================
// MOCK DATA STORE
// ==========================================

export const MOCK_WEEKLY_STATS: WeeklyStats = {
  weekLabel: 'Oct 14 - Oct 20, 2026',
  totalDistanceKm: 42.8,
  distanceGoalKm: 50.0,
  activeTimeFormatted: '4h 32m',
  activeTimeMinutes: 272,
  activitiesCount: 5,
  elevationGainM: 480,
  caloriesBurned: 2640,
  prevWeekDistanceKm: 37.5,
  distanceChangePercent: 14.1,
  streakWeeks: 4,
  dailyActivities: [
    { dayName: 'Monday', dayShort: 'Mon', dateStr: 'Oct 14', distanceKm: 6.2, activeMinutes: 34, type: 'run', isToday: false },
    { dayName: 'Tuesday', dayShort: 'Tue', dateStr: 'Oct 15', distanceKm: 18.4, activeMinutes: 52, type: 'ride', isToday: false },
    { dayName: 'Wednesday', dayShort: 'Wed', dateStr: 'Oct 16', distanceKm: 0, activeMinutes: 0, isToday: false },
    { dayName: 'Thursday', dayShort: 'Thu', dateStr: 'Oct 17', distanceKm: 7.4, activeMinutes: 40, type: 'run', isToday: false },
    { dayName: 'Friday', dayShort: 'Fri', dateStr: 'Oct 18', distanceKm: 0, activeMinutes: 0, isToday: false },
    { dayName: 'Saturday', dayShort: 'Sat', dateStr: 'Oct 19', distanceKm: 6.0, activeMinutes: 65, type: 'walk', isToday: false },
    { dayName: 'Sunday', dayShort: 'Sun', dateStr: 'Oct 20', distanceKm: 4.8, activeMinutes: 26, type: 'run', isToday: true },
  ],
};

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    title: 'Morning Seafront Tempo Run',
    type: 'run',
    athlete: {
      name: 'Alex Varma',
      avatar: 'AV',
      badge: 'PRO',
    },
    date: 'Today, 6:45 AM',
    timeAgo: '3h ago',
    location: 'Marine Drive Coastal Promenade',
    distanceKm: 8.42,
    durationFormatted: '44:18',
    paceOrSpeedFormatted: '5:15',
    paceOrSpeedLabel: 'Avg Pace',
    elevationMeters: 68,
    calories: 592,
    avgHeartRate: 156,
    maxHeartRate: 174,
    cadenceOrSteps: '168 spm',
    kudosCount: 18,
    hasKudoed: true,
    commentsCount: 4,
    gearName: 'Nike Air Zoom Pegasus 40',
    polylinePreview: 'M 10 70 Q 40 10 90 40 T 170 50 T 250 20 T 320 60',
  },
  {
    id: 'act-2',
    title: 'Sunset Coastal Road Ride',
    type: 'ride',
    athlete: {
      name: 'Alex Varma',
      avatar: 'AV',
      badge: 'PRO',
    },
    date: 'Yesterday, 5:15 PM',
    timeAgo: '1d ago',
    location: 'Worli Sea Link & Heritage Loop',
    distanceKm: 28.5,
    durationFormatted: '1:04:12',
    paceOrSpeedFormatted: '26.6',
    paceOrSpeedLabel: 'Avg Speed',
    elevationMeters: 245,
    calories: 840,
    avgHeartRate: 142,
    maxHeartRate: 168,
    cadenceOrSteps: '84 rpm',
    kudosCount: 32,
    hasKudoed: false,
    commentsCount: 7,
    gearName: 'Trek Domane AL 4 Disc',
    polylinePreview: 'M 15 80 Q 80 20 140 60 T 230 30 T 310 75',
  },
  {
    id: 'act-3',
    title: 'Evening Sunset Stride & Recovery Walk',
    type: 'walk',
    athlete: {
      name: 'Alex Varma',
      avatar: 'AV',
      badge: 'PRO',
    },
    date: 'Saturday, 6:00 PM',
    timeAgo: '2d ago',
    location: 'Sanjay Gandhi National Reserve Park',
    distanceKm: 4.8,
    durationFormatted: '52:10',
    paceOrSpeedFormatted: '10:52',
    paceOrSpeedLabel: 'Avg Pace',
    elevationMeters: 42,
    calories: 275,
    avgHeartRate: 104,
    maxHeartRate: 118,
    cadenceOrSteps: '6,420 steps',
    kudosCount: 12,
    hasKudoed: true,
    commentsCount: 2,
    gearName: 'Hoka Clifton 9',
    polylinePreview: 'M 20 60 Q 60 90 120 40 T 200 80 T 300 30',
  },
  {
    id: 'act-4',
    title: 'Thursday Threshold Intervals',
    type: 'run',
    athlete: {
      name: 'Alex Varma',
      avatar: 'AV',
      badge: 'PRO',
    },
    date: 'Oct 17, 7:10 AM',
    timeAgo: '4d ago',
    location: 'University Track & Hillside',
    distanceKm: 7.4,
    durationFormatted: '38:50',
    paceOrSpeedFormatted: '5:14',
    paceOrSpeedLabel: 'Avg Pace',
    elevationMeters: 84,
    calories: 520,
    avgHeartRate: 162,
    maxHeartRate: 181,
    cadenceOrSteps: '172 spm',
    kudosCount: 21,
    hasKudoed: false,
    commentsCount: 5,
    gearName: 'Nike Air Zoom Pegasus 40',
    polylinePreview: 'M 10 50 Q 80 80 150 20 T 240 60 T 320 40',
  },
];

export const MOCK_ATHLETE_PROFILE: AthleteProfile = {
  name: 'Alex Varma',
  handle: '@alex_spandan',
  tagline: 'Marathon trainee & endurance enthusiast. Finding the pulse in every stride.',
  city: 'Mumbai, India',
  avatarText: 'AV',
  memberSince: 'March 2024',
  stats: {
    totalActivities: 184,
    totalDistanceKm: 1420.5,
    totalHours: 136,
    elevationTotalM: 11420,
  },
  shoes: [
    {
      name: 'Nike Air Zoom Pegasus 40',
      brand: 'Nike',
      distanceKm: 312,
      maxKm: 650,
    },
    {
      name: 'Hoka Clifton 9',
      brand: 'Hoka',
      distanceKm: 148,
      maxKm: 600,
    },
  ],
  bikes: [
    {
      name: 'Trek Domane AL 4 Disc',
      type: 'Endurance Road',
      distanceKm: 890,
    },
  ],
  personalRecords: [
    { event: '5K Stride', time: '21:42', date: 'Aug 2026' },
    { event: '10K Tempo', time: '46:15', date: 'Sep 2026' },
    { event: 'Half Marathon', time: '1:44:20', date: 'Jul 2026' },
    { event: 'Longest Ride', time: '64.2 km', date: 'Sep 2026' },
  ],
};

// ==========================================
// ACCESSOR FUNCTIONS (SIMULATED DATA SERVICE)
// ==========================================

export function getMockWeeklyStats(): WeeklyStats {
  return MOCK_WEEKLY_STATS;
}

export function getMockActivities(filterType?: ActivityType): Activity[] {
  if (!filterType) return MOCK_ACTIVITIES;
  return MOCK_ACTIVITIES.filter((a) => a.type === filterType);
}

export function getMockAthleteProfile(): AthleteProfile {
  return MOCK_ATHLETE_PROFILE;
}
