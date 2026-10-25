# Phase 52 — Shared layout reliability

Based on the latest Phase 42–51 project.

## Changes
- Adjusted three reusable cinematic hero components to make text shrink correctly and reduce decorative art opacity, improving content legibility across their consumers.
- Updated SafeScreenFrame to accept an optional `includeBottom` flag. Arena Hub is a tab screen, so its frame no longer applies a second bottom safe-area inset above the tab bar.
- Added `node scripts/audit-layout-phase52.js` to identify remaining potentially oversized top padding and fixed minimum heights for manual device review.

## Limits
- This is not a complete screen-by-screen redesign.
- Safe area, header visibility, and font scaling require real iOS/Android device verification.
- Existing gameplay and storage behavior were not intentionally changed.
