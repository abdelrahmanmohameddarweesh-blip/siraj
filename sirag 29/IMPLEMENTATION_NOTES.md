# Batl Muslim — guest onboarding and progressive personalization (milestone 1)

## Implemented
- Login screen now offers a prominent **Continue as guest / ابدأ بدون تسجيل** action, requiring no nickname, phone, email, or registration. It uses the existing stable local guest ID and storage infrastructure.
- Profile screen contains an optional Hero personalization card with local persistence via AsyncStorage (`batl-personalization-v1`). Defaults: no nickname, star avatar, age unspecified, Quran learning focus, Quran revision habit.
- Users can choose a daily habit and opt into an **8 AM or 8 PM on-device reminder**. Permission is requested only when a reminder is chosen; previously scheduled reminder is cancelled on changes or when disabled.
- Removed the profile screen's ad banner for this milestone.
- WhatsApp number collection and messaging are deliberately **not implemented**; no backend, consent record, or WhatsApp delivery exists yet.

## Limitations / next steps
- The optional personalization card is in Profile, not yet a separate first-launch wizard. The profile banner and Arena learning recommendations are not yet wired to the saved preferences.
- Reminder presets use device local clock time, not dynamically calculated prayer times. Test notifications on physical Android devices, including notification permission and Android notification channels.
- Existing optional name/phone/age inputs remain visible below the new guest action on the legacy login screen; these should be simplified in the next visual redesign.
- Guest data is local and may be lost on uninstall; there is no account/cloud sync in this milestone.
- This is a source-code patch, not a compiled or device-tested release. TypeScript checks could not run in this environment because node_modules were intentionally excluded and the globally installed tsc version does not match the project's TS 6 config.

## How to run
1. Unzip the archive.
2. From the project folder, run `npm ci` and then `npx expo start --android`.
3. Verify guest launch, profile personalization persistence after restart, and reminder permission/scheduling on a physical Android device.

The archive excludes node_modules, .git, local builds, and signing keystores. Keep production credentials out of source control.

## Milestone 2 — personalized cinematic home and Arena (2026-10-14)
- Added `useGuestPreferences`, a shared local preference reader that refreshes when Home or Arena gains focus, so profile changes appear without app restart.
- Added a cinematic dark-green/gold `HeroJourneyCard` above the existing prayer and daily-path widgets. It uses the star avatar and Quran focus by default, shows the saved nickname if supplied, and routes to the appropriate existing experience.
- Added a Quran memorization recommendation to the Arena individual tab when the user selects Quran focus. It launches the existing Quran assessment; no scoring or assessment logic was replaced.
- Reused the same guest preference schema/key in the Profile editor; removed the Arena ad banner for the ad-free phase.
- Preserved existing prayer tools, daily path, mini-apps, and Arena challenges. No phone number is collected for WhatsApp.

### Validation and remaining work
- Source files were inspected and changes were integrated, but the app was **not built or tested on a device**. This source-only package excludes dependencies; run `npm ci`, `npx tsc --noEmit`, and `npx expo start --android` locally.
- The full first-launch optional onboarding wizard and a comprehensive cinematic redesign of all screens are still outstanding. The Home hero is the first visual redesign component.
- Confirm Arabic font rendering and safe-area layout on Android; test profile edits then switching back to Home and Arena.
