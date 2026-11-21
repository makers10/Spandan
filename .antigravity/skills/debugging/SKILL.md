# Debugging Skill

## Purpose
Systematic root-cause diagnosis, error reproduction, and minimal surgical remediation.

## When to Use
Load when diagnosing runtime exceptions, test failures, device crashes, or unexpected UI behaviors.

## Rules
- Follow the 7-Step Debugging Protocol:
  1. **Reproduce:** Capture exact inputs, logs, and device environment.
  2. **Observe:** Inspect stack traces, console errors, and component state transitions.
  3. **Isolate:** Narrow down to the specific file, hook, or lifecycle stage.
  4. **Identify Root Cause:** Distinguish between underlying flaws and superficial symptoms.
  5. **Minimal Fix:** Apply the smallest surgical correction that completely solves the issue.
  6. **Regression Test:** Add or update an automated test to prevent recurrence.
  7. **Validate:** Verify full suite (`npm test`) and typecheck (`npx tsc --noEmit`).
- Never rewrite large sections of unrelated working code to fix a localized bug.
- Check platform differences: Web DOM properties vs React Native Android/iOS native views.

## Anti-Patterns
- "Guess and check" editing without reading stack traces.
- Masking errors with empty try-catch blocks or suppressing compiler warnings.

## Validation Checklist
- [ ] Root cause identified and explained clearly.
- [ ] Minimal change applied ($\le 100$ lines per file).
- [ ] Zero regressions introduced.
