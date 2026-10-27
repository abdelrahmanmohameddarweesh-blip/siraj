// Exercise the exported callable handlers against a serial transactional store.
// These tests validate business behavior; the emulator suite separately validates
// Firebase transport and deployed security rules when available.
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  Module = require("node:module");
const rows = new Map();
let serial = Promise.resolve(),
  next = 0;
class Ref {
  constructor(path) {
    this.path = path;
    this.id = path.split("/").pop();
  }
  collection(name) {
    return new Query(this.path + "/" + name);
  }
  async get() {
    return snapshot(this);
  }
  async update(data) {
    write(this, data, true);
  }
  async delete() {
    rows.delete(this.path);
  }
}
class Query {
  constructor(path) {
    this.path = path;
  }
  doc(id) {
    return new Ref(this.path + "/" + (id || "generated" + ++next));
  }
  where(field, op, value) {
    const q = new Query(this.path);
    q.filters = [...(this.filters || []), { field, op, value }];
    return q;
  }
  orderBy(field, direction) {
    this.order = { field, direction };
    return this;
  }
  limit(count) {
    this.count = count;
    return this;
  }
  async get() {
    return querySnapshot(this);
  }
}
function snapshot(ref) {
  const value = rows.get(ref.path);
  return {
    ref,
    id: ref.id,
    exists: value !== undefined,
    data: () => (value === undefined ? undefined : structuredClone(value)),
  };
}
function querySnapshot(q) {
  const docs = [...rows.keys()]
    .filter(
      (p) =>
        p.startsWith(q.path + "/") &&
        p.slice(q.path.length + 1).indexOf("/") < 0,
    )
    .map((p) => snapshot(new Ref(p)))
    .filter((s) =>
      (q.filters || []).every((f) =>
        f.op === ">=" ? s.data()[f.field] >= f.value : false,
      ),
    );
  if (q.order)
    docs.sort(
      (a, b) =>
        (a.data()[q.order.field] - b.data()[q.order.field]) *
        (q.order.direction === "desc" ? -1 : 1),
    );
  const result = q.count ? docs.slice(0, q.count) : docs;
  return { docs: result, size: result.length };
}
function merge(a, b) {
  const r = { ...a };
  for (const [k, v] of Object.entries(b))
    r[k] =
      v && typeof v === "object" && !Array.isArray(v)
        ? merge(r[k] || {}, v)
        : v;
  return r;
}
function write(ref, data, merging) {
  rows.set(
    ref.path,
    merging
      ? merge(rows.get(ref.path) || {}, structuredClone(data))
      : structuredClone(data),
  );
}
const db = {
  doc: (p) => new Ref(p),
  collection: (p) => new Query(p),
  runTransaction: (fn) => {
    const run = serial.then(async () => {
      const before = structuredClone(rows);
      let writing = false;
      const tx = {
        get: async (ref) => {
          assert.equal(
            writing,
            false,
            "all transaction reads must precede writes",
          );
          return ref instanceof Query ? querySnapshot(ref) : snapshot(ref);
        },
        set: (r, v, o) => {
          writing = true;
          write(r, v, o?.merge);
        },
        create: (r, v) => {
          writing = true;
          assert.ok(!rows.has(r.path), "create collision");
          write(r, v, false);
        },
        update: (r, v) => {
          writing = true;
          assert.ok(rows.has(r.path), "update missing document");
          write(r, v, true);
        },
        delete: (r) => {
          writing = true;
          rows.delete(r.path);
        },
      };
      try {
        return await fn(tx);
      } catch (e) {
        rows.clear();
        for (const [k, v] of before) rows.set(k, v);
        throw e;
      }
    });
    serial = run.catch(() => {});
    return run;
  },
};
class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const original = Module._load;
Module._load = function (name, ...rest) {
  if (name === "firebase-functions/v2/https")
    return { onCall: (_, fn) => fn, HttpsError };
  if (name === "firebase-functions/v2/scheduler")
    return { onSchedule: (_, fn) => fn };
  if (name === "firebase-admin/app") return { initializeApp: () => {} };
  if (name === "firebase-admin/firestore") return { getFirestore: () => db };
  return original.call(this, name, ...rest);
};
const functions = require("../index");
Module._load = original;
const user = (uid) => ({
  uid,
  token: { firebase: { sign_in_provider: "password" } },
});
const call = (uid, name, data = {}) =>
  functions[name]({ auth: uid ? user(uid) : null, data });
