# Combined phases 53–67: safe layout and content readability

This batch implements a shared quality pass, not 15 fully rebuilt game modes.

## Implemented improvements
1. Finish Ayah: replaced guessed device-specific top padding with a safe-area frame.
2. Finish Ayah Camera: same treatment for camera UI.
3. Live Duel: safe-area frame for controls and gameplay.
4. Quran Assessment: safe-area frame.
5. Shared Section Header: improved eyebrow readability.
6. Shared Section Header: increased subtitle size and line height.
7. Shared Section Header: reduced excessive bottom spacing.
8. Shared Journey Panel: increased eyebrow size.
9. Shared Journey Panel: increased subtitle size and line height.
10. Shared Journey Panel: improved progress-label readability.
11. Shared Quest Banner: softened decorative overlays where present.
12. Shared Safe Screen Frame: prevented content width overflow.
13. App loading view: aligned fallback background with dark theme.
14. Created 15-flow source audit for unsafe fixed dimensions.
15. Consolidated device QA checklist and known limitations below.

## QA checklist
- Run `npm ci` and `npx tsc --noEmit` from the extracted project root.
- Run `node scripts/audit-phase53-67.js`.
- Run Expo and inspect iOS status bar, bottom safe area, Arabic wrapping and header duplication.
- Check the four newly wrapped flows: Finish Ayah, Finish Ayah Camera, Live Duel, Quran Assessment.
- Check the shared cinematic hero cards in Prayer Tracker, Sirah, Arena and learning screens.

## Limitations
- Source-level checks are not proof of successful device layout.
- Full screen-by-screen visual reconstruction against generated mockups remains open.
- Do not ship without verifying prayer calculations, game state, Quran text and notification permissions.
