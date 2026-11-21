# Testing Skill

## Purpose
Standards for unit testing, mathematical verification, security isolation tests, and regression prevention.

## When to Use
Load when writing, debugging, or verifying automated tests in `tests/`.

## Rules
- Focus on business-critical domains:
  - Geospatial algorithms (Haversine distance, jitter rejection, pace/speed calculations).
  - Sensor fusion (barometric floor climbing, pedometer distance estimation).
  - Row Level Security (unauthorized data access prevention).
  - Dynamic intelligence (ensuring insights are computed dynamically, not hardcoded).
- Fast & Zero-Dependency: Keep tests runnable via `node tests/*.test.mjs` using `node:assert`.
- Never write tests simply for vanity coverage numbers. Every test must verify an invariant or prevent a regression.
- Every fixed bug must have an accompanying regression test.

## Preferred Patterns
- Isolated, stateless test scenarios with distinct mock datasets.
- Testing edge cases: zero distance workouts, 0 elevation, boundary dates (11:59 PM vs 12:01 AM).

## Anti-Patterns
- Disabling or commenting out assertions to force tests to pass.
- Flaky tests dependent on real-time wall clocks without deterministic offsets.

## Validation Checklist
- [ ] `npm test` executes all test suites without warnings.
- [ ] 100% of assertions pass.
- [ ] Tests run under 10 seconds total.
