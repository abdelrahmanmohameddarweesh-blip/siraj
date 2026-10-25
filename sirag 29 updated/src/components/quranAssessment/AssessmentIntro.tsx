import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface AssessmentIntroProps {
  activeTargetLabel: string;
  selectedLimit: number;
  difficultyLabel: string;
  totalQuestions: number;
  styles: any;
  onStart: () => void;
  onBackToLobby: () => void;
}

export function AssessmentIntro({
  activeTargetLabel,
  selectedLimit,
  difficultyLabel,
  totalQuestions,
  styles,
  onStart,
  onBackToLobby,
}: AssessmentIntroProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const mcqQuestionsLimit = Math.ceil(totalQuestions / 2);
  const voiceQuestionsLimit = totalQuestions - mcqQuestionsLimit;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.introHeader}>
        <View style={[styles.introIconWrapper, { backgroundColor: colors.primaryTint }]}>
          <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
            <Path d="M6 6h10M6 10h10" />
          </Svg>
        </View>
        <Text style={[styles.introTitleText, { color: colors.textPrimary }]}>
          {language === 'ar' ? 'مخطط التقييم المقسم 📊' : 'Structured Assessment Flow 📊'}
        </Text>
      </View>

      <View style={[styles.introDetailsBox, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
        <View style={styles.introDetailRow}>
          <Text style={[styles.introDetailLabel, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'الهدف المختار:' : 'Selected Target:'}
          </Text>
          <Text style={[styles.introDetailValue, { color: colors.textPrimary }]}>
            {activeTargetLabel}
          </Text>
        </View>

        <View style={styles.introDetailRow}>
          <Text style={[styles.introDetailLabel, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'إجمالي الأسئلة:' : 'Total Questions:'}
          </Text>
          <Text style={[styles.introDetailValue, { color: colors.textPrimary }]}>
            {selectedLimit}
          </Text>
        </View>

        <View style={styles.introDetailRow}>
          <Text style={[styles.introDetailLabel, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'مستوى الصعوبة:' : 'Difficulty level:'}
          </Text>
          <Text style={[styles.introDetailValue, { color: colors.primaryDeep }]}>
            {difficultyLabel}
          </Text>
        </View>
      </View>

      <View style={styles.introRulesWrapper}>
        <Text style={[styles.introRulesTitle, { color: colors.textPrimary }]}>
          {language === 'ar' ? 'قواعد التقييم الإلزامي:' : 'Mandatory Assessment Phases:'}
        </Text>

        <View style={styles.ruleItem}>
          <Text style={styles.ruleBullet}>1️⃣</Text>
          <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
            {language === 'ar'
              ? `القسم الأول (${mcqQuestionsLimit} أسئلة): أسئلة تحريرية (اختيار من متعدد) لإثبات دقة التعرف والتمييز.`
              : `Phase 1 (${mcqQuestionsLimit} Qs): Written multiple-choice questions to test basic recall & recognition.`}
          </Text>
        </View>

        <View style={styles.ruleItem}>
          <Text style={styles.ruleBullet}>2️⃣</Text>
          <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
            {language === 'ar'
              ? `القسم الثاني (${voiceQuestionsLimit} أسئلة): تسميع شفهي بالصوت. يتم فيه تدقيق الكلمات وترتيبها بدقة (دون تقييم التجويد).`
              : `Phase 2 (${voiceQuestionsLimit} Qs): Oral voice recitations. AI evaluates strictly on word arrangement and completeness (no Tajweed grading).`}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.startBtn, { backgroundColor: colors.primaryDeep }]}
        onPress={onStart}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={language === 'ar' ? 'ابدأ الاختبار الآن' : 'Start Assessment Now'}
      >
        <Text style={styles.startBtnText}>
          {language === 'ar' ? 'ابدأ الاختبار الآن ⚡' : 'Start Assessment Now ⚡'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.backToHomeBtn, { borderColor: colors.border }]}
        onPress={onBackToLobby}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={language === 'ar' ? 'تعديل الخيارات' : 'Edit Choices'}
      >
        <Text style={[styles.backToHomeBtnText, { color: colors.textSecondary }]}>
          {language === 'ar' ? 'تعديل الخيارات' : 'Edit Choices'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
