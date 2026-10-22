# Spandan Backend Performance & Load Testing Guide (Apache JMeter)

This document provides engineering guidelines, architectural flows, and reference test plans for evaluating the scalability and latency of the **Spandan** fitness application backend running on Supabase (PostgreSQL + PostgREST + GoTrue).

---

## 1. Overview & Architecture

Spandan utilizes Supabase PostgREST for direct, low-latency relational queries guarded by PostgreSQL **Row Level Security (RLS)**.

```
+-------------------------------------------------------------------------+
|                              Apache JMeter                              |
|   [Thread Group: 80% Feeds]  [Thread Group: 15% Kudos]  [5% Rec Saves]  |
+------------------------------------+------------------------------------+
                                     | HTTPS (REST API)
                                     v
+------------------------------------+------------------------------------+
|                      Supabase Edge / PostgREST                          |
|             (Stateless REST API with JWT Auth Verification)             |
+------------------------------------+------------------------------------+
                                     | SQL with RLS Context
                                     v
+-------------------------------------------------------------------------+
|                         PostgreSQL Database                             |
|  - RLS Policies (Owner / Followers / Public / Unblocked)                |
|  - Indexed GPS Tracks (activity_points)                                 |
|  - High-concurrency Kudos & Comments Counters                           |
+-------------------------------------------------------------------------+
```

---

## 2. API Endpoints Reference

All requests must pass standard Supabase client headers:
- `apikey: <EXPO_PUBLIC_SUPABASE_ANON_KEY>`
- `Authorization: Bearer <ATHLETE_JWT_ACCESS_TOKEN>`
- `Content-Type: application/json`
- `Prefer: return=representation` (when expecting the inserted/updated record back)

### 2.1 Authentication: Password Grant Token
- **Endpoint**: `POST /auth/v1/token?grant_type=password`
- **Payload**:
  ```json
  {
    "email": "${email}",
    "password": "${password}"
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user": { "id": "00000000-0000-4000-a000-000000000001" }
  }
  ```
- **JMeter JSON Path Extractor**: `$.access_token` into variable `authToken`.

---

### 2.2 Activity Feeds (High-Throughput Read)
- **Endpoint**: `GET /rest/v1/activities?select=id,user_id,title,sport,distance_km,duration_seconds,moving_time_seconds,avg_pace,avg_speed_kmh,elevation_gain_meters,start_time,visibility,profiles(id,full_name,avatar_url)&order=start_time.desc&limit=20`
- **Description**: Evaluates Supabase RLS against the caller's JWT: returns all user-owned activities, followed-athletes' activities, and public activities.
- **SLA Target**: p95 < 120ms at 500 RPS.

---

### 2.3 Route GPS Points (High-Data Read)
- **Endpoint**: `GET /rest/v1/activity_points?activity_id=eq.${activityId}&order=sequence_order.asc&select=latitude,longitude,altitude,sequence_order,timestamp`
- **Description**: Fetches sequential coordinate points to render SVG route map and calculate 1-km splits.
- **SLA Target**: p95 < 150ms at 250 RPS.

---

### 2.4 Kudos Toggle (Concurrent Write)
- **Endpoint**: `POST /rest/v1/activity_kudos`
- **Payload**:
  ```json
  {
    "activity_id": "${activityId}",
    "user_id": "${userId}"
  }
  ```
- **Delete / Remove Kudos**: `DELETE /rest/v1/activity_kudos?activity_id=eq.${activityId}&user_id=eq.${userId}`

---

### 2.5 Activity Comments
- **Endpoint**: `POST /rest/v1/activity_comments`
- **Payload**:
  ```json
  {
    "activity_id": "${activityId}",
    "user_id": "${userId}",
    "message": "Strong effort on the hill climb! 🚴"
  }
  ```

---

### 2.6 Activity Persistence (Record Save)
- **Endpoint**: `POST /rest/v1/activities`
- **Payload**:
  ```json
  {
    "user_id": "${userId}",
    "title": "JMeter Stress Run",
    "sport": "run",
    "distance_km": 5.42,
    "duration_seconds": 1820,
    "moving_time_seconds": 1780,
    "avg_pace": "5:28",
    "avg_speed_kmh": 10.95,
    "elevation_gain_meters": 45.0,
    "visibility": "public",
    "start_time": "${__time(yyyy-MM-dd'T'HH:mm:ss'Z')}"
  }
  ```
- **Post GPS Points**: `POST /rest/v1/activity_points` with array of JSON points.

---

## 3. Safe vs Unsafe Request Classification

