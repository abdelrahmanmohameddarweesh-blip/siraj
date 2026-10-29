import test from "node:test";
import assert from "node:assert/strict";
import { circleReminderDates } from "../src/circles/reminderPlan";
import { localDay } from "../src/habits/habitData";
const epoch = (day: string) => Date.parse(day + "T00:00:00Z") / 86400000;
test("free local reminders wait for the start day, cap at three, and include the end day", () => {
  const plan = circleReminderDates(
    new Date(2026, 9, 29, 12),
    20,
    15,
    epoch("2026-11-02"),
    epoch("2026-11-03"),
    50,
  );
  assert.deepEqual(plan.map(localDay), ["2026-11-02", "2026-11-03"]);
  assert.equal(plan[0].getHours(), 20);
  assert.equal(plan[0].getMinutes(), 15);
  const more = circleReminderDates(
    new Date(2026, 9, 29, 12),
    20,
    0,
    epoch("2026-10-29"),
    epoch("2026-11-30"),
    50,
  );
  assert.equal(more.length, 3);
});
test("local reminders skip elapsed times, expired journeys and a full shared notification budget", () => {
  const now = new Date(2026, 9, 29, 21);
  assert.equal(
    circleReminderDates(
      now,
      20,
      0,
      epoch("2026-10-29"),
      epoch("2026-11-04"),
      1,
    )[0].getDate(),
    30,
  );
  assert.deepEqual(
    circleReminderDates(
      now,
      20,
      0,
      epoch("2026-10-29"),
      epoch("2026-11-04"),
      0,
    ),
    [],
  );
  assert.deepEqual(
    circleReminderDates(
      now,
      20,
      0,
      epoch("2026-10-20"),
      epoch("2026-10-28"),
      60,
    ),
    [],
  );
});
