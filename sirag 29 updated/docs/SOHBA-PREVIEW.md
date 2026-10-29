# صحبة · no-email creation and joining

Browser captures of the implemented React Native screens at a phone viewport. They use an injected test service and sample data, **not a deployed Firebase database**. Real native appearance, notifications and OS link verification still need phone testing.

| Night | Dawn |
| --- | --- |
| ![Night circle entry, email optional](screenshots/sohba-night.png) | ![Dawn circle entry, email optional](screenshots/sohba-dawn.png) |

| Create: capacity, habit, goal and end date | Creator's independent privacy controls |
| --- | --- |
| ![Customizable circle creation](screenshots/sohba-create.png) | ![Creator privacy settings](screenshots/sohba-companions.png) |

| Circle with aggregate progress hidden | Join using only a code |
| --- | --- |
| ![Private circle progress](screenshots/sohba-journey.png) | ![Code-only join](screenshots/sohba-join.png) |

![Invitation to a configurable habit circle](screenshots/sohba-invite.png)

Creators choose 2–30 members, 1–90 days, a habit and target, name visibility, aggregate/individual progress and whether to show completed or pending members. Invitation routes join automatically; code entry needs one button. Email linking is an optional recovery action.

[Free Spark setup, local reminders, privacy and validation](SOHBA.md).

The current Spark edition uses direct Firestore transactions and local reminders. Cloud group-summary notifications and their switch have been removed; the screenshots illustrate the shared circle screens.
