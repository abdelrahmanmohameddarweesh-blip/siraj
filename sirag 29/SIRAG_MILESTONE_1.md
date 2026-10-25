# Sirag — playable desert milestone 1

This is a focused adaptation of the earlier Oasis Quest & Build MVP. The home screen now presents Sirag branding, a direct link to the playable Sand World, the five daily prayers in explicit Fajr → Dhuhr → Asr → Maghrib → Isha order, and worship shortcuts.

The Sand World supports selecting a habit, daily self-confirmation, touch-based planting/care, persistent plants, and oasis item placement. The legacy modules and navigation are retained in this milestone to avoid breaking existing dependencies; they are **not** the intended final Sirag scope. The desert uses its existing WebView scene, not a newly built native 3D engine.

Run: `npm ci` then `npx expo start --android`. Test on a physical Android device. Prayer times are computed using the app's existing prayer configuration and city selection; check location, calculation method, and timezone. No religious activity is independently verified.
