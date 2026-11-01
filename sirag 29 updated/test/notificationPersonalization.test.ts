import test from "node:test";
import assert from "node:assert/strict";
import {
  notificationName,
  personalizeBody,
} from "../src/notifications/personalization";
import {
  buildSchedule,
  DEFAULT_FOLLOW_UP,
  PRAYER_IDS,
  PrayerSettings,
} from "../src/notifications/schedulePlan";
import { reconcileSchedule } from "../src/notifications/reconcileSchedule";
const day = "2026-11-01";
const at = (h: number) =>
  new Date(`${day}T${String(h).padStart(2, "0")}:00:00`);
const settings: PrayerSettings = {
  enabled: true,
  perPrayer: Object.fromEntries(
    PRAYER_IDS.map((p) => [p, { enabled: true, sound: true }]),
  ) as PrayerSettings["perPrayer"],
  followUp: true,
  followUpMin: DEFAULT_FOLLOW_UP,
  preAlertMin: 10,
  quietEnabled: false,
  quietStart: "23:00",
  quietEnd: "04:30",
};
const base = {
  now: at(0),
  days: [
    {
      dateStr: day,
      fajr: at(5),
      sunrise: at(6),
      dhuhr: at(12),
      asr: at(15),
      maghrib: at(18),
      isha: at(20),
    },
  ],
  prayer: settings,
  plans: [
    {
      id: "quran",
      kind: "quran_read" as const,
      title: "القرآن",
      category: "القرآن",
      unit: "صفحة",
      target: 1,
      frequency: "daily" as const,
      gradual: false,
      createdAt: "2026-10-01",
      reminders: [{ anchor: "fajr" as const, offsetMin: 20 }],
    },
  ],
  logs: {},
  checkins: {},
  restDays: [],
};
test("Arabic and English chosen names personalize plain text; empty names retain generic copy", () => {
  assert.equal(
    personalizeBody("حان وقت الصلاة.", "عبدالرحمن"),
    "عبدالرحمن، حان وقت الصلاة.",
  );
  assert.equal(
    personalizeBody("حان وقت الصلاة.", "Sara"),
    "Sara، حان وقت الصلاة.",
  );
  assert.equal(
    personalizeBody("حان وقت الصلاة.", "Sara", false),
    "حان وقت الصلاة.",
  );
  assert.equal(
    personalizeBody("حان وقت الصلاة.", undefined),
    "حان وقت الصلاة.",
  );
  assert.equal(notificationName("  سارة\n\u202e أحمد  "), "سارة أحمد");
  assert.equal(notificationName("س".repeat(100)).length, 40);
});
test("All planned phases and habits get the name without changing timing, routing, quantity or rewards", () => {
  const generic = buildSchedule(base),
    named = buildSchedule({ ...base, displayName: "سارة" });
  assert.equal(named.length, generic.length);
  for (let i = 0; i < named.length; i++) {
    assert.equal(named[i].body, `سارة، ${generic[i].body}`);
    assert.equal(named[i].at.getTime(), generic[i].at.getTime());
    assert.deepEqual(named[i].data, generic[i].data);
    assert.equal(named[i].title, generic[i].title);
  }
  assert.deepEqual(
    buildSchedule({
      ...base,
      displayName: "سارة",
      personalizedNotifications: false,
    }),
    generic,
  );
});
test("Editing or hiding the name replaces pending content without moving a reminder", () => {
  const previous = buildSchedule({ ...base, displayName: "أحمد" }),
    next = buildSchedule({ ...base, displayName: "سارة" });
  const changes = reconcileSchedule(
    previous,
    next,
    previous.map((n) => n.id),
  );
  assert.equal(changes.schedule.length, next.length);
  assert.deepEqual(
    changes.cancel,
    previous.map((n) => n.id),
  );
  assert.equal(previous[0].at.getTime(), next[0].at.getTime());
  const hidden = buildSchedule({
    ...base,
    displayName: "سارة",
    personalizedNotifications: false,
  });
  assert.ok(!hidden[0].body.includes("سارة"));
});
