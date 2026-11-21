# Bugfix Workflow

## Steps
1. **Reproduce:** Capture reproduction steps, logs, device model (Android/iOS/Web), and error messages.
2. **Context Loading:** Load `debugging/SKILL.md` and relevant domain skill.
3. **Isolate:** Inspect stack traces; isolate failure to exact function or component lifecycle.
4. **Identify Root Cause:** Confirm underlying mechanism (e.g. native prop incompatibility vs logic error).
5. **Minimal Surgical Fix:** Apply the smallest change that fully resolves the issue ($\le 100$ lines).
6. **Regression Test:** Add or update automated test in `tests/` asserting the bug cannot reoccur.
7. **Validation:** Execute `npm test` and `npx tsc --noEmit`. Confirm 100% pass.
8. **Diff Review:** Ensure zero unrelated files are modified.
9. **Documentation:** Log notable gotchas in `docs/DECISIONS.md` if relevant to future tasks.
