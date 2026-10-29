# Optional rewarded ads in Siraj

Rewarded advertising is limited to the oasis. It does not require Firebase Functions, Blaze or a billing account, and the free Spark circle implementation remains unchanged. AdMob is a publisher monetization service; no Google Ads advertising campaign or paid backend is created by this code.

## Implemented placements

| Placement | Where it appears | In-app reward |
| --- | --- | --- |
| `seed` | Plant picker footer; empty plot or seed bag when out of seeds | One extra seed, then choose and plant normally |
| `water` | Growing plant or watering can when out of water | Two water drops |
| `gift` | Gift button in the oasis header | One seed and one water drop |

Every offer is explicitly optional and includes “المتابعة دون إعلان”. Ordinary habit-based seeds/water and all worship features remain available without watching an ad. No interstitial, automatic launch ad, banner or ad is inserted in Quran reading/listening, Salah, Athkar, Hifz, reports or onboarding. The garden is the first release's monetization area. A future purely decorative plant catalog could offer more optional cosmetic unlocks; it is not implemented here.

A rewarded advertisement can be video or an interactive format supplied by AdMob. The app labels it an advertisement, promises the exact garden resource, and waits for the SDK's `EARNED_REWARD` event. Loading, a timer, a WebView message or closing early never grants a reward. Duplicate SDK events cannot duplicate a grant. The reward changes seeds/water only—not worship completion, habit streaks, prayer points, lanterns or participation days.

There is one claim per placement per local day, three total claims/day and a two-minute gap between rewarded claims. These limits are local per installation, not server-enforced anti-fraud. Reinstalling or changing the device clock can affect them. Rewards are digital garden items with no cash or transferable monetary value.

## Supplied AdMob configuration

The owner's screenshot confirms these **Android** values, now included in `ads.config.json`:

- App ID: `ca-app-pub-6157287197742359~2477114700`
- Rewarded Ad Unit ID: `ca-app-pub-6157287197742359/9388018310`

They are used for the Android native app registration and live-release configuration. Development still uses Google's test rewarded unit; release ads remain off unless explicitly enabled. Platform environment variables can override this file.

No iOS IDs have been confirmed, so iOS live requests stay disabled. The earlier ID `ca-app-pub-6157287197742359~8744745472` was not assigned to a platform because its platform/ownership was not confirmed. Android IDs must not be reused for iOS.

## Create Siraj in AdMob

1. Open https://apps.admob.com/ → Apps → Add app.
2. Select iOS for the iPhone edition, or Android for Android. Each platform needs its own app entry and IDs.
3. If Siraj is unpublished, choose No when asked whether it is listed in a supported store.
4. Name it `Siraj | سراج`. If requested, use `com.sirag.livingdesert` as the package/bundle identifier.
5. Create the app. Save its App ID containing `~`.
6. Open Ad units → Add ad unit → **Rewarded** (not rewarded interstitial). Name it `Oasis Reward`.
7. Configure reward amount `1`, type `oasis_bonus`. One “bonus” corresponds to the explicitly displayed seed/water pack chosen in the app.
8. Save the Ad Unit ID containing `/`. App IDs and Ad Unit IDs are public settings, not passwords or service-account credentials.

A not-yet-published app may have limited live serving. Follow current AdMob app-readiness, store verification/app-ads.txt and privacy-message requirements before a live release. The app does not create store listings, app-ads.txt verification or account approvals automatically.

## Test configuration

The package uses `react-native-google-mobile-ads` 17.4.0, which declares React Native >=0.86 support; Siraj uses RN 0.88/Expo 58. Native app IDs are inserted through the Expo config plugin. Unset app IDs use Google's official sample IDs to keep native test builds valid.

- Development native builds always use `TestIds.REWARDED`, even if someone sets live IDs.
- Release builds default to ads **off**.
- A release-style preview must explicitly set `EXPO_PUBLIC_ADS_MODE=test` to show Google test ads.
- `live` requires both an own-platform App ID and Rewarded Ad Unit ID, and rejects Google's sample publisher IDs.
- Expo Go and web never load the native ad SDK or grant a simulated video reward. Expo Go development can show the offer design with a disabled Watch button and a clear explanation. Normal gardening still works.

Example local `.env` for native test builds:

```dotenv
EXPO_PUBLIC_ADS_MODE=test
# Put your own public IDs here once the platform is confirmed.
EXPO_PUBLIC_ADMOB_IOS_APP_ID=
EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID=
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=
EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID=
```

Actual rewarded ads require a **new native build**, not `npx expo start` inside Expo Go. A local Android build can use `npx expo run:android` with Android Studio/SDK installed. Local iOS builds use Xcode with `npx expo run:ios` and the required signing setup. No build, paid EAS plan or store publishing purchase has been started from this workspace. Platform developer-account/store fees are separate from Firebase Spark and are not required for the existing Expo Go feature preview.

To enable live ads later, supply the correct platform IDs and use `EXPO_PUBLIC_ADS_MODE=live` in a release build. Do not test by viewing/clicking your own live ads. Native App IDs are build-time settings; changing them needs rebuilding the binary.

## Consent and content

The native provider refreshes Google's UMP consent flow after the user asks to watch and before initializing/requesting an ad. If UMP cannot request ads, the offer fails closed and grants nothing. Its privacy-options action is available from the offer sheet where applicable. Configure the relevant Privacy & messaging forms in AdMob; missing account/message setup can prevent even a native test request.

Requests use non-personalized ads, disabled publisher personalization and maximum content rating G. The app sends no name, gender, prayer records, habit history, Firebase UID or precise location as ad targeting. Google SDK device processing is still governed by its consent/privacy mechanisms; non-personalized is not a claim of zero data processing. The owner must classify the app's intended audience accurately in AdMob; this change does not assert a child-directed or adult-only audience.

Use AdMob Blocking controls for categories unsuitable for Siraj, such as alcohol, gambling and dating, and review the ad-review center. A G rating cannot guarantee every advertiser will fit the app's cultural/religious expectations. No guarantee of ad availability, revenue or fill rate is made.

## Reward reliability

An earned SDK event is written to a separate durable local ledger before the garden receives its grant. The WebView's saved state is persisted before pending grants are acknowledged. On reopening/foregrounding, unacknowledged grants are retried with the same ID, and the scene's applied-ID list prevents duplicates. Normal garden saves are serialized; failed storage keeps the grant pending instead of silently discarding it. Ads never modify the canonical worship logs.

No remote server-side reward verification or ad-revenue analytics backend is included, keeping Firebase Spark sufficient for the app. The provider uses real SDK earning events in native builds; no countdown or test-screen simulation is presented as a watched ad.

## Validation

Unit tests cover reward-only resource grants, duplicate events, session mismatch, daily limits, cooldown, close-before-earning, load errors/timeouts, persistence failure and listener cleanup. TypeScript and platform exports are checked. Browser checks cover the native-bridge offer entry points and web preview's no-reward behavior.

Real ad fill, UMP forms, native SDK display, returning from a full-screen ad and physical-device persistence still need testing in an actual native build with the correct App ID. A native build has not been produced or published here. Existing Firebase rules/emulator validation limitations remain documented in `docs/SOHBA.md`.

[View the implemented offer screens](ADS-PREVIEW.md). Browser recovery tests use an explicit earned-grant storage fixture (not a watched advertisement) to verify state persistence before acknowledgement and no duplicated resources after restart.
