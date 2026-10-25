# Milestone 28: home-first landing, prayer check-in, Quran fixes

## Landing
- Returning users now open **Home** after the splash. The oasis opens first only when rewards are waiting (a habit or prayer recorded elsewhere that hasn't been collected yet).
- Home's oasis card shows a badge when there is something to do: «مكافآت جديدة بانتظارك ✨», «لديك بذرة جديدة 🌱», or «لديك ماء لنبتاتك 💧».
- First-time users still go Habit Setup → oasis, so they see the oasis introduction once.

## Prayer check-in (`components/prayer/PrayerCheckinSheet.tsx`), used in the oasis and the Prayer Tracker
1. هل صليت الظهر؟ → نعم، الحمد لله / ليس بعد (plus the gentle rest-day option)
2. هل صليتها في وقتها؟ → نعم، في وقتها / لا، بعد خروج وقتها (recorded as qada)
3. صليتها جماعة أم منفردًا؟
4. If جماعة: أين صليت الجماعة؟ → في المسجد / في البيت
5. «تقبّل الله منك» with a plain summary, e.g. «في وقتها · جماعة في المسجد 🕌».
- The old sheet assumed "on time" whenever the prayer window was open, and showed points («+١٥ سراج»). It now always asks, and shows no points. The Prayer Tracker badges use the same plain summary.
- New `place` field (`masjid` | `home`) on check-in records; older records without it still display correctly.
- Note: `PrayerContext` still writes `pointsAwarded`/`xpAwarded` internally for the inherited hero engine; nothing displays them now.

## Quran
- **Listening:** three of the five reciters (الحصري، المنشاوي، المعيقلي) never played; their files returned "forbidden" from the old audio source with no message. All reciters now stream full surahs from mp3quran.net (checked for surahs 1, 2 and 114), and السديس was added. If a recording can't load within 15 seconds, a clear message appears instead of silence. Replay after the end works.
- **«متابعة القراءة»** used to open the start of the surah, not the page you stopped on. It now opens the last page you read, and the page is remembered as soon as it opens.
- **Choosing al-Fatiha** used to jump to your last saved page instead; fixed.
- **Basmala:** the text source glues the basmala to verse 1 of each surah. It is now shown on its own line under a surah banner, for every surah that starts on the page (tested against all 114 surahs). At-Tawbah has none, al-Fatiha keeps it as verse 1.
- **Font:** the Uthmani text now uses Amiri Quran (bundled, SIL Open Font License, `assets/fonts/AMIRIQURAN-OFL.txt`), so marks and stops render properly instead of falling back to the system font.
- **Verse numbers** use ﴿١﴾ instead of the rub' al-hizb sign ۞ that was shown by mistake.
- **Verse-by-verse audio** continues to the next verse and onto the next page instead of stopping after one verse; the playing verse is highlighted in «آية بآية».
- The surah index works offline (bundled list) and «إعادة المحاولة» really reloads the page.

## Verified here
TypeScript clean; 28/28 tests (new: basmala split on all 114 surahs, home badge rules); iOS and Android bundles build. In the web build: no rewards → Home; uncollected prayer → oasis; the four-step check-in saved `on_time · jamaa · masjid`; rewards arrived (1 seed, 1 drop); badge shown on Home; Baqarah page renders with banner, basmala and Amiri Quran; «متابعة القراءة» showed the page just read; الحصري، المنشاوي، المعيقلي all loaded and played.

## Needs a phone
Lock-screen controls and background playback for the new audio source, check-in sheet on small screens, Quran font rendering on Android.
