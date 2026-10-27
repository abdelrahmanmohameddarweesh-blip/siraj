const { test } = require("node:test");
const assert = require("node:assert/strict");
const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
const auth = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
async function user(name) {
  const r = await fetch(`${auth}/accounts:signUp?key=demo-api-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: "TestPassword123!",
      returnSecureToken: true,
    }),
  });
  const j = await r.json();
  assert.ok(j.idToken, JSON.stringify(j));
  return { token: j.idToken, uid: j.localId };
}
async function call(u, name, data) {
  const r = await fetch(
    `http://127.0.0.1:5001/demo-siraj/europe-west1/${name}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${u.token}`,
      },
      body: JSON.stringify({ data }),
    },
  );
  const j = await r.json();
  if (j.error) {
    const e = new Error(j.error.message);
    e.status = j.error.status;
    throw e;
  }
  return j.result;
}
async function read(u, path) {
  return fetch(
    `http://127.0.0.1:8080/v1/projects/demo-siraj/databases/(default)/documents/${path}`,
    { headers: { Authorization: `Bearer ${u.token}` } },
  );
}
const date = () => new Date().toISOString().slice(0, 10);
test(
  "real callable + Firestore rules: private membership, idempotent check-ins, privacy, revocation and transfer",
  { skip: !enabled, timeout: 120000 },
  async () => {
    const [owner, friend, stranger] = await Promise.all([
      user("owner"),
      user("friend"),
      user("stranger"),
    ]);
    const created = await call(owner, "sohbaCreate", {
      name: "صحبة الاختبار",
      allowPersonalGoals: true,
      displayName: "أحمد",
      activity: "reading",
      goal: 2,
      visible: true,
      startDay: date(),
      timeZone: "UTC",
    });
    const id = created.circleId,
      root = `sohbaCircles/${id}`;
    const preview = await call(stranger, "sohbaPreview", {
      code: created.code,
    });
    assert.equal(preview.name, "صحبة الاختبار");
    assert.equal(preview.ownerUid, undefined);
    assert.equal((await read(stranger, root)).status, 403);
    await call(friend, "sohbaJoin", {
      code: created.code,
      displayName: "مريم",
      activity: "listening",
      goal: 10,
      visible: false,
    });
    await call(friend, "sohbaJoin", {
      code: created.code,
      displayName: "مريم",
      activity: "listening",
      goal: 10,
      visible: false,
    });
    let c = await (await read(owner, root)).json();
    assert.equal(c.fields.memberCount.integerValue, "2");
    assert.equal(
      (await read(owner, `${root}/members/${friend.uid}`)).status,
      403,
    );
    assert.equal(
      (await read(friend, `${root}/members/${friend.uid}`)).status,
      200,
    );
    for (let i = 0; i < 3; i++)
      await call(owner, "sohbaCheckin", {
        circleId: id,
        day: date(),
        pages: 2,
        seconds: 0,
      });
    await call(friend, "sohbaCheckin", {
      circleId: id,
      day: date(),
      pages: 0,
      seconds: 600,
    });
    let aggregate = await (await read(owner, `${root}/days/${date()}`)).json();
    assert.equal(aggregate.fields.completed.integerValue, "2");
    let pub = await (
      await read(owner, `${root}/companions/${friend.uid}`)
    ).json();
    assert.ok(pub.fields.statuses.mapValue.fields[date()].nullValue === null);
    await call(owner, "sohbaCheckin", {
      circleId: id,
      day: date(),
      pages: 1,
      seconds: 0,
    });
    aggregate = await (await read(owner, `${root}/days/${date()}`)).json();
    assert.equal(aggregate.fields.completed.integerValue, "1");
    await assert.rejects(
      call(stranger, "sohbaCheckin", {
        circleId: id,
        day: date(),
        pages: 2,
        seconds: 0,
      }),
    );
    await assert.rejects(
      call(owner, "sohbaCheckin", {
        circleId: id,
        day: "2099-01-01",
        pages: 2,
        seconds: 0,
      }),
    );
    await call(owner, "sohbaPreferences", {
      circleId: id,
      visible: false,
      reminders: false,
      summary: false,
      reminderHour: 20,
      reminderMinute: 0,
    });
    pub = await (await read(friend, `${root}/companions/${owner.uid}`)).json();
    assert.ok(pub.fields.statuses.mapValue.fields[date()].nullValue === null);
    await call(friend, "sohbaEncourage", {
      circleId: id,
      message: "معًا نستمر",
    });
    await assert.rejects(
      call(friend, "sohbaEncourage", {
        circleId: id,
        message: "arbitrary chat",
      }),
    );
    await call(friend, "sohbaReport", {
      circleId: id,
      reason: "اختبار الإبلاغ",
    });
    assert.equal((await read(friend, "sohbaReports")).status, 403);
    const changed = await call(owner, "sohbaRotateInvite", { circleId: id });
    await assert.rejects(
      call(stranger, "sohbaPreview", { code: created.code }),
    );
    assert.equal(
      (await call(stranger, "sohbaPreview", { code: changed.code })).circleId,
      id,
    );
    await call(owner, "sohbaLeave", { circleId: id });
    c = await (await read(friend, root)).json();
    assert.equal(c.fields.ownerUid.stringValue, friend.uid);
    assert.equal((await read(owner, root)).status, 403);
    await call(friend, "sohbaLeave", { circleId: id });
    await assert.rejects(
      call(stranger, "sohbaPreview", { code: changed.code }),
    );
  },
);
test(
  "concurrent joins never exceed ten and creator can revoke member access",
  { skip: !enabled, timeout: 120000 },
  async () => {
    const owner = await user("capacityowner"),
      created = await call(owner, "sohbaCreate", {
        name: "صحبة العدد",
        displayName: "المنشئ",
        activity: "reading",
        goal: 1,
        visible: false,
        startDay: date(),
        timeZone: "UTC",
      });
    const users = await Promise.all(
      Array.from({ length: 11 }, (_, i) => user("capacity" + i)),
    );
    const results = await Promise.allSettled(
      users.map((u) =>
        call(u, "sohbaJoin", {
          code: created.code,
          displayName: "رفيق",
          activity: "reading",
          goal: 1,
          visible: false,
        }),
      ),
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 9);
    const root = `sohbaCircles/${created.circleId}`;
    const c = await (await read(owner, root)).json();
    assert.equal(c.fields.memberCount.integerValue, "10");
    const joined = users[results.findIndex((r) => r.status === "fulfilled")];
    await call(owner, "sohbaLeave", {
      circleId: created.circleId,
      memberUid: joined.uid,
    });
    assert.equal((await read(joined, root)).status, 403);
  },
);
