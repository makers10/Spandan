/**
 * Spandan Streak Engine
 * Calculates athlete daily workout streaks with timezone awareness,
 * midnight boundary precision (11:59 PM vs 12:01 AM), and multi-workout deduplication.
 */

export interface StreakWorkout {
  timestamp: number | string | Date; // epoch ms or ISO string
  distanceKm?: number;
}

export interface StreakResult {
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDateStr: string | null;
  isActiveToday: boolean;
  totalActiveDays: number;
}

/**
 * Formats a Date object or timestamp into YYYY-MM-DD for a specific IANA timezone.
 * Falls back to UTC or local if timezone string is invalid.
 */
export function getLocalDateString(timestamp: number | string | Date, timeZone: string = 'UTC'): string {
  const date = typeof timestamp === 'number' || typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  if (isNaN(date.getTime())) {
    return '';
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // en-CA formats as YYYY-MM-DD
  } catch {
    // Fallback if timezone not supported
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

/**
 * Calculates consecutive daily streaks from a list of workouts.
 *
 * Rules:
 * 1. Multiple workouts on the same calendar day count as 1 active day (idempotent).
 * 2. 11:59 PM (Day N) and 12:01 AM (Day N+1) are strictly distinct consecutive days (streak += 1).
 * 3. A user has until 23:59:59 of "today" to maintain a streak earned "yesterday".
 * 4. A gap of >= 2 days resets the active streak to 0 (or 1 if worked out today).
 */
export function calculateDailyStreak(
  workouts: StreakWorkout[],
  options: {
    timeZone?: string;
    referenceDate?: number | string | Date; // Defaults to now
  } = {}
): StreakResult {
  const timeZone = options.timeZone || 'UTC';
  const refDate = options.referenceDate ? new Date(options.referenceDate) : new Date();
  const todayStr = getLocalDateString(refDate, timeZone);

  // Calculate yesterday string relative to reference date in the target timezone
  const yesterdayDate = new Date(refDate.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = getLocalDateString(yesterdayDate, timeZone);

  if (!Array.isArray(workouts) || workouts.length === 0) {
    return {
      currentStreakDays: 0,
      longestStreakDays: 0,
      lastActiveDateStr: null,
      isActiveToday: false,
      totalActiveDays: 0,
    };
  }

  // 1. Extract unique active calendar days in descending order
  const activeDaysSet = new Set<string>();
  for (const w of workouts) {
    const dStr = getLocalDateString(w.timestamp, timeZone);
    if (dStr) {
      activeDaysSet.add(dStr);
    }
  }

  const sortedDays = Array.from(activeDaysSet).sort((a, b) => b.localeCompare(a)); // Descending YYYY-MM-DD
  if (sortedDays.length === 0) {
    return {
      currentStreakDays: 0,
      longestStreakDays: 0,
      lastActiveDateStr: null,
      isActiveToday: false,
      totalActiveDays: 0,
    };
  }

  const lastActiveDateStr = sortedDays[0];
  const isActiveToday = activeDaysSet.has(todayStr);
  const isActiveYesterday = activeDaysSet.has(yesterdayStr);

  // 2. Check if current streak is alive (active today or yesterday)
  const isStreakAlive = isActiveToday || isActiveYesterday;

  let currentStreak = 0;
  if (isStreakAlive) {
    let expectedDate = isActiveToday ? new Date(refDate) : yesterdayDate;
    while (true) {
      const expStr = getLocalDateString(expectedDate, timeZone);
      if (activeDaysSet.has(expStr)) {
        currentStreak++;
        // Step back 1 day
        expectedDate = new Date(expectedDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  // 3. Compute all-time longest streak
  // Sort ascending for consecutive day forward counting
  const ascDays = Array.from(activeDaysSet).sort((a, b) => a.localeCompare(b));
  let longestStreak = 0;
  let tempStreak = 0;
  let prevTime: number | null = null;

  for (const dStr of ascDays) {
    const [y, m, d] = dStr.split('-').map(Number);
    const currTime = Date.UTC(y, m - 1, d);

    if (prevTime === null) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((currTime - prevTime) / (24 * 60 * 60 * 1000));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }

    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevTime = currTime;
  }

  return {
    currentStreakDays: currentStreak,
    longestStreakDays: Math.max(longestStreak, currentStreak),
    lastActiveDateStr,
    isActiveToday,
    totalActiveDays: sortedDays.length,
  };
}
