import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { readJSON } from "../storage/jsonStore";
import { personalizeBody } from "./personalization";
export async function personalizedBody(body: string) {
  const [profile, config] = await Promise.all([
    readJSON<{ name?: string } | null>("sirag-personal-profile-v1", null),
    readJSON<{ personalizedNotifications?: boolean } | null>(
      "batl-prayer-notification-config-v1",
      null,
    ),
  ]);
  return personalizeBody(
    body,
    profile?.name,
    config?.personalizedNotifications !== false,
  );
}
/** Update names on existing circle/garden reminders without moving their dates. */
export async function refreshAuxiliaryNotificationNames() {
  if (
    Platform.OS === "web" ||
    !(await Notifications.getPermissionsAsync()).granted
  )
    return;
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  for (const request of pending) {
    if (
      request.identifier !== "sirag-oasis-nudge" &&
      !request.identifier.startsWith("sohba:")
    )
      continue;
    const data = request.content.data;
    if (
      typeof data?.personalizationBody !== "string" ||
      typeof data?.personalizationAt !== "string"
    )
      continue;
    const date = new Date(data.personalizationAt);
    if (!Number.isFinite(date.getTime()) || date <= new Date()) continue;
    const body = await personalizedBody(data.personalizationBody);
    if (body === request.content.body) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: request.identifier,
      content: {
        title: request.content.title || "سراج",
        body,
        data,
        ...(request.content.sound ? { sound: "default" as const } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        ...(request.identifier.startsWith("sohba:") && Platform.OS === "android"
          ? { channelId: "sohba-local" }
          : {}),
      },
    });
  }
}
