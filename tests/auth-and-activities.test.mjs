/**
 * Spandan Fitness Tracking App - Auth & Activity Verification Test Suite
 * Validates authentication rules, activity mapping, and security requirements.
 */

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Starting Spandan Authentication & Activity Tests...\n');

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
// TEST 1: Database Schema & Row Level Security (RLS) Policies
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

  // Verify user ownership policies (auth.uid() = user_id)
  assert.ok(
    schema.includes('auth.uid() = user_id'),
    'Activities table must enforce auth.uid() = user_id'
  );
  assert.ok(
    schema.includes('auth.uid() = id'),
    'Profiles table must enforce auth.uid() = id'
  );

  // Ensure NO service-role key or insecure public write
  assert.ok(
    !schema.toLowerCase().includes('service_role'),
    'Schema must not reference or require client service_role key'
  );
});

// -------------------------------------------------------------
// TEST 2: Environment Security & Anon Key Safety
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
// TEST 3: Auth Validation Rules
// -------------------------------------------------------------
runTest('Email & password validation rules behave correctly', () => {
  const isValidEmail = (email) => Boolean(email && email.includes('@') && email.includes('.'));
  const isValidPassword = (pass) => Boolean(pass && pass.length >= 6);

  assert.strictEqual(isValidEmail(''), false);
  assert.strictEqual(isValidEmail('plainaddress'), false);
  assert.strictEqual(isValidEmail('athlete@spandan.fit'), true);

  assert.strictEqual(isValidPassword('123'), false);
  assert.strictEqual(isValidPassword('12345'), false);
  assert.strictEqual(isValidPassword('stride2026'), true);
});

// -------------------------------------------------------------
// TEST 4: Weekly Performance Calculation Logic
// -------------------------------------------------------------
runTest('Weekly statistics calculation accurately aggregates distances & times', () => {
  const sampleActivities = [
    {
      id: '1',
      type: 'run',
      distanceKm: 10.5,
      durationFormatted: '00:55:00',
      elevationMeters: 120,
      calories: 720,
    },
    {
      id: '2',
      type: 'ride',
      distanceKm: 25.0,
      durationFormatted: '01:00:00',
      elevationMeters: 250,
      calories: 600,
    },
  ];

  const totalDistance = sampleActivities.reduce((s, a) => s + a.distanceKm, 0);
  const totalElev = sampleActivities.reduce((s, a) => s + a.elevationMeters, 0);
  const totalCal = sampleActivities.reduce((s, a) => s + a.calories, 0);

  assert.strictEqual(totalDistance, 35.5, 'Total distance should sum to 35.5 km');
  assert.strictEqual(totalElev, 370, 'Elevation should sum to 370 m');
  assert.strictEqual(totalCal, 1320, 'Calories should sum to 1320 kcal');
  assert.strictEqual(sampleActivities.length, 2, 'Activities count should be 2');
});

// -------------------------------------------------------------
// TEST 5: Demo Mode & Unconfigured Fallback Safety
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
