class InputError extends Error {}
const DAY = 86400000;
function days(start, count = 7) {
  if (!Number.isInteger(count) || count < 1 || count > 90)
    throw new InputError("المدة من يوم إلى ٩٠ يومًا");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !Number.isFinite(Date.parse(start + "T12:00:00Z")) ||
    new Date(start + "T12:00:00Z").toISOString().slice(0, 10) !== start
  )
    throw new InputError("تاريخ غير صالح");
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.parse(start + "T12:00:00Z") + i * DAY)
      .toISOString()
      .slice(0, 10),
  );
}
function dayIn(timeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (t) => parts.find((p) => p.type === t).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
const limits = {
  reading: 604,
  listening: 180,
  prayers: 5,
  adhkar_morning: 1,
  adhkar_evening: 1,
  hifz: 1000,
  hifz_review: 1000,
  custom: 10000,
};
function goal(value, activity) {
  if (
    !Object.hasOwn(limits, activity) ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > limits[activity]
  )
    throw new InputError("اختر هدفًا صحيحًا يناسب العادة");
  return value;
}
function settings(data, legacy = false) {
  const maxMembers = data.maxMembers ?? 10;
  if (!Number.isInteger(maxMembers) || maxMembers < 2 || maxMembers > 30)
    throw new InputError("عدد الأعضاء من ٢ إلى ٣٠");
  const bool = (key, fallback) => {
    if (data[key] !== undefined && typeof data[key] !== "boolean")
      throw new InputError("إعداد خصوصية غير صالح");
    return data[key] ?? fallback;
  };
  return {
    maxMembers,
    showNames: bool("showNames", true),
    showGroupProgress: bool("showGroupProgress", true),
    showMemberProgress: bool("showMemberProgress", false),
    showCompletedMembers: bool("showCompletedMembers", true),
    showPendingMembers: bool("showPendingMembers", legacy),
    allowPersonalGoals: bool("allowPersonalGoals", legacy),
  };
}
function journey(start, end) {
  days(start, 1);
  days(end, 1);
  const count =
    Math.round(
      (Date.parse(end + "T12:00:00Z") - Date.parse(start + "T12:00:00Z")) / DAY,
    ) + 1;
  return days(start, count);
}
function entry(member, data) {
  const pages = data.pages ?? 0,
    seconds = data.seconds ?? 0;
  if (
    !Number.isInteger(pages) ||
    pages < 0 ||
    pages > 604 ||
    !Number.isInteger(seconds) ||
    seconds < 0 ||
    seconds > 86400
  )
    throw new InputError("بيانات تقدم غير صالحة");
  const value =
    member.activity === "reading"
      ? pages
      : member.activity === "listening"
        ? seconds
        : data.value;
  const max = member.activity === "listening" ? 86400 : limits[member.activity];
  if (!Number.isInteger(value) || value < 0 || value > max)
    throw new InputError("بيانات تقدم غير صالحة");
  const target = member.goal * (member.activity === "listening" ? 60 : 1);
  return {
    value,
    pages: member.activity === "reading" ? pages : 0,
    seconds: member.activity === "listening" ? seconds : 0,
    done: value >= target,
    percent: Math.min(100, Math.floor((value / target) * 100)),
  };
}
function projection(member, circle, history = {}) {
  const named = circle.showNames !== false && member.nameVisible !== false;
  const statuses = {},
    progress = {};
  for (const [day, record] of Object.entries(history)) {
    const allowed =
      member.visible &&
      (record.done
        ? circle.showCompletedMembers !== false
        : circle.showPendingMembers !== false);
    statuses[day] = allowed ? record.done : null;
    progress[day] =
      allowed && circle.showMemberProgress === true
        ? (record.percent ?? (record.done ? 100 : 0))
        : null;
  }
  return {
    uid: member.uid,
    name: named ? member.name : member.alias || "رفيق",
    alias: member.alias || "رفيق",
    visible: member.visible,
    nameVisible: member.nameVisible !== false,
    joinedAt: member.joinedAt,
    statuses,
    progress,
  };
}
function text(value, max = 50) {
  if (
    typeof value !== "string" ||
    value.trim().length < 2 ||
    value.trim().length > max ||
    /[\u0000-\u001f<>]/.test(value)
  )
    throw new InputError("اكتب اسمًا صالحًا من حرفين إلى " + max + " حرفًا");
  return value.trim();
}
function completion(member, pages, seconds) {
  return entry(member, { pages, seconds }).done;
}
// The first scheduler tick AFTER the selected time, including midnight rollover.
function reminderDay(timeZone, hour, minute, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const clock =
    Number(parts.find((p) => p.type === "hour").value) * 60 +
    Number(parts.find((p) => p.type === "minute").value);
  const elapsed = (clock - (hour * 60 + minute) + 1440) % 1440;
  return elapsed < 15
    ? dayIn(timeZone, new Date(now.getTime() - elapsed * 60000))
    : null;
}
module.exports = {
  days,
  dayIn,
  goal,
  text,
  completion,
  InputError,
  reminderDay,
  settings,
  journey,
  entry,
  projection,
};
