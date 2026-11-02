import test from "node:test";
import assert from "node:assert/strict";
import {
  fitSpotlight,
  coachTip,
  maskPath,
  HOME_STEPS,
} from "../src/onboarding/coachModel";
test("Spotlight bounds stay within small and large screens and include real targets", () => {
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [430, 932],
  ]) {
    for (const box of [
      { x: 18, y: 100, width: width - 36, height: 180 },
      { x: width - 70, y: height - 80, width: 52, height: 52 },
    ]) {
      const fit = fitSpotlight(box, width, height);
      assert.ok(
        fit.x >= 0 &&
          fit.y >= 0 &&
          fit.x + fit.width <= width &&
          fit.y + fit.height <= height,
      );
      assert.ok(fit.width > 0 && fit.height > 0);
      const card = coachTip(fit, width, height, 24, 16, 280);
      assert.ok(card.x >= 0 && card.x + card.width <= width);
      assert.ok(card.y >= 24 && card.y + card.maxHeight <= height - 16);
      if (card.placement === "above")
        assert.ok(card.y + card.maxHeight < fit.y);
      else assert.ok(card.y > fit.y + fit.height);
      assert.ok(!maskPath(width, height, fit).includes("NaN"));
    }
  }
});
test("Dock coachmarks sit above the target while header coachmarks sit below it", () => {
  const dock = { x: 170, y: 750, width: 60, height: 60 };
  assert.equal(coachTip(dock, 390, 844, 24, 16).placement, "above");
  assert.equal(
    coachTip({ x: 20, y: 45, width: 44, height: 44 }, 390, 844, 24, 16)
      .placement,
    "below",
  );
});
test("Homepage walkthrough covers actual sections once, without inventing activity", () => {
  assert.equal(
    new Set(HOME_STEPS.map((s) => s.target)).size,
    HOME_STEPS.length,
  );
  assert.deepEqual(
    HOME_STEPS.map((s) => s.screen),
    [
      "PrayerTracker",
      "PrayerReminders",
      "QuranReader",
      "HabitSetup",
      "Oasis",
      "Insights",
      "Sohba",
    ],
  );
  assert.ok(HOME_STEPS.every((s) => s.title && s.copy && s.action));
});
