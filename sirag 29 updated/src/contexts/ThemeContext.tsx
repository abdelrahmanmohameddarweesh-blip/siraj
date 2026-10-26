import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LightColors, DarkColors } from "../config/colors";
export type AppearancePreference = "light" | "dark" | "system";
type ThemeType = "light" | "dark";
type ThemeContextType = {
  theme: ThemeType;
  colors: typeof DarkColors;
  toggleTheme: () => Promise<void>;
  isLightMode: boolean;
  appearance: AppearancePreference;
  setAppearance: (value: AppearancePreference) => Promise<void>;
};
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [appearance, setPreference] = useState<AppearancePreference>("dark");
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await AsyncStorage.getItem("sirag-appearance-v1");
      const legacy = await AsyncStorage.getItem("user-app-theme");
      const value =
        saved === "light" || saved === "dark" || saved === "system"
          ? saved
          : legacy === "light"
            ? "light"
            : "dark";
      if (alive) setPreference(value);
    })().catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const theme: ThemeType =
    appearance === "system"
      ? system === "light"
        ? "light"
        : "dark"
      : appearance;
  async function setAppearance(value: AppearancePreference) {
    await AsyncStorage.setItem("sirag-appearance-v1", value);
    setPreference(value);
  }
  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: theme === "light" ? LightColors : DarkColors,
        isLightMode: theme === "light",
        appearance,
        setAppearance,
        toggleTheme: () => setAppearance(theme === "dark" ? "light" : "dark"),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}
