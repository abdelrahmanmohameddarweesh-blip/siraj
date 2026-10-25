# Sirag Milestone 10 — Choose or create a habit

Based on Milestone 7 (approved splash preserved byte-for-byte).

- Choose from five prayers, Quran, dhikr, morning/evening adhkar, dua, tasbeeh, reading, and kindness.
- Create a custom habit directly in the Living Desert bottom sheet.
- Names validated (3–40 chars), duplicates prevented, up to 12 custom definitions.
- Custom habit definitions persisted to AsyncStorage key `sirag-custom-habits-v1`.
- New habits create a plant in existing desert state; existing plants remain unchanged.
- Existing prototype limit: four planted habits total, with one growth stage per calendar day.
- Custom habit creation is available from the + button inside the desert.
- No changes to splash, homepage, analytics, or game rendering.

Run: `cd ~/Downloads/"sirag 10" && npm ci && npx tsc --noEmit && npx expo start --clear --port 8082`
