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
| Phone launcher | `سراج` on Arabic devices; `Siraj` on English devices (now implemented) | Avoid a long bilingual label being truncated |

Google Play's known app-title limit is 30 characters; confirm its current field validation in Console. Add explicit Arabic/English store localizations so the listing language follows the user instead of giving every user the same combined text. Keep the package `com.sirag.livingdesert`, EAS project and signing key unchanged. Store text and native labels are independent. The store titles remain recommendations and no live Play Console metadata was edited. The launcher now uses native localized resources: `Siraj` for English and `سراج` for Arabic, with English as the fallback for other languages. Keep the existing short bilingual listing if only one listing can be maintained initially. No evidence here proves that any suggested title increases installs; evaluate actual search/visitor conversion after the listing is complete.

## Verification

Unit checks cover Arabic/English names, missing names, sanitization, opt-out, all prayer phases/habits, content replacement and preservation of scheduled instants/routing. Run `npm test`, `npx tsc --noEmit`, and an Expo export. Build with the existing `play-internal` profile and test opt-in/out on the actual phone before the next rollout. No paid build or service is started here.

## Native label localization, implemented

`app.json` uses the English fallback `Siraj`, points to `locales/en.json` and `locales/ar.json`, and advertises English/Arabic through expo-localization. Android uses the localized `app_name` resource; iOS uses localized CFBundleDisplayName/CFBundleName. The icon artwork is unchanged. Package, bundle identifier, EAS project ID and signing credentials remain unchanged.

A native rebuild and Play update are required. The label follows the device's selected language preferences (or an applicable system app-language override), not the language in which the store listing happened to be opened. English fallback applies if no supported preferred language matches. Some launchers cache labels; reopening the launcher or restarting the phone may be needed after a language change. No reinstall/data clearing is required. In-app UI language preferences are managed separately; this metadata change does not claim to translate every screen.

In Play Console → Store presence → Main store listing → Manage translations, maintain Arabic and English listings. Use `سراج` in the Arabic title and `Siraj` in the English title (or the descriptive localized titles recommended above). Translate descriptions too. The existing default listing was created in Arabic; add an English translation rather than replacing its Arabic title for everyone. Save and submit listing changes through the Console's normal review workflow. Source changes cannot update live store metadata automatically.

Verification: isolated Android/iOS prebuild succeeded, generated English/Arabic native labels were checked, Android manifest uses the localized name resource, the supported-locales configuration contains both languages, and package/EAS identity and crash-recovery settings are preserved. A real device language-switch check remains required after the new build.

The English/Arabic listing draft files now use the short localized titles `Siraj` and `سراج`. The descriptive names above are optional alternatives. This still does not edit the live Play Console listing.
