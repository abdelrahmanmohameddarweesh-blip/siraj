# Batl Muslim — Combined Phases 42–51

## Delivered: safe-area modernization for ten additional screens

1. Reading Challenge — device-aware top and bottom boundaries.
2. Sirah Quest — device-aware boundaries.
3. Hadith Challenge — device-aware boundaries.
4. Trivia — device-aware boundaries.
5. Mutashabihat — device-aware boundaries.
6. Group Quiz Lobby — device-aware boundaries.
7. Group Quiz Waiting — device-aware boundaries.
8. Group Quiz Active — device-aware boundaries.
9. Group Quiz Results — device-aware boundaries.
10. Shop — device-aware boundaries.

Additionally, Arena Hub (tab) uses the same safe-area boundary.

The new `SafeScreenFrame` component wraps each of these screen components at the navigation level and respects actual top and bottom device insets. Existing fixed 54–60px top padding on these screens is reduced to 14px to avoid double spacing. Native-header screens and screens already using safe-area hooks were deliberately excluded to avoid double insets. Navigation names, screen behavior, scoring and stored progress are unchanged.

## Important limitations

- This is one combined *safe-area and layout reliability* release, not ten complete cinematic screen redesigns.
- Screens that use their own safe-area insets, overlays, absolute positioning, and the remaining native-header screens still require manual device verification.
- The audit helper `node scripts/audit-safe-area.js` identifies possible remaining hardcoded top paddings. It is a review tool, not proof of correct rendering.
- Run `npm ci`, `npx tsc --noEmit`, and device QA on iOS and Android before publishing.
