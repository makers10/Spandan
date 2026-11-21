# Security Architecture — Track your movement

## 1. Authentication & Session Strategy
- **GoTrue Auth:** Primary cloud authentication utilizing Supabase Auth (email/password with cryptographically signed JWTs).
- **Universal Local Fallback:** When Supabase is unreachable or unconfigured, the app transparently generates a scoped athlete ID (`athlete-${safeKey}`) and persists local sessions securely via `AsyncStorage`. Users are never blocked from tracking.
- **Client Key Hygiene:** Only the publishable anonymous key is embedded in client builds. The `service_role` key is strictly forbidden from client bundles.

## 2. Authorization & Data Isolation
- **Row Level Security (RLS):** Enforced at the PostgreSQL kernel level. Queries executed with a client token cannot access private records belonging to other athletes.
- **Social Boundaries:** Blocked athletes cannot read activities, leave comments, or give kudos.

## 3. Privacy Cloaking
- Public route maps mask exact residential start/end points within a 500m radius using fuzzy boundary offsets (`src/utils/privacy.ts`).
- Short residential loops apply centroid blur to prevent empty tracks while preserving athlete safety.

## 4. Threat Model & Mitigations
- **XSS:** React Native does not use DOM evaluation; string interpolation in native views is sanitized.
- **SQL Injection:** Queries use Supabase parameterized query builders exclusively.
