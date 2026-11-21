export interface InsightActivity {
  id: string;
  distanceKm?: number;
  durationSeconds?: number;
  calories?: number;
  createdAtIso?: string;
  date?: string;
  type?: string;
}

export interface SmartInsight {
  id: string;
  type: 'weekly_distance' | 'pace_speed' | 'calories_today' | 'step_goal' | 'monthly_record';
  icon: string;
  iconColor: string;
  iconBg: string;
  badge: string;
  headline: string;
  message: string;
}

const MS_DAY = 86_400_000;

function parseActTime(a: InsightActivity): number {
  if (a.createdAtIso) {
    const t = new Date(a.createdAtIso).getTime();
    if (!isNaN(t)) return t;
  }
  const t = new Date(a.date || '').getTime();
  return isNaN(t) ? Date.now() : t;
}

export function generateFitnessInsights(
  activities: InsightActivity[],
  dailyStepGoal: number = 8000,
  currentLiveSteps: number = 0
): SmartInsight[] {
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  const thisWeekActs = activities.filter((a) => now - parseActTime(a) <= 7 * MS_DAY);
  const lastWeekActs = activities.filter((a) => {
    const diff = now - parseActTime(a);
    return diff > 7 * MS_DAY && diff <= 14 * MS_DAY;
  });
  const todayActs = activities.filter((a) => parseActTime(a) >= todayStart);
  const monthActs = activities.filter((a) => parseActTime(a) >= thisMonthStart);

  // 1. Weekly Comparison
  const thisWeekKm = thisWeekActs.reduce((s, a) => s + (a.distanceKm || 0), 0);
  const lastWeekKm = lastWeekActs.reduce((s, a) => s + (a.distanceKm || 0), 0);
  let weeklyMsg = 'Log your first session this week to track your progress.';
  if (lastWeekKm > 0) {
    const pct = Math.round(((thisWeekKm - lastWeekKm) / lastWeekKm) * 100);
    weeklyMsg = pct >= 0 ? `You walked ${pct}% more this week than last week.` : `You are ${Math.abs(pct)}% behind last week's distance.`;
  } else if (thisWeekKm > 0) {
    weeklyMsg = `Great start! You've logged ${thisWeekKm.toFixed(1)} km so far this week.`;
  }

  // 2. Walking Speed & Pace
  const thisWeekSec = thisWeekActs.reduce((s, a) => s + (a.durationSeconds || 1800), 0);
  const lastWeekSec = lastWeekActs.reduce((s, a) => s + (a.durationSeconds || 1800), 0);
  const thisSpeed = thisWeekKm > 0 && thisWeekSec > 0 ? thisWeekKm / (thisWeekSec / 3600) : 0;
  const lastSpeed = lastWeekKm > 0 && lastWeekSec > 0 ? lastWeekKm / (lastWeekSec / 3600) : 0;
  let speedMsg = 'Log walking sessions to analyze pace improvement.';
  if (lastSpeed > 0 && thisSpeed > lastSpeed) {
    const diffPct = Math.round(((thisSpeed - lastSpeed) / lastSpeed) * 100);
    speedMsg = `Your average walking speed improved by ${diffPct}% this week.`;
  } else if (thisSpeed > 0) {
    speedMsg = `Your average moving speed is ${thisSpeed.toFixed(1)} km/h.`;
  }

  // 3. Calories Burned Today
  const todayCal = todayActs.reduce((s, a) => s + (a.calories || 0), 0);
  const calMsg = todayCal > 0 ? `You burned an estimated ${todayCal} calories today.` : 'Start a workout today to burn active calories.';

  // 4. Daily Step Goal Countdown
  const todaySteps = currentLiveSteps || todayActs.reduce((s, a) => s + Math.round((a.distanceKm || 0) * 1300), 0);
  let stepMsg = `You are ${dailyStepGoal.toLocaleString()} steps away from your daily goal.`;
  if (todaySteps >= dailyStepGoal) {
    stepMsg = `Daily goal achieved! Exceeded by ${(todaySteps - dailyStepGoal).toLocaleString()} steps.`;
  } else if (todaySteps > 0) {
    stepMsg = `You are ${(dailyStepGoal - todaySteps).toLocaleString()} steps away from your daily goal.`;
  }

  // 5. Monthly Longest Session
  const longestSec = monthActs.reduce((max, a) => Math.max(max, a.durationSeconds || 0), 0);
  const longestMins = Math.round(longestSec / 60);
  const monthMsg = longestMins > 0 ? `Your longest walking session this month was ${longestMins} minutes.` : 'Record a session this month to set an endurance record.';

  return [
    { id: 'insight-weekly', type: 'weekly_distance', icon: 'trending-up', iconColor: '#059669', iconBg: '#ecfdf5', badge: 'WEEKLY TREND', headline: 'Volume Progress', message: weeklyMsg },
    { id: 'insight-speed', type: 'pace_speed', icon: 'speedometer-outline', iconColor: '#0284c7', iconBg: '#f0f9ff', badge: 'EFFICIENCY', headline: 'Pace & Speed', message: speedMsg },
    { id: 'insight-cal', type: 'calories_today', icon: 'flame-outline', iconColor: '#ea580c', iconBg: '#fff7ed', badge: 'DAILY BURN', headline: 'Energy Expenditure', message: calMsg },
    { id: 'insight-step', type: 'step_goal', icon: 'footsteps-outline', iconColor: '#0d9488', iconBg: '#f0fdfa', badge: 'TARGET', headline: 'Step Goal', message: stepMsg },
    { id: 'insight-month', type: 'monthly_record', icon: 'ribbon-outline', iconColor: '#7c3aed', iconBg: '#f5f3ff', badge: 'MONTHLY BEST', headline: 'Endurance Record', message: monthMsg },
  ];
}
