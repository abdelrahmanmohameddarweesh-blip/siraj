# Siraj Android / Google Play release preparation

## Current state — not published

The owner has an existing Play developer account, so this workflow does not need another registration. Support/privacy email: `abdelrahman.mohamed.darweesh@gmail.com`. The existing Play Console developer display name has not been changed.

Prepared in source:

- App name `Siraj | سراج`, version `1.0.0`, initial Android versionCode `1`.
- Android package `com.sirag.livingdesert`. Confirm this before the first upload; a published app's package is permanent. If it already exists in your Play Console, keep its existing signing/upload-key setup and increment its version code.
- Original generated lantern icon and a 512×512 Play icon export; 1024×500 feature graphic.
- `play-internal` / `production` EAS profiles produce an Android App Bundle (.aab). They use remote build-number increments. Both currently keep ads off.
- A separate APK `preview` profile remains available for adult developer testing, with Google test rewarded ads. No live ad serving is approved.
- In-app account/data deletion with an interrupted-deletion checkpoint, cloud-sync blocking and device/context reset; private/profile/report rules adjusted for owner deletion.
- Public privacy, account-deletion and support pages, plus Arabic/English listing drafts.
- Unused Android camera, microphone, activity recognition, background location and broad media/storage permissions blocked. Advertising-ID permission is blocked for the family target. Foreground prayer location, notifications, exact-alarm access and foreground audio playback need their applicable current Play declarations.

**No signed APK/AAB has been built, no Play Console app has been created here, no policy page has been deployed, and no release has been uploaded/submitted.** This environment has neither an authenticated Expo session nor an Android SDK/signing setup. JavaScript exports are not a Play upload artifact.

## Blocking audience decision

The owner selected **children and families, including under 13**. This makes the current full app's cloud profiles, optional email linking and religious-activity circle sharing a release blocker until an appropriate child privacy/parental-consent and sharing design is completed. SDK child-directed flags do not establish consent for those features.

The owner has been asked to choose:

1. A family-safe first public release with local worship tracking/Quran/Hifz/oasis, keeping ads, accounts and online circles off until the child-specific setup is ready; or
2. Keep the full feature set and delay public release while parental consent, child privacy and sharing safeguards are completed.

`release.config.json` currently records `releaseScope: pending-parental-scope` and `ownerReleaseApproved: false`. `npm run play:public-check` intentionally fails until this is resolved. Do not bypass that by choosing a false adult audience in Play Console. The current working source is not yet a family-local build just because ads are off.

The native ad provider now applies child-directed treatment, under-age consent flags, NPA, G rating and a live-ad approval guard. Verify the actual native Google Mobile Ads SDK/version against the current Families self-certified SDK list before any eventual live ads. The earlier AdMob test offers are not permission to monetize a child-targeted release without that review.

## Local package checks

```sh
npm ci
npm test
npx tsc --noEmit
npm run play:check
```

The package check verifies local configuration/asset dimensions. It does not prove native behavior, Google policy compliance or a live Firebase deployment. `test/spark.emulator.test.ts` is still unrun in the cloud environment because the emulator download is blocked; perform real rules and two-device/deletion tests before public release.

## Free Firebase deployment

Use only Spark. No Cloud Functions or paid Firebase jobs are included.

```sh
npx firebase-tools login
npx firebase-tools deploy --project batal-moslem --only firestore:rules,hosting
```

Review the privacy pages and finalize the release scope **before** publishing them. The current pages describe the full implementation and must be revised for a family-local build if selected. After deployment, open the actual URLs in a private browser window (no login):

- `https://batal-moslem.web.app/privacy`
- `https://batal-moslem.web.app/delete-account`
- `https://batal-moslem.web.app/support`

Set the website to this domain in Play Console only after those pages are actually accessible. No `app-ads.txt` ownership file has been claimed or published; verify domain ownership/AdMob instructions separately if monetization is later enabled.

## Signed build on your Mac — after the audience scope is resolved

You need an Expo account to use EAS; this is separate from the Google Play account. A free Expo account may include build quota, but quota/pricing/queue rules can change. Do not authorize a paid plan or paid build; check the account's free allowance. If unavailable, wait for free quota or build locally with Android Studio instead.

Inside the latest `sirag 29 updated` folder:

```sh
npx eas-cli login
npx eas-cli init
```

Sign in privately on your Mac. Never paste passwords, access tokens, keystores or service-account JSON into this chat. If `eas init` says it cannot edit a dynamic config, send only its public project UUID/output. `EXPO_PUBLIC_EAS_PROJECT_ID` is supported by `app.config.js`; the assistant can add the public UUID for you.

For a reviewable Play internal-test bundle:

```sh
npx eas-cli build --platform android --profile play-internal
```

If this is genuinely Siraj's first Android signing key, EAS can generate/manage the upload keystore when you authorize that in its CLI. If this package is already published, use its existing upload key/Play signing process. Back up signing credentials privately. A source ZIP, Expo QR code or JavaScript export cannot be uploaded as an AAB.

A local native build needs Android Studio/SDK, Java and appropriate signing; this environment does not have the Android toolchain. No remote build was started from here.

## Play Console sequence

After scope/policies and native testing are ready:

1. Create the Play app with its final name, correct audience and free distribution. Follow the Console's current required sections; developer verification can be required even for an existing account.
2. Add the reviewed listing drafts, `store-listing/icon-512.png`, feature graphic and at least two **actual installed Android** screenshots. Existing browser/concept images are not native-release evidence.
3. Provide the verified privacy/deletion/support URLs and the public support email.
4. Complete Data Safety, ads, target-audience, content-rating, app-access and applicable foreground-service/alarms declarations from the real release behavior. `store-listing/DATA-SAFETY-DRAFT.md` is a working inventory, not pre-approved answers.
5. Create an **Internal testing** release and manually upload the first signed AAB. The first upload commonly needs Play Console UI setup before automated submission can work.
6. Install from its test link and verify startup, notifications, Quran playback, tracking, privacy/deletion, circle behavior if allowed, offline/error cases and advertising behavior matching the selected scope.
7. Follow any closed-testing/production-access requirement shown by the account. Some newer personal accounts require a closed test (commonly 12 opted-in testers for 14 consecutive days); the Console's current requirement is authoritative.
8. Only after owner review and actual tests, create/review the production release and submit it to Google. Google review determines availability; the assistant cannot guarantee approval or timing.

`eas.json` submission settings are restricted to the **internal** track with **draft** status, not an automatic public production rollout. No submission command has been executed.

## Owner review before public submission

- Decide the under-13 release scope and implement it.
- Test a signed native Android build on devices, including account deletion and interrupted deletion if account features remain.
- Verify Firebase rules and actual public legal URLs. Review support/deletion request handling and privacy copy; the support inbox must be monitored.
- Verify the current target API/SDK requirement in Play Console against the actual generated AAB; do not assume a JavaScript export proves it.
- Confirm Quran/audio/content rights and the supplied font/adhan licenses. The bundled adhan is documented as CC0 in `assets/sounds/ATHAN_LICENSE.md`; listen to both short/full files before release. External recitation services' current terms need review.
- Approve final listing art/text and accurate data declarations. No medical claims or guaranteed religious outcomes are made.
- Do not enable live ads until child policy/consent/SDK requirements and native behavior have been reviewed.
