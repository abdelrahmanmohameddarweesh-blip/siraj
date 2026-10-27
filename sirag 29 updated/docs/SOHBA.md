# صحبة — configurable habit circles

**No email or password is required to create or join.** Siraj uses its existing persisted anonymous Firebase identity. Email linking is an optional recovery feature under “احفظ حسابي لاحقًا” and never a create/join gate. Without linking, changing phones or reinstalling can lose circle access. Linking preserves the same Firebase UID and memberships.

## Create your circle

- Name the circle and set its member limit: **2–30**, including the creator.
- Choose a habit: Quran reading, Quran listening, Salah, morning Athkar, evening Athkar, Hifz, Hifz review, or a custom habit with a custom name.
- Set a shared daily target. The target is applied automatically when someone joins; no goal form is required from invitees.
- Choose a start date within the next seven days and an explicit end date. Duration can be **1–90 days**, inclusive. Quick duration buttons offer 7, 14, 30, 60 or 90 days.
- Expand the privacy controls to choose independently:
  - Show real member names or stable aliases such as “رفيق 1”.
  - Show the group's aggregate completion count.
  - Show each member's progress percentage.
  - Show which members completed their daily goal.
  - Show which members have not completed it yet.
- Member percentages are withheld when their completed/pending category is hidden. Exact activity quantities are not published as raw public fields; choosing percentage sharing can still let companions infer quantities from a known shared target.
- Members can additionally hide their own name or status, even if the creator permits sharing. These personal preferences never override a creator's stricter setting.

The creator can change the circle name, capacity and visibility afterward. Capacity cannot drop below current membership. Visibility changes rebuild prior shared projections atomically; hidden names are also hidden in encouragement, including older messages. The habit, goal and dates stay fixed for that journey to preserve consistent expectations. Start a new circle for a different habit or schedule. Up to ten active circles per account are supported.

## Joining is one step

**Code:** open صحبة → انضم برمز → enter the code → انضم مباشرة. A pasted invitation URL works too. The backend assigns the circle's habit and goal, even if a modified client submits another goal. No email, password, preview step or goal selection is required.

**Installed-app invitation:** opening a supported invitation routes to صحبة and joins automatically once. Existing membership is returned without increasing the count. A missing profile name falls back to “رفيق”; the invitation flow does not require profile/email onboarding. Invalid, full, expired or revoked invitations show an error and permit retry. Members may leave immediately or change their personal privacy preferences.

HTTPS universal/app links require a domain associated with the signed native build, as described below. Expo Go does not own the `sirag://` scheme or the app's HTTPS domain; use code entry for Expo Go testing. Installing an app does not automatically preserve an invitation: the landing page's copyable code is the fallback.

## Progress and privacy

Tracked habits read Siraj's existing canonical logs: unique confirmed Quran pages, actual playback seconds, counted Salah statuses, completed Athkar sessions, learned verses or reviewed verses. Opening a screen creates no credit. Reading and Salah remain self-reported; playback cannot prove attention. Only the selected habit's quantities are retained in the private circle check-in. Custom habits have an explicit self-reported daily total; saving replaces that total, so repeated taps never multiply completion.

Sync runs on entering/returning to an open circle, on foregrounding it, every minute while open, and on explicit refresh. It does not run while the app is closed. A device/calendar mismatch prevents attributing the local journal to a different circle day. Custom habit totals are never overwritten by automatic tracker sync. Prior Quran circles and their legacy mixed personal goals remain readable.

A daily record is replaced and aggregate completion adjusted by the old/new difference. Raw circle amounts and device push tokens are readable only by the owning member. Shared companion documents contain only permitted aliases/statuses/percentages. Aggregate document reads are denied by Firestore rules when the creator hides aggregate progress. The encouragement feed is served through a membership-checked function using the **current** public names, so legacy stored names cannot leak through old messages. A small circle's aggregate may naturally imply another member's contribution; choose hidden aggregate mode when needed.

Other features include a duration-aware calendar, preset encouragement, personal celebration sharing, private reports, invitation rotation, removing members, and leaving. Removal revokes the current invite; creator departure transfers ownership. Leaving removes that member's shared contributions and circle day records without deleting their local worship journal. Administrators must monitor `sohbaReports` in Firebase Console; no staffed moderation service is included.

## Firebase activation / update

This code is implemented but the backend has **not been deployed from this workspace**: there is no Firebase deployment login. Real multi-device circles require activating/updating the existing **batal-moslem** project. If an earlier backend was deployed, redeploy both functions and rules: it still enforces the old email requirement and lacks the new feed/settings functions.

