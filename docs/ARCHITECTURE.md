# Architecture Overview — Track your movement

## 1. System Architecture
The application follows a modular, mobile-first layered architecture:

```text
┌────────────────────────────────────────────────────────┐
│                   Expo Router UI                       │
│  src/app/ (index, record, explore, profile, activity)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Custom Hooks                        │
│  useHomeActivities, useAuth, useTheme, useColorScheme  │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
┌─────────────▼───────────────┐ ┌─────────▼──────────────┐
│       Domain Services       │ │     Pure Math Utils    │
│  activityService, floorSvc, │ │  geo.ts, floor-math.ts,│
│  locationService, authSvc   │ │  fitness-insights.ts   │
└─────────────┬───────────────┘ └────────────────────────┘
              │
┌─────────────▼──────────────────────────────────────────┐
│              Data & Hardware Adapters                  │
│  Supabase (Cloud) + AsyncStorage (Offline Fallback)    │
│  Expo Location (GNSS) + Expo Sensors (Pedometer/Baro)  │
└────────────────────────────────────────────────────────┘
```

## 2. Component Responsibilities
- **Presentation (`src/components/`):** Pure UI components. Extracted styles in `*.styles.ts` keeping files $\le 100$ lines.
- **State & Transport (`src/services/`):** Network calls, Supabase client RPCs, and local storage persistence.
- **Pure Math Utilities (`src/utils/`):** Zero-dependency mathematical algorithms (Haversine distance, ISA barometric hypsometry, dynamic coaching calculations).

## 3. Sensor Fusion Pipeline
During session recording:
`effectiveDistance = Math.max(calculateTrackDistanceKm(gpsPoints), estimateDistanceFromSteps(steps, sport))`
Ensures walking distance advances accurately indoors and under dense tree cover.
