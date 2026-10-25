# Batl Muslim — Combined Phases 18–27

This is one coordinated **layout quality pass** based on the user-provided Prayer Tracker screenshot. It does not constitute ten complete feature redesigns.

- 18 — Hide redundant native stack headers on Fajr, Voice and Leaderboard
- 19 — Remove repeated Fajr title and subtitle above chapter banner
- 20 — Remove redundant Hall of Heroes heading block
- 21 — Remove redundant Recitation heading above working steps
- 22 — Compact prayer statistics card and reduce wasted vertical space
- 23 — Reduce ornamental interference and improve RTL text wrapping on chapter headers
- 24 — Improve readability and compact icon treatment for journey panels
- 25 — Reduce banner art overlap and tighten challenge heading typography
- 26 — Expose real journey progress to accessibility services
- 27 — Add reproducible layout audit script for oversized fixed-height panels

## Important boundaries
- Existing gameplay, scoring, prayer data and navigation destinations are retained.
- The native navigation bar remains where it supplies the only back button; removing it without replacement would trap users.
- Other screens still require visual QA on iOS/Android and comparison with approved mockups.
- Run `npm ci`, `npx tsc --noEmit`, `node scripts/layout-audit.mjs`, and `npx expo start --clear --port 8082`.
