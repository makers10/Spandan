# Development Guide — Track your movement

## 1. Prerequisites
- **Node.js:** v20+ (tested on Node v22.23.1)
- **Package Manager:** npm (or bun if `bun.lock` present)
- **Expo CLI / EAS CLI:** Included via `npx expo` / `npx eas-cli`

## 2. Setup & Installation
```bash
# Clone the repository
git clone <repo-url>
cd Spandan

# Install dependencies (respecting Expo SDK 58 locks)
npm install

# Setup local environment variables
cp .env.example .env
```

## 3. Running the Application
```bash
# Start local Metro bundler
npx expo start

# Start on web browser directly
npx expo start --web

# Start on connected Android device/emulator
npx expo run:android
```

## 4. Verification & Testing
Before committing or creating PRs, execute all quality gates:
```bash
# Run all 7 test suites (58 tests)
npm test

# Full TypeScript compilation check
npx tsc --noEmit

# Code style and lint check
npx expo lint
```
