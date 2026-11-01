# Prayer, Athkar, onboarding and ads update — 1 November 2026

## What changed

- Prayer reminder CTA is fixed above the bottom safe area, shows a busy state, reports permission denial and confirms the actual number of scheduled prayer requests. It waits for the scheduler rather than silently queuing an update. Web explains that notifications require the native app.
- Prayer reminder cards are collapsed summaries with their actual calculated clock times; expand one at a time. Time choices scroll horizontally, keeping 44-point touch targets.
- GPS detection is explicit in the tour/settings. Existing GPS users refresh on launch/foreground without another permission prompt; manual cities stay manual. Unknown locations no longer default their country/method to Egypt. Detection has a timeout; saving failures are not reported as success.
- Optional per-prayer calibration (−30 to +30 minutes) affects the same Adhan calculation used by the displayed times and reminders, including next-day Fajr. Method and Asr school remain selectable. The next-prayer clock now uses the actual next date's time.
- Android asks for exact-alarm access and uses alarm-clock delivery for the adhan. Other reminders remain best-effort. A status-bar alarm icon may appear. Android schedules up to seven days within a shared capacity; iOS retains a 60-request budget. Open the app daily to refill. OEM settings, permission revocation, silent mode, battery settings, DST and device clock still require physical-device tests; absolute delivery accuracy cannot be promised.
- Gentle/steady/strong prayer plan choices reset old timing overrides and control the same configuration as the reminder screen. The selected preset is reflected on existing prayer plans. Completed prayers cancel follow-up questions. Excused days suppress both required and optional prayer-habit reminders.
- Sunnah tracking records Fajr before (2), Dhuhr before (up to 4)/after (2), Maghrib after (2), and Isha after (2) separately. These are the selected twelve Rawatib, not every possible voluntary prayer. Replacing a record does not add duplicate rakats. Sunnah opens from a habit, the prayer page and the completed prayer check-in; Asr has no Rawatib row in this selection. A Sunnah reminder is anchored after the adhan, not before its time.
- Excused-day controls are available only with a female profile and checked again when saving. Days are local, not shared as a circle status. Prayer goals/reminders are excluded; no prayer completions or prayer points are fabricated. Other actually completed activities keep normal rewards. Existing earned rewards are not deducted. This is an app bookkeeping policy, not a statement about religious reward. Historical real prayer records are retained.
- Athkar text/audio taps no longer count repetitions. Only explicit counters or a confirmed full-count action record reading. Counters reset per local day/session; the screen notices midnight/foreground rollover. Corrections can reset one item or the selected session with confirmation. Atomic updates prevent time tracking from overwriting a repetition. Completion shown in reports/circles is derived from valid counts, not just a stale done flag. Old user counts are preserved until explicitly corrected; the app cannot infer which older taps were accidental.
- A six-step interactive tour links to real sections, has skip/back/next and replay from the profile menu. The practice dhikr counter does not create real reading credit.
- Two labelled native banner slots follow Athkar cards 4 and 10. Google test ads are used internally; production uses the owner's rewarded ad ID. The owner supplied Android banner unit `ca-app-pub-6157287197742359/1804274820`, now configured for production. See REWARDED-ADS.md. No ad credits worship.

## Phone-size browser previews

These are actual app screens in a 390×844 browser viewport with fixture data, not native ad or notification delivery evidence.

- [Compact reminders and fixed CTA](previews/prayer-reminders.png)
- [Separate Sunnah records](previews/sunnah-tracking.png)
- [Explicit Athkar counter](previews/athkar-counting.png)
- [Female excused-day state](previews/female-excused-day.png)
- [Interactive tour](previews/guided-tour.png)

## Validation and release

Verification: 93 tests passed, one existing Firebase emulator test skipped; TypeScript and Android/iOS/web exports passed. The browser interaction checks passed with zero JavaScript exceptions.

Unit tests cover independent Sunnah slots/corrections, stale Athkar completion, prayer calibration and rolling plans, reminder presets and excused-day reward behavior. Browser checks exercise real screens with cloud requests blocked. Android/iOS/web JavaScript exports and TypeScript checks do not substitute for a signed native test.

Build with the existing free EAS allowance:

```sh
npm ci
npx eas-cli build --platform android --profile play-internal
```

Keep the existing EAS project and upload key. Upload the new AAB to Internal testing and update through Play without erasing data. Verify location against a trusted local timetable, exact-alarm permission granted/denied, CTA counts, pre/adhan/follow-up timing and follow-up cancellation, background/silent-mode behavior, both profile genders, independent Rawatib corrections, Athkar scroll/audio/counter actions and midnight rollover, tour navigation, and actual test rewarded/banner ads. Expo Go cannot exercise native advertising or all notification behavior. Live production builds are a separate profile; complete Play/AdMob disclosures/readiness and do not click your own live ads. No Functions/Blaze or paid cloud service is added.
