import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface AssessmentResultsProps {
  activeTargetLabel: string;
  correctCount: number;
  totalQuestions: number;
  wrongAnswers: { question: string; selected: string; correct: string }[];
  styles: any;
  onShare: () => void;
  onNewAssessment: () => void;
  onBackToHome: () => void;
}

export function AssessmentResults({
  activeTargetLabel,
  correctCount,
  totalQuestions,
  wrongAnswers,
  styles,
  onShare,
  onNewAssessment,
  onBackToHome,
}: AssessmentResultsProps) {
  const { colors } = useTheme();
  const { language, backArrow } = useLanguage();
  const accuracy = Math.round((correctCount / (totalQuestions || 1)) * 100);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.resultsHeader}>
        <View style={[styles.resultsIconHolder, { backgroundColor: colors.primaryTint }]}>
          <Svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <Path d="m22 4-10 10.01-3-3" />
          </Svg>
        </View>
        <Text style={[styles.resultsTitleText, { color: colors.textPrimary }]}>
          {language === 'ar' ? 'تم اكتمال التقييم!' : 'Assessment Complete!'}
        </Text>
        <Text style={[styles.resultsSubtitleText, { color: colors.textSecondary }]}>
          {language === 'ar' ? `نتيجتك لتقييم حفظ [${activeTargetLabel}]` : `Your performance report for [${activeTargetLabel}]`}
        </Text>
      </View>

      {/* Performance Stats */}
      <View style={styles.resultsStatsRow}>
        <View style={[styles.resultBox, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
          <Text style={[styles.resultVal, { color: colors.primaryDeep }]}>{accuracy}%</Text>
          <Text style={[styles.resultLbl, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'نسبة الدقة' : 'Accuracy'}
          </Text>
        </View>

        <View style={[styles.resultBox, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
          <Text style={[styles.resultVal, { color: colors.textPrimary }]}>
            {correctCount} / {totalQuestions}
          </Text>
          <Text style={[styles.resultLbl, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'الإجابات الصحيحة' : 'Correct Answers'}
          </Text>
        </View>
      </View>

      {/* Wrong Answers Report Card */}
      {wrongAnswers.length > 0 && (
        <View style={styles.wrongAnswersBlock}>
          <Text style={styles.wrongAnswersBlockTitle}>
            {language === 'ar' ? '📋 تقرير الأخطاء التي تحتاج لتثبيت ومراجعة:' : '📋 Incorrect Answers Review:'}
          </Text>
          {wrongAnswers.map((item, idx) => (
            <View key={idx} style={styles.wrongAnswerCard}>
              <Text style={styles.wrongAnswerQuestion}>{item.question}</Text>

              <View style={styles.wrongAnswerRow}>
                <Text style={styles.wrongAnswerLabel}>{language === 'ar' ? 'إجابتك:' : 'Your Answer:'}</Text>
                <View style={styles.answerTextCardWrong}>
                  <Text style={styles.answerTextWrong}>{item.selected} ❌</Text>
                </View>
              </View>

              <View style={styles.wrongAnswerRow}>
                <Text style={styles.wrongAnswerLabel}>{language === 'ar' ? 'الإجابة الصحيحة:' : 'Correct Answer:'}</Text>
                <View style={styles.answerTextCardCorrect}>
                  <Text style={styles.answerTextCorrect}>{item.correct} ✅</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Share CTA */}
      <TouchableOpacity
        style={styles.shareReportBtn}
        onPress={onShare}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={language === 'ar' ? 'مشاركة النتيجة بنص مخصص' : 'Share Performance Log'}
      >
        <Text style={styles.shareReportBtnText}>
          {language === 'ar' ? 'مشاركة النتيجة بنص مخصص 💬' : 'Share Performance Log 💬'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: colors.primary }]}
        onPress={onNewAssessment}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={language === 'ar' ? 'تقييم جديد' : 'New Assessment'}
      >
        <Text style={styles.nextBtnText}>
          {language === 'ar' ? 'تقييم جديد 🔄' : 'New Assessment 🔄'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.backToHomeBtn, { borderColor: colors.border }]}
        onPress={onBackToHome}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={language === 'ar' ? 'الرئيسية' : 'Home'}
      >
        <Text style={[styles.backToHomeBtnText, { color: colors.textSecondary }]}>{backArrow}</Text>
      </TouchableOpacity>
    </View>
  );
}
