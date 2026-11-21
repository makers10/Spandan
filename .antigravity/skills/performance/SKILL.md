# Performance Skill

## Purpose
Evidence-driven mobile optimization for smooth 60fps frame rates, battery life, and minimal bundle sizes.

## When to Use
Load when optimizing GPS tracking loops, list rendering, animations, or bundle weight.

## Rules
- Evidence First: Never optimize code prematurely without profiling or concrete benchmarks.
- GPS Battery Conservation: Do not request continuous high-accuracy fixes when stationary. Apply distance filtering ($\ge 1.0\text{ m}$) and accuracy tolerances ($\le 65\text{ m}$).
- Render Efficiency: Use `FlatList` with `getItemLayout` for long activity feeds instead of unbounded `ScrollView`.
- State Minimization: Do not trigger re-renders inside high-frequency sensor ticks (use `useRef` for tracking state, syncing to UI state once per second).
- Pure Math: Keep telemetry mathematics zero-allocation and inline wherever possible.

## Preferred Patterns
- `useNativeDriver: true` for React Native layout animations.
- Throttled interval timers (e.g., 1000ms moving time ticks) during workout recording.

## Anti-Patterns
- Creating new object references or inline functions inside `useFrame` or tick intervals.
- Heavy synchronous calculations blocking the JavaScript main thread.

## Validation Checklist
- [ ] No frame drops during workout recording HUD ticks.
- [ ] List views recycle items efficiently without memory growth.
