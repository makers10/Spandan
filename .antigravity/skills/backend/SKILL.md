# Backend Skill

## Purpose
Standards for service architecture, business logic, offline fallbacks, and background tracking.

## When to Use
Load when modifying services (`src/services/`), authentication context, or server integrations.

## Rules
- Keep business logic decoupled from UI components. UI calls services; services handle persistence and network.
- Never trust client inputs: validate coordinates, distances, and duration at service boundaries.
- Offline-First Architecture: If Supabase credentials are missing or the device is offline, gracefully fall back to local `AsyncStorage` athlete session.
- Never crash on network timeouts. Return structured error responses or cached records.
- Background sensor tasks (GPS / Pedometer): Manage battery efficiency using `Location.startLocationUpdatesAsync` with balanced distance intervals.

## Preferred Patterns
- Singleton service instances (`activityService`, `authService`, `floorService`, `locationService`).
- Unified authentication fallback that ensures users can log in and record sessions even without a live cloud connection.

## Anti-Patterns
- Throwing uncaught network promises that crash the mobile app.
- Storing unencrypted sensitive credentials in local storage.
- Performing duplicate database calls for data already cached in active memory.

## Validation Checklist
- [ ] Offline demo/fallback mode functions without Supabase connection.
- [ ] Service methods return predictable typed results.
- [ ] Unit tests pass against both live and simulated offline states.
