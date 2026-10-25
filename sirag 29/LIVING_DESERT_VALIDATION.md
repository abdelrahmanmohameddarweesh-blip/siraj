# Living Desert — Integrated Gameplay Validation (MVP)

## What is implemented
- Habit Garden entry opens the new full-screen Living Desert, not the old separate First Bloom card.
- Choose one of four habits; each becomes a persistent plant in a sandy world.
- Confirm a daily habit once; the task sheet disappears automatically and the camera approaches the active plant.
- Day 1: tap soil to plant a seed; Day 2: tap soil to nourish; Day 3: hold and drag upward to pour water (visible water meter); Day 4: care for sprout; Day 5: bloom.
- After each action, a short camera/lighting growth sequence returns to free-roam.
- Free-roam: lower-left touch joystick to move; drag elsewhere to look; tap plant to inspect; plus button to choose another habit.
- AsyncStorage persists planted habits, completed days, pending care interactions, and plant stages. If the app closes after habit confirmation but before finishing care, the interaction resumes.
- Arabic and English task controls.

## Important limitations
- The scene is a **custom 2.5D Canvas environment**, NOT true 3D. It is a functional interaction prototype to validate the complete loop rapidly, not final cinematic-quality art.
- No 3D asset pipeline, physically based water, mesh deformation, or cinematic character movement yet.
- The world is a bounded clearing with illustrative dunes and sprout shapes.
- The app has not been tested on an actual iPhone in this environment. Test touch and performance in Expo Go.
- Habit completion is user-confirmed and recorded in the existing local Habit Garden check-in storage. It is not independently verified as a real-world action.
- The five growth actions require completions on five distinct local dates. There is no missed-day penalty.

## Quick test
1. `npm ci`
2. `npx expo start --clear --port 8082`
3. Open Expo Go > Habit Garden > The Living Desert.
4. Choose Quran reading. Confirm completion. The sheet disappears and the camera approaches the seed. Tap soil to plant. Move using left thumb and look with right thumb.
5. On subsequent calendar days repeat completion; on Day 3 drag upward on the scene to pour water.
6. Tap the + icon to select a second habit.

## Validation checklist
- [ ] Habit selection is understandable without instructions.
- [ ] Confirmation seamlessly enters the world.
- [ ] Camera and movement gestures work on the actual iPhone.
- [ ] Day 3 watering feels controllable and completes.
- [ ] Progress survives killing/restarting the app.
- [ ] Second habit appears as another plant.
- [ ] The interaction is emotionally rewarding enough to justify a full 3D art production phase.

**Do not judge the visual fidelity of this 2.5D prototype against the intended AAA 3D art target.** Judge the loop, navigation, timing, and agency. The next phase is a true 3D asset and rendering prototype if these pass.
