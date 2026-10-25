# Phase 8 — Gameplay Journey Refresh

## Implemented
- New reusable emerald-and-gold `QuestMilestoneStrip` with real game-state progress, accessible text and up to 12 chapter markers.
- Reading Challenge: live journey milestones, synced to completed passages and final result.
- Islamic Trivia: live challenge route on quiz and completion screens, preserving existing timers and scoring.
- Group Quiz Lobby: new cinematic illustrated Heroes Gathering introduction while retaining room controls.
- No changes to scoring, account data, prayer calculations, or quiz answer logic.

## QA and limitations
- Full app-wide pixel matching is not claimed.
- Device QA remains necessary; review layouts on smaller phones.
- `npm ci`, `npx tsc --noEmit`, then `npx expo start --clear --port 8082`.
