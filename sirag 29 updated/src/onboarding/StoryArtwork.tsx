import React, { useState } from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";
import { SirajIcon } from "../design/SirajUI";
import { F } from "../ui/theme";
const GOLD = "#BC9254",
  INK = "#173E33";
function Halo({ mint = false }: { mint?: boolean }) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      viewBox="0 0 360 360"
    >
      <Circle
        cx="180"
        cy="175"
        r="155"
        fill={mint ? "#DCE8D8" : "#F1D3AF"}
        opacity="0.6"
      />
      <Circle
        cx="180"
        cy="175"
        r="125"
        fill="none"
        stroke="#FFFDF6"
        strokeWidth="1"
      />
      <Circle
        cx="180"
        cy="175"
        r="100"
        fill="none"
        stroke="#FFFDF6"
        strokeWidth="1"
      />
      <Path
        d="M34 94l5-13 5 13 13 5-13 5-5 13-5-13-13-5ZM307 264l4-11 4 11 11 4-11 4-4 11-4-11-11-4Z"
        fill={GOLD}
        opacity="0.7"
      />
      <Circle cx="305" cy="70" r="3" fill={GOLD} />
      <Circle cx="58" cy="283" r="2" fill={INK} opacity="0.3" />
    </Svg>
  );
}
function Mosque() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 260">
      <Ellipse
        cx="150"
        cy="234"
        rx="120"
        ry="12"
        fill="#163e33"
        opacity="0.1"
      />
      <Path d="M65 217V118Q65 73 150 43Q235 73 235 118V217Z" fill="#D9C49F" />
      <Path d="M77 215V120Q77 81 150 55Q223 81 223 120V215Z" fill="#17483D" />
      <Path
        d="M100 217v-85q0-35 50-56 50 21 50 56v85"
        fill="#255C4A"
        stroke="#E0C18D"
        strokeWidth="1.5"
      />
      <Path d="M132 217v-40q18-32 36 0v40" fill="#0E332D" />
      <Path
        d="M150 45V23m0 0a9 9 0 0 0 10-12 10 10 0 1 1-10 12"
        fill="none"
        stroke={GOLD}
        strokeWidth="2"
      />
      <Path d="M43 218V91h15v127M242 218V91h15v127" fill="#3A6954" />
      <Path d="M40 91l10-23 11 23M239 91l10-23 11 23" fill={GOLD} />
      <Path d="M92 217h116" stroke={GOLD} strokeWidth="3" />
    </Svg>
  );
}
export default function StoryArtwork({ index }: { index: number }) {
  const [size, setSize] = useState({ width: 360, height: 360 });
  const scale = Math.min(size.width / 360, size.height / 360);
  return (
    <View
      style={s.scene}
      onLayout={({ nativeEvent: { layout } }) =>
        setSize({ width: layout.width, height: layout.height })
      }
    >
      <View
        style={{
          position: "absolute",
          width: 360,
          height: 360,
          left: (size.width - 360) / 2,
          top: (size.height - 360) / 2,
          transform: [{ scale }],
        }}
      >
        <Artwork index={index} />
      </View>
    </View>
  );
}
function Artwork({ index }: { index: number }) {
  if (index === 0)
    return (
      <View
        style={s.scene}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Halo />
        <View style={s.mosque}>
          <Mosque />
        </View>
        <View style={[s.floatCard, s.prayerCard]}>
          <View style={s.topline}>
            <View style={s.roundIcon}>
              <SirajIcon name="sun" color={GOLD} size={20} />
            </View>
            <Text style={s.cardKicker}>نورٌ يتجدّد خمس مرات</Text>
          </View>
          <Text style={s.large}>صلاتك في وقتها</Text>
          <View style={s.moments}>
            {["استعدّ", "صلِّ", "سجّل"].map((v, i) => (
              <View style={s.moment} key={v}>
                <View style={[s.dot, i === 1 && { backgroundColor: INK }]}>
                  <SirajIcon
                    name={i === 0 ? "bell" : i === 1 ? "mosque" : "check"}
                    color={i === 1 ? "#FFF5DA" : INK}
                    size={17}
                  />
                </View>
                <Text style={s.small}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[s.floatCard, s.notice]}>
          <View style={s.roundIcon}>
            <SirajIcon name="bell" size={20} color={INK} />
          </View>
          <View>
            <Text style={s.cardTitle}>تذكير على إيقاع يومك</Text>
            <Text style={s.small}>قبل الأذان وبعده، كما تختار</Text>
          </View>
        </View>
      </View>
    );
  if (index === 1)
    return (
      <View
        style={s.scene}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Halo mint />
        <View style={s.bookFrame}>
          <ImageBackground
            source={require("../../assets/design/quran-card.png")}
            resizeMode="cover"
            style={s.bookImage}
          >
            <LinearGradient
              colors={["transparent", "#193E35"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={s.bookLabel}>
              <SirajIcon name="book" size={30} color="#EDD5A6" />
              <Text style={s.bookTitle}>وردٌ يرافقك</Text>
            </View>
          </ImageBackground>
          <View style={s.bookFooter}>
            <Text style={s.cardTitle}>قراءة · استماع · حفظ</Text>
            <Text style={s.small}>خطوة صغيرة كل يوم</Text>
          </View>
        </View>
        <View style={[s.floatCard, s.dhikrCard]}>
          <View style={s.topline}>
            <SirajIcon name="spark" size={19} color={GOLD} />
            <Text style={s.cardTitle}>ذِكرٌ يطمئنّ به قلبك</Text>
          </View>
          <View style={s.beads}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[s.bead, i < 3 && { backgroundColor: INK }]}
              />
            ))}
          </View>
          <Text style={s.small}>اقرأ، ثم اضغط العدّاد</Text>
        </View>
      </View>
    );
  return (
    <View
      style={s.scene}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Halo />
      <View style={s.oasisFrame}>
        <ImageBackground
          source={require("../../assets/design/home-night.png")}
          style={s.oasisImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["transparent", "rgba(5,28,27,.8)"]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={s.oasisTitle}>كل خيرٍ يترك أثرًا</Text>
        </ImageBackground>
      </View>
      <View style={[s.floatCard, s.seedCard]}>
        <View style={s.roundIcon}>
          <Svg width="23" height="23" viewBox="0 0 30 30">
            <Path
              d="M15 27V13M15 18Q2 17 5 5q14 0 10 13M15 14q1-12 12-10 1 11-12 13"
              stroke={INK}
              strokeWidth="1.8"
              fill="#CFDDBE"
            />
          </Svg>
        </View>
        <View>
          <Text style={s.cardTitle}>بذرة خير، وواحة تنمو</Text>
          <Text style={s.small}>أنجز عادتك، وازرع أثرها</Text>
        </View>
      </View>
      <View style={[s.floatCard, s.circleCard]}>
        <View style={s.avatars}>
          {["أ", "م", "س"].map((v, i) => (
            <View
              key={v}
              style={[
                s.avatar,
                {
                  backgroundColor: ["#AFC4AE", "#DCC39A", "#305D4B"][i],
                  marginLeft: i ? -9 : 0,
                },
              ]}
            >
              <Text style={[s.avatarText, i === 2 && { color: "#fff" }]}>
                {v}
              </Text>
            </View>
          ))}
        </View>
        <View>
          <Text style={s.cardTitle}>الرحلة أجمل بصحبة</Text>
          <Text style={s.small}>تشجيع وخصوصية على طريقتك</Text>
        </View>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  scene: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  mosque: {
    position: "absolute",
    width: "77%",
    height: "75%",
    top: "9%",
    right: "9%",
  },
  floatCard: {
    backgroundColor: "#FFFEF8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E9DFCB",
    padding: 15,
    shadowColor: "#6C4724",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 4,
  },
  prayerCard: {
    position: "absolute",
    width: "77%",
    top: "30%",
    right: "4%",
    gap: 8,
    transform: [{ rotate: "-3deg" }],
  },
  topline: { flexDirection: "row-reverse", alignItems: "center", gap: 9 },
  roundIcon: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#F4EAD6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardKicker: {
    fontFamily: F.m,
    fontSize: 10,
    color: "#836941",
    textAlign: "right",
  },
  large: { fontFamily: F.b, fontSize: 24, color: INK, textAlign: "right" },
  moments: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingTop: 6,
  },
  moment: { alignItems: "center", gap: 5 },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEE6D4",
    alignItems: "center",
    justifyContent: "center",
  },
  small: {
    fontFamily: F.r,
    fontSize: 10,
    lineHeight: 19,
    color: "#6C7766",
    textAlign: "right",
  },
  notice: {
    position: "absolute",
    bottom: "1%",
    left: "2%",
    flexDirection: "row-reverse",
    gap: 10,
    alignItems: "center",
    transform: [{ rotate: "3deg" }],
  },
  cardTitle: { fontFamily: F.s, fontSize: 12, color: INK, textAlign: "right" },
  bookFrame: {
    position: "absolute",
    width: "69%",
    height: "84%",
    right: "10%",
    top: "3%",
    borderRadius: 100,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    backgroundColor: "#FFFDF4",
    borderWidth: 2,
    borderColor: "#D5C5A8",
    transform: [{ rotate: "4deg" }],
  },
  bookImage: { width: "100%", flex: 1, justifyContent: "flex-end" },
  bookLabel: { alignItems: "center", paddingBottom: 16, gap: 7 },
  bookTitle: { fontFamily: F.s, fontSize: 18, color: "#FFF1CF" },
  bookFooter: { padding: 14, alignItems: "center", gap: 3 },
  dhikrCard: {
    position: "absolute",
    bottom: "3%",
    left: "1%",
    width: "70%",
    gap: 8,
    transform: [{ rotate: "-4deg" }],
  },
  beads: { flexDirection: "row-reverse", gap: 7 },
  bead: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#DCD7C6" },
  oasisFrame: {
    position: "absolute",
    top: "3%",
    width: "77%",
    height: "86%",
    borderRadius: 130,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#C6AE7F",
  },
  oasisImage: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  oasisTitle: {
    fontFamily: F.s,
    fontSize: 16,
    color: "#F0D9A8",
    marginBottom: 46,
  },
  seedCard: {
    position: "absolute",
    top: "17%",
    right: "0%",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 9,
    transform: [{ rotate: "-4deg" }],
  },
  circleCard: {
    position: "absolute",
    bottom: "1%",
    left: "0%",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    transform: [{ rotate: "3deg" }],
  },
  avatars: { flexDirection: "row-reverse" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFFEF8",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: F.s, fontSize: 12, color: INK },
});
