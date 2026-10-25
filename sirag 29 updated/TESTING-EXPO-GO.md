# Test the updated Sirag app with Expo Go

This copy uses Expo SDK 58 for the current iPhone Expo Go app. The sibling `sirag 29` folder remains on SDK 57.

1. Use Node.js 24 LTS (Node 24.19.0 was used for validation).
2. Extract the downloaded project ZIP. This updated folder includes the original assets, scripts and prototype; no files need to be copied from another project.
3. In Terminal, type `cd `, drag this `sirag 29 updated` folder from Finder into Terminal, and press Return.
4. Run `npm ci` and wait for it to succeed.
5. Run `npx expo start --clear`.
6. Connect your Mac and iPhone to the same Wi-Fi and scan the QR code using the iPhone Camera app. Open it in Expo Go for SDK 58.
7. If the local connection fails, stop Expo with Control+C and run `npx expo start --tunnel`.

The first launch shows “ابدأ رحلتك”. Returning users continue automatically after about 2.8 seconds. To see the first-time state without altering your regular app data, use the browser preview in a private window (`npm run web`).

SDK migration notes: Expo native dependencies, React, React Native and Babel preset match SDK 58. Removed obsolete StatusBar background/translucency props for React Native 0.88 and supplied WebView's explicit props generic for its current TypeScript declarations.

Cloud validation: Expo resolves SDK 58.0.0, TypeScript passes, all 54 tests pass, and full iOS, Android and web exports succeed with the supplied fonts and audio. Device testing is still needed for appearance, camera, notifications, audio and navigation. Remote push notifications and custom native notification sounds require a development build where Expo Go does not support them.


## New profile, reminders and reports

The splash uses the bundled Aref Ruqaa font and has no English subtitle. After continuing, a missing profile opens the required name/gender form. The profile saves on-device first and syncs privately to Firebase when available. See `FIREBASE-AND-NOTIFICATIONS.md` for the required Firebase console setup; a pending sync is shown honestly in Reports.

Home → **تنبيهات الصلاة** configures before/at/after reminders for each prayer. Home → **إحصائياتي** shows 7/30-day reports, daily detail, profile editing and sync status. Selecting the prayer habit opens reminder customization.

For a clean first-time test on web use a private browser window. For an existing phone install, do not clear app storage unless you accept losing local worship history; missing profiles are requested automatically. Prayer data, Athkar, confirmed pages, listening and Hifz are preserved under the existing storage keys.

Checks run on this update: TypeScript; 54 unit/regression tests; full iOS, Android and web exports; browser checks of splash/profile validation and persistence, returning-user home, reports, profile editing and reminder persistence, prayer confirmation, Athkar counting and unique Quran page confirmation. Firebase requests are blocked in browser tests, so no test users or fake personal data are written to the live database. Custom adhan delivery and sound still require a signed native-device test.
