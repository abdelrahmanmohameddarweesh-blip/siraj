import test from "node:test";
import assert from "node:assert/strict";
import {
  canonicalProgress,
  canSync,
  circleDay,
  inviteCode,
  journeyDays,
  parseGoal,
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
