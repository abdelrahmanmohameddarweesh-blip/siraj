class InputError extends Error {}
const DAY = 86400000;
function days(start) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(start) ||
    !Number.isFinite(Date.parse(start + "T12:00:00Z")) ||
    new Date(start + "T12:00:00Z").toISOString().slice(0, 10) !== start
  )
    throw new InputError("تاريخ غير صالح");
  return Array.from({ length: 7 }, (_, i) =>
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
function goal(value, activity) {
  if (
    !["reading", "listening"].includes(activity) ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > (activity === "reading" ? 604 : 180)
  )
    throw new InputError("اختر هدفًا صحيحًا: ١–٦٠٤ صفحة أو ١–١٨٠ دقيقة");
  return value;
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
  if (
    !Number.isInteger(pages) ||
    pages < 0 ||
    pages > 604 ||
    !Number.isInteger(seconds) ||
    seconds < 0 ||
    seconds > 86400
  )
    throw new InputError("بيانات تقدم غير صالحة");
  return member.activity === "reading"
    ? pages >= member.goal
    : seconds >= member.goal * 60;
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
};
