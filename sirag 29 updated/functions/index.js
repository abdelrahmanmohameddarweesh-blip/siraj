const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { randomBytes, createHash } = require("node:crypto");
const {
  days,
  dayIn,
  goal,
  text,
  completion,
  InputError,
  reminderDay,
} = require("./domain");
initializeApp();
const db = getFirestore();
const region = "europe-west1";
const circleRef = (id) => db.collection("sohbaCircles").doc(id);
const codeHash = (code) => createHash("sha256").update(code).digest("hex");
const uidOf = (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "سجّل الدخول أولًا");
  return req.auth.uid;
};
function requireLinked(req) {
  const uid = uidOf(req);
  if (req.auth.token.firebase?.sign_in_provider === "anonymous")
    throw new HttpsError(
      "failed-precondition",
      "اربط حسابك بالبريد الإلكتروني أولًا",
    );
  return uid;
}
function idOf(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9]{1,40}$/.test(value))
    throw new HttpsError("invalid-argument", "رمز غير صالح");
  return value;
}
function fail(e) {
  if (e instanceof HttpsError) throw e;
  if (e instanceof InputError)
    throw new HttpsError("invalid-argument", e.message);
  console.error(e);
  throw new HttpsError("internal", "تعذّر الاتصال بخدمة الصحبة. حاول مجددًا.");
}
const callable = (handler) =>
  onCall({ region, maxInstances: 10 }, async (req) => {
    try {
      return await handler(req);
    } catch (e) {
      fail(e);
    }
  });
