# Phase 90 — Quran Journey and authentic learning experiences

## Implemented and accessible
1. **Quran Journey**: new learning-first flow at Learning > Quran Journey, also available in the feature atlas and the Quran recommendation in Arena. Uses seven ayahs of Al-Fatiha from the project's existing bundled Quran dataset.
2. Four distinct stages for each ayah: **Read**, **Understand**, **Remember**, and **Reflect**.
3. Learning notes and selected Arabic vocabulary for each ayah, clearly labeled as simplified educational explanations rather than certified tafsir.
4. Interactive missing-word practice with no timer, no penalties, and a hint.
5. Optional reflection confirmation and save-for-review markers.
6. Auto-saved per-ayah completion, review markers and current stage with AsyncStorage; can resume after restart.
7. Progress overview with seven ayah markers, allowing revision of any ayah.
8. New **Hadith in Action** activity with two sourced hadith excerpts from the existing dataset and real-life scenarios. Explanations appear after choices, correct responses complete lessons, and local completion persists.
9. Learning tab includes clear launch cards for both experiences.
10. Arena copy now distinguishes knowledge competition from Quran, Sirah and Hadith learning. Existing assessment, Sirah map, duels and other challenge routes remain available.
11. Renamed existing challenge descriptions to focus on educational purpose and avoid inappropriate promises of religious merit or authoritative tajweed grading.

## Deliberately not claimed
- No verified audio recitation player, voice scoring, certified tajweed grading or Quran speech recognition was built.
- No authoritative tafsir or complete translation dataset was integrated.
- The Quran text and hadith excerpts reuse the project's existing bundled data; they must be independently checked against verified canonical sources before publication.
- The Sirah and remaining older challenges have **not** been rebuilt into new gameplay. Existing Sirah chronology and checkpoints remain as before.
- Progress is local only, not synced to Firebase. No new spendable Siraj points are awarded.
- Full Expo device and TypeScript dependency compilation were not run here; source transpilation syntax was checked.

## Recommended QA
1. Start the app; Learning > Quran Journey; check all four stages and correct/incorrect missing-word feedback.
2. Complete an ayah, leave and reopen; verify stage and completion persist.
3. Mark an ayah for review; verify the count persists.
4. Open Hadith in Action; choose a wrong answer then a correct one; verify only correct answers complete the lesson.
5. Check Arabic RTL text and device safe areas.
6. Test existing Sirah, Trivia, memorization assessment and Arena to ensure they still navigate correctly.
7. Run `npm ci`, `npx tsc --noEmit`, and test in Expo Go.
