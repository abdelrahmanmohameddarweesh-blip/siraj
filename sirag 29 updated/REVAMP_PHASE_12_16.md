# Batl Muslim — Combined Phases 12–16

Built on combined Phases 9–11. Five screen-level updates in one package:

- **Phase 12: Recitation** — illustrated journey banner added to voice recitation screen, retaining recorder and assessment logic.
- **Phase 13: Finish the Ayah** — new chapter banner in the game lobby; question flow remains intact.
- **Phase 14: Hall of Heroes** — cinematic results banner added above multiplayer standings; scores unchanged.
- **Phase 15: Onboarding** — new cinematic welcome banner on login/onboarding screen; guest-first behavior unchanged.
- **Phase 16: Fajr Challenge** — new dawn-themed chapter banner above streak content; prayer tracking unchanged.

Shared `CinematicQuestBanner` uses RTL-aware text alignment, emerald gradients, gold ornamentation and SVG artwork. It is not an actual game progress meter.

This is a focused five-screen visual update, **not a complete mockup-matched redesign of every app screen**. No claim of production readiness.

## Test
`npm ci`
`npx tsc --noEmit`
`npx expo start --clear --port 8082`
