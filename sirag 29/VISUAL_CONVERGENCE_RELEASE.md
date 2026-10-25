# Batl Muslim — Visual Convergence Release (combined remaining roadmap)

This is a **single substantial source release**, built from Phase 90, prioritizing the original emerald/gold cinematic screen mockups and meaningful learning interactions. It is not a claim that every reference screen is now pixel-perfect or every roadmap feature complete.

## Main changes implemented
- Shared reusable `CinematicPortal` artwork with original SVG architecture, open Quran, and garden illustrations, gradients, gold actions, and progress bars.
- Home dashboard: new large Quran Journey hero; Sirah, Habit Garden, and Arena cinematic world panels; retained next prayer, check-ins, daily path and guest profile.
- Home quick access: Quran route leads to learning rather than generic assessment; new entry to a dedicated Quran Reader.
- Learning: prominent Quran Journey, Sirah Story and Hadith in Action cards; older learning library and challenge links retained.
- Quran Journey: integrated visual hero into the existing read/understand/remember/reflect progression.
- **New Quran Reader**: four selected complete short surahs from the bundled dataset, ayah bookmarks, locally saved reading position, and return to Quran Journey.
- **New Sirah Story**: chronological chapter storytelling from existing checkpoint data, chapter selector, review questions, completion history and local resume.
- Hadith in Action: visual hero and a functional fix so a wrong scenario response cannot mark a lesson completed.
- Arena: cinematic competitive hero distinct from Quran/Sirah learning.
- Habit Garden: scenic growth hero above existing live habit stages, streaks and achievements.
- Prayer Tracker: compact cinematic header while retaining prayer check-in controls.
- Profile: consistent cinematic profile hero.
- Shared home design tokens migrated from pale surfaces to dark emerald surfaces with gold accents.
- Updated key routes in feature atlas, home, passport, and learning to use the redesigned experiences.
- Corrected one visibly corrupted Quran dataset string in Al-Baqarah 2:6; **this is not a canonical text audit**.

## Scope limitations
- Reference collages depict dozens of distinct screens and sophisticated illustrations; this release aligns the major navigation surfaces and introduces new functional screens, but **does not exactly reproduce every mockup**.
- Quran Reader includes only four selected surahs, not the complete mushaf. Quranic text, translations, and Sirah/hadith material require independent authoritative verification before release.
- No production-grade audio recitation, speech/tajweed grading, synced accounts, real-time multiplayer, or comprehensive new artwork pack is claimed.
- Existing features not listed above remain inherited from Phase 90.
- Expo runtime, native iOS/Android layouts and full TypeScript compilation require local testing.

## Suggested first-pass phone testing
1. Home: confirm status bar spacing, visible prayer card, and new hero cards.
2. Quran Journey: complete one ayah's four stages; close and resume.
3. Quran Reader: change surah, bookmark ayah, reopen and confirm persistence.
4. Sirah Story: open a chapter, answer incorrectly, then correctly, and confirm completion after restart.
5. Hadith in Action: verify wrong answers don't unlock lessons.
6. Arena, Prayer Tracker, Habit Garden, Profile: check dark surfaces, safe areas, navigation, and no duplicate titles.
7. Verify Arabic RTL and English layouts on iPhone and Android.

Run:
```
npm ci
npx tsc --noEmit
node scripts/audit-visual-convergence.js
npx expo start --clear --port 8082
```
