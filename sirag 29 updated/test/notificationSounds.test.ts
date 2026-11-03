import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  SOUND_OPTIONS,
  selectedSound,
  soundFile,
  soundChannel,
  foregroundSound,
  type SoundRole,
} from "../src/notifications/soundPolicy";
import {
  buildSchedule,
  DEFAULT_FOLLOW_UP,
  PRAYER_IDS,
  type PrayerSettings,
} from "../src/notifications/schedulePlan";
import { reconcileSchedule } from "../src/notifications/reconcileSchedule";
const date = "2026-11-03";
const at = (hour: number) =>
  new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
const day = {
  dateStr: date,
  fajr: at(5),
  sunrise: at(6),
  dhuhr: at(12),
  asr: at(15),
  maghrib: at(17),
  isha: at(19),
};
const settings: PrayerSettings = {
  enabled: true,
  perPrayer: Object.fromEntries(
    PRAYER_IDS.map((p) => [p, { enabled: true, sound: true }]),
  ) as PrayerSettings["perPrayer"],
  followUp: true,
  followUpMin: { ...DEFAULT_FOLLOW_UP },
  preAlertMin: 10,
  quietEnabled: true,
  quietStart: "23:00",
  quietEnd: "04:30",
};
const plan = (prayer: PrayerSettings) =>
  buildSchedule({
    now: at(0),
    days: [day],
    prayer,
    plans: [],
    logs: {},
    checkins: {},
    restDays: [],
  });
test("Adhan, wudu and prayer follow-up default to different bundled sounds", () => {
  const p = plan(settings);
  assert.equal(p.find((n) => n.id.startsWith("athan:"))?.sound, "athan");
  assert.equal(p.find((n) => n.id.startsWith("pre:"))?.sound, "wudu_drop");
  assert.equal(p.find((n) => n.id.startsWith("pfu:"))?.sound, "prayer_bell");
});
test("Sound changes reconcile only the affected notification role and leave dates unchanged", () => {
  const before = plan(settings),
    after = plan({ ...settings, sounds: { wudu: "wudu_soft" } });
  const diff = reconcileSchedule(
    before,
    after,
    before.map((n) => n.id),
  );
  assert.equal(diff.schedule.length, 5);
  assert(diff.schedule.every((n) => n.id.startsWith("pre:")));
  assert.deepEqual(
    after.map((n) => [n.id, n.at]),
    before.map((n) => [n.id, n.at]),
  );
  assert.notEqual(
    soundChannel("wudu", "wudu_drop"),
    soundChannel("wudu", "wudu_soft"),
  );
  assert.notEqual(
    soundChannel("wudu", "default"),
    soundChannel("reminder", "default"),
  );
});
test("Global mute choices and legacy per-prayer mute preserve notification timing", () => {
  const p = plan({
    ...settings,
    sounds: { adhan: "silent", wudu: "silent", reminder: "silent" },
  });
  assert.equal(p.length, 15);
  assert(p.every((n) => n.sound === null));
  const q = plan({
    ...settings,
    perPrayer: { ...settings.perPrayer, fajr: { enabled: true, sound: false } },
    sounds: { adhan: "gentle" },
  });
  assert.equal(q.find((n) => n.id === `athan:${date}:fajr`)?.sound, null);
  assert.equal(q.find((n) => n.id === `athan:${date}:dhuhr`)?.sound, "gentle");
  assert.equal(q.find((n) => n.id === `pre:${date}:fajr`)?.sound, "wudu_drop");
});
test("Invalid category choices fall back safely; full foreground adhan never duplicates the OS excerpt", () => {
  assert.equal(selectedSound({ wudu: "athan" }, "wudu"), "wudu_drop");
  assert.equal(soundFile("silent"), null);
  assert.equal(soundFile("default"), "default");
  assert.equal(
    foregroundSound(
      { type: "prayer_athan", soundId: "athan" },
      "athan.wav",
      true,
    ),
    false,
  );
  assert.equal(
    foregroundSound(
      { type: "prayer_athan", soundId: "gentle" },
      "gentle.wav",
      true,
    ),
    true,
  );
  assert.equal(foregroundSound({ type: "prayer_pre" }, null, true), false);
  assert.equal(foregroundSound({ attention: "1" }, "default", true), false);
  assert.equal(
    foregroundSound(
      { type: "prayer_athan", soundId: "athan" },
      "athan.wav",
      false,
    ),
    true,
  );
});
test("Every bundled notification sound is valid mono PCM under the iOS 30-second limit and registered", () => {
  const app = JSON.parse(fs.readFileSync("app.json", "utf8"));
  const registered = app.expo.plugins.find(
    (p: any) => Array.isArray(p) && p[0] === "expo-notifications",
  )[1].sounds;
  for (const role of Object.keys(SOUND_OPTIONS) as SoundRole[])
    for (const option of SOUND_OPTIONS[role]) {
      if (["default", "silent"].includes(option.id)) continue;
      const path = `./assets/sounds/${option.id}.wav`,
        wav = fs.readFileSync(path);
      assert(registered.includes(path));
      assert.equal(wav.toString("ascii", 0, 4), "RIFF");
      assert.equal(wav.toString("ascii", 8, 12), "WAVE");
      let offset = 12,
        rate = 0,
        bytes = 0;
      while (offset + 8 <= wav.length) {
        const size = wav.readUInt32LE(offset + 4),
          chunk = wav.toString("ascii", offset, offset + 4);
        if (chunk === "fmt ") {
          assert.equal(wav.readUInt16LE(offset + 8), 1);
          assert.equal(wav.readUInt16LE(offset + 10), 1);
          rate = wav.readUInt32LE(offset + 16);
        }
        if (chunk === "data") bytes = size;
        offset += 8 + size + (size % 2);
      }
      assert(rate > 0 && bytes > 0);
      assert(bytes / rate < 30, `${path} exceeds iOS notification limit`);
    }
});
