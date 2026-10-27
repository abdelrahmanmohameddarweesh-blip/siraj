# صحبة — private Quran journeys

Sohba adds private circles of up to ten people. Each journey lasts seven days. Each member chooses a fixed personal reading goal (1–604 confirmed pages/day) or listening goal (1–180 minutes/day); both activities can coexist in one circle. There are no rankings or public missed-prayer records.

## Included

- Homepage entry; night/dawn screens; create a named circle starting within the next seven days.
- Link the existing anonymous Firebase identity to email/password before creating or joining. Existing users can sign in, reset passwords and request email verification. Local worship records remain on the device; this is not cloud backup of those records.
- Cryptographically random 12-character invitation codes. The database stores a SHA-256 hash, not the readable code. Preview reveals the circle's invitation details only. Joining is transactional and capped at ten. Up to ten active journeys per account, with archived journeys retained.
- Per-member reading/listening goals, private exact quantities, optional named completion status, and aggregate completion counts. Aggregate counts necessarily reveal more in a very small circle; explain this before joining. Turning visibility off scrubs prior named statuses.
- Canonical tracker-based check-ins for the circle's current day, during the journey. Confirmed unique Quran pages and actual playback seconds are used; simply opening a screen contributes nothing. Reading is self-report and playback cannot establish attention. The client submits these values; this is not an anti-cheat system.
- Repeated syncs replace a daily record and adjust the aggregate by the change in completion. Goals stay fixed for the journey. Sync runs when opening/returning to a circle, when foregrounding it, every minute while it is open, and on explicit refresh. It does not run while the app is closed. No raw worship journal is uploaded automatically outside this check-in.
- Seven-day personal/aggregate calendar, preset encouragement (one current reaction per person/day, throttled to one change/minute), personal completion card and sharing. Celebration shares only your own participation days, never other members' names or records. Exact personal totals appear separately in the private screen.
- Creator can reset invites and remove members. Removal revokes the current invitation to prevent immediate rejoining; generate a new code for future invitations. Members can leave; their shared contributions, private circle day records and encouragement are removed. Creator departure transfers ownership. Local worship logs are untouched.
- Member-only reports stored privately for administrators. Administrators must monitor `sohbaReports` in Firebase Console; there is no staffed or automatic moderation service included.
- Optional personal reminders and aggregate summaries via scheduled Firebase Function and Expo Push. Defaults off. Settings are member-private; one device token per circle membership. No reminders if the journey is inactive. A personal reminder alone is skipped after completion. One combined summary message is sent when summaries are enabled.
- Hosted, responsive Arabic invitation page with copy-code and installed-app link. Store links are intentionally absent until real listings exist. Install does not automatically preserve the invitation: the code is the explicit fallback. No deferred deep-link vendor is configured.

## Required Firebase activation — not deployed automatically

The repository contains the implementation, but live multi-device circles require these steps in the existing **batal-moslem** project. A project owner must perform them; no authenticated Firebase deployment session is available in the coding environment.

1. Firebase Console → Authentication → Sign-in methods: enable **Anonymous** and **Email/Password**. Check the authorized domains and email action templates. Anonymous profile onboarding continues to work; durable circle membership requires linking/sign-in.
2. Create the Firestore database if absent. The existing `firestore.rules` now includes member-only circle access. All circle writes use Admin SDK callable functions. Clients cannot read invitation lookup records, moderation reports, rate limits, another member's goals, notification token or exact amounts.
3. Enable the **Blaze billing plan**, which is needed for Cloud Functions/Cloud Scheduler. Review Firebase budgets/alerts. The reminder job runs every 15 minutes and reads active circles/members; there will be usage costs. App Check enforcement is not enabled in this first version; configure a native/web App Check provider and enforce it before broad public promotion. There are authenticated per-account create/join/preview/report rate limits, not a comprehensive abuse-prevention service.
4. In Terminal, enter `sirag 29 updated` and run:

   ```sh
   npm ci
   npm ci --prefix functions
   npx firebase-tools login
   npx firebase-tools deploy --project batal-moslem --only firestore:rules,functions:sohba,hosting
   ```

   Review the complete existing rules before deployment: legacy leaderboard/community/quiz policies are still present and have not been redesigned by this feature. Functions use Node 22 and region `europe-west1`.

5. For HTTPS invitations, add `EXPO_PUBLIC_INVITE_BASE_URL=https://batal-moslem.web.app` to your local `.env` and restart Expo with `--clear`. Only use this URL once Hosting deployment succeeds. Without it, invitations contain a code and `sirag://sohba?code=...`, which works in an installed native build, not an uninstalled app. Expo Go testers enter the code inside the screen.
6. When store listings exist, put their HTTPS URLs in `invitation-site/config.js` and redeploy Hosting. Until then, recipients must obtain the test build from the inviter.
7. Link an EAS project and generate a native build for push. Expo Go can test circle screens, create/join and sync after backend activation, but **cannot validate this remote push feature**. A native build supplies the EAS project ID and Expo push token. Each member opts in and grants OS permission. Delivery can be delayed by OS/network conditions; reminders are best effort within the selected quarter-hour window. Device credentials must be configured with EAS. Disabling both toggles clears the token for that membership. Notification taps route to the circle with profile gating.
8. Test with two distinct email accounts on separate devices. Create → invite → preview → join → confirm Quran pages or play audio → return to the circle → verify the aggregate. Repeated refresh must not increase it. Check privacy, invite rotation, removal and leave. Test notification permission denial and a real native push separately.

## Local tests

```sh
npm test
npm test --prefix functions
npx tsc --noEmit
```

The backend transaction tests execute the actual exported callable handlers with a serial in-memory transaction adapter. They check membership permissions, linked-account requirements, capacity under concurrent joins, idempotence, corrections, mixed units, privacy scrubbing, invite rotation, leave/ownership and reporting. They are not a substitute for Firestore rules emulator validation.

For real Firebase transport and rules tests, install Java 21+, then:

```sh
npx firebase-tools emulators:exec --project demo-siraj --only auth,firestore,functions "node --test functions/test/emulator.test.js"
```

For an app pointed only at emulators, set `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` to the development machine's IP, start the emulators and restart Expo. This switches the app's Firebase project ID to `demo-siraj`, never the live project. Leave it unset for normal builds. Physical phones need emulator hosts bound to the LAN interface; use trusted local networks only.

The cloud execution environment blocked the Google Storage emulator JAR download, so the emulator integration tests are included but have not run here. Browser interaction captures use an injected test service and sample member data; they do not demonstrate a deployed live database. Real Firebase activation, physical-device push delivery and native deep links remain release checks.

## Screen gallery

[View Night, Dawn, journey, companion and invitation screens](SOHBA-PREVIEW.md).
