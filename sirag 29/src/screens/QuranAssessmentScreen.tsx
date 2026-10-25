import CinematicSectionHeader from '../components/CinematicSectionHeader';
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import AdBanner from '../components/AdBanner';
import { useQuranAssessment } from '../hooks/useQuranAssessment';
import { getQuranAssessmentStyles } from '../components/quranAssessment/quranAssessmentStyles';
import { AssessmentLobby } from '../components/quranAssessment/AssessmentLobby';
import { AssessmentIntro } from '../components/quranAssessment/AssessmentIntro';
import { AssessmentActive } from '../components/quranAssessment/AssessmentActive';
import { AssessmentResults } from '../components/quranAssessment/AssessmentResults';

export default function QuranAssessmentScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language, backArrow } = useLanguage();
  const styles = useMemo(() => getQuranAssessmentStyles(colors), [colors]);

  const {
    screenState,
    setScreenState,
    filterMode,
    setFilterMode,
    selectedJuz,
    setSelectedJuz,
    selectedSurah,
    setSelectedSurah,
    selectedLimit,
    setSelectedLimit,
    allowedLimits,
    fetching,
    questions,
    currentIndex,
    currentQuestion,
    selectedAnswer,
    setSelectedAnswer,
    answered,
    correctCount,
    feedback,
    wrongAnswers,
    wordPool,
    builtWords,
    isCurrentQuestionVoice,
    profile,
    isFlying,
    lanternScale,
    lanternPos,
    lanternOpacity,
    walletScale,
    activeTargetLabel,
    difficultyLabel,
    handleTapPoolWord,
    handleTapBuiltWord,
    handleSubmitBuilder,
    handleSubmitMCQ,
    handleNext,
    handleStartLobby,
    handleShareResults,
  } = useQuranAssessment(navigation);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Top Header Bar */}
      <View style={styles.headerCustom}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (screenState === 'lobby' ? navigation.goBack() : setScreenState('lobby'))}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'رجوع' : 'Back'}
        >
          <Text style={{ fontSize: 20, color: colors.primary }}>{backArrow}</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'تقييم حفظ القرآن الكريم' : 'Quran memorization assessment'}
        </Text>

        <Animated.View style={[styles.walletBadge, { transform: [{ scale: walletScale }] }]}>
          <Text style={{ fontSize: 16, marginRight: 4 }}>🕯️</Text>
          <Text style={styles.walletText}>{profile?.sirajBalance ?? 50}</Text>
        </Animated.View>
      </View>

      <ScrollView
        style={[styles.outerContainer, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {screenState === 'lobby' && (<CinematicSectionHeader titleAr="رحلتي مع القرآن" titleEn="My Quran Journey" subtitleAr="اختبر حفظك وتقدّم على وتيرتك" subtitleEn="Check your memorization at your own pace" symbol="✧" />)}
        <View style={styles.container}>
          {screenState === 'lobby' && (
            <AssessmentLobby
              filterMode={filterMode}
              selectedJuz={selectedJuz}
              selectedSurah={selectedSurah}
              selectedLimit={selectedLimit}
              allowedLimits={allowedLimits}
              fetching={fetching}
              styles={styles}
              onSetFilterMode={setFilterMode}
              onSetSelectedJuz={setSelectedJuz}
              onSetSelectedSurah={setSelectedSurah}
              onSetSelectedLimit={setSelectedLimit}
              onStart={handleStartLobby}
            />
          )}

          {screenState === 'introduction' && (
            <AssessmentIntro
              activeTargetLabel={activeTargetLabel}
              selectedLimit={selectedLimit}
              difficultyLabel={difficultyLabel}
              totalQuestions={questions.length}
              styles={styles}
              onStart={() => setScreenState('assessment')}
              onBackToLobby={() => setScreenState('lobby')}
            />
          )}

          {screenState === 'assessment' && currentQuestion && (
            <AssessmentActive
              currentQuestion={currentQuestion}
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              selectedAnswer={selectedAnswer}
              answered={answered}
              feedback={feedback}
              isCurrentQuestionVoice={isCurrentQuestionVoice}
              wordPool={wordPool}
              builtWords={builtWords}
              styles={styles}
              onSelectAnswer={setSelectedAnswer}
              onTapPoolWord={handleTapPoolWord}
              onTapBuiltWord={handleTapBuiltWord}
              onSubmitBuilder={handleSubmitBuilder}
              onSubmitMCQ={handleSubmitMCQ}
              onNext={handleNext}
            />
          )}

          {screenState === 'results' && (
            <AssessmentResults
              activeTargetLabel={activeTargetLabel}
              correctCount={correctCount}
              totalQuestions={questions.length}
              wrongAnswers={wrongAnswers}
              styles={styles}
              onShare={handleShareResults}
              onNewAssessment={() => setScreenState('lobby')}
              onBackToHome={() => navigation.goBack()}
            />
          )}
        </View>
      </ScrollView>

      <AdBanner />

      {/* FLYING LANTERN REWARD CELEBRATION */}
      {isFlying && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View
            style={[
              styles.flyingFanoos,
              {
                transform: [
                  { scale: lanternScale },
                  { translateX: lanternPos.x },
                  { translateY: lanternPos.y },
                ],
                opacity: lanternOpacity,
              },
            ]}
          >
            <Text style={{ fontSize: 32 }}>🕯️</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}
