# Coding Skill

## Purpose
General engineering standards for readability, modularity, typing, error handling, and maintainability.

## When to Use
Load when writing, refactoring, or reviewing any TypeScript/JavaScript source code in this project.

## Rules
- Keep all files $\le 100$ lines. Extract styles, helpers, or subcomponents when approaching limits.
- Do not duplicate business logic across components or services.
- Never use magic strings or magic numbers; use descriptive constants or types.
- Strongly type all inputs, return values, and parameters. Avoid `any` unless required for native platform bridges.
- Validate inputs at module boundaries. Handle errors explicitly—never fail silently.
- Write cohesive, single-purpose functions. Avoid monolithic abstractions without multiple proven use cases.

## Preferred Patterns
- Pure utility functions with zero side effects.
- Separation of presentation from business logic via custom hooks (e.g., `useHomeActivities`).
- Explicit named exports over default exports for reusable modules.

## Anti-Patterns
- Creating generic utility functions used only once.
- Silently swallowing thrown errors with empty `catch {}` blocks.
- Mixing transport/networking code directly into presentation UI.

## Validation Checklist
- [ ] Every file modified is $\le 100$ lines.
- [ ] No `any` types introduced without platform necessity.
- [ ] Errors handled with user-friendly fallbacks.
- [ ] `npx tsc --noEmit` passes with 0 errors.
