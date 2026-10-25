import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface CategoryGridProps {
  styles: any;
  onSelectCategory: (id: string) => void;
}

export function CategoryGrid({ styles, onSelectCategory }: CategoryGridProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  const categories = [
    { id: 'achievements', icon: '🏆', titleAr: 'الإنجازات والألقاب', titleEn: 'Achievements', descAr: 'الأوسمة والجوائز واللقب', descEn: 'Badges, Titles & Vault' },
    { id: 'saved_records', icon: '💾', titleAr: 'المحفوظات والسجل', titleEn: 'Saved Records', descAr: 'التلاوات وسجل المحاسبة', descEn: 'Recitations & Journal' },
    { id: 'settings', icon: '⚙️', titleAr: 'إعدادات الحساب', titleEn: 'Settings', descAr: 'اللغة والمظهر والدولة', descEn: 'Language, Theme & Region' },
    { id: 'logout', icon: '🚪', titleAr: 'تسجيل الخروج', titleEn: 'Logout', descAr: 'إغلاق الجلسة الحالية', descEn: 'Exit active session' },
  ];

  return (
    <View style={styles.categoryCardsGrid}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.smallCategoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => onSelectCategory(cat.id)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? cat.titleAr : cat.titleEn}
        >
          <View style={[styles.smallCategoryIconWrapper, { backgroundColor: colors.neutralTint }]}>
            <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
          </View>
          <Text style={[styles.smallCategoryTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
            {language === 'ar' ? cat.titleAr : cat.titleEn}
          </Text>
          <Text style={[styles.smallCategoryDesc, { color: colors.textSecondary }]}>
            {language === 'ar' ? cat.descAr : cat.descEn}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
