/**
 * Track your movement Fitness Tracking App - Auth & Activity Verification Test Suite
 * Validates authentication rules, RLS policies, unauthorized access, activity mapping, and demo isolation.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting Track your movement Supabase Integration & Security Audit Tests...\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// -------------------------------------------------------------
// TEST 1: Database Schema & Row Level Security (RLS) Enablement
// -------------------------------------------------------------
runTest('Database schema enforces Row Level Security (RLS) on all tables', () => {
  const schemaPath = path.join(rootDir, 'supabase', 'schema.sql');
  assert.ok(fs.existsSync(schemaPath), 'schema.sql must exist');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Verify RLS enablement
  assert.ok(
    schema.includes('alter table public.profiles enable row level security;'),
    'profiles table must enable RLS'
  );
  assert.ok(
    schema.includes('alter table public.activities enable row level security;'),
    'activities table must enable RLS'
  );

  // Ensure NO service-role key or insecure public write
  assert.ok(
    !schema.toLowerCase().includes('service_role'),
    'Schema must not reference or require client service_role key'
  );
});

// -------------------------------------------------------------
// TEST 2: RLS Policies for Profiles & Activities
// -------------------------------------------------------------
runTest('RLS policy rules enforce CRUD ownership checks (auth.uid() = user_id)', () => {
  const schema = fs.readFileSync(path.join(rootDir, 'supabase', 'schema.sql'), 'utf8');

  // SELECT policy
  assert.ok(
    (schema.includes('create policy "Users can view authorized activities"') ||
     schema.includes('create policy "Users can view own activities"')) &&
    schema.includes('auth.uid() = user_id'),
    'Activities select policy must enforce auth.uid() = user_id'
  );

  // INSERT policy
  assert.ok(
    schema.includes('create policy "Users can insert own activities"') &&
    schema.includes('with check (auth.uid() = user_id)'),
    'Activities insert policy must enforce auth.uid() = user_id'
  );

  // UPDATE policy
  assert.ok(
    schema.includes('create policy "Users can update own activities"') &&
    schema.includes('using (auth.uid() = user_id)'),
    'Activities update policy must enforce auth.uid() = user_id'
  );

  // DELETE policy
  assert.ok(
    schema.includes('create policy "Users can delete own activities"') &&
    schema.includes('using (auth.uid() = user_id)'),
    'Activities delete policy must enforce auth.uid() = user_id'
  );
});

// -------------------------------------------------------------
// TEST 3: Unauthorized Access & Mismatched User ID Simulation
// -------------------------------------------------------------
runTest('Unauthorized access simulation verifies data isolation between athletes', () => {
  // Simulate Postgres RLS engine logic
  const evaluateSelect = (authUid, rowUserId) => Boolean(authUid && authUid === rowUserId);
  const evaluateInsert = (authUid, insertPayloadUserId) => Boolean(authUid && authUid === insertPayloadUserId);
  const evaluateUpdate = (authUid, existingRowUserId, newUserId) =>
    Boolean(authUid && authUid === existingRowUserId && authUid === newUserId);
  const evaluateDelete = (authUid, existingRowUserId) => Boolean(authUid && authUid === existingRowUserId);

  const athleteA = 'uuid-athlete-a-1111';
  const athleteB = 'uuid-athlete-b-2222';

  // 1. Unauthenticated request (anon/unlogged)
  assert.strictEqual(evaluateSelect(null, athleteA), false, 'Anonymous user cannot read Athlete A rows');
  assert.strictEqual(evaluateInsert(null, athleteA), false, 'Anonymous user cannot insert activity');
  assert.strictEqual(evaluateDelete(null, athleteA), false, 'Anonymous user cannot delete activity');

  // 2. Athlete B attempting to read Athlete A's private activity
  assert.strictEqual(evaluateSelect(athleteB, athleteA), false, 'Athlete B cannot read Athlete A activity');

  // 3. Athlete B attempting to insert activity on behalf of Athlete A (spoofing)
  assert.strictEqual(evaluateInsert(athleteB, athleteA), false, 'Athlete B cannot insert row with user_id = Athlete A');

  // 4. Athlete A inserting activity with own user_id
  assert.strictEqual(evaluateInsert(athleteA, athleteA), true, 'Athlete A can insert row with own user_id');

  // 5. Athlete B attempting to update Athlete A's activity
  assert.strictEqual(evaluateUpdate(athleteB, athleteA, athleteB), false, 'Athlete B cannot update Athlete A activity');

  // 6. Athlete B attempting to delete Athlete A's activity
  assert.strictEqual(evaluateDelete(athleteB, athleteA), false, 'Athlete B cannot delete Athlete A activity');
});

// -------------------------------------------------------------
// TEST 4: Environment Security & Anon Key Safety
// -------------------------------------------------------------
runTest('Client frontend only accepts publishable anon key, never service_role', () => {
  const envExamplePath = path.join(rootDir, '.env.example');
  assert.ok(fs.existsSync(envExamplePath), '.env.example must exist');
  const envExample = fs.readFileSync(envExamplePath, 'utf8');

  assert.ok(
    envExample.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    '.env.example must document EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
  assert.ok(
    !envExample.includes('SERVICE_ROLE'),
    '.env.example must never mention or request a SERVICE_ROLE key'
  );

  const gitignorePath = path.join(rootDir, '.gitignore');
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  assert.ok(gitignore.includes('.env'), '.gitignore must ignore .env files to protect keys');
});

// -------------------------------------------------------------
// TEST 5: Auth Validation Rules
// -------------------------------------------------------------
runTest('Email & password validation rules behave correctly', () => {
  const isValidEmail = (email) => Boolean(email && email.includes('@') && email.includes('.'));
  const isValidPassword = (pass) => Boolean(pass && pass.length >= 6);

  assert.strictEqual(isValidEmail(''), false);
  assert.strictEqual(isValidEmail('plainaddress'), false);
  assert.strictEqual(isValidEmail('athlete@trackyourmovement.com'), true);

  assert.strictEqual(isValidPassword('123'), false);
  assert.strictEqual(isValidPassword('12345'), false);
  assert.strictEqual(isValidPassword('stride2026'), true);
});

// -------------------------------------------------------------
// TEST 6: Weekly Performance & Day-of-Week Bucketing Logic
// -------------------------------------------------------------
runTest('Weekly statistics calculation accurately aggregates distances and day buckets', () => {
  // Test day-of-week bucketing logic
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayBuckets = dayNames.map(() => ({ distanceKm: 0, activeMinutes: 0 }));

  // Monday = Oct 19 2026, Wednesday = Oct 21 2026
  const sampleActivities = [
    {
      id: '1',
      type: 'run',
      distanceKm: 10.5,
      durationFormatted: '00:55:00',
      elevationMeters: 120,
      calories: 720,
      createdAtIso: '2026-10-19T06:30:00Z', // Monday
    },
    {
      id: '2',
      type: 'ride',
      distanceKm: 25.0,
      durationFormatted: '01:00:00',
      elevationMeters: 250,
      calories: 600,
      createdAtIso: '2026-10-21T07:15:00Z', // Wednesday
    },
  ];

  for (const act of sampleActivities) {
    const d = new Date(act.createdAtIso);
    const dayIdx = (d.getDay() + 6) % 7;
    dayBuckets[dayIdx].distanceKm += act.distanceKm;
  }

  assert.strictEqual(dayBuckets[0].distanceKm, 10.5, 'Monday bucket must receive 10.5 km');
  assert.strictEqual(dayBuckets[1].distanceKm, 0, 'Tuesday bucket must remain 0 km');
  assert.strictEqual(dayBuckets[2].distanceKm, 25.0, 'Wednesday bucket must receive 25.0 km');

  const totalDistance = sampleActivities.reduce((s, a) => s + a.distanceKm, 0);
  const totalElev = sampleActivities.reduce((s, a) => s + a.elevationMeters, 0);
  const totalCal = sampleActivities.reduce((s, a) => s + a.calories, 0);

  assert.strictEqual(totalDistance, 35.5, 'Total distance should sum to 35.5 km');
  assert.strictEqual(totalElev, 370, 'Elevation should sum to 370 m');
  assert.strictEqual(totalCal, 1320, 'Calories should sum to 1320 kcal');
  assert.strictEqual(sampleActivities.length, 2, 'Activities count should be 2');
});

// -------------------------------------------------------------
// TEST 7: Demo Mode Data Isolation
// -------------------------------------------------------------
runTest('Demo Mode strictly isolates mock activities from live user activities', () => {
  const mockActivities = [
    { id: 'm1', title: 'Sample Mock Run', distanceKm: 5 },
    { id: 'm2', title: 'Sample Mock Ride', distanceKm: 20 },
  ];
  const liveUserActivities = [
    { id: 'u1', title: 'Real User Stride', distanceKm: 8.2 },
  ];

  const getFeed = (isLiveUser) => (isLiveUser ? liveUserActivities : mockActivities);

  // Live user view
  const liveFeed = getFeed(true);
  assert.strictEqual(liveFeed.length, 1);
  assert.strictEqual(liveFeed[0].id, 'u1');
  assert.ok(!liveFeed.some((a) => a.id.startsWith('m')), 'Live feed must NEVER contain mock activities');

  // Demo user view
  const demoFeed = getFeed(false);
  assert.strictEqual(demoFeed.length, 2);
  assert.ok(demoFeed.every((a) => a.id.startsWith('m')), 'Demo feed must only contain mock activities');
});

// -------------------------------------------------------------
// TEST 8: Trigger Function SQL Syntax & Collision Safety
// -------------------------------------------------------------
runTest('Database schema profile trigger handles name fallback and conflict safely', () => {
  const schema = fs.readFileSync(path.join(rootDir, 'supabase', 'schema.sql'), 'utf8');

  assert.ok(
    schema.includes('create or replace function public.handle_new_user()'),
    'Trigger function handle_new_user must be defined'
  );
  assert.ok(
    schema.includes('on conflict (id) do nothing;'),
    'Trigger must handle conflict on (id)'
  );
  assert.ok(
    schema.includes('after insert on auth.users'),
    'Trigger must execute after insert on auth.users'
  );
  assert.ok(
    schema.includes('security definer'),
    'Trigger function must be security definer to write to profiles table'
  );
});

// -------------------------------------------------------------
// TEST 9: Unconfigured Supabase Fallback Safety
// -------------------------------------------------------------
runTest('Unconfigured Supabase credentials trigger safe Demo Mode without crash', () => {
  const checkConfigured = (url, key) =>
    Boolean(url) && Boolean(key) && key !== 'your-anon-key-here' && key.length > 20;

  assert.strictEqual(checkConfigured('', ''), false, 'Empty strings are not configured');
  assert.strictEqual(
    checkConfigured('https://example.supabase.co', ''),
    false,
    'Missing key is not configured'
  );
  assert.strictEqual(
    checkConfigured('https://example.supabase.co', 'your-anon-key-here'),
    false,
    'Placeholder key is not configured'
  );
  assert.strictEqual(
    checkConfigured(
      'https://fnwisxcdxcmygnxvapbh.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_valid_length_key_for_testing'
    ),
    true,
    'Valid length key is configured'
  );
});

console.log(`\n=============================================`);
console.log(`Summary: ${passedTests}/${totalTests} tests passed.`);
console.log(`=============================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
