# Architecture Decision Log (ADR) — Track your movement

## ADR-001: 100-Line File Size Constraint
- **Date:** 2026-11-03
- **Decision:** All source code files must remain strictly $\le 100$ lines.
- **Context:** Large monolithic components become unmaintainable and degrade AI context token efficiency.
- **Consequences:** Styles must be separated into `*.styles.ts` and complex screens broken into subcomponents.

## ADR-002: Universal Local Auth Fallback
- **Date:** 2026-11-03
- **Decision:** Fall back to isolated local athlete storage when Supabase returns 400 or network is down.
- **Context:** Users testing offline or without configured cloud credentials were encountering `Invalid login credentials`.
- **Consequences:** Users can immediately record sessions and log workouts without friction; data seamlessly transitions.

## ADR-003: 0% External Device Dependency (Phone-Native Sensors)
- **Date:** 2026-11-21
- **Decision:** Eliminate all required external biometric hardware (smartwatches, chest straps, foot pods).
- **Context:** Users tracking runs on their phones were frustrated by tiles showing `--` with "Requires HRM" or "Requires Running Pod".
- **Consequences:** All tiles now use 100% phone hardware (pedometer steps, GPS pace, barometric floors, active calories).

## ADR-004: Dynamic Movement Intelligence Engine
- **Date:** 2026-11-21
- **Decision:** Build a dynamic coaching engine (`fitness-insights.ts`) computing weekly trends, pace boosts, and step countdowns.
- **Context:** Users requested human-readable coaching insights instead of raw static telemetry labels.
- **Consequences:** 5 dynamic coaching insights are calculated locally without external paid APIs.
