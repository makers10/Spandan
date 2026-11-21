# Database Skill

## Purpose
PostgreSQL, Supabase migrations, Row Level Security (RLS), and schema integrity standards.

## When to Use
Load when creating, updating, or reviewing Supabase schema, migrations (`supabase/migrations/`), or RLS policies.

## Rules
- Every database modification must be captured in a sequential SQL migration file. Never modify production schema ad-hoc.
- RLS is MANDATORY: Every table (`activities`, `profiles`, `activity_points`, `follows`, `kudos`, `comments`) must have `ENABLE ROW LEVEL SECURITY`.
- Data Isolation: RLS policies must strictly verify `auth.uid() = user_id` for mutations.
- Public read access must be bounded by explicit privacy settings (`visibility = 'public'`).
- Avoid N+1 queries by joining related athlete profiles or batching telemetry points.
- Index foreign keys and temporal fields (`created_at`, `user_id`, `activity_id`) to ensure fast query aggregation.

## Preferred Patterns
- `ON DELETE CASCADE` on child records (e.g., deleting an activity cascades to its telemetry points).
- Automated timestamps via `created_at TIMESTAMPTZ DEFAULT NOW()`.

## Anti-Patterns
- Using `service_role` keys on client devices (client must strictly use publishable `anon` key).
- Missing foreign key indexes causing full sequential table scans.
- Destructive table drops without data backup strategies.

## Validation Checklist
- [ ] RLS policies enabled and tested with unauthorized caller simulation.
- [ ] SQL migration script is deterministic and idempotent.
- [ ] Schema matches TypeScript data contracts in `src/types/fitness.ts`.
