import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { type Reader } from '../../data/readers';
import { ayahs, type Ayah } from '../../data/ayahs';
import { surahsList } from '../../data/surahs';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface VoiceAyahStepProps {
  selectedReader: Reader;
  selectedSurahNumber: number;
  startAyahNumber: number;
  endAyahNumber: number;
  recordWholeSurah: boolean;
  fetchingAyah: boolean;
  styles: any;
  onSelectQuickAyah: (ayah: Ayah) => void;
  onSetSelectedSurahNumber: (surahNum: number) => void;
  onSetStartAyahNumber: (num: number) => void;
  onSetEndAyahNumber: (num: number) => void;
  onToggleRecordWholeSurah: () => void;
  onLoadSelectedAyahRange: (surahNum: number, startNum: number, endNum: number) => void;
  onReset: () => void;
}

export function VoiceAyahStep({
  selectedReader,
  selectedSurahNumber,
  startAyahNumber,
  endAyahNumber,
  recordWholeSurah,
  fetchingAyah,
  styles,
  onSelectQuickAyah,
  onSetSelectedSurahNumber,
  onSetStartAyahNumber,
  onSetEndAyahNumber,
  onToggleRecordWholeSurah,
  onLoadSelectedAyahRange,
  onReset,
}: VoiceAyahStepProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  return (
    <View style={styles.card}>
      <View style={styles.qariHeader}>
        <Text style={styles.qariName}>المحاكاة المطلوبة: {selectedReader.name}</Text>
        <Text style={styles.qariAdvice}>💡 نصيحة النبرة: {selectedReader.tuneAdvice}</Text>
      </View>

      <Text style={styles.sectionTitle}>اختر الآية الكريمة للتحدي:</Text>

      {/* Path A: Quick Select Popular Verses */}
      <Text style={styles.subSectionTitle}>⚡ آيات سريعة مقترحة:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAyahScroll}>
        {ayahs.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={styles.quickAyahBadge}
            onPress={() => onSelectQuickAyah(a)}
            activeOpacity={0.8}
          >
            <Text style={styles.quickAyahBadgeText}>{a.surah}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Path B: Select from Quran */}
      <Text style={styles.subSectionTitle}>🌍 تصفح المصحف الشريف كاملاً:</Text>

      {/* Surah Picker Container */}
      <Text style={styles.pickerLabel}>اختر السورة:</Text>
      <ScrollView style={styles.pickerScrollView} nestedScrollEnabled={true}>
        <View style={styles.pickerGrid}>
          {surahsList.map((s) => (
            <TouchableOpacity
              key={s.number}
              style={[
                styles.pickerGridItem,
                selectedSurahNumber === s.number && styles.pickerGridItemActive,
              ]}
              onPress={() => onSetSelectedSurahNumber(s.number)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerGridItemText,
                  selectedSurahNumber === s.number && styles.pickerGridItemTextActive,
                ]}
              >
                {s.number}. {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Record Whole Surah Toggle Option */}
      <TouchableOpacity
        style={[styles.wholeSurahToggleRow, recordWholeSurah && styles.wholeSurahToggleRowActive]}
        onPress={onToggleRecordWholeSurah}
        activeOpacity={0.8}
      >
        <Text style={[styles.wholeSurahToggleText, recordWholeSurah && styles.wholeSurahToggleTextActive]}>
          {language === 'ar' ? '📖 تلاوة السورة كاملة' : '📖 Record Entire Surah'}
        </Text>
      </TouchableOpacity>

      {!recordWholeSurah && (
        <View style={{ width: '100%' }}>
          {/* Start Ayah Picker */}
          <Text style={styles.pickerLabel}>آية البداية:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ayahNumberScroll}>
            {Array.from(
              { length: surahsList.find((s) => s.number === selectedSurahNumber)?.totalAyahs || 7 },
              (_, i) => i + 1
            ).map((num) => (
              <TouchableOpacity
                key={`start-${num}`}
                style={[styles.ayahNumBadge, startAyahNumber === num && styles.ayahNumBadgeActive]}
                onPress={() => onSetStartAyahNumber(num)}
                activeOpacity={0.7}
              >
                <Text style={[styles.ayahNumBadgeText, startAyahNumber === num && styles.ayahNumBadgeTextActive]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* End Ayah Picker */}
          <Text style={styles.pickerLabel}>آية النهاية:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ayahNumberScroll}>
            {Array.from(
              { length: (surahsList.find((s) => s.number === selectedSurahNumber)?.totalAyahs || 7) - startAyahNumber + 1 },
              (_, i) => i + startAyahNumber
            ).map((num) => (
              <TouchableOpacity
                key={`end-${num}`}
                style={[styles.ayahNumBadge, endAyahNumber === num && styles.ayahNumBadgeActive]}
                onPress={() => onSetEndAyahNumber(num)}
                activeOpacity={0.7}
              >
                <Text style={[styles.ayahNumBadgeText, endAyahNumber === num && styles.ayahNumBadgeTextActive]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {fetchingAyah ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
      ) : (
        <TouchableOpacity
          style={styles.loadAyahBtn}
          onPress={() => onLoadSelectedAyahRange(selectedSurahNumber, startAyahNumber, endAyahNumber)}
          activeOpacity={0.85}
        >
          <Text style={styles.loadAyahBtnText}>تحميل الآيات ومتابعة التحدي 📖</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backButton} onPress={onReset}>
        <Text style={styles.backButtonText}>تغيير القارئ</Text>
      </TouchableOpacity>
    </View>
  );
}
