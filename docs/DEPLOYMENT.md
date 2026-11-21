# Deployment & Build Guide — Track your movement

## 1. Cloud Build via EAS (Expo Application Services)
The recommended deployment strategy for production Android APK/AAB and iOS IPA bundles:
```bash
# Login to EAS
npx eas-cli login

# Configure build credentials
npx eas-cli build:configure

# Build standalone Android APK for local testing
npx eas-cli build --platform android --profile preview

# Submit production build to Google Play Store
npx eas-cli submit --platform android
```

## 2. Local Android APK Compilation
For building standalone APKs on local workstations:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-apk.ps1
```
The compiled APK will be output to `android/app/build/outputs/apk/release/app-release.apk`.

## 3. Web Deployment
Deploy the static web bundle:
```bash
# Export static web assets
npx expo export --platform web

# Deploy dist/ to hosting providers (Vercel, Netlify, Cloudflare Pages)
```

## 4. Rollback & Over-The-Air (OTA) Updates
Ship instant bugfixes without app store review:
```bash
npx eas-cli update --branch production --message "Critical fix for sensor calibration"
```
