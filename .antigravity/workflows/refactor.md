# Refactor Workflow

## Steps
1. **Baseline Assessment:** Run `npm test` and `npx tsc --noEmit` to verify existing tests are passing.
2. **Context Loading:** Load `coding/SKILL.md` and domain skill.
3. **Map Consumers:** Identify all callers, hooks, and components dependent on the target module.
4. **Incremental Decomposition:**
   - Extract styles into `*.styles.ts` to keep components $\le 100$ lines.
   - Extract reusable calculations into pure helper functions.
5. **Contract Preservation:** Ensure function signatures, return types, and props remain identical.
6. **Continuous Validation:** Re-run `npm test` after each incremental edit.
7. **Quality Check:** Run `npx tsc --noEmit` and `npx expo lint`.
8. **Diff Review:** Confirm no behavior was inadvertently altered or deleted.