| Request Type | Target Endpoint | Concurrency Suitability | Caution / Constraints |
| :--- | :--- | :--- | :--- |
| **Activity Feed Query** | `GET /rest/v1/activities` | **High (1,000+ RPS)** | Safe to run full load. Tests database indexes and RLS policy efficiency. |
| **Route Points Query** | `GET /rest/v1/activity_points` | **High (500+ RPS)** | Safe. Verifies `idx_activity_points_activity_id` index performance. |
| **Social Kudos Insertion** | `POST /rest/v1/activity_kudos` | **Moderate (200 RPS)** | Safe under synthetic test IDs. Requires unique constraint handling on duplicates. |
| **Comments Insertion** | `POST /rest/v1/activity_comments` | **Moderate (100 RPS)** | Safe. Tests RLS write verification. |
| **Auth Login / Token** | `POST /auth/v1/token` | **Low / Pre-authenticated (Setup Only)** | **CAUTION**: Auth GoTrue uses bcrypt CPU cycles. Hammering login directly triggers GoTrue rate limits (HTTP 429). Pre-generate JWT tokens or run in a setup thread. |
| **User Registration** | `POST /auth/v1/signup` | **DO NOT LOAD TEST** | Creating thousands of auth users causes email service rate-limiting and DB bloat. Always use pre-seeded test accounts. |
| **Database Deletions** | `DELETE /rest/v1/*` | **Restricted to Cleanup** | Never run arbitrary delete queries during concurrency test runs. Run isolated cleanup script after testing. |

---

## 4. Test Environment & Seed Data

### 4.1 Seed Data Generation
Spandan provides a deterministic data generator in `scripts/seed-jmeter-test-data.mjs`:

```bash
# Generate CSV datasets and SQL seed scripts
node scripts/seed-jmeter-test-data.mjs
```

This generates:
1. `scripts/jmeter-athletes.csv`: 10 virtual athlete accounts with emails, passwords, and fixed test UUIDs.
2. `supabase/seed-jmeter-test-data.sql`: 10 athlete profiles, 20 public/follower activities, 160 GPS route points, kudos, and comments.
3. `supabase/cleanup-jmeter-test-data.sql`: Safe SQL script that strictly deletes records within test namespaces.

### 4.2 Non-Destructive Isolation Contract
- **Test User ID Prefix**: `00000000-0000-4000-a000-************`
- **Test Activity ID Prefix**: `00000000-a000-4000-****-************`
- **Test Email Domain**: `@loadtest.spandan.internal`
- The cleanup script contains hardcoded `LIKE '00000000-%'` filters and **cannot** match or delete production users.

---

## 5. Recommended Apache JMeter Test Plan Structure

### Step 1: Test Plan & Global Config
- **User Defined Variables**:
  - `BASE_URL`: `xyzcompany.supabase.co`
  - `SUPABASE_ANON_KEY`: `<Anon Key>`
  - `PORT`: `443`
  - `PROTOCOL`: `https`
- **HTTP Request Defaults**:
  - Server Name: `${BASE_URL}`
  - Protocol: `${PROTOCOL}`
- **HTTP Header Manager**:
  - `apikey`: `${SUPABASE_ANON_KEY}`
  - `Authorization`: `Bearer ${jwt_token}`
  - `Content-Type`: `application/json`

### Step 2: Setup Thread Group (Token Warming)
- Uses `scripts/jmeter-athletes.csv` with **CSV Data Set Config**:
  - Filename: `scripts/jmeter-athletes.csv`
  - Variables: `email,password,user_id,athlete_name,sport_preference`
- Request: `POST https://${BASE_URL}/auth/v1/token?grant_type=password`
- **JSON Extractor**:
  - Variable Name: `jwt_token`
  - Expression: `$.access_token`
- Store tokens in JMeter memory or output to `tokens.csv`.

### Step 3: Main Workload Thread Groups (Concurrent Traffic Distribution)
1. **Feed & Route Browsing (80% Weight)**:
   - 50 concurrent virtual users, ramp-up 30s, duration 10m.
   - Loop:
     - Request 1: `GET /rest/v1/activities` (Activity Feed)
     - Response Assertion: Code `200`, JSON contains `"distance_km"`.
     - Uniform Random Timer: 500ms to 2000ms (simulate reading activities).
     - Request 2: `GET /rest/v1/activity_points?activity_id=eq.00000000-a000-4000-0001-00000001` (GPS Route Points).
     - Response Assertion: Code `200`, JSON contains `"latitude"`.

2. **Social Interaction (15% Weight)**:
   - 10 concurrent virtual users.
   - Loop:
     - Request: `POST /rest/v1/activity_kudos`
     - Response Assertion: Code `201` or `204`.

3. **Activity Saving (5% Weight)**:
   - 2 concurrent virtual users.
   - Loop:
     - Request: `POST /rest/v1/activities` with payload.
     - Response Assertion: Code `201`.

---

## 6. Cleanup After Load Testing

To safely reset your staging database after JMeter runs:

```sql
-- In Supabase SQL Editor on Staging:
-- Run contents of supabase/cleanup-jmeter-test-data.sql
```

Verification output should confirm `remaining_load_test_profiles: 0` without altering any real athlete data.
