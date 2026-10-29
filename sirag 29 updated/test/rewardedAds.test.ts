import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyAdLedger,
  eligibility,
  rewardSession,
  AdSession,
  isPlacement,
} from "../src/ads/rewardPolicy";
import { runRewardedLifecycle, AdDriver } from "../src/ads/adLifecycle";
const day = "2026-10-29",
  at = Date.parse(day + "T12:00:00Z");
function session(
  id: string,
  placement: AdSession["placement"] = "seed",
): AdSession {
  return { id, placement, startedAt: at };
}
test("earned ad bonuses are cosmetic resources only and a repeated SDK event cannot double them", () => {
  const s = session("one"),
    initial = { ...emptyAdLedger(), active: s },
    earned = rewardSession(initial, s, day, at);
  assert.equal(earned.pending.length, 1);
  assert.deepEqual(earned.pending[0], {
    id: "ad:one",
    day,
    habitId: "",
    seeds: 1,
    drops: 0,
    lanterns: 0,
    firstOfDay: false,
    allDone: false,
  });
  assert.equal(rewardSession(earned, s, day, at), earned);
  assert.throws(() => rewardSession(emptyAdLedger(), s, day, at));
  assert.equal(isPlacement("arbitrary"), false);
});
test("ad limits enforce one per placement, three per local day, cooldown and next-day reset", () => {
  let ledger = { ...emptyAdLedger(), active: session("seed") };
  ledger = rewardSession(ledger, ledger.active!, day, at);
  assert.equal(eligibility(ledger, "seed", day, at + 120000).allowed, false);
  assert.equal(eligibility(ledger, "water", day, at + 119999).allowed, false);
  const water = session("water", "water");
  ledger = rewardSession({ ...ledger, active: water }, water, day, at + 120000);
  assert.equal(ledger.pending[1].drops, 2);
  const gift = session("gift", "gift");
  ledger = rewardSession({ ...ledger, active: gift }, gift, day, at + 240000);
  assert.equal(eligibility(ledger, "gift", day, at + 360000).remaining, 0);
  assert.equal(
    eligibility(ledger, "seed", "2026-10-30", at + 86400000).allowed,
    true,
  );
});
function driver() {
  const listeners = new Map<string, ((e?: unknown) => void)[]>();
  let destroyed = false,
    shows = 0;
  const d: AdDriver = {
    on: (event, listener) => {
      listeners.set(event, [...(listeners.get(event) || []), listener]);
      return () =>
        listeners.set(
          event,
          (listeners.get(event) || []).filter((l) => l !== listener),
        );
    },
    load: () => {},
    show: async () => {
      shows++;
    },
    destroy: () => {
      destroyed = true;
    },
  };
  return {
    d,
    emit: (event: string, e?: unknown) => {
      for (const f of [...(listeners.get(event) || [])]) f(e);
    },
    get destroyed() {
      return destroyed;
    },
    get shows() {
      return shows;
    },
  };
}
test("closing an ad early never awards a reward", async () => {
  const sdk = driver();
  let awards = 0;
  const result = runRewardedLifecycle(sdk.d, async () => {
    awards++;
  });
  sdk.emit("loaded");
  sdk.emit("closed");
  assert.deepEqual(await result, { earned: false });
  assert.equal(awards, 0);
  assert.equal(sdk.destroyed, true);
});
test("SDK earning persists once before close resolves, and duplicate load/reward/close events are ignored", async () => {
  const sdk = driver();
  let awards = 0,
    released = false;
  let persist!: () => void;
  const saved = new Promise<void>((resolve) => (persist = resolve));
  const pending = runRewardedLifecycle(sdk.d, async () => {
    awards++;
    await saved;
    released = true;
  });
  sdk.emit("loaded");
  sdk.emit("loaded");
  sdk.emit("earned");
  sdk.emit("earned");
  sdk.emit("closed");
  sdk.emit("closed");
  await Promise.resolve();
  assert.equal(awards, 1);
  assert.equal(released, false);
  persist();
  assert.deepEqual(await pending, { earned: true });
  assert.equal(sdk.shows, 1);
  assert.equal(released, true);
});
test("load failures and timeouts award nothing and clean listeners", async () => {
  const sdk = driver();
  let awards = 0;
  const pending = runRewardedLifecycle(sdk.d, async () => {
    awards++;
  });
  sdk.emit("error", new Error("no-fill"));
  await assert.rejects(pending, /no-fill/);
  sdk.emit("earned");
  assert.equal(awards, 0);
  const timeout = driver();
  await assert.rejects(
    runRewardedLifecycle(
      timeout.d,
      async () => {
        awards++;
      },
      1,
    ),
    /الإعلان لم يصل/,
  );
  assert.equal(awards, 0);
  assert.equal(timeout.destroyed, true);
});
test("failed reward persistence is not reported as success", async () => {
  const sdk = driver();
  const pending = runRewardedLifecycle(sdk.d, async () => {
    throw Error("storage failed");
  });
  sdk.emit("loaded");
  sdk.emit("earned");
  sdk.emit("closed");
  await assert.rejects(pending, /storage failed/);
});

test("a display error after the SDK earned event still delivers the already-earned gift", async () => {
  const sdk = driver();
  let awards = 0;
  const pending = runRewardedLifecycle(sdk.d, async () => {
    awards++;
  });
  sdk.emit("loaded");
  sdk.emit("earned");
  sdk.emit("error", new Error("late display error"));
  assert.deepEqual(await pending, { earned: true });
  assert.equal(awards, 1);
});
