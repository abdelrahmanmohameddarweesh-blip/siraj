# Batl Muslim — Milestone 5: Learning Journeys & Habit Garden

## Included in this build

### A real new feature: Habit Garden
- New fully navigable `HabitGarden` screen, linked from the Batl Worlds "Garden of Habits" card and the home Habit card.
- Four optional daily self-check-ins: Quran time, remembrance, prayer reflection and kindness.
- Tap to check/uncheck each activity, daily progress bar and seven-day overview.
- Local-only persistence through AsyncStorage, with no forced login or remote upload.
- Bilingual Arabic/English labels, RTL-aligned copy, cinematic emerald/gold styling.

### Dedicated illustrated chapter presentations on eight additional screens
- Athkar: daily completion progress derived from existing remembrance counters.
- Qibla: compass guidance chapter; existing location/compass logic retained.
- Fasting: illustrated fasting journey chapter; existing Hijri calculations retained.
- Trivia: knowledge arena introduction and completed-state indicator.
- Hadith Challenge: progress derived from question index.
- Reading Challenge: progress derived from passage index.
- Leaderboard: illustrated Hall of Heroes section.
- Mutashabihat: chapter intro in the lobby only.

### Shared design system
- New reusable `CinematicJourneyPanel` with SVG mosque-inspired geometry, gold detailing, Arabic/English titles, optional state-driven progress bar, and compact layout.
- All chapter artwork is vector decoration, not religious text or claims.
- Preserves existing functional logic and navigation in the modified screens.

## Validation and limitations
- All 13 changed/added TSX files passed TypeScript transpilation/syntax diagnostics using a globally installed TypeScript compiler.
- A full project `tsc --noEmit` could **not** be completed here: npm offline dependency installation was blocked by uncached `zxing-wasm@3.1.3`. The user must run `npm ci && npx tsc --noEmit` locally.
- No device QA was possible here. Some screens may need layout adjustments on smaller devices.
- This is a substantial functional and visual iteration, but not a pixel-perfect recreation of every original concept image.
- Existing dependency security warnings and Expo Go native notification limitations remain for later release hardening.

## Test on Mac
1. Extract the ZIP into a new folder.
2. Open Terminal in that folder (the one containing `package.json`).
3. Run `npm ci`.
4. Run `npx tsc --noEmit` and share any errors.
5. Run `npx expo start --clear`.
6. Test Home → Batl Worlds → Garden of Habits, and the Athkar, Qibla, Fasting, Trivia, Hadith, Reading and Mutashabihat screens.

Do not use `npm audit fix --force` without reviewing dependency compatibility.
