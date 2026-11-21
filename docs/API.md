# API Specification — Track your movement

## 1. Overview & Protocol
The frontend interacts with the backend using the `@supabase/supabase-js` client SDK over secure HTTPS / WebSockets.
- Transport: PostgREST REST API + Realtime WebSockets.
- Authentication: Bearer token (Supabase JWT passed via `Authorization` header).
- Client Credentials: Public `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Core Service Methods (`src/services/activity-service.ts`)
- `fetchUserActivities(userId: string, limit?: number, athleteName?: string): Promise<Activity[]>`
  Fetches recent activities for the authenticated athlete with local fallback.
- `saveActivity(activityData: Partial<Activity>, routePoints?: GpsCoordinate[]): Promise<Activity>`
  Persists workout record and bulk-inserts GPS breadcrumbs with cascade link.
- `fetchActivityDetails(activityId: string): Promise<Activity | null>`
  Retrieves single activity record with elevation and pace metrics.
- `deleteActivity(activityId: string): Promise<boolean>`
  Deletes activity and automatically cascades to route points and kudos.

## 3. Offline Data Contracts
When offline, services transparently read and write to local athlete keys:
- `@track_local_activities_${athleteId}`
- `@track_local_user_session`
All response formats remain 100% identical between online and offline modes.
