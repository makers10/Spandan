# Security Skill

## Purpose
Enforce data confidentiality, prevent credential leakage, and maintain zero-trust boundaries.

## When to Use
Load when handling authentication, environment variables, Supabase access, or user privacy features.

## Rules
- Zero Secrets in Client Code: Never hardcode API keys, database passwords, or JWT secrets.
- Use `EXPO_PUBLIC_` only for publishable anonymous keys (`EXPO_PUBLIC_SUPABASE_ANON_KEY`).
- Never expose `service_role` keys on client devices.
- Enforce granular Row Level Security (RLS) on all database tables.
- Input Sanitization: Validate all workout metadata, user comments, and display names before persistence.
- Route Privacy Cloaking: Mask exact start/finish coordinates within sensitive radii (e.g., home/office cloaking) when sharing routes publicly.
- Never log user passwords, tokens, or biometric parameters.

## Preferred Patterns
- Isolated athlete namespaces for offline storage (`@track_local_activities_${athleteId}`).
- Automated test suites simulating unauthorized token queries to verify RLS rejection.

## Anti-Patterns
- Committing `.env` files with production secrets.
- Relying on client-side filtering for private user data instead of database-level RLS.

## Validation Checklist
- [ ] No secrets committed in git history.
- [ ] RLS policies active and verified via unit tests.
- [ ] Sensitive logs removed from production code.
