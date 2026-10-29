import type { AdSupport, AdResult } from "./providerTypes";
export function adSupport(): AdSupport {
  return {
    available: false,
    test: true,
    message:
      "إعلانات الهاتف غير متاحة في معاينة الويب. مكافآت العادات والزراعة العادية تعمل دون إعلان.",
  };
}
export async function showRewardedAd(
  _onEarned: () => Promise<unknown>,
): Promise<AdResult> {
  throw new Error(adSupport().message);
}
export async function adPrivacyOptions() {
  throw new Error("خيارات خصوصية الإعلان متاحة في نسخة الهاتف المدعومة فقط.");
}