const today = () => new Date().toISOString().slice(0, 10);
const create = (uid, extra = {}) =>
  call(uid, "sohbaCreate", {
    name: "صحبة القرآن",
    displayName: "أحمد",
    activity: "reading",
    goal: 2,
    visible: true,
    startDay: today(),
    timeZone: "UTC",
    allowPersonalGoals: true,
    showPendingMembers: true,
    ...extra,
  });
test("create/join allow anonymous identities, preserve legacy goals, and remain capped/idempotent", async () => {
  await assert.rejects(create(null), (e) => e.code === "unauthenticated");
  const anon = await functions.sohbaCreate({
    auth: {
      uid: "anonymous",
      token: { firebase: { sign_in_provider: "anonymous" } },
    },
    data: {
      name: "صحبة بلا بريد",
      displayName: "رفيق",
      activity: "reading",
      goal: 2,
      startDay: today(),
      timeZone: "UTC",
    },
  });
  const joined = await functions.sohbaJoin({
    auth: {
      uid: "anonymousFriend",
      token: { firebase: { sign_in_provider: "anonymous" } },
    },
    data: { code: anon.code, displayName: "رفيق" },
  });
  assert.equal(joined.circleId, anon.circleId);
  const { circleId, code } = await create("owner");
  const preview = await call("outsider", "sohbaPreview", { code });
  assert.equal(preview.ownerUid, undefined);
  assert.equal(preview.name, "صحبة القرآن");
  await call("friend", "sohbaJoin", {
    code,
    displayName: "مريم",
    activity: "listening",
    goal: 10,
    visible: false,
  });
  await call("friend", "sohbaJoin", {
    code,
    displayName: "مريم",
    activity: "reading",
    goal: 3,
  });
  assert.equal(rows.get(`sohbaCircles/${circleId}`).memberCount, 2);
  assert.equal(
    rows.get(`sohbaCircles/${circleId}/members/friend`).activity,
    "listening",
  );
  const joins = await Promise.allSettled(
    Array.from({ length: 10 }, (_, i) =>
      call("guest" + i, "sohbaJoin", {
        code,
        displayName: "رفيق",
        goal: 1,
        activity: "reading",
      }),
    ),
  );
  assert.equal(joins.filter((r) => r.status === "fulfilled").length, 8);
  assert.equal(rows.get(`sohbaCircles/${circleId}`).memberCount, 10);
});
test("daily corrections never duplicate group credit; exact amounts stay out of companion documents", async () => {
  const { circleId, code } = await create("tracker"),
    root = `sohbaCircles/${circleId}`;
  await call("listener", "sohbaJoin", {
    code,
    displayName: "رفيق",
    activity: "listening",
    goal: 10,
    visible: false,
  });
  const check = (uid, pages, seconds) =>
    call(uid, "sohbaCheckin", { circleId, day: today(), pages, seconds });
  await Promise.all([
    check("tracker", 2, 0),
    check("tracker", 2, 0),
    check("tracker", 2, 0),
  ]);
  await check("listener", 0, 600);
  assert.equal(rows.get(`${root}/days/${today()}`).completed, 2);
  assert.deepEqual(rows.get(`${root}/companions/listener`).statuses, {
    [today()]: null,
  });
  assert.equal(rows.get(`${root}/companions/listener`).goal, undefined);
  assert.equal(rows.get(`${root}/companions/listener`).pages, undefined);
  await check("tracker", 1, 0);
  assert.equal(rows.get(`${root}/days/${today()}`).completed, 1);
  await assert.rejects(
    check("outsider", 2, 0),
    (e) => e.code === "permission-denied",
  );
  await assert.rejects(
    call("tracker", "sohbaCheckin", {
      circleId,
      day: "2099-01-01",
      pages: 2,
      seconds: 0,
    }),
  );
  await call("tracker", "sohbaPreferences", {
    circleId,
    visible: false,
    reminderHour: 20,
    reminderMinute: 0,
  });
  assert.equal(rows.get(`${root}/companions/tracker`).statuses[today()], null);
  await call("listener", "sohbaPreferences", {
    circleId,
    visible: true,
    reminderHour: 20,
    reminderMinute: 0,
  });
  assert.equal(rows.get(`${root}/companions/listener`).statuses[today()], true);
});
test("creator can rotate invitations and remove members, leaving transfers ownership and removes contributions", async () => {
  const { circleId, code } = await create("admin"),
    root = `sohbaCircles/${circleId}`;
  await call("companion", "sohbaJoin", {
    code,
    displayName: "رفيق",
    goal: 1,
    activity: "reading",
  });
  await call("companion", "sohbaCheckin", {
    circleId,
    day: today(),
    pages: 1,
    seconds: 0,
  });
  await call("companion", "sohbaEncourage", {
    circleId,
    message: "معًا نستمر",
  });
  await assert.rejects(
    call("companion", "sohbaRotateInvite", { circleId }),
    (e) => e.code === "permission-denied",
  );
  await assert.rejects(
    call("companion", "sohbaLeave", { circleId, memberUid: "admin" }),
    (e) => e.code === "permission-denied",
  );
  const rotated = await call("admin", "sohbaRotateInvite", { circleId });
  await assert.rejects(call("companion", "sohbaPreview", { code }));
  assert.equal(
    (await call("companion", "sohbaPreview", { code: rotated.code })).circleId,
    circleId,
  );
  await call("admin", "sohbaLeave", { circleId });
  assert.equal(rows.get(root).ownerUid, "companion");
  assert.equal(rows.has(root + "/members/admin"), false);
  await call("companion", "sohbaLeave", { circleId });
  assert.equal(rows.has(root), false);
  assert.equal(rows.get(`${root}/days/${today()}`).completed, 0);
  assert.equal(
    [...rows.keys()].some((p) => p.startsWith(root + "/encouragement/")),
    false,
  );
});
test("encouragement is preset and throttled; reports require membership", async () => {
  const { circleId } = await create("moderated");
  await assert.rejects(
    call("moderated", "sohbaEncourage", { circleId, message: "free chat" }),
  );
  await call("moderated", "sohbaEncourage", {
    circleId,
    message: "بارك الله فيكم",
  });
  await assert.rejects(
    call("moderated", "sohbaEncourage", { circleId, message: "تقبّل الله" }),
  );
  await assert.rejects(
    call("outsider", "sohbaReport", { circleId, reason: "بلاغ" }),
    (e) => e.code === "permission-denied",
  );
  await call("moderated", "sohbaReport", { circleId, reason: "بلاغ اختبار" });
  assert.equal(
    [...rows.entries()].filter(([p]) => p.startsWith("sohbaReports/")).length,
    1,
  );
});

