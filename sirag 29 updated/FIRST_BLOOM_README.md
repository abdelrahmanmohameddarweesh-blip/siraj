# Batl Muslim — The First Bloom (playable vertical slice)

This is an **actual interactive WebGL 3D prototype**, embedded in the existing Expo React Native app. It is a first quality-validation slice, not a finished AAA-quality cinematic asset.

## Test the feature

1. Install the app dependencies with `npm ci`.
2. Run `npx tsc --noEmit` and resolve any environment/dependency errors.
3. Run `npx expo start --clear --port 8082` and open Expo Go on your iPhone.
4. Go to **Habit Garden → The First Bloom**.
5. Tap **I completed Quran time · Grow my flower** to record today's Quran habit and trigger a ~12-second cinematic growth sequence.
6. Drag the scene to orbit the camera. Replay the animation without duplicating the check-in. Restart the app and verify that the flower remains bloomed.

## What's actually implemented

- Real-time WebGL rendering of a procedurally modeled 3D flower (not a sprite or static image).
- Animated growth of stem, leaves and layered petals; cinematic orbit, dynamic lighting, small moving particles, ground and stones.
- Touch-controlled 3D camera rotation.
- Expo `react-native-webview` bridge for starting, replaying and restoring animation.
- Actual integration with Habit Garden's existing Quran habit (`batl-garden-v1`), and independent persistent bloom state (`batl-first-bloom-v1`).
- Idempotent task completion; replay doesn't create duplicate daily habit records.
- Arabic and English UI; reduced-motion setting shortens the animation.
- Self-contained offline HTML renderer; no CDN or external 3D dependencies.
- Standalone `FIRST_BLOOM_BROWSER_DEMO.html` to inspect in a desktop browser before phone testing. Browser demo has a **Preview growth** button and does not save app progress.

## Quality limitations and next step

The current flower is **procedurally generated geometry**, not an artist-authored photorealistic model. Lighting uses simple shaders and the environment is minimal. It proves the animation loop, camera, persistence, and native integration, but **does not yet meet the requested cinematic quality bar**. The next art pass should replace the mesh with a professional animated GLB/GLTF botanical asset, physically based materials, richer lighting, ambient audio, and designed camera choreography after the interaction is validated on-device.

This prototype does not verify whether Quran reading occurred; it is a self-reported habit check-in. The flower is a symbol of effort, not spiritual purity.

## Verification done in this environment

- Standalone renderer JavaScript passes `node --check`.
- Project route and integration source are present.
- ZIP integrity is checked.
- Full TypeScript compilation and iPhone testing are not completed here.
