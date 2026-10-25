# Milestone 29: habit library, adhan and prayer follow-ups, Quran memorization, morning/evening adhkar

## Habit library (`src/habits/library.ts`, screen `HabitLibraryScreen.tsx`, route `HabitSetup`)
- 20 habits in 7 categories. Each has three ready plans (بداية لطيفة / ثبات / همّة). A plan is a target **and** a reminder plan: when the app reminds you (anchored to prayer times, e.g. «بعد الفجر بـ٢٠ دقيقة», or a clock time) and whether it follows up if you haven't done it.
- Three quick questions (current level, daily time, preferred moment) pick the recommended plan, marked «الأنسب لك» with the reason. Rule: never above your current level, never above your time (tested for every habit). Adhkar keep their natural times.
- «خطة مخصصة» lets the user change target, daily/weekly, gradual growth, reminder moment or clock time, and the follow-up.
- Gradual plans start small and rise (e.g. Quran 1 page → +1 each week → 5). Home, the oasis and reminders all use today's target.
- «الصلوات الخمس» in the library sets the prayer notifications: adhan only / adhan + «هل صليت؟» (recommended) / heads-up 10 min before + adhan + question.
- Custom habits by name still work. Old plans keep working unchanged.

## Notifications (`src/notifications/`)
- One planner (`schedulePlan.ts`, pure and tested) for everything: adhan at each prayer time, «هل صليت الظهر؟» after the congregation (Fajr +35, Dhuhr/Asr/Isha +30, Maghrib +20 min), optional heads-up, and habit reminders/follow-ups.
- «هل صليت؟» is not sent for a prayer already recorded, habit reminders stop once the habit is done for the day, quiet hours never silence the Fajr adhan, rest days skip prayers. Max 60 pending (iOS allows 64), 3 days ahead, refreshed when the app opens.
- Tapping «هل صليت الظهر؟» opens the Prayer Tracker directly on that prayer's check-in. Habit reminders open their screen (adhkar, memorization, mushaf).
- Fixed in the old scheduler: it cancelled and rebuilt every notification every minute, used old wording («يا بطل»، «شمعات السراج»), and could silence the Fajr adhan inside quiet hours.
- **Adhan sound:** `assets/sounds/athan.wav` (29.5 s, the first two takbirs, because iOS only plays notification sounds under 30 s) and `athan_full.mp3` (full adhan, played inside the app when it is open at prayer time, with a stop button). Recording: Wikimedia Commons «Beautiful adhan», CC0. See `assets/sounds/ATHAN_LICENSE.md`.
- **Custom notification sounds need a development build** (`eas build --profile development`). In Expo Go the phone's default sound plays instead; everything else works.

## Quran memorization (`src/quran/hifz/`, route `Hifz`)
- Choose a starting point (Juz' 'Amma from An-Nas, Al-Mulk, start of the mushaf, or any surah) and verses per day (from the habit plan).
- Daily: today's verses in the Quran font, listen or repeat ×3 (Alafasy, verse by verse), hide the text to practise.
- Test: per verse one recognition question (pick the missing word, or pick how the verse continues; options come from neighbouring verses) and one self-recitation (recite from memory, reveal, rate yourself). 80% adds the verses to your memorized list, logs the habit, and moves to the next verses. Below 80%: repeat and retry, no penalty.
- Review: memorized verses return on a spaced schedule (1, 3, 7, 14, 30, 60 days); right answers push the next review further, mistakes bring it back tomorrow. Reviews log the «مراجعة الحفظ» habit.
- Honest limit: the app can't hear recitation yet. Checking recitation by voice needs a specialised Quran speech-recognition service; the test design leaves room for it.

## Morning and evening adhkar (`src/athkar/`, route `Adhkar`)
- All 24 adhkar of Hisn al-Muslim chapter 27 «أذكار الصباح والمساء», **imported verbatim** from hisnmuslim.com by `scripts/import-athkar.py` (no hand-typed text), with each dhikr's repeat count and audio.
- Tap a card to count (3/3, 100/100…), «قرأتها كاملة» for long counts, listen to each dhikr, evening wording note.
- Tracked: items completed, progress, minutes of reading, consecutive days. Finishing a session logs the habit (and the oasis reward).
- The session opens by time of day (before Asr: morning; from Asr: evening).
- Before release: confirm hisnmuslim.com's permission in writing and have the list reviewed (`src/athkar/ATHKAR_SOURCE.md`). The older hand-typed file in `src/apps/athkar/` is no longer used by the app.

## Home
New doors: أذكار الصباح/المساء (by time), حفظ القرآن. A card asks to turn on adhan and reminders when they're off. Tracked habits show «ابدأ» instead of manual counting.

## Verified here
TypeScript clean; 37/37 tests (new: library recommendation for all 20 habits, gradual targets, notification plan incl. follow-up timing/skipping/quiet hours/limit and tap routing, athkar counting/completion/streak, memorization order/test/pass/spaced review); iOS and Android bundles build (adhan and Quran font bundled). Web walkthrough: library → questions → recommended plan (reminder moved to after Isha) → custom → saved; adhkar counting; memorization from An-Nas: a 67% test kept the verses unlearned, a 100% test added 114:1–3, moved to 114:4 and logged 3 verses.

## Needs a phone (development build for the adhan sound)
Adhan sound on lock screen (iOS and Android), «هل صليت؟» tap opening the check-in, reminders at the right local times, full adhan when the app is open, adhkar audio.
