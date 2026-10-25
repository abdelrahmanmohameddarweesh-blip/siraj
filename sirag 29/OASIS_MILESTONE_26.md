# Milestone 26: full-screen oasis inside the app

## What changed
- **New home for returning users:** Splash → `Oasis` (first-time users still go through Habit Setup first, then land in the oasis). The ⌂ button in the oasis opens the previous Home screen; every "الواحة" link in the app now opens the new oasis.
- **`src/oasis/OasisScreen.tsx`:** full-screen WebView running the oasis game, bridged to the app:
  - reads today's habits from the app's real records: the five prayer check-ins (`batl-prayer-checkin-records-v1`) and the user's daily habit plans (`sirag-habit-plans-v1` / `sirag-habit-log-v1`). Rest days hide prayers; weekly plans and plans that duplicate the five prayers are skipped.
  - tapping a habit in the oasis drawer records it in the app: prayers ask «في وقتها / متأخرة / قضاء» and save through `submitPrayerCheckin`; plans mark today's target as met (Quran plans also offer «افتح المصحف»).
  - habits recorded elsewhere (Prayer Tracker, Home) are picked up when the oasis is opened or the app returns to the foreground, with a toast «حصلت من عاداتك على …».
  - oasis state saved in AsyncStorage (`sirag-oasis-state-v1`), haptics through expo-haptics, safe areas passed from React Native.
  - one gentle reminder two days after the last visit (e.g. «البط ينتظرك عند العين 🦆»), **only if the user already allowed notifications**. The oasis never asks for permission.
  - demo tools (⋯ menu, «يوم جديد») appear only in development (`__DEV__`).
- **`src/oasis/oasisRewards.ts`:** exactly-once rewards. Each completion has a stable id (`day:habitId`) in a ledger (`sirag-oasis-ledger-v1`); grants stay pending until the oasis confirms it applied them, so a crash or reload can't lose or duplicate rewards. Rewards are never taken back.
- **`src/oasis/oasisHtml.ts`:** generated from `prototype/sirag-oasis.html` by `npm run build:oasis`. Edit the prototype, then rebuild; the prototype still runs on its own in a browser.

## Verified here
- `npx tsc --noEmit`: no errors.
- `npm test`: 25/25 pass (18 existing + 7 new reward tests: daily rules, no double awards, rest days, skipped prayers, new day, pending/ack).
- `npx expo export` for iOS and Android: both bundles build.
- Bridge test in a browser with a simulated app side using the real reward module: complete 6 habits → 2 seeds, 5 drops, 1 lantern; re-tapping a done habit does nothing; restart awards nothing new; next day's prayer recorded outside the oasis gives a seed on open.

## Not verified (needs a real phone)
- Running in Expo Go on iPhone/Android, touch/drag feel, frame rate on older phones, sound in WKWebView, haptics, the reminder notification.

## Phone checklist (Expo Go)
1. `npm ci`, then `npx expo start --clear`, scan the QR code.
2. Fresh install: Splash → Habit Setup → choose «قراءة القرآن» → you land in the oasis; the intro sheet appears.
3. Tap «الفجر» in the drawer → choose «في وقتها» → a seed flies into the bag, the phone taps lightly.
4. Drag the seed bag onto a spot, pick a plant. Complete two more prayers, drag the watering can over the plant until it grows.
5. Open Home (⌂) → Prayer Tracker, check in another prayer, come back → the drop arrives with a toast.
6. Complete all habits → lantern sheet → «شاهد واحتك ليلًا».
7. Force-quit and reopen: plants, counts and lanterns are unchanged and nothing is awarded twice.
8. Turn sound on (speaker button) and confirm wind/water/birds play; confirm drag works without scrolling the page.

## Known follow-ups
- The prayer check-in still computes points/XP inside `PrayerContext` (inherited); that conflicts with the "no worship scoring" rule and should be removed separately.
- Fonts load from Google Fonts when online; offline the phone's Arabic system font is used.
- `SandWorldScreen` (old 3D oasis) is still registered but no longer linked; it can be deleted once the new oasis is accepted.
