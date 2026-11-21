import assert from 'node:assert';
import { generateFitnessInsights } from '../src/utils/fitness-insights.ts';

console.log('🧪 Starting Smart Fitness Intelligence & Coaching Insights Tests...\n');

let passedTests = 0;
function pass(testName) {
  console.log(`  ✅ PASS: ${testName}`);
  passedTests++;
}

const MS_DAY = 86_400_000;
const now = Date.now();

// Test 1: Weekly Comparison (15% improvement)
{
  const acts = [
    {
      id: 'w1',
      title: 'This Week Walk',
      type: 'walk',
      distanceKm: 23.0,
      durationSeconds: 7200,
      calories: 400,
      createdAtIso: new Date(now - 2 * MS_DAY).toISOString(),
    },
    {
      id: 'w2',
      title: 'Last Week Walk',
      type: 'walk',
      distanceKm: 20.0,
      durationSeconds: 7200,
      calories: 380,
      createdAtIso: new Date(now - 9 * MS_DAY).toISOString(),
    },
  ];

  const insights = generateFitnessInsights(acts);
  const weekly = insights.find((i) => i.type === 'weekly_distance');
  assert(weekly, 'Weekly insight must exist');
  assert.strictEqual(weekly.message, 'You walked 15% more this week than last week.');
  pass('Insight 1: Weekly distance comparison calculates exact percentage increase ("15% more")');
}

// Test 2: Speed & Pace Improvement
{
  const acts = [
    {
      id: 'p1',
      title: 'Fast Walk',
      type: 'walk',
      distanceKm: 10.0,
      durationSeconds: 3600, // 10 km/h
      createdAtIso: new Date(now - 1 * MS_DAY).toISOString(),
    },
    {
      id: 'p2',
      title: 'Slower Walk',
      type: 'walk',
      distanceKm: 10.0,
      durationSeconds: 4000, // 9 km/h
      createdAtIso: new Date(now - 8 * MS_DAY).toISOString(),
    },
  ];

  const insights = generateFitnessInsights(acts);
  const speed = insights.find((i) => i.type === 'pace_speed');
  assert(speed, 'Pace/Speed insight must exist');
  assert(speed.message.includes('improved by 11%'), `Expected improved by 11%, got: ${speed.message}`);
  pass('Insight 2: Walking speed improvement accurately detects pace acceleration');
}

// Test 3: Calories Burned Today (250 calories)
{
  const acts = [
    {
      id: 'c1',
      title: 'Morning Walk',
      type: 'walk',
      distanceKm: 2.5,
      calories: 150,
      createdAtIso: new Date(now).toISOString(),
    },
    {
      id: 'c2',
      title: 'Lunch Stroll',
      type: 'walk',
      distanceKm: 1.5,
      calories: 100,
      createdAtIso: new Date(now).toISOString(),
    },
  ];

  const insights = generateFitnessInsights(acts);
  const cal = insights.find((i) => i.type === 'calories_today');
  assert(cal, 'Calories insight must exist');
  assert.strictEqual(cal.message, 'You burned an estimated 250 calories today.');
  pass('Insight 3: Daily calorie aggregator sums today workouts to "250 calories today"');
}

// Test 4: Daily Step Goal Countdown (1,500 steps away)
{
  const acts = [
    {
      id: 's1',
      title: 'Daily Walk',
      type: 'walk',
      distanceKm: 5.0, // 5 * 1300 = 6,500 steps
      createdAtIso: new Date(now).toISOString(),
    },
  ];

  const insights = generateFitnessInsights(acts, 8000);
  const step = insights.find((i) => i.type === 'step_goal');
  assert(step, 'Step goal insight must exist');
  assert.strictEqual(step.message, 'You are 1,500 steps away from your daily goal.');
  pass('Insight 4: Daily step countdown accurately computes "1,500 steps away from daily goal"');
}

// Test 4b: Daily Step Goal Surpassed
{
  const acts = [
    {
      id: 's2',
      title: 'Long Hike',
      type: 'walk',
      distanceKm: 7.0, // 7 * 1300 = 9,100 steps
      createdAtIso: new Date(now).toISOString(),
    },
  ];

  const insights = generateFitnessInsights(acts, 8000);
  const step = insights.find((i) => i.type === 'step_goal');
  assert(step.message.includes('Daily goal achieved!'), `Expected achieved, got: ${step.message}`);
  pass('Insight 4b: Daily step goal congratulates runner when target is smashed');
}

// Test 5: Monthly Longest Session (45 minutes)
{
  const acts = [
    {
      id: 'm1',
      title: 'Quick Stroll',
      type: 'walk',
      durationSeconds: 1200, // 20m
      createdAtIso: new Date(now - 1 * MS_DAY).toISOString(),
    },
    {
      id: 'm2',
      title: 'Long Walk',
      type: 'walk',
      durationSeconds: 2700, // 45m
      createdAtIso: new Date(now - 3 * MS_DAY).toISOString(),
    },
  ];

  const insights = generateFitnessInsights(acts);
  const month = insights.find((i) => i.type === 'monthly_record');
  assert(month, 'Monthly insight must exist');
  assert.strictEqual(month.message, 'Your longest walking session this month was 45 minutes.');
  pass('Insight 5: Monthly endurance tracker calculates "longest session was 45 minutes"');
}

// Test 6: Empty Activities Graceful Fallbacks (No crash or NaN)
{
  const insights = generateFitnessInsights([]);
  assert.strictEqual(insights.length, 5, 'Must return all 5 insights on empty data');
  for (const item of insights) {
    assert(!item.message.includes('NaN'), `Message must not contain NaN: ${item.message}`);
    assert(item.message.length > 5, 'Message must be meaningful');
  }
  pass('Insight 6: Empty workout history handles gracefully with helpful user prompts');
}

console.log('\n=============================================');
console.log(`Summary: ${passedTests}/${passedTests} tests passed.`);
console.log('=============================================\n');
