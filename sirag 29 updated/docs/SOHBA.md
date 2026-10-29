# صحبة — Firebase Spark edition (no billing account)

This version replaces the earlier Cloud Functions implementation. **Keep `batal-moslem` on Spark. Do not upgrade to Blaze or attach a payment method.** The app uses Firebase Anonymous Authentication and Firestore's Spark quotas directly. The deployment configuration contains no Functions target, and there are no scheduled cloud jobs or remote push tokens.

Under Spark's current terms, exceeding a free service quota can stop that service until the quota resets. This is a capacity limit, not a reason to enable billing. These statements concern this Firebase project; phone/internet access and optional future app-store publishing are separate choices. There is no automatic upgrade or payment flow in Siraj.

## What works without a paid backend

- Create configurable habit circles without email. An existing anonymous identity is used; optional email linking preserves access after changing phones or reinstalling.
- Choose 2–30 members, 1–90 inclusive days, the habit and daily target, and name/progress/completed/pending visibility. Habits include Quran reading/listening, Salah, morning/evening Athkar, Hifz/review and custom habits.
- Direct code joining, invitation reset, member removal and ownership transfer. A valid invitation and a transactional capacity check are required to join. Leaving/removal invalidates old invitation versions. The creator can generate a new invitation afterward.
- Current-day canonical tracker progress and explicit custom-habit totals. Repeated unchanged updates perform no writes. Corrections replace a daily record and do not duplicate completion. Exact personal quantities remain in member-private records.
- Realtime circle progress, encouragement and private moderation reports. Reports are stored for the project owner to review in `sparkReports`; no staffed moderation service is provided.
- Local phone reminders, scheduled on the device. No server, Expo push token or EAS project ID is required for these reminders. Expo Go local notification support depends on the platform/version, but remote-push development builds are not required by this feature.

Automatic cloud group-summary notifications have been removed. Their switch is no longer shown.

## Activate the free version on your Mac

Anonymous sign-in is already enabled according to the screenshot supplied by the owner. The public Firebase configuration has been corrected from the owner's console.

1. Download the latest project and open **sirag 29 updated**. The original `sirag 29` is not modified.
2. Stop Expo with Control+C if it is running in that Terminal.
3. Run, one command at a time:

   ```sh
   npm ci
   npx firebase-tools login
   npx firebase-tools deploy --project batal-moslem --only firestore:rules
   ```

   **Do not run the old command containing `functions:sohba`.** There is no `functions` folder or Functions target in this release. Rules deployment uses Spark and does not require Cloud Build/Cloud Functions APIs. If a command unexpectedly asks for billing, stop and send its complete output; do not upgrade.

4. Wait for **Deploy complete!**, then:

   ```sh
   npx expo start --clear
   ```

5. Reopen Expo Go and scan the new QR. Create a circle, copy its code, then join from a second phone with a different app identity. Test a tracker completion, privacy changes and a repeated refresh.

No cloud data from the blocked paid deployment is migrated automatically. The new records use `sparkCircles`, `sparkAccounts`, `sparkInvites` and `sparkReports`. Existing personal profiles and local worship logs are retained. The earlier Functions deployment did not complete in the provided Terminal output.

## Rules and privacy

Circle metadata is unlisted: authenticated direct gets require knowing a random circle ID, and collection browsing is denied. This metadata includes the circle name, habit/settings and anonymous membership IDs/ordinal aliases. It contains no real member names, private quantities or shareable invitation secret. Possessing an old circle ID does not bypass invitation revocation or grant access to progress.

Sensitive data is split into member-only private records and separate name, contribution, completion, pending and percentage collections. Rules gate each public collection against membership and the creator's current settings. A creator hiding names/progress denies new reads immediately without a paid server rewriting other people's private data. Turning off personal name/status sharing deletes the corresponding public records in the same transaction. Raw names never appear in encouragement records: the client resolves currently permitted names or stable aliases.

Member counts are changed transactionally. Join rules require a current invitation version and an atomic private membership record, and enforce the cap. Private progress changes affect one bounded recent journey day. Contributions must equal the member's validated completion map; shared statuses and percentages must match their private maps. No client can submit activity for another member. Tracker records remain self-reported; there is no server anti-cheat or verification of attention.

Legacy leaderboard/community/quiz rules are retained and have not been redesigned as part of circles. Review those policies before making those separate features public.

## Free-quota use

Snapshots update an in-memory detail cache, so a visible circle does not refetch every member's history for each change. Unchanged tracker updates are skipped before a transaction. Private day histories are stored together in one record per member; circles last at most 90 days. The pending/completion/percentage collections are queried only when visible. Reactions keep one latest record per member, avoiding an unbounded chat feed.

Quotas are finite and shared with the rest of this Firebase project. Larger groups and many simultaneous circles can reach Spark limits. The UI reports the free-limit error and allows retry later; it never enables billing. Firestore's free tier currently includes one eligible free database per project; keep using the existing default database.

## Local reminders

Reminders use phone-local time and stop after the configured end date. At most three future alerts per circle are scheduled, subject to the device's shared pending-notification budget. Open the circle daily to refill; force-quitting the app for several days prevents refill. Reminders cannot query closed-app group activity, so they may still arrive after a goal is completed. OS permission, Focus, silent settings and battery restrictions can delay or suppress delivery. Leaving a circle cancels that phone's circle alerts. No remote group summaries are generated.

## Links and the optional free invitation webpage

Code entry works in Expo Go. For a free webpage containing the copyable code, optionally deploy Hosting:

```sh
npx firebase-tools deploy --project batal-moslem --only hosting
```

Set `EXPO_PUBLIC_INVITE_BASE_URL=https://batal-moslem.web.app` only after Hosting succeeds. It provides `/join?code=...` and an installed-app scheme link. The committed app-store links are empty; no store listing or paid publishing is required to test through Expo Go.

OS-verified HTTPS links still require an independently signed native build and the real signing identifiers. `app.config.js` and `scripts/configure-sohba-links.cjs` retain support for future use. This free Expo Go workflow does not require purchasing a native build or developer membership. It uses copyable invitation codes instead. Installation does not automatically preserve a pending invite; the code is the fallback.

## Validation and release checks

```sh
npm test
npx tsc --noEmit
```

Tests exercise the actual Spark business-logic core with a serial transactional adapter, including capacity, idempotent progress, corrections, privacy projections, invitation revocation, ownership transfer and units. Browser checks verify the app route and no-email creation/join screens. Platform export source maps verify that the Functions SDK is no longer in the app bundles, and configuration checks verify that there is no Functions deployment target.

Firebase emulator integration tests are provided separately. They require Java 21+ and emulator downloads, without any billing account:

```sh
npx firebase-tools emulators:exec --project demo-siraj --only auth,firestore "npx tsx --test test/spark.emulator.test.ts"
```

The cloud environment blocks Google's emulator JAR download, so actual rules compilation and authorization have **not** been verified there. The owner's free rules deployment performs real compilation; two-device and physical notification checks remain required before a public release.

[Screen gallery](SOHBA-PREVIEW.md).
