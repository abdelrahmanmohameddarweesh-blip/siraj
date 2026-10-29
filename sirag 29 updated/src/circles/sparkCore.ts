/** Spark-only circle business logic. No server functions, scheduled jobs or paid APIs. */
import {
  Activity,
  Circle,
  CircleDraft,
  CircleOptions,
  PrivateDay,
  activityOptions,
  circleDay,
  journeyDays,
  parseGoal,
} from "./model";
export type Data = Record<string, any>;
export interface Tx {
  get(path: string): Promise<Data | null>;
  set(path: string, data: Data): void;
  delete(path: string): void;
}
export interface Store {
  get(path: string): Promise<Data | null>;
  transaction<T>(work: (tx: Tx) => Promise<T>): Promise<T>;
  newId(): string;
  newCode(): string;
  now(): number;
}
export type SparkCircle = Circle & {
  members: Record<string, number>;
  nextMemberNumber: number;
  inviteVersion: number;
  startEpoch: number;
  endEpoch: number;
  lastRemovedUid: string;
};
export const root = (id: string) => `sparkCircles/${id}`;
export const own = (id: string, uid: string) => `${root(id)}/members/${uid}`;
export const publicKinds = [
  "names",
  "contributions",
  "completed",
  "pending",
  "completedProgress",
  "pendingProgress",
  "encouragement",
] as const;
export function validateName(value: string) {
  const clean = (value || "").trim();
  if (clean.length < 2 || clean.length > 50 || /[\u0000-\u001f<>]/.test(clean))
    throw new Error("اكتب اسمًا من حرفين إلى ٥٠ حرفًا");
  return clean;
}
export function validateOptions(o: CircleOptions) {
  if (!Number.isInteger(o.maxMembers) || o.maxMembers < 2 || o.maxMembers > 30)
    throw new Error("عدد الأعضاء من ٢ إلى ٣٠");
  for (const key of [
    "showNames",
    "showGroupProgress",
    "showMemberProgress",
    "showCompletedMembers",
    "showPendingMembers",
  ] as const)
    if (typeof o[key] !== "boolean") throw new Error("إعداد خصوصية غير صالح");
  return o;
}
export function recordFor(
  activity: Activity,
  goal: number,
  data: Data,
): PrivateDay & { value: number; percent: number } {
  const value =
    activity === "reading"
      ? data.pages
      : activity === "listening"
        ? data.seconds
        : data.value;
  const max = activity === "listening" ? 86400 : activityOptions[activity].max;
  if (!Number.isInteger(value) || value < 0 || value > max)
    throw new Error("بيانات تقدم غير صالحة");
  const target = goal * (activity === "listening" ? 60 : 1);
  return {
    day: data.day,
    value,
    pages: activity === "reading" ? value : 0,
    seconds: activity === "listening" ? value : 0,
    done: value >= target,
    percent: Math.min(100, Math.floor((value / target) * 100)),
  };
}
/** Physically separate collections allow rules to deny hidden fields without a server. */
export function publish(tx: Tx, id: string, m: Data) {
  const path = root(id),
    uid = m.uid,
    entries = Object.entries(m.days || {}) as [
      string,
      PrivateDay & { percent: number },
    ][];
  tx.set(`${path}/contributions/${uid}`, { uid, days: m.doneMap || {} });
  if (m.nameVisible) tx.set(`${path}/names/${uid}`, { uid, name: m.name });
  else tx.delete(`${path}/names/${uid}`);
  for (const [kind, done, percent] of [
    ["completed", true, false],
    ["pending", false, false],
    ["completedProgress", true, true],
    ["pendingProgress", false, true],
  ] as const) {
    if (!m.visible) {
      tx.delete(`${path}/${kind}/${uid}`);
      continue;
    }
    tx.set(`${path}/${kind}/${uid}`, {
      uid,
      days: Object.fromEntries(
        entries
          .filter(([, r]) => r.done === done)
          .map(([day, r]) => [day, percent ? r.percent : r.done]),
      ),
    });
  }
}
const epoch = (day: string) => Date.parse(day + "T00:00:00Z") / 86400000;
function member(
  c: SparkCircle,
  uid: string,
  name: string,
  now: number,
  code: string,
) {
  return {
    uid,
    name: validateName(name),
    activity: c.activity,
    goal: c.sharedGoal!,
    visible: true,
    nameVisible: true,
    joinedAt: now,
    updatedAt: now,
    days: {},
    doneMap: {},
    percentMap: {},
    lastDay: "",
    joinCode: code,
  };
}
function exists(c: Data | null, uid?: string): asserts c is SparkCircle {
  if (!c) throw new Error("الصحبة غير موجودة");
  if (uid && !Object.prototype.hasOwnProperty.call(c.members, uid))
    throw new Error("لم تعد عضوًا في هذه الصحبة");
}
export function sparkCore(store: Store) {
  return {
    async create(
      uid: string,
      displayName: string,
      d: CircleDraft,
      timeZone: string,
    ) {
      const dates = journeyDays(d.startDay, d.endDay),
        today = circleDay(timeZone, new Date(store.now()));
      if (d.startDay < today || epoch(d.startDay) > epoch(today) + 6)
        throw new Error("ابدأ خلال الأيام السبعة القادمة");
      const options = validateOptions({
        maxMembers: d.maxMembers,
        showNames: d.showNames,
        showGroupProgress: d.showGroupProgress,
        showMemberProgress: d.showMemberProgress,
        showCompletedMembers: d.showCompletedMembers,
        showPendingMembers: d.showPendingMembers,
      });
      const id = store.newId(),
        code = store.newCode(),
        now = store.now();
      const c: SparkCircle = {
        id,
        name: validateName(d.name),
        activity: d.activity,
        sharedGoal: parseGoal(String(d.goal), d.activity),
        habitName:
          d.activity === "custom" ? validateName(d.habitName || "") : null,
        startDay: d.startDay,
        endDay: dates[dates.length - 1],
        startEpoch: epoch(d.startDay),
        endEpoch: epoch(d.endDay),
        timeZone,
        ownerUid: uid,
        memberCount: 1,
        members: { [uid]: 1 },
        nextMemberNumber: 2,
        inviteVersion: 1,
        lastRemovedUid: "",
        createdAt: now,
        ...options,
      };
      await store.transaction(async (tx) => {
        if (await tx.get(root(id))) throw new Error("حاول مرة أخرى");
        const m = member(c, uid, displayName, now, "");
        tx.set(root(id), c);
        tx.set(own(id, uid), m);
        publish(tx, id, m);
        tx.set(`${root(id)}/secrets/invite`, { code, version: 1 });
        tx.set(`sparkInvites/${code}`, { circleId: id, version: 1 });
        tx.set(`sparkAccounts/${uid}/circles/${id}`, { circleId: id });
      });
      return { circleId: id, code };
    },
    async join(uid: string, displayName: string, code: string) {
      return store.transaction(async (tx) => {
        const invitation = await tx.get(`sparkInvites/${code}`);
        if (!invitation) throw new Error("الدعوة غير صالحة أو تم تغييرها");
        const id = invitation.circleId,
          c = await tx.get(root(id));
        exists(c);
        if (Object.prototype.hasOwnProperty.call(c.members, uid))
          return { circleId: id };
        if (c.inviteVersion !== invitation.version)
          throw new Error("الدعوة قديمة. اطلب رمزًا جديدًا");
        if (c.memberCount >= c.maxMembers!)
          throw new Error("اكتمل عدد أعضاء الصحبة");
        if (circleDay(c.timeZone, new Date(store.now())) > c.endDay)
          throw new Error("انتهت رحلة هذه الصحبة");
        const m = member(c, uid, displayName, store.now(), code);
        tx.set(root(id), {
          ...c,
          members: { ...c.members, [uid]: c.nextMemberNumber },
          nextMemberNumber: c.nextMemberNumber + 1,
          memberCount: c.memberCount + 1,
        });
        tx.set(own(id, uid), m);
        publish(tx, id, m);
        tx.set(`sparkAccounts/${uid}/circles/${id}`, { circleId: id });
        return { circleId: id };
      });
    },
    async checkin(uid: string, id: string, data: Data) {
      return store.transaction(async (tx) => {
        const c = await tx.get(root(id)),
          m = await tx.get(own(id, uid));
        exists(c, uid);
        if (!m) throw new Error("عضوية غير موجودة");
        const day = circleDay(c.timeZone, new Date(store.now()));
        if (data.day !== day || day < c.startDay || day > c.endDay)
          throw new Error("يمكن تحديث تقدم اليوم فقط أثناء الرحلة");
        const r = recordFor(m.activity, m.goal, data);
        if (m.days[day]?.value === r.value) return false;
        const updated = {
          ...m,
          days: { ...m.days, [day]: r },
          doneMap: { ...m.doneMap, [day]: r.done },
          percentMap: { ...m.percentMap, [day]: r.percent },
          lastDay: day,
          updatedAt: store.now(),
        };
        tx.set(own(id, uid), updated);
        publish(tx, id, updated);
        return true;
      });
    },
    async preferences(
      uid: string,
      id: string,
      visible: boolean,
      nameVisible: boolean,
    ) {
      await store.transaction(async (tx) => {
        const c = await tx.get(root(id)),
          m = await tx.get(own(id, uid));
        exists(c, uid);
        if (!m) throw new Error("عضوية غير موجودة");
        const updated = { ...m, visible, nameVisible, updatedAt: store.now() };
        tx.set(own(id, uid), updated);
        publish(tx, id, updated);
      });
    },
    async update(
      uid: string,
      id: string,
      data: CircleOptions & { name: string },
    ) {
      const options = validateOptions(data),
        name = validateName(data.name);
      await store.transaction(async (tx) => {
        const c = await tx.get(root(id));
        exists(c, uid);
        if (c.ownerUid !== uid) throw new Error("متاح لمنشئ الصحبة فقط");
        if (options.maxMembers < c.memberCount)
          throw new Error("الحد أقل من عدد الأعضاء الحالي");
        tx.set(root(id), { ...c, ...options, name });
      });
    },
    async rotate(uid: string, id: string) {
      const code = store.newCode();
      await store.transaction(async (tx) => {
        const c = await tx.get(root(id));
        exists(c, uid);
        if (c.ownerUid !== uid) throw new Error("متاح لمنشئ الصحبة فقط");
        const old = await tx.get(`${root(id)}/secrets/invite`);
        const version = c.inviteVersion + 1;
        tx.set(root(id), { ...c, inviteVersion: version });
        if (old) tx.delete(`sparkInvites/${old.code}`);
        tx.set(`sparkInvites/${code}`, { circleId: id, version });
        tx.set(`${root(id)}/secrets/invite`, { code, version });
      });
      return { code };
    },
    async redactRemoval(uid: string, id: string) {
      await store.transaction(async (tx) => {
        const c = await tx.get(root(id));
        if (c && c.lastRemovedUid === uid)
          tx.set(root(id), { ...c, lastRemovedUid: "" });
      });
    },
    async leave(uid: string, id: string, target = uid) {
      await store.transaction(async (tx) => {
        const c = await tx.get(root(id));
        exists(c, uid);
        if (target !== uid && c.ownerUid !== uid) throw new Error("غير مسموح");
        if (!Object.prototype.hasOwnProperty.call(c.members, target)) return;
        const members = { ...c.members };
        delete members[target];
        const remaining = Object.keys(members);
        const secret = remaining.length
          ? null
          : await tx.get(`${root(id)}/secrets/invite`);
        if (remaining.length)
          tx.set(root(id), {
            ...c,
            members,
            memberCount: remaining.length,
            ownerUid: target === c.ownerUid ? remaining[0] : c.ownerUid,
            inviteVersion: c.inviteVersion + 1,
            lastRemovedUid: target,
          });
        else {
          tx.delete(root(id));
          if (secret) {
            tx.delete(`sparkInvites/${secret.code}`);
            tx.delete(`${root(id)}/secrets/invite`);
          }
        }
        tx.delete(own(id, target));
        for (const kind of publicKinds)
          tx.delete(`${root(id)}/${kind}/${target}`);
        tx.delete(`sparkAccounts/${target}/circles/${id}`);
      });
    },
  };
}
