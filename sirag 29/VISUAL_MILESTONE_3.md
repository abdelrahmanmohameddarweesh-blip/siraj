# Batl Muslim — Cinematic visual alignment (Milestone 3)

This package is the continuation of Milestone 2, not a brand-new project.

## Implemented
- Dark emerald and gold Home treatment inspired by the approved mockup.
- Arabic/English Hero welcome with optional guest nickname, star avatar, real XP level, streak and points from existing Home data.
- Mosque skyline illustration drawn with SVG (no external image service or extra assets).
- Quran assessment primary call to action.
- Four quick-access utilities: Quran assessment, Athkar, Qibla, Prayer Tracker.
- Batl Worlds: Sirah, Quran and Habits entry cards wired to existing routes (Habits currently opens Profile preferences, not a new Garden of Habits world).
- Arena promotional card with real navigation to existing Quran assessment and Arena Hub.
- Existing live prayer card, daily path, habit card and mini apps preserved.
- Dark emerald bottom navigation with gold active state and bilingual labels.

## Still to build to match *all* reference screens
- Full cinematic redesign of Quran reader, prayer details, Athkar, Arena question/result screens, Sirah chapters, habit garden, profile, settings, onboarding and future shop.
- Full illustrated asset production and visual QA across screen sizes.
- Dedicated optional guest-first onboarding; current guest preferences remain editable from Profile.
- New world-specific content must be religiously verified before release.

## How to test on your Mac
1. Back up your current folder. Unzip this package into a new folder.
2. In Terminal, `cd` into the extracted folder containing `package.json`.
3. Run `npm ci` then `npx tsc --noEmit`.
4. Run `npx expo start --clear`, open Expo Go and inspect Home, Prayer, Quran assessment, Arena, Worlds and Profile.
5. Share screenshots and Terminal errors so remaining screens can be refined against the reference.

## Validation
TSX parse checks completed for the new and changed screens. Full TypeScript check could not be completed in this environment because package installation timed out. The user previously confirmed the Milestone 2 app ran successfully; Milestone 3 is not yet device-tested.
