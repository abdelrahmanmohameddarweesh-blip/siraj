import BannerPreview from "./BannerPreview";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { bannerSupport, prepareAds, adPrivacyOptions } from "./provider";
import { C, F } from "../ui/theme";
/** Only mounted at the two explicit gaps in the Athkar list. No rewarded credit. */
export default function AthkarBanner({ placement }: { placement: 1 | 2 }) {
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [privacyMessage, setPrivacyMessage] = useState("");
  const [native, setNative] = useState<{
    Banner: React.ComponentType<any>;
    size: string;
  } | null>(null);
  const support = bannerSupport(),
    { width } = useWindowDimensions();
  useEffect(() => {
    let active = true;
    if (!support.available) return;
    void prepareAds()
      .then(() => {
        if (!active) return;
        const sdk =
          require("react-native-google-mobile-ads") as typeof import("react-native-google-mobile-ads");
        setNative({ Banner: sdk.BannerAd, size: sdk.BannerAdSize.BANNER });
        setReady(true);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [support.available, support.unitId]);
  if (!support.available)
    return __DEV__ ? <BannerPreview placement={placement} /> : null;
  if (failed)
    return support.test ? (
      <BannerPreview
        placement={placement}
        message="تعذّر تحميل إعلان Google التجريبي. هذا هو موضعه؛ تأكد من الاتصال ثم أعد فتح الأذكار."
      />
    ) : null;
  if (!ready || !native || !support.unitId || width < 320) return null;
  const Banner = native.Banner;
  return (
    <View style={s.gap} accessibilityLabel={`مساحة إعلان ${placement}`}>
      <Text style={s.label}>{support.test ? "إعلان تجريبي" : "إعلان"}</Text>
      <Banner
        unitId={support.unitId}
        size={native.size}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={() => setFailed(true)}
      />
      <Pressable
        onPress={() =>
          void adPrivacyOptions().catch((error) =>
            setPrivacyMessage(String(error.message || error)),
          )
        }
      >
        <Text style={s.privacy}>خيارات خصوصية الإعلان</Text>
      </Pressable>
      {!!privacyMessage && <Text style={s.privacy}>{privacyMessage}</Text>}
    </View>
  );
}
const s = StyleSheet.create({
  gap: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
    marginTop: 12,
    marginHorizontal: -14,
    borderTopWidth: 1,
    borderColor: C.line,
  },
  label: { fontFamily: F.m, fontSize: 10, color: C.muted },
  privacy: {
    fontFamily: F.r,
    fontSize: 10,
    color: C.muted,
    textAlign: "center",
  },
});
