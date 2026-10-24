# Spandan (स्पंदन) 🏃‍♂️🚴‍♀️

> **Next-Generation Cardiovascular & Athlete Longevity Tracking Platform**  
> Built with Expo SDK 58, React Native, React 19, and Supabase.

[![Expo SDK 58](https://img.shields.io/badge/Expo-SDK%2058-blue.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB.svg)](https://reactnative.dev)
[![React 19](https://img.shields.io/badge/React-19.3-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6.svg)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-RLS%20Enforced-3ECF8E.svg)](https://supabase.com)
[![Tests Passing](https://img.shields.io/badge/Tests-18%2F18%20Passed-brightgreen.svg)](tests/)

---

## 🌟 Overview

**Spandan** (*"Pulse"* or *"Heartbeat"* in Sanskrit) is an open-architecture, cross-platform mobile and web application designed for endurance athletes and everyday fitness enthusiasts. 

Unlike conventional fitness trackers that prioritize vanity distance and maximum speed at the cost of overtraining and injuries, Spandan focuses on **cardiovascular efficiency, aerobic longevity (Zone-2 training), and athlete privacy**.

---

## ⚡ What Makes Spandan Different?

| Feature | Strava / Nike Run Club | Spandan Platform |
| :--- | :--- | :--- |
| **Core Philosophy** | Raw speed & vanity leaderboards | Cardiovascular health, aerobic base & longevity |
| **Route Privacy** | Public routes often expose home address | **Smart Privacy Cloaking**: Auto-masks 500m start/end radius |
| **Data Sovereignty** | Proprietary walled garden & $80/yr paywalls | Open-architecture, Supabase-backed, exportable data |
| **Telemetry** | Distance & basic pace | Moving time calculation, Haversine splits, elevation deltas |
| **Offline Resilience** | Can fail in remote trail areas | Resilient local demo fallback & queued cloud sync |

---

## 🚀 Key Features

- **Multi-Sport Recording**: Real-time tracking for **Runs**, **Rides**, **Walks**, and **Hikes** with live moving time, distance, current pace/speed, and elevation gain.
- **Smart GPS Filtering**: Robust coordinate validation, noise removal, and Haversine distance aggregation with auto-pause detection.
- **Weekly Rhythm & Goals**: Dynamic 7-day distance bar chart, 4-week workout streak monitor, and visual weekly goal completion percentage.
- **Community & Social Feed**: Discover activities from other athletes, grant kudos, join discussion threads, and filter by sport.
- **Athlete Profiles**: Track career milestones, distance totals, gear mileage (running shoes & bikes), and personal records.
- **Dual-Mode Architecture**:
  - **Live Cloud Mode**: Real-time Supabase synchronization protected with granular Row Level Security (RLS).
  - **Offline / Demo Mode**: Instant trial experience with curated mock activities, allowing full UI exploration without an account.

---

## 📂 Project Architecture

```
spandan/
├── .env.example               # Template environment configuration
├── app.json                   # Expo application manifest & permission plugins
├── assets/                    # App icons, splash screens, and vector badges
├── docs/
│   └── jmeter-testing-guide.md# JMeter performance & stress testing documentation
├── src/
│   ├── app/                   # Expo Router file-based screens
│   │   ├── _layout.tsx        # Root navigation, theme & auth provider
│   │   ├── index.tsx          # Home dashboard (stats, weekly chart, feed)
│   │   ├── explore.tsx        # Community discovery & segment feed
│   │   ├── record.tsx         # Workout recording & live telemetry HUD
│   │   ├── profile.tsx        # Athlete profile, gear tracking & settings
│   │   ├── activity/[id].tsx  # Granular activity details, splits & map
│   │   └── auth/              # Login & registration screens
│   ├── components/            # Reusable UI components & fitness cards
│   ├── constants/             # Design tokens, color palette & typography
│   ├── context/               # Authentication & session state
│   ├── data/                  # Mock fitness seed data & TypeScript models
│   ├── services/              # Supabase database, auth, location & social services
│   └── utils/                 # Geospatial calculation, telemetry & formatting utils
├── supabase/
│   ├── schema.sql             # Full PostgreSQL schema with RLS policies & triggers
│   ├── seed-jmeter-test-data.sql
│   └── cleanup-jmeter-test-data.sql
└── tests/
    ├── auth-and-activities.test.mjs  # Unit & RLS ownership test suite
    └── geo-and-tracking.test.mjs     # Haversine, splits & telemetry math tests
```

---

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- [Expo Go](https://expo.dev/go) on your physical device (optional, for mobile testing)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/spandan.git
cd spandan
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:

```ini
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-anon-key
```

> **Note:** If Supabase credentials are not provided, Spandan automatically activates **Demo Mode**, enabling all features with mock athlete data.

### 3. Setup Supabase Database (Optional for Live Mode)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
4. Enable Email Auth under **Authentication -> Providers**.

### 4. Run the Application

Start the Expo development server:

```bash
# Start Metro bundler (Universal)
npx expo start

# Run directly in web browser
npx expo start --web

# Open on connected Android device / emulator
npx expo start --android

# Open on iOS simulator (macOS required)
npx expo start --ios
```

---

## 🧪 Testing & Code Quality

Spandan includes automated test suites and static analysis tools:

```bash
# Run unit & geospatial integration tests
npm test

# Run TypeScript typecheck
npx tsc --noEmit

# Run ESLint validation
npx expo lint

# Diagnose dependencies and Expo configuration
npx expo-doctor
```

For load and concurrency testing, review the [JMeter Testing Guide](docs/jmeter-testing-guide.md).

---

## 🔒 Security & Privacy

- **Row Level Security (RLS)**: Enforced on all Supabase tables (`profiles`, `activities`, `activity_splits`, `kudos`, `comments`).
- **Data Isolation**: Athletes can only edit or delete their own activities and comments.
- **Client Key Safety**: Only the public publishable anon key is used on the frontend; service role keys are never exposed.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
