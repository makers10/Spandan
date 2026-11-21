# Release Workflow

## Steps
1. **Pre-flight Quality Gates:**
   - Run `npm test` (all test suites must pass 100%).
   - Run `npx tsc --noEmit` (0 errors).
   - Run `npx expo lint` (clean lint).
2. **Context Loading:** Load `git/SKILL.md` and `security/SKILL.md`.
3. **Secret Scan:** Verify `git status` and `git diff` contain no secrets, API tokens, or `.env` files.
4. **Dependency Audit:** Check `package.json` for incompatible dependencies using `npx expo-doctor`.
5. **Native Prebuild Verification:** Ensure `app.json` has correct bundle identifiers and splash assets.
6. **Build Trigger:**
   - Android APK: Run `powershell -ExecutionPolicy Bypass -File .\scripts\build-apk.ps1`
   - EAS Cloud: Run `npx eas-cli@latest build --profile production`
7. **Artifact Verification:** Verify build artifact generation and output checksums.
8. **Documentation:** Log release notes and version bump in `docs/DECISIONS.md`.
