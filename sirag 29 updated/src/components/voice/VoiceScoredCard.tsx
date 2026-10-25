import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { type Reader } from '../../data/readers';
import { type Ayah } from '../../data/ayahs';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface VoiceScoredCardProps {
  selectedReader: Reader;
  currentAyah: Ayah | null;
  recitationStyle: 'murattal' | 'mujawwad';
  scoreBreakdown: {
    pronunciation: number;
    tone: number;
    rhythm: number;
    tajweed: number;
    overall: number;
  };
  transcribedText: string;
  textMatchDetails: { matches: string[]; missing: string[] } | null;
  isTranscriptionSuccess: boolean;
  hasShared: boolean;
  hasSaved: boolean;
  styles: any;
  onShareToFeed: () => void;
  onSaveToProfile: () => void;
  onReset: () => void;
  onBack: () => void;
}

export function VoiceScoredCard({
  selectedReader,
  currentAyah,
  recitationStyle,
  scoreBreakdown,
  transcribedText,
  textMatchDetails,
  isTranscriptionSuccess,
  hasShared,
  hasSaved,
  styles,
  onShareToFeed,
  onSaveToProfile,
  onReset,
  onBack,
}: VoiceScoredCardProps) {
  const { colors, isLightMode } = useTheme();
  const { language, backArrow } = useLanguage();

  return (
    <View style={styles.card}>
      <Text style={styles.resultTitle}>نتائج التلاوة والمحاكاة</Text>
      <Text style={styles.resultSubtitle}>
        أسلوب التحدي: {recitationStyle === 'mujawwad' ? 'مجوّد (نغمي)' : 'مرتل (رسمي)'} | الشيخ {selectedReader.name}
      </Text>

      {/* Overall score box */}
      {scoreBreakdown.overall === 0 && (
        <View
          style={{
            backgroundColor: '#FEF2F2',
            borderColor: '#EF4444',
            borderWidth: 1.5,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 24, marginBottom: 8 }}>❌</Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: '#991B1B',
              textAlign: 'center',
              marginBottom: 4,
              fontFamily: 'IBMPlexSansArabic-Bold',
            }}
          >
            {language === 'ar' ? 'عذراً، لم تتطابق التلاوة!' : 'Recitation Mismatch!'}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: '#B91C1C',
              textAlign: 'center',
              lineHeight: 18,
              fontFamily: 'IBMPlexSansArabic-Regular',
            }}
          >
            {isTranscriptionSuccess
              ? language === 'ar'
                ? 'الكلمات التي نطقها طفلك لا تطابق الآية الكريمة المحددة. يرجى تلاوة الآية المكتوبة بوضوح وتجنب أي كلام جانبي.'
                : 'The words read do not match the target Quran verse. Please recite the written verse clearly.'
              : language === 'ar'
                ? 'يجب الاتصال بالإنترنت للتحقق من الكلمات ونطق الآيات وكسب نقاط التحدي.'
                : 'Internet connection is required to verify recitation words and earn points.'}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.overallScoreBox,
          scoreBreakdown.overall < 40 && styles.scoreBoxLow,
          scoreBreakdown.overall >= 75 && styles.scoreBoxHigh,
        ]}
      >
        <Text
          style={[
            styles.overallVal,
            scoreBreakdown.overall < 40 && styles.textLow,
            scoreBreakdown.overall >= 75 && styles.textHigh,
          ]}
        >
          {scoreBreakdown.overall}%
        </Text>
        <Text style={styles.overallLbl}>نسبة المحاكاة العامة</Text>
      </View>

      {/* Visual Speech Recognition results */}
      {isTranscriptionSuccess && transcribedText ? (
        <View
          style={{
            backgroundColor: isLightMode ? '#F0FDF4' : '#0B2519',
            borderColor: isLightMode ? '#DCFCE7' : '#143C27',
            borderWidth: 1,
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: colors.primary,
              marginBottom: 6,
              textAlign: 'right',
            }}
          >
            {language === 'ar' ? '📖 النص الذي نطقته (الذكاء الاصطناعي):' : '📖 Transcribed Audio (AI Speech):'}
          </Text>

          <Text
            style={{
              fontSize: 16,
              lineHeight: 26,
              textAlign: 'center',
              color: colors.textPrimary,
              fontWeight: '600',
            }}
          >
            {transcribedText}
          </Text>

          {/* Highlight matched vs missing words */}
          {textMatchDetails && (
            <View style={{ marginTop: 10, borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: 8 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'right', marginBottom: 4 }}>
                {language === 'ar'
                  ? `صحة الكلمات: ${scoreBreakdown.pronunciation}%`
                  : `Word accuracy: ${scoreBreakdown.pronunciation}%`}
              </Text>

              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center' }}>
                {(currentAyah?.text || '').split(/\s+/).map((word, wIdx) => {
                  const cleanWord = word
                    .replace(/[ً-ٰٟۖ-ۭ]/g, '')
                    .replace(/[أإآ]/g, 'ا')
                    .replace(/ة/g, 'ه')
                    .replace(/ى/g, 'ي');

                  const isMatched = textMatchDetails.matches.includes(cleanWord);

                  return (
                    <Text
                      key={`word-${wIdx}`}
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        marginHorizontal: 3,
                        color: isMatched ? '#10B981' : '#EF4444',
                        textDecorationLine: isMatched ? 'none' : 'line-through',
                      }}
                    >
                      {word}
                    </Text>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View
          style={{
            backgroundColor: isLightMode ? '#F9FAFB' : '#111827',
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center' }}>
            {language === 'ar'
              ? '📶 تعذر التحقق الصوتي التلقائي (أنت في وضع عدم الاتصال). تم استخدام المحاكاة الصوتية المحلية.'
              : '📶 Voice verification fallback to local acoustic model.'}
          </Text>
        </View>
      )}

      {/* Detailed breakdowns */}
      <View style={styles.breakdownList}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownPercent}>{scoreBreakdown.pronunciation}%</Text>
          <Text style={styles.breakdownLabel}>مخارج الحروف ونطق الكلمات (Syllables)</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownPercent}>{scoreBreakdown.tone}%</Text>
          <Text style={styles.breakdownLabel}>طبقة الصوت وتغيرات النغمة (Melody Contour)</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownPercent}>{scoreBreakdown.rhythm}%</Text>
          <Text style={styles.breakdownLabel}>تنظيم النفس وإيقاع الترتيل (Pacing)</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownPercent}>{scoreBreakdown.tajweed || 0}%</Text>
          <Text style={styles.breakdownLabel}>أحكام التجويد والمدود (Tajweed & Madd)</Text>
        </View>
      </View>

      {/* Reward feedback */}
      {scoreBreakdown.overall >= 40 ? (
        <View style={styles.rewardBox}>
          <Text style={styles.rewardText}>
            🏆 أحسنت! حصلت على +{Math.round((scoreBreakdown.overall / 100) * 25)} نقطة إضافية
          </Text>
        </View>
      ) : (
        <View style={[styles.rewardBox, styles.rewardBoxLow]}>
          <Text style={[styles.rewardText, styles.rewardTextLow]}>
            💡 حاول ترتيل الآية بنبرة مطابقة وسرعة متزنة لتحصل على نقاط.
          </Text>
        </View>
      )}

      <View style={styles.actionRow}>
        {!hasShared && scoreBreakdown.overall > 0 && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent, marginBottom: 10 }]}
            onPress={onShareToFeed}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryButtonText, { color: '#09120F', fontWeight: '900' }]}>
              {language === 'ar' ? '👥 نشر في ساحة التلاوة (+١٠ نقاط)' : '👥 Publish to Recitation Square (+10 XP)'}
            </Text>
          </TouchableOpacity>
        )}

        {!hasSaved && scoreBreakdown.overall > 0 && (
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: '#1E3A2F', borderColor: colors.primary, borderWidth: 1, marginBottom: 10 },
            ]}
            onPress={onSaveToProfile}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primary, fontWeight: '900' }]}>
              {language === 'ar' ? '💾 حفظ في ملفي الشخصي (+٥ نقاط)' : '💾 Save to My Profile (+5 XP)'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={onReset} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>
            {language === 'ar' ? 'تحدي قارئ آخر 🔄' : 'Challenge Another Qari 🔄'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.secondaryButtonText}>{backArrow}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
