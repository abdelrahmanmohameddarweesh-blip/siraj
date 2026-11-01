# App icon attention badges — 1 November 2026

## Behavior implemented

The attention state is derived from local records; it never changes worship records or grants rewards.

- A prayer counts only after its configured check-in delay. If follow-ups are off or set to zero, a conservative default grace applies (Fajr 35 min, Dhuhr/Asr/Isha 30 min, Maghrib 20 min). Upcoming prayers do not count. Prayers with completed statuses are excluded. Disabled individual prayer reminders and female excused days suppress prayer tasks.
- Planting contributes one task, regardless of seed quantity, only when at least one real saved seed and an empty plot in the current oasis exist. Full plots and zero seeds are not counted. Planting attention is independent of the prayer reminder master switch.
- The current count updates on app open/foreground, notification delivery, local prayer/profile/settings changes, saved garden changes, and once per minute while active. A mere app open does not erase outstanding actions.
- Future local notifications carry projected badge counts based on the latest saved records; prayer follow-ups are reused. When follow-ups are off, badge-only attention requests occur after the grace period. They use a quiet Android notification channel; iOS badge-only requests have no alert title/body. All requests are rescheduled from updated records when the app is used. The existing rolling scheduling limits still apply; no paid push/backend or continuous background polling is added.
- Prayer check-ins and planting reduce the pending state. Obsolete/completed attention/check-in notifications are cleaned up and badge zero clears the explicit badge count. Account deletion clears delivered app notifications and badge count.
- Prayer reminder settings include `شارة الأعمال المنتظرة على أيقونة سراج`. This disables this feature's counts and quiet requests without changing reminder intensity. Notification permission and the OS's badge permission/settings are required. Names follow the notification-personalization preference.

## Android platform limit

An Android launcher controls the dot's color, shape, placement and support. Android often shows a dot because an active notification exists, rather than supporting arbitrary app-controlled badge drawing. The app therefore maintains one low-importance, silent `سراج · أعمال بانتظارك` notification while tasks are pending. It is dismissible, not an always-on foreground service. It is not reposted every minute for the same state in the same app session. Tapping it opens the relevant prayer check-in or the garden.

Nothing OS, Pixel, Samsung and other launchers can differ; this code cannot force an exact red dot. The app setting controls its own badge requests, but a launcher may still display ordinary notification dots for other visible Siraj notifications. To hide all launcher dots, use Android's notification-dot/app-icon-badge settings. On iOS the standard system badge usually displays a number. There is no fake dot baked into the icon artwork.

Offline local planning works, but force-stop restrictions, battery policies, notification revocation, launcher settings and finite pending-notification capacity can prevent or delay background updates. The code cannot observe actions on other devices or run unlimited background code while killed. Physical-device checks remain required.

## Validation

Pure tests cover future-vs-due prayers, grace boundaries, completed/disabled/excused prayers, seed availability/plot capacity, badge opt-out, background quiet requests and no duplicate prayer follow-ups. They also check that no worship records are changed. Native display, exact dot styling and launcher behavior cannot be proven by JavaScript export or browser tests.

Build the combined name-localization/personalization/badge update using the existing project/key with `npx eas-cli build --platform android --profile play-internal`, upload the new AAB to Internal testing and update through Play. Test an overdue unrecorded prayer, complete it, plant seeds until no planting action remains, test an excused day, disable the badge switch, change the phone language, and verify state after leaving/reopening the app. Do not uninstall or erase user data for this test.
