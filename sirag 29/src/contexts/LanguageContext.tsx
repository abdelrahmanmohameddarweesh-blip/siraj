import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { translations, type TranslationKey } from '../config/translations';

type LanguageType = 'ar' | 'en';

type LanguageContextType = {
  language: LanguageType;
  isRTL: boolean;
  backArrow: string;
  nextArrow: string;
  t: (key: TranslationKey) => string;
  setLanguage: (lang: LanguageType) => Promise<void>;
  formatNumber: (num: string | number) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageType>('ar');

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem('user-app-language');
        if (saved === 'en' || saved === 'ar') {
          setLanguageState(saved);
        } else {
          // Detect device language on first open
          const locales = Localization.getLocales();
          const deviceLang = locales[0]?.languageCode;
          if (deviceLang === 'en' || deviceLang === 'ar') {
            setLanguageState(deviceLang);
            await AsyncStorage.setItem('user-app-language', deviceLang);
          } else {
            setLanguageState('ar'); // Default to Arabic
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSavedLanguage();
  }, []);

  const setLanguage = async (lang: LanguageType) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem('user-app-language', lang);
    } catch (err) {
      console.error(err);
    }
  };

  const formatNumber = (num: string | number): string => {
    if (language === 'ar') {
      return String(num).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
    }
    return String(num);
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.ar;
    return dict[key] || translations.ar[key] || String(key);
  };

  const isRTL = language === 'ar';
  const backArrow = isRTL ? '→' : '←';
  const nextArrow = isRTL ? '←' : '→';

  return (
    <LanguageContext.Provider value={{ language, isRTL, backArrow, nextArrow, t, setLanguage, formatNumber }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