function publicMember(m) {
  return { uid: m.uid, name: m.name, visible: m.visible, joinedAt: m.joinedAt };
}
async function rate(tx, uid, action, limit) {
  const ref = db.doc(`sohbaLimits/${uid}_${action}`);
  const s = await tx.get(ref);
  const hour = Math.floor(Date.now() / 3600000);
  const count = s.exists && s.data().hour === hour ? s.data().count : 0;
  if (count >= limit)
    throw new HttpsError("resource-exhausted", "محاولات كثيرة، حاول لاحقًا");
  return () => tx.set(ref, { hour, count: count + 1 });
}
exports.sohbaCreate = callable(async (req) => {
  const uid = requireLinked(req),
    d = req.data || {},
    name = text(d.name),
    displayName = text(d.displayName),
    activity = d.activity;
  const target = goal(d.goal, activity),
    zone = d.timeZone;
  let today;
  if (typeof zone !== "string" || zone.length > 64)
    throw new InputError("منطقة زمنية غير صالحة");
  try {
    today = dayIn(zone);
  } catch {
    throw new InputError("منطقة زمنية غير صالحة");
  }
  const journey = days(d.startDay);
  if (d.startDay < today || d.startDay > days(today)[6])
    throw new InputError("ابدأ خلال الأيام السبعة القادمة");
  const ref = db.collection("sohbaCircles").doc();
  const code = randomBytes(6).toString("hex").toUpperCase();
  const now = Date.now();
  const member = {
    uid,
    name: displayName,
    activity,
    goal: target,
    visible: d.visible === true,
    joinedAt: now,
    reminderHour: 20,
    reminderMinute: 0,
    reminders: false,
    summary: false,
  };
  await db.runTransaction(async (tx) => {
    const consume = await rate(tx, uid, "create", 5);
    const memberships = await tx.get(
      db.collection("sohbaAccounts").doc(uid).collection("circles"),
    );
    if (
      memberships.docs.filter((s) => (s.data().endDay || "9999") >= today)
        .length >= 10
    )
      throw new InputError("الحد الأقصى عشر صحبات نشطة");
    consume();
    tx.create(ref, {
      name,
      ownerUid: uid,
      activity,
      startDay: d.startDay,
      endDay: journey[6],
      timeZone: zone,
      memberCount: 1,
      createdAt: now,
      inviteHash: codeHash(code),
    });
    tx.create(ref.collection("members").doc(uid), member);
    tx.create(ref.collection("companions").doc(uid), publicMember(member));
    tx.create(db.doc(`sohbaAccounts/${uid}/circles/${ref.id}`), {
      circleId: ref.id,
      name,
      endDay: journey[6],
    });
    tx.create(db.doc(`sohbaInvites/${codeHash(code)}`), {
      circleId: ref.id,
      createdAt: now,
    });
  });
  return { circleId: ref.id, code };
});
exports.sohbaPreview = callable(async (req) => {
  const uid = uidOf(req),
    code = idOf(String(req.data?.code || "").toUpperCase());
  // Preview reveals only invitation information, never membership or progress.
  const ref = await db.doc(`sohbaInvites/${codeHash(code)}`).get();
  await db.runTransaction(async (tx) => {
    const consume = await rate(tx, uid, "preview", 40);
    consume();
  });
  if (!ref.exists)
    throw new HttpsError("not-found", "الدعوة غير صالحة أو تم تغييرها");
  const c = await circleRef(ref.data().circleId).get();
  if (!c.exists) throw new HttpsError("not-found", "الصحبة غير موجودة");
  const { name, activity, startDay, endDay, memberCount, timeZone } = c.data();
  return {
    circleId: c.id,
    name,
    activity,
    startDay,
    endDay,
    memberCount,
    timeZone,
  };
});
exports.sohbaJoin = callable(async (req) => {
  const uid = requireLinked(req),
    d = req.data || {},
    code = idOf(String(d.code || "").toUpperCase()),
    name = text(d.displayName);
  return db.runTransaction(async (tx) => {
    const consume = await rate(tx, uid, "join", 20);
    const invite = await tx.get(db.doc(`sohbaInvites/${codeHash(code)}`));
    if (!invite.exists) throw new HttpsError("not-found", "الدعوة غير صالحة");
    const ref = circleRef(invite.data().circleId),
      snap = await tx.get(ref);
    if (!snap.exists) throw new InputError("الصحبة غير موجودة");
    const c = snap.data();
    const mref = ref.collection("members").doc(uid),
      existing = await tx.get(mref);
    if (existing.exists) return { circleId: ref.id };
    const memberships = await tx.get(
      db.collection("sohbaAccounts").doc(uid).collection("circles"),
    );
    if (
      memberships.docs.filter(
        (s) => (s.data().endDay || "9999") >= dayIn(c.timeZone),
      ).length >= 10
    )
      throw new InputError("الحد الأقصى عشر صحبات نشطة");
    if (c.memberCount >= 10 || dayIn(c.timeZone) > c.endDay)
      throw new InputError("الصحبة مكتملة العدد أو انتهت");
    const activity = d.activity || c.activity;
    const target = goal(d.goal, activity);
    const member = {
      uid,
      name,
      activity,
      goal: target,
      visible: d.visible === true,
      joinedAt: Date.now(),
      reminderHour: 20,
      reminderMinute: 0,
      reminders: false,
      summary: false,
    };
    consume();
    tx.create(mref, member);
    tx.create(ref.collection("companions").doc(uid), publicMember(member));
    tx.set(db.doc(`sohbaAccounts/${uid}/circles/${ref.id}`), {
      circleId: ref.id,
      name: c.name,
      endDay: c.endDay,
    });
    tx.update(ref, { memberCount: c.memberCount + 1 });
    return { circleId: ref.id };
  });
});
exports.sohbaCheckin = callable(async (req) => {
  const uid = uidOf(req),
    d = req.data || {},
    ref = circleRef(idOf(d.circleId));
  return db.runTransaction(async (tx) => {
    const cdoc = await tx.get(ref),
      mref = ref.collection("members").doc(uid),
      ms = await tx.get(mref);
    if (!cdoc.exists || !ms.exists)
      throw new HttpsError("permission-denied", "هذه الصحبة خاصة بأعضائها");
    const c = cdoc.data(),
      m = ms.data(),
      day = dayIn(c.timeZone);
    if (day < c.startDay || day > c.endDay || d.day !== day)
      throw new InputError("يمكن تحديث تقدم اليوم فقط خلال الرحلة");
    const done = completion(m, d.pages, d.seconds),
      privateRef = mref.collection("days").doc(day),
      old = await tx.get(privateRef),
      dayRef = ref.collection("days").doc(day),
      group = await tx.get(dayRef),
      pubRef = ref.collection("companions").doc(uid);
    const count = Math.max(
      0,
      (group.data()?.completed || 0) +
        Number(done) -
        Number(old.data()?.done || false),
    );
    tx.set(privateRef, {
      day,
      pages: d.pages,
      seconds: d.seconds,
      done,
      updatedAt: Date.now(),
    });
    tx.set(dayRef, { day, completed: count });
    tx.set(
      pubRef,
      { statuses: { [day]: m.visible ? done : null } },
      { merge: true },
    );
    return { done };
  });
});
exports.sohbaPreferences = callable(async (req) => {
  const uid = uidOf(req),
    d = req.data || {},
    ref = circleRef(idOf(d.circleId));
  await db.runTransaction(async (tx) => {
    const mref = ref.collection("members").doc(uid),
      ms = await tx.get(mref);
    if (!ms.exists)
      throw new HttpsError("permission-denied", "عضوية غير موجودة");
    const history = await tx.get(mref.collection("days"));
    const visible = d.visible === true;
    const hour = d.reminderHour,
      minute = d.reminderMinute;
    if (
      !Number.isInteger(hour) ||
      hour < 0 ||
      hour > 23 ||
      !Number.isInteger(minute) ||
      minute < 0 ||
      minute > 59
    )
      throw new InputError("وقت غير صالح");
    const token =
      typeof d.pushToken === "string" &&
      /^ExponentPushToken\[[A-Za-z0-9_-]+\]$|^ExpoPushToken\[[A-Za-z0-9_-]+\]$/.test(
        d.pushToken,
      )
        ? d.pushToken
        : null;
    tx.update(mref, {
      visible,
      reminders: d.reminders === true,
      summary: d.summary === true,
      reminderHour: hour,
      reminderMinute: minute,
      pushToken: token,
    });
    tx.set(
      ref.collection("companions").doc(uid),
      {
        visible,
        statuses: Object.fromEntries(
          history.docs.map((s) => [s.id, visible ? s.data().done : null]),
        ),
      },
      { merge: true },
    );
  });
  return { ok: true };
});
exports.sohbaEncourage = callable(async (req) => {
  const uid = uidOf(req),
    d = req.data || {},
    ref = circleRef(idOf(d.circleId));
  if (!["بارك الله فيكم", "معًا نستمر", "تقبّل الله"].includes(d.message))
    throw new InputError("اختر رسالة التشجيع");
  await db.runTransaction(async (tx) => {
    const ms = await tx.get(ref.collection("members").doc(uid)),
      cs = await tx.get(ref);
    if (!ms.exists)
      throw new HttpsError("permission-denied", "عضوية غير موجودة");
    const day = dayIn(cs.data().timeZone);
    const reaction = ref.collection("encouragement").doc(`${day}_${uid}`),
      old = await tx.get(reaction);
    if (old.exists && Date.now() - old.data().createdAt < 60000)
      throw new InputError("انتظر دقيقة قبل التشجيع مجددًا");
    tx.set(reaction, {
      name: ms.data().name,
      message: d.message,
      day,
      createdAt: Date.now(),
    });
  });
  return { ok: true };
});
exports.sohbaRotateInvite = callable(async (req) => {
  const uid = uidOf(req),
    ref = circleRef(idOf(req.data?.circleId)),
    code = randomBytes(6).toString("hex").toUpperCase();
  await db.runTransaction(async (tx) => {
    const s = await tx.get(ref);
    if (s.data()?.ownerUid !== uid)
      throw new HttpsError("permission-denied", "متاح لمنشئ الصحبة فقط");
    tx.delete(db.doc(`sohbaInvites/${s.data().inviteHash}`));
    tx.create(db.doc(`sohbaInvites/${codeHash(code)}`), {
      circleId: ref.id,
      createdAt: Date.now(),
    });
    tx.update(ref, { inviteHash: codeHash(code) });
  });
  return { code };
});
exports.sohbaLeave = callable(async (req) => {
  const uid = uidOf(req),
    d = req.data || {},
    ref = circleRef(idOf(d.circleId)),
    target = d.memberUid ? idOf(d.memberUid) : uid;
  await db.runTransaction(async (tx) => {
    const cs = await tx.get(ref);
    if (!cs.exists) throw new InputError("الصحبة غير موجودة");
    const c = cs.data();
    if (target !== uid && c.ownerUid !== uid)
      throw new HttpsError("permission-denied", "غير مسموح");
    const mref = ref.collection("members").doc(target),
      m = await tx.get(mref);
    if (!m.exists) return;
    const members = await tx.get(ref.collection("members"));
    const history = await tx.get(mref.collection("days"));
    const groups = await Promise.all(
      history.docs.map((s) => tx.get(ref.collection("days").doc(s.id))),
    );
    const reactions = await tx.get(ref.collection("encouragement"));
    history.docs.forEach((s, i) => {
      if (s.data().done)
        tx.set(groups[i].ref, {
          day: s.id,
          completed: Math.max(0, (groups[i].data()?.completed || 0) - 1),
        });
      tx.delete(s.ref);
    });
    reactions.docs
      .filter((s) => s.id.endsWith("_" + target))
      .forEach((s) => tx.delete(s.ref));
    tx.delete(mref);
    tx.delete(ref.collection("companions").doc(target));
    tx.delete(db.doc(`sohbaAccounts/${target}/circles/${ref.id}`));
    const remaining = members.docs.filter((s) => s.id !== target);
    if (target !== uid) tx.delete(db.doc(`sohbaInvites/${c.inviteHash}`));
    if (!remaining.length) {
      tx.delete(db.doc(`sohbaInvites/${c.inviteHash}`));
      tx.delete(ref);
    } else
      tx.update(ref, {
        memberCount: remaining.length,
        ownerUid: target === c.ownerUid ? remaining[0].id : c.ownerUid,
      });
  });
  return { ok: true };
});
exports.sohbaReport = callable(async (req) => {
  const uid = uidOf(req),
    d = req.data || {},
    ref = circleRef(idOf(d.circleId));
  const member = await ref.collection("members").doc(uid).get();
  if (!member.exists)
    throw new HttpsError("permission-denied", "عضوية غير موجودة");
  const reason = text(d.reason, 500);
  await db.runTransaction(async (tx) => {
    const consume = await rate(tx, uid, "report", 5);
    consume();
    tx.create(db.collection("sohbaReports").doc(), {
      circleId: ref.id,
      reporterUid: uid,
      reason,
      createdAt: Date.now(),
      status: "new",
    });
  });
  return { ok: true };
});