test("reminders are opt-in, skip completed personal intentions and do not send twice", async () => {
  const oldFetch = global.fetch,
    sent = [];
  global.fetch = async (_, options) => {
    sent.push(JSON.parse(options.body));
    return {
      ok: true,
      json: async () => ({ data: { status: "ok", id: "ticket" } }),
    };
  };
  try {
    const now = new Date();
    for (const [uid, done, summary] of [
      ["notifyDone", true, false],
      ["notifyPending", false, false],
      ["notifySummary", true, true],
    ]) {
      const { circleId } = await create(uid);
      await call(uid, "sohbaPreferences", {
        circleId,
        visible: false,
        reminders: true,
        summary,
        reminderHour: now.getUTCHours(),
        reminderMinute: now.getUTCMinutes(),
        pushToken: `ExpoPushToken[${uid}]`,
      });
      if (done)
        await call(uid, "sohbaCheckin", {
          circleId,
          day: today(),
          pages: 2,
          seconds: 0,
        });
    }
    await functions.sohbaReminders();
    assert.equal(sent.length, 2);
    assert.equal(
      sent.some((m) => m.to === "ExpoPushToken[notifyDone]"),
      false,
    );
    assert.ok(
      sent
        .find((m) => m.to === "ExpoPushToken[notifyPending]")
        .body.includes("وردك"),
    );
    assert.ok(
      sent
        .find((m) => m.to === "ExpoPushToken[notifySummary]")
        .body.includes("1 من 1"),
    );
    assert.equal(
      sent.every((m) => m.channelId === "sohba" && m.data.screen === "Sohba"),
      true,
    );
    await functions.sohbaReminders();
    assert.equal(sent.length, 2);
  } finally {
    global.fetch = oldFetch;
  }
});

