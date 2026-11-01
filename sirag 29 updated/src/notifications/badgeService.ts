import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { readJSON } from "../storage/jsonStore";
import { calculatePrayerTimes } from "../prayer/prayerTimesService";
import {
  getSavedLocation,
  getSavedCalculationMethod,
  getSavedMadhab,
} from "../prayer/locationService";
import type { PrayerNotificationConfig } from "../prayer/types";
import { DEFAULT_FOLLOW_UP, PRAYER_IDS, PrayerSettings } from "./schedulePlan";
import { hasPlantableSeeds, pendingActions } from "./badgeModel";
import { personalizeBody } from "./personalization";
import { localDay } from "../habits/habitData";
export const ATTENTION_ID = "siraj-pending-actions";
const CHANNEL = "pending-actions-v1";
let active: Promise<void> | null = null,
  rerun = false,
  lastSignature = "";
export async function syncAppBadge(): Promise<void> {
  if (Platform.OS === "web") return;
  if (active) {
    rerun = true;
    return active;
  }
  active = (async () => {
    try {
      const [config, profile, checkins, rest, state, loc, method, madhab] =
        await Promise.all([
          readJSON<PrayerNotificationConfig | null>(
            "batl-prayer-notification-config-v1",
            null,
          ),
          readJSON<{ name?: string; gender?: string } | null>(
            "sirag-personal-profile-v1",
            null,
          ),
          readJSON<Record<string, { status?: string }>>(
            "batl-prayer-checkin-records-v1",
            {},
          ),
          readJSON<string[]>("batl-prayer-rest-days-v1", []),
          readJSON<any>("sirag-oasis-state-v1", null),
          getSavedLocation(),
          getSavedCalculationMethod(),
          getSavedMadhab(),
        ]);
      const settings: PrayerSettings = {
        enabled: config?.notificationsEnabled ?? true,
        perPrayer: Object.fromEntries(
          PRAYER_IDS.map((p) => [
            p,
            { enabled: config?.[p]?.enabled ?? true, sound: true },
          ]),
        ) as PrayerSettings["perPrayer"],
        followUp: config?.checkinFollowUpEnabled ?? true,
        followUpMin: { ...DEFAULT_FOLLOW_UP, ...config?.followUpMin },
        preAlertMin: 0,
        quietEnabled: false,
        quietStart: "23:00",
        quietEnd: "04:30",
      };
      const now = new Date(),
        day = calculatePrayerTimes(
          loc,
          now,
          method,
          madhab,
          config?.adjustments,
        );
      const tasks = pendingActions({
        now,
        day,
        settings,
        checkins,
        rest: profile?.gender === "female" && rest.includes(localDay(now)),
        canPlant: hasPlantableSeeds(state),
        enabled: config?.badgesEnabled !== false && !!profile,
      });
      const permission = await Notifications.getPermissionsAsync();
      const presented = await Notifications.getPresentedNotificationsAsync();
      for (const n of presented) {
        if (!/^(pfu:|att:)/.test(n.request.identifier)) continue;
        const data = n.request.content.data;
        if (typeof data?.date !== "string" || typeof data?.prayer !== "string")
          continue;
        const record = checkins[`${data.prayer}_${data.date}`];
        const completed = ["on_time", "late", "qada"].includes(
          record?.status || "",
        );
        if (
          (config?.badgesEnabled === false &&
            n.request.identifier.startsWith("att:")) ||
          data.date < day.dateStr ||
          completed ||
          (data.date === day.dateStr &&
            profile?.gender === "female" &&
            rest.includes(day.dateStr))
        )
          await Notifications.dismissNotificationAsync(
            n.request.identifier,
          ).catch(() => {});
      }
      await Notifications.setBadgeCountAsync(
        permission.granted ? tasks.count : 0,
      ).catch(() => false);
      if (Platform.OS !== "android") return;
      if (!permission.granted || !tasks.count) {
        lastSignature = "";
        await Notifications.dismissNotificationAsync(ATTENTION_ID).catch(
          () => {},
        );
        return;
      }
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: "أعمال بانتظارك · شارة التطبيق",
        importance: Notifications.AndroidImportance.LOW,
        sound: null,
        vibrationPattern: [],
        showBadge: true,
      });
      const copy = [
        tasks.prayers.length
          ? tasks.prayers.length === 1
            ? "صلاة بانتظار التسجيل"
            : `${tasks.prayers.length.toLocaleString("ar-EG")} صلوات بانتظار التسجيل`
          : "",
        tasks.planting ? "بذورك جاهزة للزراعة 🌱" : "",
      ]
        .filter(Boolean)
        .join(" · ");
      const body = personalizeBody(
        copy,
        profile?.name,
        config?.personalizedNotifications !== false,
      );
      const signature = JSON.stringify([
        day.dateStr,
        body,
        tasks.prayers,
        tasks.planting,
      ]);
      if (lastSignature === signature) return;
      const shown = await Notifications.getPresentedNotificationsAsync();
      if (
        shown.some(
          (n) =>
            n.request.identifier === ATTENTION_ID &&
            n.request.content.body === body &&
            n.request.content.badge === tasks.count &&
            n.request.content.data?.pendingKey === tasks.prayers.join(","),
        )
      ) {
        lastSignature = signature;
        return;
      }
      await Notifications.scheduleNotificationAsync({
        identifier: ATTENTION_ID,
        content: {
          title: "سراج · أعمال بانتظارك",
          body,
          badge: tasks.count,
          sound: false,
          data: {
            type: tasks.prayers.length ? "prayer_checkin" : "oasis",
            ...(tasks.prayers.length
              ? { prayer: tasks.prayers[0], date: day.dateStr }
              : {}),
            attention: "1",
            pendingKey: tasks.prayers.join(","),
          },
        },
        trigger: { channelId: CHANNEL },
      });
      lastSignature = signature;
    } catch (error) {
      console.warn("[badge] update failed", error);
    } finally {
      active = null;
      if (rerun) {
        rerun = false;
        void syncAppBadge();
      }
    }
  })();
  return active;
}
