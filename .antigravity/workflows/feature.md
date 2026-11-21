# Feature Workflow

## Steps
1. **Understand Requirement:** Clarify scope, target screen, and user persona.
2. **Context Loading:** Load relevant skills (e.g. `frontend/SKILL.md` or `backend/SKILL.md`).
3. **Reusable Audit:** Check existing components (`src/components/`) and utilities before writing new code.
4. **Architecture Check:** Ensure all planned files remain strictly $\le 100$ lines.
5. **Implementation:** Write modular components, hooks, and service logic.
6. **Automated Testing:** Add unit or integration tests in `tests/`.
7. **Quality Gates:** Run `npx tsc --noEmit` and `npm test`. Both must pass with 0 errors.
8. **Diff Review:** Inspect `git diff` for accidental files or formatting regressions.
9. **Documentation:** Update `docs/PRODUCT.md` or `docs/ARCHITECTURE.md` if user workflows change.
10. **Report Completion:** Summarize changes and verification evidence to user.
