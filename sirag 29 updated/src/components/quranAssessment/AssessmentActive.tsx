import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DynamicQuestion } from '../../hooks/useQuranAssessment';

interface AssessmentActiveProps {
  currentQuestion: DynamicQuestion;
  currentIndex: number;
  totalQuestions: number;
  isCurrentQuestionVoice: boolean;
  selectedAnswer: string;
  answered: boolean;
  builtWords: { id: string; text: string }[];
  wordPool: { id: string; text: string }[];
  feedback: string;
  styles: any;
  onSelectAnswer: (opt: string) => void;
  onTapBuiltWord: (word: { id: string; text: string }) => void;
  onTapPoolWord: (word: { id: string; text: string }) => void;
  onSubmitBuilder: () => void;
  onSubmitMCQ: () => void;
  onNext: () => void;
}

export function AssessmentActive({
  currentQuestion,
  currentIndex,
  totalQuestions,
  isCurrentQuestionVoice,
  selectedAnswer,
  answered,
  builtWords,
  wordPool,
  feedback,
  styles,
  onSelectAnswer,
  onTapBuiltWord,
  onTapPoolWord,
  onSubmitBuilder,
  onSubmitMCQ,
  onNext,
}: AssessmentActiveProps) {
  const { colors } = useTheme();
  const { language, formatNumber } = useLanguage();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header progress bar */}
      <View style={styles.quizHeader}>
        <View style={styles.quizMetaRow}>
          <View style={[styles.categoryBadge, { backgroundColor: colors.primaryTint }]}>
            <Text style={[styles.categoryBadgeText, { color: colors.primaryOnTint }]}>
              {isCurrentQuestionVoice
                ? `🎙️ ${language === 'ar' ? 'القسم الثاني: التسميع الصوتي' : 'Phase 2: Oral Recitation'}`
                : `✏️ ${language === 'ar' ? 'القسم الأول: اختيار من متعدد' : 'Phase 1: Written MCQ'}`}
            </Text>
          </View>
          <Text style={[styles.quizProgressText, { color: colors.textSecondary }]}>
            {language === 'ar'
              ? `سؤال ${formatNumber(currentIndex + 1)} من ${formatNumber(totalQuestions)}`
              : `Question ${currentIndex + 1} of ${totalQuestions}`}
          </Text>
        </View>
        <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentIndex + 1) / totalQuestions) * 100}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>
      </View>

      {/* Instructions */}
      <Text style={[styles.instructionLabelText, { color: colors.textSecondary }]}>
        {isCurrentQuestionVoice
          ? language === 'ar' ? 'سجل تلاوتك للآية المفقودة بصوتك:' : 'Record your recitation for the missing verse:'
          : currentQuestion.type === 'missing_ayah'
          ? language === 'ar' ? 'اختر الآية الكريمة المناسبة لإكمال السياق:' : 'Select the correct missing Ayah to complete the verse:'
          : language === 'ar' ? 'في أي سورة وردت هذه الآية الكريمة؟' : 'In which Surah does this Ayah appear?'}
      </Text>

      {/* Prompt Verse */}
      <View style={[styles.promptCard, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}>
        <Text style={[styles.promptText, { color: colors.textPrimary }]}>{currentQuestion.prompt}</Text>
      </View>

      {/* Options list / Voice Content */}
      {!isCurrentQuestionVoice ? (
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map(opt => {
            const isSelected = selectedAnswer === opt;
            const isCorrectOpt = opt === currentQuestion.answer;

            let optBtnStyle: any = styles.optionBtn;
            let optTextStyle: any = styles.optionBtnText;

            if (answered) {
              if (isCorrectOpt) {
                optBtnStyle = [styles.optionBtn, styles.optionBtnCorrect];
                optTextStyle = [styles.optionBtnText, styles.optionTextWhite];
              } else if (isSelected) {
                optBtnStyle = [styles.optionBtn, styles.optionBtnIncorrect];
                optTextStyle = [styles.optionBtnText, styles.optionTextWhite];
              } else {
                optBtnStyle = [styles.optionBtn, styles.optionBtnDisabled];
                optTextStyle = [styles.optionBtnText, styles.optionTextMuted];
              }
            } else if (isSelected) {
              optBtnStyle = [styles.optionBtn, styles.optionBtnSelected];
              optTextStyle = [styles.optionBtnText, styles.optionTextSelected];
            }

            return (
              <TouchableOpacity
                key={opt}
                style={[optBtnStyle, { minHeight: 48 }]}
                onPress={() => !answered && onSelectAnswer(opt)}
                disabled={answered}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${opt}${
                  answered
                    ? isCorrectOpt
                      ? language === 'ar' ? '، إجابة صحيحة' : ', correct answer'
                      : isSelected
                      ? language === 'ar' ? '، إجابة خاطئة' : ', incorrect answer'
                      : ''
                    : isSelected
                    ? language === 'ar' ? '، محدد' : ', selected'
                    : ''
                }`}
                accessibilityState={{ selected: isSelected, disabled: answered }}
              >
                <Text style={optTextStyle}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={[styles.voiceRecorderContainer, { borderColor: colors.border, padding: 16 }]}>
          <Text style={[styles.audioStateSubText, { color: colors.textSecondary, marginBottom: 8, fontWeight: '700' }]}>
            {language === 'ar' ? 'الآية التي قمت بتركيبها:' : 'Your constructed verse:'}
          </Text>

          <View
            style={[
              styles.promptCard,
              {
                backgroundColor: colors.neutralTint,
                borderColor: colors.border,
                minHeight: 65,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
              },
            ]}
          >
            {builtWords.length === 0 ? (
              <Text style={{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>
                {language === 'ar' ? '[ اضغط على الكلمات بالترتيب لتركيب الآية ]' : '[ Tap words in order to build the verse ]'}
              </Text>
            ) : (
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
                {builtWords.map(word => (
                  <TouchableOpacity
                    key={word.id}
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 6,
                    }}
                    onPress={() => onTapBuiltWord(word)}
                    disabled={answered}
                  >
                    <Text style={{ color: colors.white, fontSize: 14, fontWeight: '600' }}>{word.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {!answered && (
            <>
              <Text style={[styles.audioStateSubText, { color: colors.textSecondary, marginBottom: 8, fontWeight: '700' }]}>
                {language === 'ar' ? 'اختر الكلمات بالترتيب الصحيح:' : 'Select words in the correct order:'}
              </Text>
              <View style={{ flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingBottom: 16 }}>
                {wordPool.map(word => (
                  <TouchableOpacity
                    key={word.id}
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                    }}
                    onPress={() => onTapPoolWord(word)}
                  >
                    <Text style={{ color: colors.textPrimary, fontSize: 13 }}>{word.text}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {!answered && (
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary, marginTop: 12, opacity: builtWords.length === 0 ? 0.6 : 1, minHeight: 48 },
              ]}
              onPress={onSubmitBuilder}
              disabled={builtWords.length === 0}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={language === 'ar' ? 'تحقق من الترتيب' : 'Verify Word Order'}
              accessibilityState={{ disabled: builtWords.length === 0 }}
            >
              <Text style={styles.submitBtnText}>{language === 'ar' ? 'تحقق من الترتيب' : 'Verify Word Order'}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Feedback & Actions */}
      {answered && (
        <View style={styles.feedbackWrapper}>
          <Text style={[styles.feedbackTitleText, { color: colors.textPrimary }]}>{feedback}</Text>
          <Text style={styles.correctAnswerText}>{currentQuestion.answer}</Text>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: colors.primary, minHeight: 48 }]}
            onPress={onNext}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={
              currentIndex + 1 >= totalQuestions
                ? language === 'ar' ? 'عرض التقييم النهائي' : 'View Report'
                : language === 'ar' ? 'السؤال التالي' : 'Next Question'
            }
          >
            <Text style={styles.nextBtnText}>
              {currentIndex + 1 >= totalQuestions
                ? language === 'ar' ? 'عرض التقييم النهائي ➔' : 'View Report ➔'
                : language === 'ar' ? 'السؤال التالي ➔' : 'Next Question ➔'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!answered && !isCurrentQuestionVoice && (
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.primaryDeep, minHeight: 48, opacity: selectedAnswer ? 1 : 0.6 },
          ]}
          onPress={onSubmitMCQ}
          activeOpacity={0.85}
          disabled={!selectedAnswer}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'تحقق من الإجابة' : 'Check Answer'}
          accessibilityState={{ disabled: !selectedAnswer }}
        >
          <Text style={styles.submitBtnText}>{language === 'ar' ? 'تحقق من الإجابة' : 'Check Answer'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
