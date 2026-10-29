import test from "node:test";
import assert from "node:assert/strict";
import {
  sparkCore,
  Store,
  Data,
  Tx,
  root,
  own,
  recordFor,
} from "../src/circles/sparkCore";
import { buildSparkDetail } from "../src/circles/sparkView";
import { defaultCircleOptions, CircleDraft } from "../src/circles/model";
function harness() {
  const rows = new Map<string, Data>();
  let serial = Promise.resolve(),
    sequence = 0,
    writes = 0;
  const store: Store = {
    now: () => Date.parse("2026-10-29T12:00:00Z"),
    newId: () => `circle${++sequence}`,
    newCode: () => String(++sequence).padStart(12, "0"),
    get: async (p) => structuredClone(rows.get(p) || null),
    transaction: (work) => {
      const job = serial.then(async () => {
        const before = structuredClone(rows);
        let changed = false;
        const tx: Tx = {
          get: async (p) => {
            assert.equal(changed, false, "read before write");
            return structuredClone(rows.get(p) || null);
          },
          set: (p, d) => {
            changed = true;
            writes++;
            rows.set(p, structuredClone(d));
          },
          delete: (p) => {
            changed = true;
            writes++;
            rows.delete(p);
          },
        };
        try {
          return await work(tx);
        } catch (e) {
          rows.clear();
          for (const [p, d] of before) rows.set(p, d);
          throw e;
        }
      });
      serial = job.then(
        () => {},
        () => {},
      );
      return job;
    },
  };
  const draft: CircleDraft = {
    ...defaultCircleOptions,
    name: "صحبة العائلة",
    activity: "reading",
    goal: 2,
    startDay: "2026-10-29",
    endDay: "2026-11-04",
  };
  return {
    rows,
    core: sparkCore(store),
    draft,
    get writes() {
      return writes;
    },
  };
}
test("Spark anonymous identity creates and joins a circle directly with enforced shared goal and capacity", async () => {
  const h = harness(),
    { circleId, code } = await h.core.create(
      "anonymous",
      "أحمد",
      { ...h.draft, maxMembers: 2 },
      "UTC",
    );
  const results = await Promise.allSettled(
    ["friend", "third"].map((uid) => h.core.join(uid, "رفيق", code)),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(h.rows.get(root(circleId))!.memberCount, 2);
  assert.equal(h.rows.get(own(circleId, "friend"))!.goal, 2);
  assert.equal(h.rows.get(own(circleId, "friend"))!.activity, "reading");
  await h.core.join("friend", "رفيق", code);
  assert.equal(h.rows.get(root(circleId))!.memberCount, 2);
});
test("Spark daily corrections replace records, and unchanged progress performs zero writes", async () => {
  const h = harness(),
    { circleId } = await h.core.create("owner", "أحمد", h.draft, "UTC");
  await h.core.checkin("owner", circleId, { day: "2026-10-29", pages: 2 });
  const count = h.writes;
  assert.equal(
    await h.core.checkin("owner", circleId, { day: "2026-10-29", pages: 2 }),
    false,
  );
  assert.equal(h.writes, count);
  assert.deepEqual(h.rows.get(root(circleId) + "/contributions/owner")!.days, {
    "2026-10-29": true,
  });
  await h.core.checkin("owner", circleId, { day: "2026-10-29", pages: 1 });
  assert.deepEqual(h.rows.get(root(circleId) + "/contributions/owner")!.days, {
    "2026-10-29": false,
  });
  await assert.rejects(
    h.core.checkin("stranger", circleId, { day: "2026-10-29", pages: 2 }),
  );
  await assert.rejects(
    h.core.checkin("owner", circleId, { day: "2099-01-01", pages: 2 }),
  );
});
test("Spark visibility opts out by deleting public names and statuses, never private activity", async () => {
  const h = harness(),
    { circleId } = await h.core.create("owner", "أحمد", h.draft, "UTC");
  await h.core.checkin("owner", circleId, { day: "2026-10-29", pages: 2 });
  await h.core.preferences("owner", circleId, false, false);
  for (const kind of [
    "names",
    "completed",
    "pending",
    "completedProgress",
    "pendingProgress",
  ])
    assert.equal(h.rows.has(root(circleId) + "/" + kind + "/owner"), false);
  assert.equal(h.rows.get(own(circleId, "owner"))!.days["2026-10-29"].value, 2);
  assert.equal(h.rows.has(root(circleId) + "/contributions/owner"), true);
  await h.core.preferences("owner", circleId, true, true);
  assert.equal(h.rows.get(root(circleId) + "/names/owner")!.name, "أحمد");
  assert.equal(
    h.rows.get(root(circleId) + "/completed/owner")!.days["2026-10-29"],
    true,
  );
});
test("Spark invite rotation and removal revoke old codes; creator departure transfers ownership", async () => {
  const h = harness(),
    { circleId, code } = await h.core.create("owner", "أحمد", h.draft, "UTC");
  await h.core.join("friend", "مريم", code);
  const next = await h.core.rotate("owner", circleId);
  await assert.rejects(h.core.join("outsider", "رفيق", code));
  await assert.rejects(h.core.rotate("friend", circleId));
  await h.core.leave("owner", circleId);
  assert.equal(h.rows.get(root(circleId))!.ownerUid, "friend");
  await assert.rejects(h.core.join("owner", "أحمد", next.code));
  assert.equal(h.rows.has(own(circleId, "owner")), false);
  await h.core.leave("friend", circleId);
  assert.equal(h.rows.has(root(circleId)), false);
});
test("Spark creator settings preserve member goals and prevent reducing cap below membership", async () => {
  const h = harness(),
    { circleId, code } = await h.core.create("owner", "أحمد", h.draft, "UTC");
  await h.core.join("friend", "رفيق", code);
  await h.core.join("other", "رفيق", code);
  await assert.rejects(
    h.core.update("owner", circleId, {
      ...defaultCircleOptions,
      name: "صحبة جديدة",
      maxMembers: 2,
    }),
  );
  await assert.rejects(
    h.core.update("friend", circleId, {
      ...defaultCircleOptions,
      name: "صحبة جديدة",
    }),
  );
  await h.core.update("owner", circleId, {
    ...defaultCircleOptions,
    name: "صحبة جديدة",
    showNames: false,
    showGroupProgress: false,
  });
  assert.equal(h.rows.get(root(circleId))!.showNames, false);
  assert.equal(h.rows.get(own(circleId, "friend"))!.goal, 2);
});
test("Spark UI projection never reveals hidden names, percentages, group counts or encouragement author names", async () => {
  const h = harness(),
    { circleId } = await h.core.create("owner", "أحمد", h.draft, "UTC"),
    c = h.rows.get(root(circleId))! as any,
    m = h.rows.get(own(circleId, "owner"))!;
  const rows: any = {
    names: [{ uid: "owner", name: "أحمد" }],
    completed: [{ uid: "owner", days: { today: true } }],
    pending: [{ uid: "owner", days: { yesterday: false } }],
    completedProgress: [{ uid: "owner", days: { today: 100 } }],
    pendingProgress: [{ uid: "owner", days: { yesterday: 20 } }],
    contributions: [{ uid: "owner", days: { today: true } }],
    encouragement: [
      { uid: "owner", message: "معًا نستمر", day: "today", createdAt: 1 },
    ],
  };
  const hidden = buildSparkDetail(
    {
      ...c,
      showNames: false,
      showGroupProgress: false,
      showMemberProgress: false,
      showCompletedMembers: false,
      showPendingMembers: false,
    },
    m,
    rows,
  );
  assert.equal(hidden.companions[0].name, "رفيق 1");
  assert.deepEqual(hidden.companions[0].statuses, {});
  assert.deepEqual(hidden.companions[0].progress, {});
  assert.deepEqual(hidden.days, {});
  assert.equal(hidden.encouragement[0].name, "رفيق 1");
});
test("Spark custom and tracked habits retain their distinct units with bounded values", () => {
  assert.equal(
    recordFor("listening", 10, { day: "x", seconds: 600 }).done,
    true,
  );
  assert.equal(recordFor("prayers", 5, { day: "x", value: 3 }).percent, 60);
  assert.equal(recordFor("custom", 3, { day: "x", value: 3 }).done, true);
  assert.throws(() => recordFor("prayers", 5, { day: "x", value: 6 }));
});
