import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { C, F } from "../ui/theme";
/** A labelled layout preview, never a simulated paid advertisement. */
export default function BannerPreview({
  placement,
  message = "الإعلانات تظهر في نسخة الهاتف المبنية، ولا تعمل داخل Expo Go أو معاينة الويب.",
}: {
  placement: 1 | 2;
  message?: string;
}) {
  return (
    <View accessibilityLabel={`معاينة موضع إعلان ${placement}`} style={s.box}>
      <Text style={s.title}>
        معاينة موضع إعلان · {placement === 1 ? "١" : "٢"}
      </Text>
      <Text style={s.copy}>{message}</Text>
      <Text style={s.note}>مساحة تجريبية للتصميم · لا تولّد أرباحًا</Text>
    </View>
  );
}
const s = StyleSheet.create({
  box: {
    minHeight: 110,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.line,
    borderRadius: 14,
    backgroundColor: C.chip,
    gap: 7,
    alignItems: "center",
  },
  title: { fontFamily: F.s, color: C.ink, textAlign: "center" },
  copy: {
    fontFamily: F.r,
    fontSize: 12,
    lineHeight: 22,
    color: C.ink2,
    textAlign: "center",
  },
  note: { fontFamily: F.r, color: C.muted, fontSize: 10, textAlign: "center" },
});
