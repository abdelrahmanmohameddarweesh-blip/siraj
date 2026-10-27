const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  days,
  dayIn,
  goal,
  text,
  completion,
  reminderDay,
} = require("../domain");
test("seven-day journeys cross months and leap years without extra days", () => {
  assert.deepEqual(days("2028-02-27"), [
    "2028-02-27",
    "2028-02-28",
    "2028-02-29",
    "2028-03-01",
    "2028-03-02",
    "2028-03-03",
    "2028-03-04",
  ]);
  assert.throws(() => days("2026-02-30"));
  assert.throws(() => days("tomorrow"));
});
test("circle date uses its timezone instead of server UTC", () => {
  assert.equal(
    dayIn("Africa/Cairo", new Date("2026-10-26T23:30:00Z")),
    "2026-10-27",
  );
  assert.equal(
    dayIn("America/New_York", new Date("2026-10-27T01:00:00Z")),
    "2026-10-26",
  );
  assert.throws(() => dayIn("invalid"));
});
test("goals and names reject unsafe, empty, fractional and unbounded input", () => {
  assert.equal(goal(2, "reading"), 2);
  assert.equal(text(" أحمد "), "أحمد");
  for (const v of [0, -1, NaN, Infinity, 2.5, 605])
    assert.throws(() => goal(v, "reading"));
  assert.throws(() => goal(181, "listening"));
  assert.throws(() => goal(1, "prayers"));
  for (const n of ["", "a", "<script>", "a\nb"]) assert.throws(() => text(n));
});
test("personal reading and listening completion use distinct units and reject inflated values", () => {
  assert.equal(completion({ activity: "reading", goal: 2 }, 2, 0), true);
  assert.equal(completion({ activity: "reading", goal: 2 }, 1, 6000), false);
  assert.equal(
    completion({ activity: "listening", goal: 10 }, 604, 599),
    false,
  );
  assert.equal(completion({ activity: "listening", goal: 10 }, 0, 600), true);
  assert.throws(() => completion({ activity: "reading", goal: 1 }, 605, 0));
  assert.throws(() =>
    completion({ activity: "reading", goal: 1 }, 1, Infinity),
  );
});

test("reminder windows never send early and preserve the intended day across midnight", () => {
  assert.equal(
    reminderDay("UTC", 20, 7, new Date("2026-10-27T20:00:00Z")),
    null,
  );
  assert.equal(
    reminderDay("UTC", 20, 7, new Date("2026-10-27T20:15:00Z")),
    "2026-10-27",
  );
  assert.equal(
    reminderDay("UTC", 20, 50, new Date("2026-10-27T21:00:00Z")),
    "2026-10-27",
  );
  assert.equal(
    reminderDay("UTC", 23, 58, new Date("2026-10-28T00:00:00Z")),
    "2026-10-27",
  );
  assert.equal(
    reminderDay("UTC", 20, 0, new Date("2026-10-27T20:15:00Z")),
    null,
  );
});
