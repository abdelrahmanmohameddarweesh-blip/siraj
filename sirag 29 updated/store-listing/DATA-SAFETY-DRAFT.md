# Data Safety / app-content working notes — not submitted answers

The owner confirmed an audience including children under 13. Public release is blocked until its feature scope and child-privacy approach are approved. Do not copy an adult app's declarations or label the app adult-only to avoid the actual audience requirements.

## Current full implementation (before a family-local scope is applied)

- Name and gender: local profile; the current full build synchronizes a private Firebase profile. These can be personal information. The profile and optional email flows need a child-appropriate redesign/consent approach before public under-13 use.
- Email/password: optional Firebase Auth linking. Firebase UID is an identifier. Anonymous Auth is also an online identifier; it is not equivalent to collecting no data.
- Religious activity: selected circle-habit quantities and completion/percentage are stored in Firestore and optionally shared within circles. Treat these as potentially sensitive religious/personal activity data and assess the applicable declaration categories accurately.
- Circle metadata/invites: unlisted name, settings and anonymous membership identifiers; a valid invite joins a circle. Circle reporting stores user-entered report text and reporter UID. Preset encouragement is not open chat, but online sharing still requires children/family safeguards.
- Location: optional coordinates for on-device prayer calculations. Google ad/media services receive network IP information; evaluate their own SDK disclosures separately. Do not promise zero collection merely because the app doesn't explicitly add targeting fields.
- Notifications: local schedules, no server push token for circles. Exact alarm and foreground audio uses must match Android/Play declarations.
- Google Mobile Ads: integrated but live ads disabled. Before any live use, verify the exact native SDK/version against the current Play Families self-certified SDK requirements and AdMob child settings. The native provider now tags all requests as child-directed/under-age, requests NPA and G content, and blocks live serving without approval. Child-directed flags do not establish parental consent for cloud profile/circle data.
- External Quran providers: api.alquran.cloud, everyayah.com and cdn.mp3quran.net are used by current readers/audio. Inspect current traffic, terms and age suitability. Network services can receive IP/request information.

## Owner app-content decisions required

Use the real release build and the current forms in Play Console to decide collected/shared data types, purposes, optional/required status, encryption, deletion, ads, audience, content rating, app access and any foreground-service/exact-alarm declarations. The publisher/support email is abdelrahman.mohamed.darweesh@gmail.com; existing developer display name is not changed by this code.

Do not choose “no data collected” while cloud profiles, circles, Auth or active ad/media SDK processing contradict it. If a family-local build is selected, reassess after the implementation actually disables the relevant cloud flows.

## Deletion implementation

Home profile menu → Account/privacy → Delete account/data. The new flow reauthenticates email-linked users, removes circle data/indexes/reports/private profile, deletes Firebase Auth identity, then clears device data and notifications. An interruption keeps a checkpoint and blocks automatic profile re-sync. It does not claim completion after failure. Parent/guardian web requests can be made without reinstalling through the public deletion page after Hosting deploys.

The publisher must monitor its support inbox, verify ownership, and handle requests that the app cannot complete. Third-party ad/security data and independent reports submitted by others may need separate handling under the reviewed privacy policy. No paid deletion backend or automatic cloud job is introduced.
