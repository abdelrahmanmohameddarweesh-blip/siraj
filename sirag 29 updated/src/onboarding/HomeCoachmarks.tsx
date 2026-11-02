import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect } from "react-native-svg";
import { coachTip, fitSpotlight, maskPath } from "./coachModel";
import { useHomeCoachmarks } from "./useHomeCoachmarks";
import { F, ar } from "../ui/theme";
export default function HomeCoachmarks({
  guide,
}: {
  guide: ReturnType<typeof useHomeCoachmarks>;
}) {
  const { width, height, fontScale } = useWindowDimensions(),
    insets = useSafeAreaInsets();
  const box = guide.rect ? fitSpotlight(guide.rect, width, height) : null;
  const card = box
    ? coachTip(
        box,
        width,
        height,
        insets.top,
        insets.bottom,
        Math.min(340, 300 * fontScale),
      )
    : null;
  let arrow = "";
  if (box && card) {
    const endX = box.x + box.width / 2,
      endY = card.placement === "below" ? box.y + box.height + 3 : box.y - 3,
      startX = Math.max(card.x + 24, Math.min(endX, card.x + card.width - 24)),
      startY =
        card.placement === "below" ? card.y - 3 : card.y + card.maxHeight + 3,
      dy = card.placement === "below" ? 8 : -8;
    arrow = `M${startX} ${startY}Q${startX + 24} ${(startY + endY) / 2} ${endX} ${endY} M${endX - 5} ${endY + dy}L${endX} ${endY}L${endX + 5} ${endY + dy}`;
  }
  return (
    <Modal
      visible={guide.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={guide.skip}
    >
      <View style={s.root} accessibilityViewIsModal>
        <Svg
          style={StyleSheet.absoluteFill}
          width={width}
          height={height}
          pointerEvents="none"
        >
          <Path
            d={
              box ? maskPath(width, height, box) : `M0 0H${width}V${height}H0Z`
            }
            fill="rgba(3,15,16,0.82)"
            fillRule="evenodd"
          />
          {box && (
            <Rect
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              rx={18}
              stroke="#EBCB8C"
              strokeWidth={2}
              fill="none"
            />
          )}
          {!!arrow && (
            <Path
              d={arrow}
              stroke="#EBCB8C"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
        </Svg>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="تخطي جولة الصفحة الرئيسية"
          disabled={guide.busy}
          onPress={guide.skip}
          style={[s.skip, { top: insets.top + 8 }]}
        >
          <Text style={s.skipText}>تخطي الجولة</Text>
        </Pressable>
        {box && card ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`جرّب العنصر المحدد: ${guide.step.title}`}
              disabled={guide.busy}
              onPress={() => void guide.visit()}
              style={{
                position: "absolute",
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
                borderRadius: 18,
              }}
            />
            <View
              style={[
                s.card,
                {
                  left: card.x,
                  top: card.y,
                  width: card.width,
                  maxHeight: card.maxHeight,
                },
              ]}
            >
              <ScrollView
                contentContainerStyle={s.cardInside}
                showsVerticalScrollIndicator={false}
              >
                <View style={s.meta}>
                  <Text style={s.counter}>
                    {ar(guide.index + 1)} / {ar(guide.total)}
                  </Text>
                  <Text style={s.kicker}>دليلك في سراج</Text>
                </View>
                <Text accessibilityRole="header" style={s.title}>
                  {guide.step.title}
                </Text>
                <Text style={s.copy}>{guide.step.copy}</Text>
                {!!guide.error && (
                  <Text accessibilityRole="alert" style={s.error}>
                    {guide.error}
                  </Text>
                )}
                <View style={s.actions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={guide.busy}
                    onPress={guide.next}
                    style={s.next}
                  >
                    <Text style={s.nextText}>
                      {guide.index === guide.total - 1
                        ? "فهمت، لنبدأ"
                        : "التالي  ←"}
                    </Text>
                  </Pressable>
                  {guide.index > 0 && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={guide.previous}
                      style={s.previous}
                    >
                      <Text style={s.actionText}>السابق</Text>
                    </Pressable>
                  )}
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={guide.busy}
                  onPress={() => void guide.visit()}
                  style={s.tryButton}
                >
                  <Text style={s.tryText}>{guide.step.action} ↗</Text>
                </Pressable>
              </ScrollView>
            </View>
          </>
        ) : (
          <View
            style={[
              s.loading,
              { top: Math.max(insets.top + 80, height * 0.38) },
            ]}
          >
            {!guide.error && <ActivityIndicator color="#EBCB8C" />}
            <Text style={s.loadingText}>
              {guide.error || "نجهّز لك جولة قصيرة…"}
            </Text>
            {!!guide.error && (
              <Pressable
                accessibilityRole="button"
                onPress={guide.next}
                style={s.next}
              >
                <Text style={s.nextText}>متابعة الجولة</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  root: { flex: 1 },
  skip: {
    position: "absolute",
    right: 16,
    minHeight: 44,
    paddingHorizontal: 17,
    borderRadius: 22,
    backgroundColor: "rgba(20,47,41,.95)",
    borderWidth: 1,
    borderColor: "#5E7061",
    justifyContent: "center",
  },
  skipText: { fontFamily: F.m, color: "#EFE4CA", fontSize: 12 },
  card: {
    position: "absolute",
    backgroundColor: "#FFF9EC",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2CC9E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    shadowOpacity: 0.2,
    elevation: 10,
  },
  cardInside: { padding: 18, gap: 9 },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counter: { fontFamily: F.s, color: "#997540", fontSize: 11 },
  kicker: { fontFamily: F.m, color: "#8C8068", fontSize: 11 },
  title: {
    fontFamily: F.b,
    color: "#173F33",
    fontSize: 21,
    lineHeight: 31,
    textAlign: "right",
  },
  copy: {
    fontFamily: F.r,
    color: "#5D6C57",
    fontSize: 13,
    lineHeight: 24,
    textAlign: "right",
  },
  actions: {
    flexDirection: "row-reverse",
    gap: 12,
    alignItems: "center",
    marginTop: 3,
  },
  next: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 16,
    backgroundColor: "#214D3B",
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { fontFamily: F.s, color: "#FFF4DA", fontSize: 13 },
  previous: { minHeight: 44, paddingHorizontal: 10, justifyContent: "center" },
  actionText: { fontFamily: F.m, color: "#727B67", fontSize: 12 },
  tryButton: { minHeight: 40, justifyContent: "center", alignItems: "center" },
  tryText: { fontFamily: F.s, fontSize: 12, color: "#9D7740" },
  loading: {
    position: "absolute",
    left: 24,
    right: 24,
    gap: 18,
    alignItems: "center",
  },
  loadingText: {
    fontFamily: F.r,
    color: "#FFF4DA",
    textAlign: "center",
    lineHeight: 25,
  },
  error: {
    fontFamily: F.r,
    color: "#AD5147",
    fontSize: 12,
    textAlign: "right",
  },
});
