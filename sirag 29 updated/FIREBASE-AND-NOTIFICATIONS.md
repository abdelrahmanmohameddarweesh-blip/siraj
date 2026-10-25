# Profile database and prayer notifications

## Existing Firebase project: batal-moslem

The app uses Firebase Authentication anonymous identities (persisted on the device) and Cloud Firestore. Names and gender are written only to `privateProfiles/{Firebase UID}`. Local profile storage completes first; a failed or offline cloud sync stays pending and retries when the app becomes active. Reports → Personal profile shows the real sync status and a retry button. No public leaderboard receives this data.

Before a cloud profile save can succeed, the project owner must:

1. Open Firebase Console and select **batal-moslem**.
2. In **Authentication → Sign-in method**, enable **Anonymous**.
3. In **Firestore Database**, create the database if it does not exist. Do not use publicly readable test rules.
4. Publish the `privateProfiles` rules in `firestore.rules`. They permit reads/writes only to the matching authenticated UID and validate the name and gender. The file also tightens legacy `/users` reads to the owner. Compare with any live rules before publishing so unrelated existing rules are preserved.
5. If using the Firebase CLI, authenticate with your account, then run `npx firebase-tools deploy --only firestore:rules --project batal-moslem` from this folder. The included `firebase.json` deploys only these rules.
6. Open the app, enter your name and gender, then open Reports and select **مزامنة الملف الآن**. Confirm the synced status and check your own `privateProfiles` document in Firebase Console.

This cloud workspace cannot reach the Firebase APIs through its current network proxy, and no Firebase administrator session is provided here. Live cloud writes and live rule deployment have not been verified or performed. UI tests block Firebase requests and never create fake production users. Do not describe a local-only save as a successful cloud sync.

Anonymous identity is installation-specific. This release does not offer account recovery or cross-device profile restore. Worship logs remain on the device; they are not uploaded by profile sync.

## Adhan and focused prayer reminders

Prayer announcements are **local scheduled notifications**, calculated on the phone using its chosen city, calculation method and madhab. A remote push server is not needed for these prayer alerts, and this release does not register remote-push tokens or send server-originated pushes.

Home → **تنبيهات الصلاة** opens independent settings for each prayer:
- Before the adhan: off, 5, 10, 15, 20, 30 or 60 minutes.
- At the adhan: notification on/off, with adhan sound on/off.
- After the adhan: off, 15, 20, 30, 35, 45, 60 or 90 minutes, asking whether the prayer was completed. This is a configurable estimate, not detection of the end of a mosque congregation.

Selecting the prayer habit opens these settings after saving. Confirming a prayer removes its pending follow-up after rescheduling. Tapping a follow-up opens the correct prayer and original date. Rest days suppress prayer reminders. The scheduler preserves other app notifications, reacts to sound/body changes and keeps within the iOS pending-notification capacity. A rolling three-day plan is refilled on foreground, date changes, location/settings changes and tracking updates; open the app daily. If the app is never opened again, notifications eventually stop rather than continuing indefinitely.

### Testing on a phone

Expo Go can preview the screens and some local-notification behavior. **Custom background adhan sound must be tested in a native build of Sirag**, because the sound asset must be bundled into the native app. A short (<30 s) `athan.wav` is configured for the notification; the full adhan plays only while the app is active. iOS does not allow an ordinary app notification to play the whole adhan in the background. Sound is subject to silent mode, Focus/Do Not Disturb and system settings. Android may require the user to allow exact alarms in system settings.

For an internally distributed native build, use your Expo/Apple/Google signing account and EAS build setup. The existing `preview` profile is suitable for a standalone internal build; iOS signing/provisioning is required. No signed device binary has been generated in this cloud workspace. From this folder, the owner can run:

```sh
npx eas-cli login
npx eas-cli build --platform ios --profile preview
```

Follow the signing/device-registration prompts with your Apple Developer account. Install the resulting Sirag build on the registered iPhone; this is separate from Expo Go.

Validation checklist:
1. Set the correct city/method; compare the next prayer time with a trusted local timetable.
2. Allow notifications; enable a pre-alert and a follow-up for the next prayer.
3. Test with the app foregrounded, backgrounded and locked; verify the appropriate short/full sound behavior.
4. Record that prayer; check its follow-up is cancelled and the report/habit count changes once.
5. Turn sound off; verify it stays silent on Android too. Disable the prayer; verify all three phases disappear on rescheduling.
6. Tap an earlier day's follow-up after midnight; it must record that original date, not today's prayer.

## Tracking and reports

Prayer records, Athkar sessions, confirmed Quran pages, measured playback and tested Hifz items are the sources of truth. Home reconciles habit values from these sources, including when a habit is added after the activity. Read pages are unique per local day. Listening excludes explicit seeks, buffering and paused time and splits at local midnight. Athkar taps use a current ref to avoid lost rapid taps; JSON writes serialize mutations. Hifz rejects empty/invalid scores and duplicate answers/passes. Some progress is self-reported: page completion, prayer status and recitation ratings cannot prove the act was performed.

Reports show 7/30 days, daily prayer detail, on-time/late/qada and congregation counts, rest days, morning/evening Athkar, pages, real listening duration, newly learned/reviewed verses, habit completion, a daily chart, shareable summaries and profile sync status. No activity is fabricated. Unrecorded prayers are labelled unrecorded, not missed. The report ring uses entered prayer times and excludes rest days.
