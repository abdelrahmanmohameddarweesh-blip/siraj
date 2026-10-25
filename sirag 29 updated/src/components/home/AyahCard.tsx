import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface AyahCardProps {
  onShareAyah: () => void;
  styles: any;
}

export function AyahCard({ onShareAyah, styles }: AyahCardProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  return (
    <View style={[styles.ayahCard, { backgroundColor: colors.accentTint, borderColor: colors.accentTintBorder }]}>
      <View style={styles.ayahHeaderRow}>
        <Text style={[styles.ayahLabelText, { color: colors.accentOnTint }]}>
          {language === 'ar' ? 'آية اليوم 📖' : 'Ayah of the Day 📖'}
        </Text>
        <TouchableOpacity
          style={[styles.ayahShareButton, { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }]}
          onPress={onShareAyah}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'مشاركة آية اليوم' : 'Share Ayah of the day'}
        >
          <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.accentOnTint} strokeWidth="2.5">
            <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <Path d="m16 6-4-4-4 4" />
            <Path d="M12 2v13" />
          </Svg>
        </TouchableOpacity>
      </View>

      <Text style={[styles.ayahArabicText, { color: colors.textPrimary }]}>
        وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ
      </Text>

      {language !== 'ar' && (
        <Text style={[styles.ayahEnglishText, { color: colors.textSecondary }]}>
          "And for this let those aspire, who have aspirations."
        </Text>
      )}

      <Text style={[styles.ayahMetaText, { color: colors.accentOnTint }]}>
        {language === 'ar' ? 'سورة المطففين · ٢٦' : 'Surah Al-Mutaffifin · 26'}
      </Text>
    </View>
  );
}
