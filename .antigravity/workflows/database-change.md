# Database Change Workflow

## Steps
1. **Schema Review:** Read `docs/DATABASE.md` and current SQL files in `supabase/migrations/`.
2. **Context Loading:** Load `database/SKILL.md` and `security/SKILL.md`.
3. **Consumer Mapping:** Identify all client queries in `src/services/` affected by schema changes.
4. **Draft Migration:** Write reproducible, idempotent SQL script in `supabase/migrations/<timestamp>_<name>.sql`.
5. **Security Enforce:** Add `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` and explicit RLS policies.
6. **Type Sync:** Update TypeScript interfaces in `src/types/fitness.ts`.
7. **Service Update:** Update service query methods and offline fallback schemas.
8. **Automated Testing:** Add test cases in `tests/auth-and-activities.test.mjs` verifying RLS and CRUD.
9. **Documentation:** Update `docs/DATABASE.md` entity and relationship tables.
