# Phase 41 — iPhone status bar overlap hotfix

## Changed
- Prayer Tracker custom header now uses `useSafeAreaInsets()` from the already-installed `react-native-safe-area-context` dependency.
- Header top padding includes the device top inset, rather than relying on a hard-coded 10px.
- Scroll content bottom padding includes the device bottom inset.
- Navigation header remains disabled for this route to avoid duplicate titles.

## Not yet completed
- Other screens have not all been migrated to a shared safe-area header.
- Run `npm ci`, `npx tsc --noEmit`, and test on iOS and Android.
- This is a targeted hotfix, not a claim of full app-wide safe-area QA.
