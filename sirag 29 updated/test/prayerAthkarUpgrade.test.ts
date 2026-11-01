import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePrayerTimes,
  calculateRollingWeek,
} from "../src/prayer/prayerTimesService";
import {
  SUNNAH_SLOTS,
  setSunnah,
  sunnahTotal,
  slotsForPrayer,
  SunnahLog,
} from "../src/prayer/sunnahModel";
import { ATHKAR } from "../src/athkar/athkarData";
import {
  emptySession,
  tap,
  completeItem,
  normalizeSession,
  resetItem,
} from "../src/athkar/athkarEngine";
import {
  prayerPresetPatch,
  followUpPatch,
} from "../src/notifications/prayerPresets";
import {
  buildSchedule,
  DEFAULT_FOLLOW_UP,
  PrayerSettings,
  PRAYER_IDS,
} from "../src/notifications/schedulePlan";
import {
  todaysHabits,
  computeGrants,
  emptyLedger,
} from "../src/oasis/oasisRewards";

test("Sunnah choices track distinct before/after prayers, replace corrections and never double count", () => {
  let log: SunnahLog = {};
  for (const slot of SUNNAH_SLOTS)
    log = setSunnah(log, "2026-11-01", slot.id, slot.max);
  assert.equal(sunnahTotal(log, "2026-11-01"), 12);
  log = setSunnah(log, "2026-11-01", "dhuhr_before", 4);
  assert.equal(sunnahTotal(log, "2026-11-01"), 12);
  log = setSunnah(log, "2026-11-01", "dhuhr_before", 2);
  assert.equal(sunnahTotal(log, "2026-11-01"), 10);
  assert.equal(sunnahTotal(log, "2026-11-02"), 0);
  assert.equal(slotsForPrayer("asr").length, 0);
  assert.throws(() => setSunnah(log, "2026-11-01", "fajr_before", 4));
  assert.throws(() => setSunnah(log, "2026-11-01", "dhuhr_before", 3));
});
test("Stale Athkar completion flags, listening and empty records cannot imply actual repetitions", () => {
  const stale = normalizeSession(
    { ...emptySession(), done: true, seconds: 300, completedAt: "old" },
    ATHKAR,
  );
  assert.equal(stale.done, false);
  assert.equal(stale.completedAt, undefined);
  let current = stale;
  for (const item of ATHKAR)
    current = completeItem(current, item, ATHKAR, "now");
  assert.equal(current.done, true);
  current = resetItem(current, ATHKAR[0], ATHKAR);
  assert.equal(current.done, false);
  assert.equal(current.counts[ATHKAR[0].id], 0);
  assert.equal(current.counts[ATHKAR[1].id], ATHKAR[1].repeat);
  assert.equal(
    tap(emptySession(), ATHKAR[0], ATHKAR, "now").counts[ATHKAR[0].id],
    1,
  );
});
test("Prayer calibration shifts the same calculated instants used for a rolling reminder schedule", () => {
  const loc = { latitude: 30.04, longitude: 31.24 },
    date = new Date("2026-11-01T12:00:00");
  const base = calculatePrayerTimes(loc, date),
    adjusted = calculatePrayerTimes(loc, date, "Egyptian", "shafii", {
      fajr: 3,
      isha: -2,
    });
  assert.equal(adjusted.fajr.getTime() - base.fajr.getTime(), 180000);
  assert.equal(adjusted.isha.getTime() - base.isha.getTime(), -120000);
  assert.equal(adjusted.dhuhr.getTime(), base.dhuhr.getTime());
  const days = calculateRollingWeek(loc, date, 7, "Egyptian", "shafii", {
    fajr: 3,
  });
  assert.equal(days.length, 7);
  assert.equal(days[0].fajr.getTime(), adjusted.fajr.getTime());
  const perPrayer = Object.fromEntries(
    PRAYER_IDS.map((p) => [p, { enabled: true, sound: true }]),
  ) as PrayerSettings["perPrayer"];
  const settings: PrayerSettings = {
    enabled: true,
    perPrayer,
    preAlertMin: 0,
    followUp: false,
    followUpMin: DEFAULT_FOLLOW_UP,
    quietEnabled: false,
    quietStart: "23:00",
    quietEnd: "04:30",
  };
  const schedule = buildSchedule({
    now: new Date(days[0].fajr.getTime() - 60000),
    days,
    prayer: settings,
    plans: [],
    logs: {},
    checkins: {},
    restDays: [],
    limit: 400,
  });
  assert.equal(schedule[0].at.getTime(), adjusted.fajr.getTime());
  assert.equal(schedule.length, 35);
});
test("Prayer reminder presets reset stale overrides rather than mixing frequencies", () => {
  const gentle = prayerPresetPatch("gentle"),
    steady = prayerPresetPatch("steady"),
    strong = prayerPresetPatch("strong");
  assert.equal(gentle.checkinFollowUpEnabled, false);
  assert.equal(steady.checkinFollowUpEnabled, true);
  assert.equal(steady.preAlertMin, 0);
  assert.equal(strong.preAlertMin, 10);
  assert.deepEqual(strong.preAlertByPrayer, {});
  assert.deepEqual(strong.followUpMin, {});
});
test("An excused day fabricates no prayer rewards and retains real non-prayer activity rewards", () => {
  const sources = {
    day: "2026-11-01",
    restDay: true,
    checkins: {},
    logs: { "2026-11-01": { sunnah: 12, kindness: 1 } },
    plans: [
      {
        id: "sunnah",
        title: "سنن",
        category: "الصلاة",
        target: 12,
        unit: "ركعة",
        frequency: "daily" as const,
        gradual: false,
        createdAt: "2026-10-01",
      },
      {
        id: "kindness",
        title: "خير",
        category: "الخير",
        target: 1,
        unit: "مرة",
        frequency: "daily" as const,
        gradual: false,
        createdAt: "2026-10-01",
      },
    ],
  };
  const habits = todaysHabits(sources);
  assert.deepEqual(
    habits.map((h) => h.id),
    ["plan:kindness"],
  );
  const result = computeGrants(emptyLedger(), sources.day, habits);
  assert.equal(
    result.grants.some((g) => g.habitId.startsWith("prayer:")),
    false,
  );
  assert.ok(result.grants.length > 0);
});

test("Enabling only Isha follow-up from an adhan-only plan keeps other prayers off", () => {
  const patch = followUpPatch({ checkinFollowUpEnabled: false }, "isha", 20);
  assert.deepEqual(patch.followUpMin, {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 20,
  });
});
