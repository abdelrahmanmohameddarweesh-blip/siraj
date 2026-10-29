/** Local phone notifications only. No Expo push tokens, server or billing plan. */
import { circleReminderDates } from "./reminderPlan";
import { localDay } from "../habits/habitData";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { readJSON, updateJSON } from "../storage/jsonStore";
export type Reminder = {
  reminders: boolean;
  reminderHour: number;
  reminderMinute: number;
  notificationIds?: string[];
  refreshedDay?: string;
};
const KEY = "sirag-spark-circle-reminders-v1";
const fallback: Reminder = {
  reminders: false,
  reminderHour: 20,
  reminderMinute: 0,
};
export async function loadCircleReminder(
  uid: string,
  id: string,
): Promise<Reminder> {
  return (
    (await readJSON<Record<string, Reminder>>(KEY, {}))[uid + ":" + id] ||
    fallback
  );
}
export async function removeCircleReminder(uid: string, id: string) {
  const old = await loadCircleReminder(uid, id);
  if (Platform.OS !== "web")
    for (const token of old.notificationIds || [])
      await Notifications.cancelScheduledNotificationAsync(token);
  await updateJSON<Record<string, Reminder>>(KEY, {}, (rows) => {
    const next = { ...rows };
    delete next[uid + ":" + id];
    return next;
  });
}
export async function configureCircleReminder(
  uid: string,
  id: string,
  name: string,
  prefs: Reminder,
  endEpoch: number,
  startEpoch: number = 0,
) {
  if (
    !Number.isInteger(prefs.reminderHour) ||
    prefs.reminderHour < 0 ||
    prefs.reminderHour > 23 ||
    !Number.isInteger(prefs.reminderMinute) ||
    prefs.reminderMinute < 0 ||
    prefs.reminderMinute > 59
  )
    throw new Error("وقت غير صالح");
  if (!prefs.reminders) {
    await removeCircleReminder(uid, id);
    return;
  }
  if (Platform.OS === "web")
    throw new Error("التذكير المحلي متاح على الهاتف فقط");
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("sohba-local", {
      name: "تذكير الصحبة",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted)
    permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error("اسمح بالإشعارات من إعدادات الهاتف");
  // At most three alerts per circle; refill on opening the circle. This respects
  // the device's shared pending-notification budget and stops after the end date.
  const old = await loadCircleReminder(uid, id);
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const capacity = Math.max(
    0,
    60 -
      all.filter((n) => !(old.notificationIds || []).includes(n.identifier))
        .length,
  );
  const planned: string[] = [];
  try {
    for (const when of circleReminderDates(
      new Date(),
      prefs.reminderHour,
      prefs.reminderMinute,
      startEpoch,
      endEpoch,
      capacity,
    )) {
      planned.push(
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `صحبة · ${name}`,
            body: "خطوة صغيرة لعادتك اليوم. رفاقك يشجّعونك.",
            sound: "default",
            data: { screen: "Sohba", circleId: id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: when,
            channelId: Platform.OS === "android" ? "sohba-local" : undefined,
          },
        }),
      );
    }
    if (!planned.length)
      throw new Error("لا توجد مساحة لتذكيرات جديدة أو انتهت الرحلة");
    await updateJSON<Record<string, Reminder>>(KEY, {}, (rows) => ({
      ...rows,
      [uid + ":" + id]: {
        ...prefs,
        notificationIds: planned,
        refreshedDay: localDay(),
      },
    }));
  } catch (e) {
    for (const token of planned)
      await Notifications.cancelScheduledNotificationAsync(token);
    throw e;
  }
  for (const token of old.notificationIds || [])
    await Notifications.cancelScheduledNotificationAsync(token);
}