test("creator customization is enforced on capacity, shared goals, hidden names, feed and prior progress", async () => {
  const { circleId, code } = await create("customOwner", {
    maxMembers: 2,
    endDay: require("../domain").days(today(), 30)[29],
    showNames: false,
    showGroupProgress: false,
    showMemberProgress: true,
    showCompletedMembers: false,
    showPendingMembers: false,
    allowPersonalGoals: false,
    activity: "prayers",
    goal: 5,
  });
  const root = `sohbaCircles/${circleId}`;
  await call("customFriend", "sohbaJoin", {
    code,
    displayName: "اسم خاص",
    activity: "reading",
    goal: 1,
  });
  assert.equal(rows.get(root + "/members/customFriend").activity, "prayers");
  assert.equal(rows.get(root + "/members/customFriend").goal, 5);
  await assert.rejects(
    call("overflow", "sohbaJoin", { code, displayName: "رفيق" }),
  );
  await call("customFriend", "sohbaCheckin", {
    circleId,
    day: today(),
    value: 5,
  });
  assert.equal(rows.get(root + "/companions/customFriend").name, "رفيق 2");
  assert.equal(
    rows.get(root + "/companions/customFriend").statuses[today()],
    null,
  );
  await call("customFriend", "sohbaEncourage", {
    circleId,
    message: "معًا نستمر",
  });
  const feed = await call("customOwner", "sohbaFeed", { circleId });
  assert.equal(feed[0].name, "رفيق 2");
  assert.equal(JSON.stringify(feed).includes("اسم خاص"), false);
  await assert.rejects(
    call("stranger", "sohbaFeed", { circleId }),
    (e) => e.code === "permission-denied",
  );
  await assert.rejects(
    call("customFriend", "sohbaUpdateCircle", {
      circleId,
      name: "تعديل",
      maxMembers: 3,
    }),
    (e) => e.code === "permission-denied",
  );
  await call("customOwner", "sohbaUpdateCircle", {
    circleId,
    name: "صحبة مخصصة",
    maxMembers: 3,
    showNames: true,
    showGroupProgress: true,
    showMemberProgress: true,
    showCompletedMembers: true,
    showPendingMembers: true,
  });
  assert.equal(rows.get(root + "/companions/customFriend").name, "اسم خاص");
  assert.equal(
    rows.get(root + "/companions/customFriend").progress[today()],
    100,
  );
  await call("customOwner", "sohbaUpdateCircle", {
    circleId,
    name: "صحبة مخصصة",
    maxMembers: 3,
    showNames: false,
    showGroupProgress: false,
    showMemberProgress: false,
    showCompletedMembers: false,
    showPendingMembers: false,
  });
  assert.equal(rows.get(root + "/companions/customFriend").name, "رفيق 2");
  assert.equal(
    rows.get(root + "/companions/customFriend").statuses[today()],
    null,
  );
  assert.equal(
    (await call("customOwner", "sohbaFeed", { circleId }))[0].name,
    "رفيق 2",
  );
});
test("custom habit check-ins replace the daily total without duplicate completion", async () => {
  const { circleId } = await create("manualOwner", {
    activity: "custom",
    habitName: "قراءة كتاب",
    goal: 3,
    allowPersonalGoals: false,
  });
  for (const value of [3, 3, 3])
    await call("manualOwner", "sohbaCheckin", {
      circleId,
      day: today(),
      value,
    });
  assert.equal(
    rows.get(`sohbaCircles/${circleId}/days/${today()}`).completed,
    1,
  );
  await call("manualOwner", "sohbaCheckin", {
    circleId,
    day: today(),
    value: 1,
  });
  assert.equal(
    rows.get(`sohbaCircles/${circleId}/days/${today()}`).completed,
    0,
  );
});
