# Android startup recovery — 30 October 2026

## Evidence

The owner's Nothing Phone (2) report for version 1.0.0 (2) repeatedly records a fatal main-thread exception before activity startup:

```text
Unable to get provider androidx.startup.InitializationProvider
Failed to create an instance of androidx.work.impl.WorkDatabase
androidx.work.WorkManagerInitializer
```

The native stack is R8-obfuscated. This is a native Android initialization failure before the JavaScript screens render, not a tester-invitation failure. The report does not expose the innermost database creation reason. Release shrinking/reflection is a suspected cause, not a proven complete root cause. No private device report is committed here.

## Recovery configuration

Use Expo SDK 58's compatible `expo-build-properties` plugin. Explicitly disable native release minification and resource shrinking and retain WorkDatabase/Room implementation classes if shrinking is deliberately re-enabled later. Keep the WorkManager initializer and normal database behavior intact. Do not delete user data, reset databases, or disable WorkManager to hide the crash.

The app package, EAS project and signing credentials remain unchanged. EAS remote version numbering will increment the next build (normally to 3 after the first build's 2). Live ads remain off.

## Verification and limits

An isolated Android prebuild succeeds. Its generated gradle.properties disables minification and resource shrinking, and app/proguard-rules.pro contains the Room keep rules. Existing TypeScript/unit/release checks are run separately. This environment cannot compile/sign/install an Android binary, so these checks do not establish a successful on-device launch.

## Rebuild and retest

Use the new full source download, install with `npm ci`, then run:

```sh
npx eas-cli build --platform android --profile play-internal --clear-cache
```

Use only the owner's existing free EAS allowance. Do not authorize a paid plan/build. Retain the existing remote keystore; do not replace it. Upload the new AAB to a new Internal testing release, roll it out to existing testers and update through Google Play. Confirm the higher version is installed, then test cold launch, profile setup, tracking and notifications. Do not require uninstalling or clearing user records. If it still crashes, capture a fresh report for that exact new version and obtain the matching build's mapping.txt if the stack remains obfuscated. Public release remains blocked pending this verification and the other checks in PLAY-RELEASE.md.
