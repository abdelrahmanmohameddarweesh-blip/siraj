# Combined Phase 9–11: Hero Passport / Quran / Arena / Daily Worship

## Implemented
- New full-screen, bilingual Hero Passport journey map with six real destinations across Quran, Reading, Sirah, Trivia, Prayer, and Habit Garden.
- Daily local manual checklist saved by date using AsyncStorage; percentage updates and resets on a new day. This is NOT synced with scoring, prayer logs, or cloud accounts.
- Filterable full-screen map with learning/worship tabs, illustrated emerald-and-gold SVG scene, accessible navigation and checkmarks.
- Compact Hero Passport embedded in Home, Learning, and Arena. Links to full journey map.
- Reuses existing tested routes and feature screens rather than replacing gameplay engines.

## Important limitations
- This is a significant new integrated journey interface, NOT a complete pixel-perfect redraw of every screen. Quran reader, onboarding and several detailed game screens still need bespoke work.
- No automatic reward claims: checkmarks are a personal manual checklist only.
- TypeScript and on-device verification are required before release.

## Run
From the extracted Batl-Muslim-Phases-9-10-11 directory: npm ci; npx tsc --noEmit; npx expo start --clear --port 8082.
