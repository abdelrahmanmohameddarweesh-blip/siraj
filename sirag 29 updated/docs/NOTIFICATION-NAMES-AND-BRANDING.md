# Notification names and naming recommendation — 1 November 2026

## Implemented personalization

Prayer pre-alerts, adhan notifications, prayer follow-ups and habit reminders use the locally saved chosen profile name in the message body, e.g. `عبدالرحمن، اضغط لتسجيل صلاتك.` Titles remain short and recognizable. Circle and garden reminders also use the name when scheduled. Missing names retain the original generic text. Control/bidirectional characters and line breaks are removed, whitespace is normalized and the displayed name is capped at 40 characters.

Prayer reminders → `اذكر اسمي في التنبيهات` turns personalization off without turning reminders off. The screen explains that the name may be visible on the lock screen. The OS ultimately controls notification previews. Changing a profile or the switch refreshes pending core reminders and already personalized garden/circle requests, preserving their original dates. Older generic garden/circle requests can stay generic until their normal refill; they contain no personal name. The preference is stored locally alongside notification settings, not as an analytics property. The existing private-profile synchronization remains unchanged; no new cloud database, server, billing or push service is introduced.

These are locally scheduled notifications; this change does not introduce a remotely operated marketing/push campaign system. A new signed app build is required. Native lock-screen display and pending-request replacement need a physical-device test.

## Research evidence and limits

Direct Google Play and publisher-site requests were blocked by the execution environment (HTTP tunnel 403). Therefore no current competitor listing title, localized Play title, download figure, ranking or conversion claim was verified. Familiar brands such as Muslim Pro and Athan are examples of recognizable short brands, not a newly verified comparison dataset.

One concrete source verified on 1 November 2026 is Quran Android's public repository:

- English Android app label: `Quran`, [source](https://github.com/quran/quran_android/blob/master/app/src/main/res/values/strings.xml), `app_name`.
- Arabic Android app label: `قرآن`, [source](https://github.com/quran/quran_android/blob/master/app/src/main/res/values-ar/strings.xml), `app_name`.

This demonstrates native-label localization in that app; it does not establish what its current Play listing title is.

## Recommendation, not an applied store rename

| Surface | Proposed name | Reason |
| --- | --- | --- |
| Arabic Google Play listing | `سراج: الصلاة والقرآن` (20 characters) | Arabic brand plus clear primary function |
| English Google Play listing | `Siraj: Prayer, Quran & Habits` (29 characters) | Consistent transliterated brand and understandable scope |
| Phone launcher | Short `سراج` for the current Arabic edition; optionally localize English devices to `Siraj` in a later approved branding update | Avoid a long bilingual label being truncated |

Google Play's known app-title limit is 30 characters; confirm its current field validation in Console. Add explicit Arabic/English store localizations so the listing language follows the user instead of giving every user the same combined text. Keep the package `com.sirag.livingdesert`, EAS project and signing key unchanged. Store text and native labels are independent. These titles are recommendations; this change does not rename the current `سراج` launcher or edit live Play Console metadata. Keep the existing short bilingual listing if only one listing can be maintained initially. No evidence here proves that any suggested title increases installs; evaluate actual search/visitor conversion after the listing is complete.

## Verification

Unit checks cover Arabic/English names, missing names, sanitization, opt-out, all prayer phases/habits, content replacement and preservation of scheduled instants/routing. Run `npm test`, `npx tsc --noEmit`, and an Expo export. Build with the existing `play-internal` profile and test opt-in/out on the actual phone before the next rollout. No paid build or service is started here.
