import { CircleDetail, Companion, Membership } from "./model";
import { Data, SparkCircle } from "./sparkCore";
type Rows = Record<string, Data[]>;
export function buildSparkDetail(
  c: SparkCircle,
  m: Data,
  rows: Rows,
): CircleDetail {
  const lookup = (kind: string) =>
    Object.fromEntries((rows[kind] || []).map((r) => [r.uid, r]));
  const names = lookup("names"),
    completed = lookup("completed"),
    pending = lookup("pending"),
    cp = lookup("completedProgress"),
    pp = lookup("pendingProgress");
  const companions: Companion[] = Object.keys(c.members).map((uid) => ({
    uid,
    name:
      c.showNames && names[uid] ? names[uid].name : `رفيق ${c.members[uid]}`,
    alias: `رفيق ${c.members[uid]}`,
    visible: !!(completed[uid] || pending[uid]),
    statuses: {
      ...(c.showPendingMembers ? pending[uid]?.days || {} : {}),
      ...(c.showCompletedMembers ? completed[uid]?.days || {} : {}),
    },
    progress: {
      ...(c.showMemberProgress && c.showPendingMembers
        ? pp[uid]?.days || {}
        : {}),
      ...(c.showMemberProgress && c.showCompletedMembers
        ? cp[uid]?.days || {}
        : {}),
    },
  }));
  const days: Record<string, number> = {};
  if (c.showGroupProgress)
    for (const contribution of rows.contributions || [])
      for (const [day, done] of Object.entries(contribution.days))
        if (done) days[day] = (days[day] || 0) + 1;
  const byUid = Object.fromEntries(
    companions.map((person) => [person.uid, person.name]),
  );
  return {
    circle: c,
    member: {
      ...m,
      reminders: false,
      summary: false,
      reminderHour: 20,
      reminderMinute: 0,
    } as Membership,
    companions,
    days,
    mine: m.days || {},
    encouragement: (rows.encouragement || [])
      .map((r) => ({
        id: r.uid,
        name: byUid[r.uid] || "رفيق",
        message: r.message,
        day: r.day,
        createdAt: r.createdAt,
      }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20),
  };
}
