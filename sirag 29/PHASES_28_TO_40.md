# Batl Muslim — Combined Phases 28–40

This package builds on Phases 18–27. It is a **cross-screen layout and readability release**, not thirteen completely rebuilt feature experiences.

## Changes applied
- 28 Shared chapter header typography and decoration
- 29 Journey card content width and progress visibility
- 30 Quest banners less visual overlap
- 31 Habit Garden more compact daily dashboard
- 34 Reading challenge spacing
- 38 Fajr challenge spacing
- 39 Leaderboard row spacing

## Additional screen-specific updates
- Prayer Tracker header and content compacted
- Learning hub header reduced excessive top whitespace
- Arena hub challenge cards standardized
- Sirah quest chapter card corners standardized
- Quran assessment component cards compacted

## What has not been completed
- Full pixel-by-pixel recreation of all concept images
- Full Quran reader redesign, Arena game engine redesign, new animation system
- Automated visual screenshot regression on iOS and Android

## Verify
1. `npm ci`
2. `npx tsc --noEmit`
3. `node scripts/layout-audit.mjs`
4. `npx expo start --clear --port 8082`
5. Inspect Prayer Tracker, Quran Assessment, Learning, Arena, Sirah, Fajr, Profile, Leaderboard, Reading, Habit Garden on device.

Do not run `npm audit fix --force` without reviewing changes.
