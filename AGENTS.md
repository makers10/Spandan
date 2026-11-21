# AGENTS.md — Track your movement (Spandan)

Primary instruction file for all software engineering agents working on this project.

## 1. Project Purpose & Architecture
`Track your movement` is a high-performance, mobile-first fitness tracking application (walking, running, cycling, floor climbing) featuring phone sensor fusion (GPS, Pedometer, Barometer), offline athlete storage, and dynamic movement intelligence.
- **Frontend / Routing:** Expo SDK 58, React Native 0.88, React 19, Expo Router (`src/app/`).
- **Backend & Cloud:** Supabase (PostgreSQL, Row Level Security, GoTrue Auth) with local AsyncStorage fallback.
- **Hardware Telemetry:** Phone-native sensors only. 0% external device dependencies.

## 2. Progressive Context Loading (Token Efficiency)
Always start with `AGENTS.md`. Never load all documentation or skills at once:
- **Frontend tasks:** `AGENTS.md` → `.antigravity/skills/frontend/SKILL.md` → `docs/ARCHITECTURE.md`
- **Backend / Data:** `AGENTS.md` → `.antigravity/skills/backend/SKILL.md` → `docs/DATABASE.md`
- **Bugs / Fixes:** `AGENTS.md` → `.antigravity/skills/debugging/SKILL.md` → relevant source files
- **Features:** `AGENTS.md` → `.antigravity/workflows/feature.md` → relevant skills

## 3. Critical Rules
1. **100-Line Limit:** Every created or refactored file MUST remain $\le 100$ lines (split styles/helpers cleanly).
2. **Never Break Native:** Never edit `android/` or `ios/` manually; configure native behavior via `app.json`.
3. **No External Hardware Blockers:** Always prefer phone-native sensors (GPS, pedometer, barometer).
4. **Security & Secrets:** Never commit `.env` or credentials. All client requests use publishable anon key only.
5. **Validation Baseline:** Run lint, typecheck, and test suite before declaring any task complete.

## 4. Important Commands
```bash
npx expo start        # Start Metro dev server
npx tsc --noEmit      # Full TypeScript typecheck (must exit 0)
npm test              # Run all 7 automated test suites (must pass 100%)
npx expo lint         # Run ESLint across codebase
npx expo install --fix# Resolve SDK-compatible versions
```

## 5. Definition of Done
A task is complete ONLY when:
- Requirements are met with minimal, clean code.
- Every touched or created file is $\le 100$ lines.
- `npx tsc --noEmit` exits code 0 with 0 errors.
- `npm test` passes 100% across all suites.
- Git diff contains no accidental files or secrets.
