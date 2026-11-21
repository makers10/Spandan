# API Skill

## Purpose
Guidelines for API contracts, Supabase client RPCs, HTTP endpoints, and data contracts.

## When to Use
Load when modifying client-server communications, RPC functions, or REST integration layers.

## Rules
- Predictable Contracts: Every API response must match TypeScript types in `src/types/fitness.ts`.
- Never silently break contracts: When adding fields, maintain backward compatibility.
- Meaningful Status & Error Handling: Map database constraint violations to human-readable error messages.
- Pagination: Use cursor or offset pagination (`range(start, end)`) when querying feed activities.
- Never expose secrets: Supabase JWT tokens and credentials must be handled through secure auth storage (`AsyncStorage` / `SecureStore`).

## Preferred Patterns
- Strongly typed service wrappers around Supabase queries.
- Optimistic UI updates for social actions (e.g. instant kudos increment with rollback on failure).

## Anti-Patterns
- Leaking raw database error objects directly into user-facing alerts.
- Polling endpoints in uncontrolled loops without backoff or reactive subscriptions.

## Validation Checklist
- [ ] Contract changes reflected in `src/types/fitness.ts`.
- [ ] Error messages are client-safe and logged for debugging.
- [ ] Network failures fail gracefully into local offline mode.
