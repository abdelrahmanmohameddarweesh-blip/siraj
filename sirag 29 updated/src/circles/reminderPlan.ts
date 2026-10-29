import { localDay } from "../habits/habitData";
/** A small rolling plan in device-local time; no background service is needed. */
export function circleReminderDates(
  now: Date,
  hour: number,
  minute: number,
  startEpoch: number,
  endEpoch: number,
  capacity: number,
): Date[] {
  const first = Math.max(
      0,
      startEpoch - Date.parse(localDay(now) + "T00:00:00Z") / 86400000,
    ),
    out: Date[] = [];
  for (
    let offset = first;
    offset < first + 4 && out.length < Math.min(3, capacity);
    offset++
  ) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    date.setHours(hour, minute, 0, 0);
    const day = Date.parse(localDay(date) + "T00:00:00Z") / 86400000;
    if (date > now && day >= startEpoch && day <= endEpoch) out.push(date);
  }
  return out;
}
