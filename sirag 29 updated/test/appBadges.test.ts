import test from "node:test";
import assert from "node:assert/strict";
import {
  pendingActions,
  hasPlantableSeeds,
} from "../src/notifications/badgeModel";
import {
  buildSchedule,
  PRAYER_IDS,
  DEFAULT_FOLLOW_UP,
  PrayerSettings,
} from "../src/notifications/schedulePlan";
const date = "2026-11-01";
const at = (h: number, m = 0) =>
  new Date(
    `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`,
  );
const day = {
  dateStr: date,
  fajr: at(5),
  sunrise: at(6),
  dhuhr: at(12),
  asr: at(15),
  maghrib: at(18),
  isha: at(20),
};
const settings: PrayerSettings = {
  enabled: true,
  perPrayer: Object.fromEntries(
    PRAYER_IDS.map((p) => [p, { enabled: true, sound: true }]),
  ) as PrayerSettings["perPrayer"],
  followUp: true,
  followUpMin: DEFAULT_FOLLOW_UP,
  preAlertMin: 0,
  quietEnabled: false,
  quietStart: "23:00",
  quietEnd: "04:30",
};
const base = {
  now: at(5, 34),
  day,
  settings,
  checkins: {},
  rest: false,
  canPlant: false,
  enabled: true,
};
test("Only overdue unrecorded prayers count after the configured grace, never future prayers", () => {
  assert.equal(pendingActions(base).count, 0);
  assert.deepEqual(pendingActions({ ...base, now: at(5, 35) }).prayers, [
    "fajr",
  ]);
  assert.equal(pendingActions({ ...base, now: at(12, 29) }).count, 1);
  assert.equal(pendingActions({ ...base, now: at(12, 30) }).count, 2);
  assert.equal(
    pendingActions({
      ...base,
      now: at(5, 35),
      checkins: { [`fajr_${date}`]: { status: "qada" } },
    }).count,
    0,
  );
});
test("Prayer exclusions, badge opt-out and disabled prayer notifications are respected", () => {
  assert.equal(pendingActions({ ...base, now: at(23), rest: true }).count, 0);
  assert.equal(
    pendingActions({ ...base, now: at(23), enabled: false, canPlant: true })
      .count,
    0,
  );
  assert.equal(
    pendingActions({
      ...base,
      now: at(23),
      settings: { ...settings, enabled: false },
      canPlant: true,
    }).count,
    1,
  );
  assert.equal(
    pendingActions({
      ...base,
      now: at(5, 35),
      settings: {
        ...settings,
        perPrayer: {
          ...settings.perPrayer,
          fajr: { enabled: false, sound: false },
        },
      },
    }).count,
    0,
  );
});
test("Planting contributes one actionable task only when real seeds and an available plot exist", () => {
  assert.equal(
    hasPlantableSeeds({ seeds: 3, oases: [{ plots: [null] }] }),
    true,
  );
  assert.equal(
    hasPlantableSeeds({ seeds: 0, oases: [{ plots: [null] }] }),
    false,
  );
  assert.equal(
    hasPlantableSeeds({ seeds: 3, oases: [{ plots: [{ stage: 1 }] }] }),
    false,
  );
  assert.equal(
    hasPlantableSeeds({ seeds: "3", oases: [{ plots: [null] }] }),
    false,
  );
  assert.equal(pendingActions({ ...base, canPlant: true }).count, 1);
  assert.equal(
    pendingActions({ ...base, now: at(23), canPlant: true, rest: true }).count,
    1,
  );
});
test("Background badges reuse prayer follow-ups, while adhan-only plans get quiet attention requests", () => {
  const input = {
    now: at(0),
    days: [day],
    prayer: settings,
    plans: [],
    logs: {},
    checkins: {},
    restDays: [],
    badgesEnabled: true,
    canPlant: true,
  };
  const regular = buildSchedule(input);
  assert.equal(regular.filter((n) => n.id.startsWith("att:")).length, 0);
  assert.equal(regular.find((n) => n.id === `pfu:${date}:fajr`)?.badge, 2);
  const quiet = buildSchedule({
    ...input,
    prayer: { ...settings, followUp: false },
  });
  assert.equal(quiet.filter((n) => n.id.startsWith("att:")).length, 5);
  assert.ok(
    quiet
      .filter((n) => n.id.startsWith("att:"))
      .every((n) => n.sound === null && n.channel === "attention"),
  );
  const disabled = buildSchedule({ ...input, badgesEnabled: false });
  assert.ok(
    disabled.every((n) => n.badge === undefined && !n.id.startsWith("att:")),
  );
});
test("Checking in removes that prayer attention request and lowers counts without altering records or rewards", () => {
  const checkins = { [`fajr_${date}`]: { status: "on_time" } };
  const copy = JSON.stringify(checkins);
  const plan = buildSchedule({
    now: at(0),
    days: [day],
    prayer: { ...settings, followUp: false },
    plans: [],
    logs: {},
    checkins,
    restDays: [],
    badgesEnabled: true,
  });
  assert.ok(!plan.some((n) => n.id === `att:${date}:fajr`));
  assert.equal(plan.find((n) => n.id === `att:${date}:dhuhr`)?.badge, 1);
  assert.equal(JSON.stringify(checkins), copy);
});
