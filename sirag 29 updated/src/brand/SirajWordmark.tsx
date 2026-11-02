import React from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import wordmark from "./wordmark.json";
/** Shaped Ruqaa outlines avoid platform font-metric clipping of the descending ج. */
export default function SirajWordmark({
  width = 190,
  height = 130,
  color = "#F4D99F",
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel="سراج"
      style={{ width, height, alignItems: "center", justifyContent: "center" }}
    >
      <Svg
        accessible={false}
        width="100%"
        height="100%"
        viewBox={`0 0 ${wordmark.width} ${wordmark.height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Path fill={color} d={wordmark.path} />
      </Svg>
    </View>
  );
}
