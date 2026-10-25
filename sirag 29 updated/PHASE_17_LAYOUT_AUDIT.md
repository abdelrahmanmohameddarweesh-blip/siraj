# Phase 17 — Layout consistency pass

Based on the supplied Prayer Tracker screenshot.

## Implemented
- Prayer Tracker: removed duplicate React Navigation title, retaining the in-screen header with back and settings actions.
- Reading Challenge: removed duplicate React Navigation title, retaining the in-screen navigation bar.
- Prayer Tracker: reduced top padding and scroll spacing and aligned the hero to page margins.
- Shared cinematic SectionHeader, JourneyPanel and QuestBanner: removed enforced minimum heights; reduced padding, heading sizes, ornament spacing and margins. Changes propagate to screens using these components.
- Existing calculations, challenges, local storage, navigation and gameplay logic were not intentionally changed.

## QA still required
- Run `npm ci`, `npx tsc --noEmit`, then test on a device.
- Audit other screens individually for screen-specific headers and layout exceptions.
- Verify Arabic text wrapping on narrow screens and accessibility font scaling.
- This is a cross-screen layout pass, not a claim that every screen has been manually validated.
