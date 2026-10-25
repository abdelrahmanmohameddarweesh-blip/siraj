# Combined Phases 70–89 — Functional learning and challenge progression

## Implemented 20 scoped functional improvements
1. Persistent, guest-compatible local challenge history.
2. Challenge history schema with unique event identifiers.
3. Input validation of restored history.
4. Deduplication by event ID.
5. Capped history to 250 events to avoid unbounded storage growth.
6. Serialized history writes to prevent simultaneous updates overwriting each other.
7. Recorded completed Reading Challenge sessions.
8. Reading result stores correct answers and total passages.
9. Recorded completed Hadith Challenge sessions.
10. Hadith Challenge now counts correct answers explicitly.
11. Hadith results show correct answers, not only reward points.
12. Recorded completed Trivia sessions and actual points.
13. Recorded Sirah checkpoints, once per checkpoint.
14. Arena dashboard refreshes when screen regains focus.
15. Arena shows completed-session total.
16. Arena shows locally accumulated points (not a cloud currency balance).
17. Arena shows challenge activity streak.
18. Arena shows best question accuracy from recorded activities.
19. Arena shows activity breakdown for Reading, Hadith, Trivia and Sirah.
20. Arena shows six unlockable badges and recent challenge history.

## Important limitations
- This is one coherent functionality release; it is **not** 20 independent game rebuilds.
- Trivia now counts correct answers at submission rather than estimating them from XP; sudden-death results use the number of questions reached.
- History starts when this version is installed. Older activity is not automatically backfilled.
- Guest history is device-local and not synced to a signed-in profile.
- Server XP and Siraj rewards remain managed by existing flows; dashboard local points are not spendable.
- Requires TypeScript compile and physical device testing before release.

## Testing
1. Finish Reading Challenge, return to Arena; verify one recorded session.
2. Finish Hadith Challenge, verify answer count and Arena record.
3. Finish Trivia, verify points and session count; accuracy should not be interpreted for Trivia.
4. Complete a Sirah checkpoint, repeat it and verify no duplicate record.
5. Close and reopen Expo Go; verify Arena history remains.
6. Play as a guest and check that history works without a profile.
7. Inspect Arabic RTL and iPhone/Android safe areas.