// Send personal reminders and optional aggregate summaries. No individual misses
// or private page/minute totals are included. Requires a native Expo push token.
exports.sohbaReminders = onSchedule(
  { region, schedule: "every 15 minutes", timeZone: "UTC", maxInstances: 1 },
  async () => {
    const now = new Date();
    const active = await db
      .collection("sohbaCircles")
      .where(
        "endDay",
        ">=",
        new Date(now.getTime() - 86400000).toISOString().slice(0, 10),
      )
      .get();
    for (const circle of active.docs) {
      const c = circle.data(),
        day = dayIn(c.timeZone);
      if (day < c.startDay || day > days(c.endDay)[1]) continue;
      const members = await circle.ref.collection("members").get();
      for (const mdoc of members.docs) {
        const m = mdoc.data();
        if (!m.pushToken || (!m.reminders && !m.summary)) continue;
        const reminderDate = reminderDay(
          c.timeZone,
          m.reminderHour,
          m.reminderMinute,
          now,
        );
        if (
          !reminderDate ||
          reminderDate < c.startDay ||
          reminderDate > c.endDay
        )
          continue;
        const own = await mdoc.ref.collection("days").doc(reminderDate).get();
        if (!m.summary && own.data()?.done) continue;
        const group = await circle.ref
          .collection("days")
          .doc(reminderDate)
          .get();
        const delivery = mdoc.ref.collection("deliveries").doc(reminderDate);
        const claimed = await db.runTransaction(async (tx) => {
          if ((await tx.get(delivery)).exists) return false;
          tx.create(delivery, { createdAt: Date.now() });
          return true;
        });
        if (!claimed) continue;
        try {
          const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: m.pushToken,
              title: `صحبة · ${c.name}`,
              body: m.summary
                ? `أتمّ ${group.data()?.completed || 0} من ${c.memberCount} رفاق نيتهم ${reminderDate === day ? "اليوم" : `في ${reminderDate}`}. معًا نستمر.`
                : "وردك اليوم ينتظرك، ولو بخطوة صغيرة.",
              sound: "default",
              channelId: "sohba",
              data: { screen: "Sohba", circleId: circle.id },
            }),
          });
          const result = await response.json();
          if (!response.ok || result.data?.status === "error") {
            console.error(
              "Sohba push failed",
              response.status,
              result.data?.details?.error || "push-error",
            );
            if (result.data?.details?.error === "DeviceNotRegistered")
              await mdoc.ref.update({ pushToken: null });
            else await delivery.delete();
          }
        } catch (e) {
          await delivery.delete();
          console.error("Sohba push transport failed");
        }
      }
    }
  },
);
