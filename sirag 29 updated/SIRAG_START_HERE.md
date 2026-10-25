# Sirag — isolated iPhone prototype

This is a new **Sirag** folder and app entry point, based on the original Milestone 1 source. The Batl Muslim home, Arena and old navigation are not loaded. Old source files remain in `src/` only to avoid breaking shared imports while we incrementally migrate.

## On Mac
1. Unzip the package and open Terminal in the `Sirag` folder.
2. Run `npm ci`.
3. Run `npx expo start --clear --port 8082`.
4. Open the **Sirag** project from Expo Go on iPhone (scan the *new* QR code). Close any older Expo server first.

The Expo identity uses `sirag`, `com.sirag.livingdesert`, and no inherited EAS project ID. Expo Go itself is a shared container, not a separately installed Sirag app. A standalone iPhone app requires a separate iOS build.

## Current scope
- New Sirag-only home and navigation
- Existing Living Desert prototype
- Existing prayer tracker
- Other old files are not active, pending safe removal

Progress note: the desert currently reads legacy AsyncStorage keys so existing progress is not silently lost; an explicit migration will be needed before a production build.
