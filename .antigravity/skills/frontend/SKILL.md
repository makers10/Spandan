# Frontend Skill

## Purpose
Guidelines for Expo SDK 58, React Native 0.88, React 19 UI components, navigation, and styling.

## When to Use
Load when building, modifying, or reviewing UI screens (`src/app/`), components (`src/components/`), or hooks.

## Rules
- Routes live strictly in `src/app/` (Expo Router). Non-route components live in `src/components/`.
- Handle loading, error, and empty states gracefully for every visual screen.
- Keep components modular: extract styles to `*.styles.ts` whenever the file exceeds 80 lines.
- Accessibility: Never use web-only roles (e.g., `accessibilityRole="dialog"`) on native `RCTView`. Use `Platform.OS === 'web'` checks where necessary.
- Responsive design: Support safe area insets via `react-native-safe-area-context`.
- Performance: Memoize expensive aggregations (`useMemo`, `useCallback`). Avoid inline object re-creations inside tight timers.

## Preferred Patterns
- Bento grid layouts for fitness telemetry tiles.
- Custom modular modals (`CustomModal`) with keyboard avoidance and hardware back handler.
- Platform-adaptive rendering (`Platform.select`, `Platform.OS`).

## Anti-Patterns
- Huge monolithic screens exceeding 100 lines.
- Calling `setState` directly inside synchronous `useEffect` bodies (triggers React 19 warnings).
- Hardcoding external hardware requirements (e.g. smartwatches) when phone sensors can calculate the metric.

## Validation Checklist
- [ ] Screen renders cleanly on both iOS/Android and Web.
- [ ] No React 19 compiler warnings in console or lint.
- [ ] Safe insets applied for notch and navigation bar.
