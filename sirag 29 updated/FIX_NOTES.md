# Living Desert interaction hotfix

- Fixed the scene bridge `setPlants` receiving `{type, plants}` and accidentally assigning that object to the plants array, crashing the render loop on habit selection.
- Added defensive validation and native-visible WebView JavaScript error reporting.
- Protected care transitions against a missing active plant.
- Fixed all three `StyleSheet.absoluteFillObject` TypeScript errors.
- Preserved the existing AsyncStorage keys and game progress.

## Smoke test
1. Enter Habit Garden > Living Desert.
2. Select Quran reading; habit task panel should open.
3. Close panel and move/look around; scene should continue animating.
4. Confirm habit; panel should disappear, scene should transition to planting interaction.
5. Tap the soil to complete seed placement; cinematic should finish and scene should return to exploration.
6. Re-enter and confirm plant persists.

Note: this is still the existing 2.5D MVP, not a cinematic 3D renderer. The fix is targeted at broken interactions.
