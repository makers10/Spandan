# API Change Workflow

## Steps
1. **Contract Review:** Read `docs/API.md` and check current service methods in `src/services/`.
2. **Context Loading:** Load `api/SKILL.md`.
3. **Assess Breaking Nature:** Determine if changes affect offline storage, existing activity feeds, or Supabase RPCs.
4. **Contract Evolution:** Add optional fields or maintain backward-compatible fallback parameters.
5. **Client Update:** Update service calls, query builders, and React hooks.
6. **Validation:** Ensure network error handling falls back to local AsyncStorage gracefully.
7. **Test Updates:** Update API contract verification in `tests/auth-and-activities.test.mjs`.
8. **Documentation:** Update endpoint signatures and data shapes in `docs/API.md`.
