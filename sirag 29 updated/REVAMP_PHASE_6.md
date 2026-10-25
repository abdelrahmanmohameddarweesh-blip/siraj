# Batl Muslim — App-wide cinematic foundation (Phase 6)

## Changes actually made
- Fixed the Milestone 5 TypeScript error in `src/components/home/CinematicHome.tsx` (`StyleSheet.absoluteFillObject` -> `StyleSheet.absoluteFill`).
- Set React Navigation's background, cards, borders, and typography to the emerald/gold cinematic palette for all navigated screens.
- Set the stack's content background and headers to the cinematic palette throughout the app.
- Added a one-time theme migration so existing installations previously saved in light mode start in dark cinematic mode. Users can still toggle the theme afterward.
- Preserved existing screens, routes, guest data, and application functionality.

## Not yet implemented
This is an app-wide visual foundation, **not** a full mockup-faithful screen-by-screen rebuild. Existing screens with hardcoded backgrounds or bespoke layouts may still look inconsistent. Quran reader, onboarding, individual gameplay, and other screen-specific art/layouts require dedicated implementation and visual QA. Do not describe this package as a complete redesign.

## Test
1. Extract ZIP to a fresh directory.
2. Run `npm ci`.
3. Run `npx tsc --noEmit` and fix any errors before launch.
4. Run `npx expo start --clear --port 8082`.
5. Open the newly shown QR code, not an Expo Go recent-project shortcut.

The full TypeScript check was not possible in the artifact workspace because the installed dependency tree is absent. The user's machine can validate after npm ci.
