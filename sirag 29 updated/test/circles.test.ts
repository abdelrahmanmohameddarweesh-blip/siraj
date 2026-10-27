import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalProgress,
  canSync,
  circleDay,
  inviteCode,
  journeyDays,
  parseGoal,
  progressForHabit,
  invitationFromURL,
  Circle,
} from "../src/circles/model";
test("circle progress uses unique valid confirmed pages and bounded listening seconds", () => {
  assert.deepEqual(
    canonicalProgress(
      { "2026-10-27": [1, 1, 2, 0, 605, 2.5] },
      601.9,
      "2026-10-27",
    ),
    { pages: 2, seconds: 601 },
  );
  assert.deepEqual(canonicalProgress({}, -5, "2026-10-27"), {
    pages: 0,
    seconds: 0,
  });
  assert.equal(canonicalProgress({}, Infinity, "x").seconds, 86400);
});
test("Arabic and Persian goals validate integer units", () => {
  assert.equal(parseGoal("٢", "reading"), 2);
  assert.equal(parseGoal("۱۰", "listening"), 10);
  for (const n of ["", "0", "-1", "1.5", "NaN", "605"])
    assert.throws(() => parseGoal(n, "reading"));
  assert.throws(() => parseGoal("181", "listening"));
});
test("invitation parsing accepts shared HTTPS and installed app links without arbitrary text", () => {
  assert.equal(inviteCode("sirag://sohba?code=abcdef123456"), "ABCDEF123456");
  assert.equal(
    inviteCode("https://example.com/?code=abcdef123456"),
    "ABCDEF123456",
  );
  assert.equal(inviteCode(" ABCDEF-123456 "), "ABCDEF123456");
});
test("seven-day calendar and timezone boundaries prevent future, expired and mismatched day sync", () => {
  assert.equal(journeyDays("2026-12-29")[6], "2027-01-04");
  assert.equal(
    circleDay("Africa/Cairo", new Date("2026-10-26T23:00:00Z")),
    "2026-10-27",
  );
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const c = {
    startDay: "2026-10-27",
    endDay: "2026-11-02",
    timeZone: zone,
  } as Circle;
  assert.equal(canSync(c, new Date("2026-10-28T12:00:00")), true);
  assert.equal(canSync(c, new Date("2026-10-26T12:00:00")), false);
  assert.equal(canSync(c, new Date("2026-11-03T12:00:00")), false);
});

test("custom-duration calendars validate bounds instead of silently producing invalid dates", () => {
  assert.equal(journeyDays("2026-10-27", "2026-11-25").length, 30);
  assert.equal(journeyDays("2026-10-27", "2026-10-27").length, 1);
  for (const end of ["2026-10-26", "2026-02-30", "2027-12-31"])
    assert.throws(() => journeyDays("2026-10-27", end));
});
test("habit progress uses canonical prayer, Athkar and Hifz records without opening-screen credit", () => {
  const day = "2026-10-27";
  const source: any = {
    readDays: { [day]: [1, 1, 2] },
    listening: { [day]: 600 },
    checkins: {
      ["fajr_" + day]: { status: "on_time" },
      ["dhuhr_" + day]: { status: "rest" },
      ["asr_" + day]: { status: "qada" },
    },
    athkar: { [day]: { morning: { done: true }, evening: { done: false } } },
    hifz: {
      items: { a: { learnedOn: day }, b: { learnedOn: "2026-10-26" } },
      reviewed: { [day]: 3 },
    },
  };
  assert.deepEqual(progressForHabit("prayers", source, day), {
    value: 2,
    pages: 0,
    seconds: 0,
  });
  assert.equal(progressForHabit("adhkar_morning", source, day).value, 1);
  assert.equal(progressForHabit("adhkar_evening", source, day).value, 0);
  assert.equal(progressForHabit("hifz", source, day).value, 1);
  assert.equal(progressForHabit("hifz_review", source, day).value, 3);
  assert.equal(progressForHabit("reading", source, day).pages, 2);
  assert.equal(progressForHabit("listening", source, day).seconds, 600);
});

test("only installed-app scheme or the configured HTTPS invitation host can auto-join", () => {
  const code = "ABCDEF123456",
    base = "https://batal-moslem.web.app";
  assert.equal(invitationFromURL("sirag://sohba?code=" + code), code);
  assert.equal(invitationFromURL(base + "/join?code=" + code, base), code);
  for (const url of [
    "https://evil.example/join?code=" + code,
    "https://batal-moslem.web.app.evil.example/join?code=" + code,
    "http://batal-moslem.web.app/join?code=" + code,
    base + "/other?code=" + code,
    "sirag://other?code=" + code,
    "sirag://sohba?code=bad",
  ])
    assert.equal(invitationFromURL(url, base), null);
  assert.equal(invitationFromURL(base + "/join?code=" + code), null);
});
