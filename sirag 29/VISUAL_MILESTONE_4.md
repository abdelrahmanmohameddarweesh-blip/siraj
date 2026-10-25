# Batl Muslim — Milestone 4 (bulk cinematic screen pass)

## Changes actually included
- A shared reusable dark-emerald / gold cinematic chapter header with decorative vector mosque architecture and bilingual Arabic/English labels.
- Applied the chapter header to six functional screens: Arena Hub, Prayer Tracker, Sirah Quest, Learning, Profile, and Quran Assessment lobby.
- Changed the default theme for new installs to dark, while retaining saved user theme preferences and the light/dark toggle.
- Refined dark palette tokens for page background, cards, borders and gold primary emphasis.
- Added Expo app deep-link scheme `batlmuslim` to app.json to address the prior Expo warning.
- Kept existing navigation, quiz data, assessment logic, prayer calculations, profile storage and guest flows intact.

## Remaining work (not represented as complete)
- This is a shared design-system pass, not a pixel-identical recreation of every supplied mockup.
- Athkar and Qibla feature layouts, individual Arena question/result flows, Quran reader, Habit Garden and onboarding require dedicated redesign and QA.
- Full TypeScript check and device run need to be completed on the user's machine. TSX syntax/transpilation check of changed files completed here; npm install could not complete offline because a package was missing from cache.
- Dependency audit, verified Islamic references, permissions and push notifications need review before release.

## Run
Extract ZIP, open Terminal inside the folder containing package.json, then run:

    npm ci
    npx tsc --noEmit
    npx expo start --clear

Do not run npm audit fix --force blindly. If the old theme is saved as light, switch to dark in Settings to see the cinematic palette.
