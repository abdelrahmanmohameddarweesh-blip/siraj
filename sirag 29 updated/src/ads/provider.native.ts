import { Platform } from "react-native";
import adConfig from "../../ads.config.json";
import Constants, { ExecutionEnvironment } from "expo-constants";
import type { AdSupport, AdResult } from "./providerTypes";
import { runRewardedLifecycle } from "./adLifecycle";
type SDK = typeof import("react-native-google-mobile-ads");
const mode = __DEV__ ? "test" : process.env.EXPO_PUBLIC_ADS_MODE || "off";
const liveUnit =
  Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_ADMOB_IOS_REWARDED_ID ||
      adConfig.ios.rewardedUnitId
    : process.env.EXPO_PUBLIC_ADMOB_ANDROID_REWARDED_ID ||
      adConfig.android.rewardedUnitId;
const appId =
  Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID || adConfig.ios.appId
    : process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID || adConfig.android.appId;
let sdk: SDK | undefined,
  busy = false,
  initializing: Promise<void> | null = null;
function getSdk() {
  return sdk ?? (sdk = require("react-native-google-mobile-ads") as SDK);
}
export function adSupport(): AdSupport {
  const test = mode === "test";
  if (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === "expo"
  )
    return {
      available: false,
      test,
      message:
        "Expo Go لا يدعم الإعلانات الحقيقية. يمكنك تجربة أماكنها هنا، وتبقى الزراعة ومكافآت العادات مجانية دون إعلان.",
    };
  if (!["test", "live"].includes(mode))
    return {
      available: false,
      test,
      message:
        "الإعلانات غير مفعّلة في هذه النسخة. واصل زراعتك ومكافآت عاداتك كالمعتاد.",
    };
  if (
    !test &&
    (!/^ca-app-pub-\d+\/\d+$/.test(liveUnit || "") ||
      !/^ca-app-pub-\d+~\d+$/.test(appId || "") ||
      (liveUnit || "").includes("3940256099942544") ||
      (appId || "").includes("3940256099942544"))
  )
    return {
      available: false,
      test,
      message: "الإعلانات الحية لم تُجهّز بعد. مكافآت العادات متاحة دائمًا.",
    };
  try {
    getSdk();
    return {
      available: true,
      test,
      message: test
        ? "إعلان تجريبي من Google؛ لا يولّد أرباحًا."
        : "إعلان اختياري بمكافأة للواحة.",
    };
  } catch {
    return {
      available: false,
      test,
      message:
        "هذه النسخة لا تحتوي على مكتبة الإعلانات الأصلية. استخدم نسخة هاتف مبنية مع دعم الإعلانات.",
    };
  }
}
async function initialize() {
  const s = getSdk();
  // Refresh the required regional consent flow on each user-initiated request.
  await s.AdsConsent.gatherConsent();
  const consent = await s.AdsConsent.getConsentInfo();
  if (!consent.canRequestAds)
    throw new Error(
      "الإعلان غير متاح وفق اختيارات الخصوصية الحالية. يمكنك المتابعة دون إعلان.",
    );
  if (!initializing)
    initializing = (async () => {
      await s.default().setRequestConfiguration({
        maxAdContentRating: s.MaxAdContentRating.G,
        publisherPrivacyPersonalizationState: "disabled",
      });
      await s.default().initialize();
    })().catch((e) => {
      initializing = null;
      throw e;
    });
  await initializing;
}
export async function showRewardedAd(
  onEarned: () => Promise<unknown>,
): Promise<AdResult> {
  const support = adSupport();
  if (!support.available) throw new Error(support.message);
  if (busy) throw new Error("إعلان آخر قيد التشغيل");
  busy = true;
  try {
    await initialize();
    const s = getSdk();
    const ad = s.RewardedAd.createForAdRequest(
      support.test ? s.TestIds.REWARDED : liveUnit!,
      { requestNonPersonalizedAdsOnly: true },
    );
    const events = {
      loaded: s.RewardedAdEventType.LOADED,
      earned: s.RewardedAdEventType.EARNED_REWARD,
      closed: s.AdEventType.CLOSED,
      error: s.AdEventType.ERROR,
    };
    return await runRewardedLifecycle(
      {
        on: (event, listener) =>
          ad.addAdEventListener(events[event] as any, listener as any),
        load: () => ad.load(),
        show: () => ad.show(),
        destroy: () => ad.destroy(),
      },
      onEarned,
    );
  } finally {
    busy = false;
  }
}
export async function adPrivacyOptions() {
  const support = adSupport();
  if (!support.available) throw new Error(support.message);
  const s = getSdk();
  await s.AdsConsent.requestInfoUpdate();
  const info = await s.AdsConsent.getConsentInfo();
  if (
    info.privacyOptionsRequirementStatus ===
    s.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED
  )
    await s.AdsConsent.showPrivacyOptionsForm();
  else
    throw new Error(
      "لا توجد استمارة خصوصية إضافية مطلوبة حاليًا. تُطلب إعلانات غير مخصّصة فقط.",
    );
}
