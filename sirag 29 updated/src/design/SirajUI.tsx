import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../contexts/ThemeContext";
import { homePalettes } from "./homeTheme";
import { C, F } from "../ui/theme";
export type IconName =
  | "home"
  | "book"
  | "palm"
  | "chart"
  | "bell"
  | "arrow"
  | "pin"
  | "sun"
  | "moon"
  | "check"
  | "plus"
  | "user"
  | "mosque"
  | "spark";
export function SirajIcon({
  name,
  color = C.ink,
  size = 24,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) {
  const stroke = {
    fill: "none",
    stroke: color,
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  const paths: Record<IconName, string> = {
    home: "M3 11 12 3l9 8M5 10v10h5v-6h4v6h5V10",
    book: "M3 5c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2ZM12 7v14",
    palm: "M12 21V10M12 10Q7 2 2 8q6-1 10 2M12 10q5-8 10-2-6-1-10 2M12 10Q7 3 12 2q5 3 0 8M6 21h12",
    chart: "M4 20h16M7 16v-5M12 16V5M17 16V9",
    bell: "M5 16h14l-2-3V9a5 5 0 0 0-10 0v4ZM10 20h4M12 2v2",
    arrow: "M19 12H5m6-6-6 6 6 6",
    pin: "M12 22s7-7 7-13A7 7 0 0 0 5 9c0 6 7 13 7 13ZM12 7v4",
    sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    moon: "M19 15A8 8 0 0 1 9 5a8 8 0 1 0 10 10Z",
    check: "M5 12l4 4L19 6",
    plus: "M12 5v14M5 12h14",
    user: "M4 21a8 8 0 0 1 16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    mosque: "M4 21V11l8-7 8 7v10M9 21v-6a3 3 0 0 1 6 0v6M2 21h20M12 2v2",
    spark: "m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z",
  };
  return (
    <Svg accessible={false} width={size} height={size} viewBox="0 0 24 24">
      <Path {...stroke} d={paths[name]} />
    </Svg>
  );
}
export function BottomDock({
  navigation,
  active,
  bottom = 0,
}: {
  navigation: any;
  active: string;
  bottom?: number;
}) {
  const { theme } = useTheme();
  const palette = homePalettes[theme];
  const tabs: [IconName, string, string][] = [
    ["home", "الرئيسية", "Home"],
    ["book", "القرآن", "QuranReader"],
    ["palm", "الواحة", "Oasis"],
    ["chart", "أثري", "Insights"],
  ];
  return (
    <View style={[styles.dockWrap, { paddingBottom: Math.max(bottom, 12) }]}>
      <View
        style={[
          styles.dock,
          {
            backgroundColor: palette.surface,
            borderWidth: 1,
            borderColor: palette.border,
          },
        ]}
      >
        {tabs.map(([icon, label, route]) => (
          <Pressable
            key={route}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: active === route }}
            onPress={() => active !== route && navigation.navigate(route)}
            style={[
              styles.tab,
              active === route && { backgroundColor: palette.soft },
            ]}
          >
            <SirajIcon
              name={icon}
              color={active === route ? palette.accent : palette.muted}
              size={22}
            />
            <Text
              style={[
                styles.tabText,
                { color: active === route ? palette.accent : palette.muted },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  section: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  title: { fontFamily: F.b, fontSize: 21, color: C.ink, textAlign: "right" },
  subtitle: {
    fontFamily: F.r,
    fontSize: 12,
    color: C.muted,
    textAlign: "right",
    marginTop: 3,
  },
  action: { fontFamily: F.s, fontSize: 12, color: C.green, paddingVertical: 8 },
  dockWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  dock: {
    width: "100%",
    maxWidth: 640,
    flexDirection: "row-reverse",
    borderRadius: 26,
    backgroundColor: "#123D33",
    padding: 7,
    shadowColor: "#173A30",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  tab: {
    flex: 1,
    minHeight: 55,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 20,
  },
  tabActive: { backgroundColor: "#295447" },
  tabText: { fontFamily: F.m, color: "#BCD0C1", fontSize: 10 },
});
