import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
export async function circlePushToken(): Promise<string> {
  if (Platform.OS === "web")
    throw new Error("التذكيرات متاحة من نسخة الهاتف فقط.");
  if (Constants.appOwnership === "expo")
    throw new Error(
      "تذكيرات الصحبة تحتاج نسخة تطبيق مستقلة. يمكنك تجربة بقية الميزات عبر Expo Go.",
    );
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync("sohba", {
      name: "تذكيرات الصحبة",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted)
    permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted)
    throw new Error("اسمح بالإشعارات من إعدادات الهاتف لتفعيل التذكيرات.");
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ||
    Constants.easConfig?.projectId;
  if (!projectId)
    throw new Error("يلزم ربط نسخة التطبيق بمشروع EAS لتفعيل إشعارات الصحبة.");
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}
