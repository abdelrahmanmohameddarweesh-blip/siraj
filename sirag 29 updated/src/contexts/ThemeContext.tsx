import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from '../config/colors';

type ThemeType = 'light' | 'dark';

type ThemeContextType = {
  theme: ThemeType;
  colors: typeof DarkColors;
  toggleTheme: () => Promise<void>;
  isLightMode: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('dark');

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const migrated = await AsyncStorage.getItem('batl-cinematic-theme-v6');
        const saved = migrated ? await AsyncStorage.getItem('user-app-theme') : 'dark';
        if (!migrated) {
          await AsyncStorage.setItem('user-app-theme', 'dark');
          await AsyncStorage.setItem('batl-cinematic-theme-v6', '1');
        }
        if (saved === 'light' || saved === 'dark') {
          setThemeState(saved);
        }
      } catch (err) {
        console.error('Error loading theme:', err);
      }
    };
    loadSavedTheme();
  }, []);

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(nextTheme);
    try {
      await AsyncStorage.setItem('user-app-theme', nextTheme);
    } catch (err) {
      console.error('Error saving theme:', err);
    }
  };

  const colors = theme === 'light' ? LightColors : DarkColors;
  const isLightMode = theme === 'light';

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isLightMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
