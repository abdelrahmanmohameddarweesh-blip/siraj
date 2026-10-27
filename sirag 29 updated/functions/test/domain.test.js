const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  days,
  dayIn,
  goal,
  text,
  completion,
  reminderDay,
  settings,
  journey,
  entry,
  projection,
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
  assert.equal(goal(5, "prayers"), 5);
  assert.throws(() => goal(6, "prayers"));
  assert.throws(() => goal(2, "adhkar_morning"));
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

test("custom journeys and capacity validate bounds and dates", () => {
  assert.equal(journey("2026-12-20", "2027-01-18").length, 30);
  assert.equal(journey("2026-10-27", "2026-10-27").length, 1);
  for (const end of ["2026-10-26", "2027-02-01", "2026-02-30"])
    assert.throws(() => journey("2026-10-27", end));
  assert.equal(settings({ maxMembers: 30 }).maxMembers, 30);
  for (const n of [1, 31, 2.5, NaN])
    assert.throws(() => settings({ maxMembers: n }));
  assert.throws(() => settings({ showNames: "false" }));
});
test("projection never exposes hidden names, hidden completed/pending status or exact amounts", () => {
  const member = {
    uid: "a",
    name: "أحمد",
    alias: "رفيق 1",
    visible: true,
    nameVisible: true,
    joinedAt: 0,
  };
  const history = {
    one: { done: true, percent: 100, pages: 7 },
    two: { done: false, percent: 25, pages: 1 },
  };
  const hidden = projection(
    member,
    {
      showNames: false,
      showMemberProgress: true,
      showCompletedMembers: false,
      showPendingMembers: false,
    },
    history,
  );
  assert.equal(hidden.name, "رفيق 1");
  assert.deepEqual(hidden.statuses, { one: null, two: null });
  assert.deepEqual(hidden.progress, { one: null, two: null });
  assert.equal(JSON.stringify(hidden).includes("أحمد"), false);
  assert.equal(hidden.pages, undefined);
  const partial = projection(
    member,
    {
      showMemberProgress: true,
      showCompletedMembers: false,
      showPendingMembers: true,
    },
    history,
  );
  assert.equal(partial.statuses.one, null);
  assert.equal(partial.progress.one, null);
  assert.equal(partial.progress.two, 25);
  assert.equal(
    projection({ ...member, nameVisible: false }, { showNames: true }).name,
    "رفيق 1",
  );
});
test("all supported habits validate separate daily units", () => {
  for (const activity of [
    "prayers",
    "adhkar_morning",
    "adhkar_evening",
    "hifz",
    "hifz_review",
    "custom",
  ])
    assert.equal(entry({ activity, goal: 1 }, { value: 1 }).done, true);
  assert.equal(
    entry({ activity: "prayers", goal: 5 }, { value: 3 }).percent,
    60,
  );
  assert.throws(() => entry({ activity: "prayers", goal: 5 }, { value: 6 }));
  assert.throws(() => entry({ activity: "custom", goal: 1 }, { value: NaN }));
});