1. Firebase Console → Authentication → Sign-in methods: enable **Anonymous**. Enable **Email/Password** only if you want optional recovery linking. Check authorized domains and email templates for that optional feature.
2. Create Firestore if needed. Review the complete `firestore.rules` before deployment; legacy community/leaderboard/quiz policies are retained. Circle writes use authenticated Admin SDK callable functions. No anonymous user can access another circle merely by being signed in; membership or a valid invitation is still required.
3. Functions and scheduled notifications require Firebase's **Blaze billing plan**. Configure budgets/alerts. The 15-minute reminder job reads active circles/members and incurs usage costs. There are per-account creation/join/preview/report rate limits. App Check is not enforced in this version; configure native/web providers and enforcement before broad promotion.
4. In `sirag 29 updated`, run:

   ```sh
   npm ci
   npm ci --prefix functions
   npx firebase-tools login
   npx firebase-tools deploy --project batal-moslem --only firestore:rules,functions:sohba,hosting
   ```

   Functions use Node 22 and `europe-west1`. No client-held admin credential is used.

5. If Hosting succeeds, set `EXPO_PUBLIC_INVITE_BASE_URL=https://batal-moslem.web.app` in local `.env`, then restart Expo with `--clear`. Without it, sharing includes the installed-app scheme and a code. Hosting serves the invitation page at `/` and `/join`; it is separate from the Expo web app so it cannot replace Expo's root HTML.

## Direct HTTPS links on installed phones

`app.config.js` adds the configured HTTPS host to iOS associated domains and Android verified intent filters. Domain verification also needs the actual signing identifiers:

1. In local `.env` (or exported shell variables), set `SIRAJ_APPLE_TEAM_ID` to the ten-character Apple Developer team ID, and `SIRAJ_ANDROID_SHA256_FINGERPRINTS` to the release signing certificate SHA-256 fingerprints, comma-separated. These identifiers are public, not passwords or private keys.
2. Run `node scripts/configure-sohba-links.cjs`. This generates `invitation-site/.well-known/apple-app-site-association` and `assetlinks.json`. The committed files are intentionally empty until real signing IDs are supplied; they do not claim a verified domain yet. For Google Play use the **app signing** certificate, not just the upload certificate.
3. Deploy Hosting again and make a **new native build** with the same `EXPO_PUBLIC_INVITE_BASE_URL` configured. Install it. Build-time associated-domain settings cannot be added to an old installed binary through a JavaScript update.
4. Test a link received through Messages/WhatsApp on each platform. The OS should open the circle directly; the app automatically joins using the code. Platform/browser settings can still open a website instead, where “افتح الدعوة في سراج” and the code remain available.
5. Add actual app-store URLs to `invitation-site/config.js` only once listings exist. Until then the invitation page asks the recipient to obtain the test build from the inviter. There is no deferred-link provider or published store build in this change.

## Optional reminders

Each member may opt into personal reminders and/or a daily group summary. Defaults are off. A native EAS build with configured push credentials/project ID is required; Expo Go and browsers do not validate remote push. The app requests OS permission and stores one device token per membership. Notifications are best effort within the first 15 minutes **after** the chosen local time, including midnight rollover. Completed personal goals suppress personal reminders; a summary can still be delivered if opted in. Hiding group aggregate progress suppresses aggregate summaries as well. No individual misses or exact amounts are included in notifications. Taps open the circle.

## Verification

- App unit tests cover all habit sources, dates, goal validation, invitation parsing and trusted-link routing.
- Backend tests execute actual callable handlers with a serial transactional adapter: anonymous access, legacy goals, capacity/concurrent joins, current-day check-ins, corrections, custom totals, privacy projection, changes to prior records, anonymous encouragement feed, ownership and notifications.
- Browser UI checks use an injected test service and sample data. They cover no-email create/join, configurable habits/capacity/duration/privacy, settings edits, custom totals, direct code join, auto-joining an invitation once, both themes and narrow/wide layouts.
- Firebase transport/rules integration tests are included but **not run here**: Google Storage blocked the emulator JAR download. Physical-device notification delivery and OS-verified HTTPS links also remain release checks.

Run local tests:

```sh
npm test
npm test --prefix functions
npx tsc --noEmit
```

With Java 21+ and the emulators available:

```sh
npx firebase-tools emulators:exec --project demo-siraj --only auth,firestore,functions "node --test functions/test/emulator.test.js"
```

`EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` switches the app to `demo-siraj` and local emulators; leave it unset for normal builds. Use your machine's LAN IP and bind emulator hosts appropriately for physical-phone testing on a trusted network.

[View the screen gallery](SOHBA-PREVIEW.md).

## `auth/api-key-not-valid` while creating a circle

This is a Firebase app configuration failure, not a missing email/password. The original project's bundled key can be rejected if it was deleted, replaced, belongs to another project, or has unsuitable API/app restrictions. A new valid key cannot be guessed or repaired in app code.

The owner should open Firebase Console → batal-moslem → Project settings → General → Your apps → Web app → SDK setup and configuration → Config. Supply that current **public web app configuration** as a matching set. Do not supply a service-account JSON, password or private key. It can replace `src/firebase/config.ts` or be provided with the `EXPO_PUBLIC_FIREBASE_*` variables in `.env.example`; restart Expo with `--clear` after changing it. Then confirm Anonymous Auth is enabled and deploy the included backend/rules. A valid key alone does not deploy the circle service.

Failed actions now scroll back to their error and show a native alert. The primary button displays a busy label while awaiting the service. No circle is claimed to exist when authentication fails.
