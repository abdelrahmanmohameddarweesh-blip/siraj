# Milestone 27: cinematic splash and redesigned home

## Splash (`src/oasis/OasisSplash.tsx`)
- Replaces the old static image (which had a palace-in-the-sky scene and a spelling mistake baked into it) with the app's own living oasis at dusk.
- About 4 seconds: the camera slowly pulls back over the oasis, stars appear, lanterns light one by one around the spring, then «سراج» rises in gold with «كل عمل طيب يترك أثرًا».
- First launch: «ابدأ رحلتك» → Habit Setup. Returning users: continues to the oasis automatically (tap to skip).
- If the scene can't load within 5 seconds, a native title and button appear so nobody is stuck.

## Home (`src/screens/SiragHome.tsx`)
- **Hero:** the user's own oasis, alive (water, wind, animals they have unlocked), with a greeting and an «ادخل واحتك» card showing plants grown and residents. Tapping anywhere on it opens the oasis.
- **Next prayer card:** the coming prayer, its time and a countdown, all five times with the next one highlighted, city, current location and calculation method (now in Arabic).
- **عاداتي اليوم:** same logging as before, cleaner layout, «تم ✓» when today's target is met.
- **Quick doors:** القرآن الكريم، صلواتي، إحصائياتي، واحتي. New bottom bar with drawn icons.
- IBM Plex Sans Arabic (already in `assets/fonts`) is now loaded app-wide.
- The old splash/home images are no longer used and no longer bundled; the files are still in `assets/sirag/`.

## Web preview
`src/oasis/WebViewCompat.web.tsx` lets the whole app run in a browser for design review: `npm run web:preview`.

## Verified here
TypeScript clean, 25/25 tests, iOS and Android bundles build, and the web build was walked through: splash → oasis → home, for a new user and for a user with a grown oasis.

## Needs a phone
Splash timing and smoothness, hero performance (it is a second live scene), fonts on Android, safe areas on notched phones.
