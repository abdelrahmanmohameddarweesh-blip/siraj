import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { surahsList } from '../../data/surahs';

interface AssessmentLobbyProps {
  filterMode: 'juz' | 'surah';
  selectedJuz: number;
  selectedSurah: string;
  selectedLimit: number;
  allowedLimits: number[];
  fetching: boolean;
  styles: any;
  onSetFilterMode: (mode: 'juz' | 'surah') => void;
  onSetSelectedJuz: (juz: number) => void;
  onSetSelectedSurah: (surah: string) => void;
  onSetSelectedLimit: (limit: number) => void;
  onStart: () => void;
}

export function AssessmentLobby({
  filterMode,
  selectedJuz,
  selectedSurah,
  selectedLimit,
  allowedLimits,
  fetching,
  styles,
  onSetFilterMode,
  onSetSelectedJuz,
  onSetSelectedSurah,
  onSetSelectedLimit,
  onStart,
}: AssessmentLobbyProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {language === 'ar' ? 'تقييم حفظ القرآن الكريم 📖' : 'Quran Memorization Assessment 📖'}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {language === 'ar'
          ? 'اختبر دقة حفظك في سور وأجزاء محددة، واحصل على تقرير أداء لمشاركته وتتبع مستواك.'
          : 'Assess your memorization level in specific Surahs or Juz, and generate shareable performance logs.'}
      </Text>

      {/* Segmented Filter Mode Selector */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, filterMode === 'juz' && { backgroundColor: colors.primaryDeep }]}
          onPress={() => onSetFilterMode('juz')}
          accessibilityRole="tab"
          accessibilityState={{ selected: filterMode === 'juz' }}
          accessibilityLabel={language === 'ar' ? 'بالجزء' : 'By Juz'}
        >
          <Text style={[styles.segmentBtnText, filterMode === 'juz' && { color: colors.white, fontWeight: '700' }]}>
            {language === 'ar' ? 'بالجزء' : 'By Juz'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, filterMode === 'surah' && { backgroundColor: colors.primaryDeep }]}
          onPress={() => onSetFilterMode('surah')}
          accessibilityRole="tab"
          accessibilityState={{ selected: filterMode === 'surah' }}
          accessibilityLabel={language === 'ar' ? 'بالسورة' : 'By Surah'}
        >
          <Text style={[styles.segmentBtnText, filterMode === 'surah' && { color: colors.white, fontWeight: '700' }]}>
            {language === 'ar' ? 'بالسورة' : 'By Surah'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selection Scrollbars */}
      {filterMode === 'juz' ? (
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {language === 'ar' ? 'اختر الجزء (١ - ٣٠):' : 'Select Juz (1 - 30):'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollListContainer}>
            {Array.from({ length: 30 }, (_, i) => i + 1).map(juzNum => {
              const isSelected = selectedJuz === juzNum;
              return (
                <TouchableOpacity
                  key={juzNum}
                  style={[
                    styles.scrollCell,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    isSelected && { backgroundColor: colors.primaryTint, borderColor: colors.primary },
                  ]}
                  onPress={() => onSetSelectedJuz(juzNum)}
                  accessibilityRole="button"
                  accessibilityLabel={`Juz ${juzNum}`}
                >
                  <Text style={[styles.scrollCellText, { color: colors.textPrimary }, isSelected && { fontWeight: '700' }]}>
                    {language === 'ar' ? `جزء ${juzNum}` : `Juz ${juzNum}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.sectionWrapper}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {language === 'ar' ? 'اختر السورة (١١٤ سورة):' : 'Select Surah (114 Surahs):'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollListContainer}>
            {surahsList.map(surah => {
              const isSelected = selectedSurah === surah.name;
              return (
                <TouchableOpacity
                  key={surah.number}
                  style={[
                    styles.scrollCell,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    isSelected && { backgroundColor: colors.primaryTint, borderColor: colors.primary },
                  ]}
                  onPress={() => onSetSelectedSurah(surah.name)}
                  accessibilityRole="button"
                  accessibilityLabel={surah.name}
                >
                  <Text style={[styles.scrollCellText, { color: colors.textPrimary }, isSelected && { fontWeight: '700' }]}>
                    {surah.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Questions Limit */}
      <View style={styles.sectionWrapper}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          {language === 'ar' ? 'عدد الأسئلة (يزداد الصعوبة بزيادة العدد):' : 'Questions Limit (Difficulty scales with limit):'}
        </Text>
        <View style={styles.limitOptionRow}>
          {allowedLimits.map(limitVal => {
            const isSelected = selectedLimit === limitVal;
            let diffLabel = language === 'ar' ? 'مبتدئ' : 'Easy';
            if (limitVal === 10) diffLabel = language === 'ar' ? 'متوسط' : 'Medium';
            if (limitVal === 15) diffLabel = language === 'ar' ? 'متقدم' : 'Hard';
            if (limitVal === 20) diffLabel = language === 'ar' ? 'بطل' : 'Expert';

            return (
              <TouchableOpacity
                key={limitVal}
                style={[
                  styles.limitPill,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  isSelected && { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
                ]}
                onPress={() => onSetSelectedLimit(limitVal)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${limitVal} questions (${diffLabel})`}
              >
                <Text style={[styles.limitPillVal, { color: colors.textPrimary }, isSelected && { color: colors.white, fontWeight: '700' }]}>
                  {limitVal}
                </Text>
                <Text style={[styles.limitPillLbl, { color: colors.textSecondary }, isSelected && { color: colors.white }]}>
                  {diffLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Start Button */}
      {fetching ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primaryDeep} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'جارٍ توليد الأسئلة الدقيقة وتحميل الآيات...' : 'Generating precision questions...'}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primaryDeep }]}
          onPress={onStart}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'بدء جلسة التقييم الآن' : 'Start Assessment'}
        >
          <Text style={styles.primaryBtnText}>
            {language === 'ar' ? 'بدء جلسة التقييم الآن ➔' : 'Start Assessment Now ➔'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
