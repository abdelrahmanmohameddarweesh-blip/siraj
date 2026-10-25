import { recordChallenge } from '../services/challengeProgress';
import CinematicJourneyPanel from '../components/CinematicJourneyPanel';
import QuestMilestoneStrip from '../components/QuestMilestoneStrip';
import { useLanguage } from '../contexts/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { readingPassages, type ReadingPassage } from '../data/reading';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile, addSirajPoints } from '../firebase/auth';
import { Colors } from '../config/colors';

const READING_PROGRESS_KEY = 'batl-reading-progress-v2';
type ReadingProgress = { index: number; passageIds: number[]; correct: number; attempts: number; savedAt: string };
const shufflePassages = () => [...readingPassages.keys()].sort(() => Math.random() - 0.5);
export default function ReadingChallengeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { language, backArrow } = useLanguage();
  const [passageOrder, setPassageOrder] = useState<number[]>(() => shufflePassages());
  const passages = passageOrder.map(index => readingPassages[index]).filter(Boolean);
  const [progressReady, setProgressReady] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [bestCorrect, setBestCorrect] = useState(0);
  const restoring = useRef(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [scoreEarned, setScoreEarned] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const currentPassage = passages[currentIndex];
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [saved, best] = await Promise.all([
          AsyncStorage.getItem(READING_PROGRESS_KEY),
          AsyncStorage.getItem('batl-reading-best-v1'),
        ]);
        if (!active) return;
        if (best) setBestCorrect(Math.max(0, Number(best) || 0));
        if (saved) {
          const parsed = JSON.parse(saved) as ReadingProgress;
          const validOrder = Array.isArray(parsed.passageIds)
            && parsed.passageIds.length === readingPassages.length
            && new Set(parsed.passageIds).size === readingPassages.length
            && parsed.passageIds.every(i => Number.isInteger(i) && i >= 0 && i < readingPassages.length);
          if (validOrder && Number.isInteger(parsed.index) && parsed.index >= 0 && parsed.index < readingPassages.length) {
            setPassageOrder(parsed.passageIds);
            setCurrentIndex(parsed.index);
            setCorrectCount(Math.max(0, Math.min(readingPassages.length, Number(parsed.correct) || 0)));
            setAttemptCount(Math.max(0, Number(parsed.attempts) || 0));
          }
        }
      } catch (error) { console.warn('Reading progress could not be restored', error); }
      finally { if (active) { restoring.current = false; setProgressReady(true); } }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!progressReady || completed) return;
    const progress: ReadingProgress = {
      index: currentIndex, passageIds: passageOrder,
      correct: correctCount, attempts: attemptCount, savedAt: new Date().toISOString(),
    };
    AsyncStorage.setItem(READING_PROGRESS_KEY, JSON.stringify(progress))
      .catch(error => console.warn('Reading progress could not be saved', error));
  }, [progressReady, completed, currentIndex, passageOrder, correctCount, attemptCount]);
  const restartJourney = async () => {
    await AsyncStorage.removeItem(READING_PROGRESS_KEY).catch(() => {});
    setPassageOrder(shufflePassages());
    setCurrentIndex(0);
    setCorrectCount(0);
    setAttemptCount(0);
    setScoreEarned(0);
    setSelectedAnswer('');
    setAnswered(false);
    setFeedback('');
    setCompleted(false);
  };

  const loadProfile = async () => {
    if (user?.uid) {
      try {
        const data = await getCurrentUserProfile(user.uid);
        setProfile(data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.uid]);

  const handleSubmit = async () => {
    if (!currentPassage) return;

    if (!selectedAnswer.trim()) {
      Alert.alert('تنبيه', 'الرجاء اختيار إجابة واحدة للاستمرار.');
      return;
    }

    const isCorrect = selectedAnswer === currentPassage.answer;
    setAttemptCount(previous => previous + 1);
    if (isCorrect) setCorrectCount(previous => previous + 1);
    setAnswered(true);

    if (isCorrect) {
      setFeedback('إجابة صحيحة! أحسنت وبوركت قراءتك 🌟 (+١٠ 🕯️ سراج)');
      const earned = scoreEarned + 10;
      setScoreEarned(earned);

      // Sync user profile score and Siraj points
      if (user?.uid) {
        try {
          const updated = await addSirajPoints(user.uid, 10);
          setProfile(updated);
          const currentScore = updated.score ?? 0;
          await saveUserScore(user.uid, currentScore + 10);
        } catch (err) {
          console.error(err);
        }
      }
    } else {
      setFeedback(`إجابة غير دقيقة. الإجابة الأصح هي:`);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < passages.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer('');
      setAnswered(false);
      setFeedback('');
    } else {
      setCompleted(true);
      AsyncStorage.removeItem(READING_PROGRESS_KEY).catch(() => {});
      const finalCorrect = correctCount;
      recordChallenge({ id: `reading-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        kind: 'reading', completedAt: new Date().toISOString(), correct: finalCorrect,
        total: passages.length, points: scoreEarned }).catch(console.warn);
      if (finalCorrect > bestCorrect) {
        setBestCorrect(finalCorrect);
        AsyncStorage.setItem('batl-reading-best-v1', String(finalCorrect)).catch(() => {});
      }
    }
  };

  if (passages.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyState}>لا توجد نصوص متوفرة حالياً.</Text>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      {/* Top Header Bar with Icon-Only Back Button and Siraj Badge on Left */}
      <View style={styles.headerCustom}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: Colors.primary }}>{backArrow}</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>تحدي القراءة وفهم المقروء</Text>

        <View style={styles.walletBadge}>
          <Text style={{ fontSize: 15, marginRight: 4 }}>🕯️</Text>
          <Text style={styles.walletText}>
            {profile?.sirajBalance ?? 50}
          </Text>
        </View>
      </View>

      <CinematicJourneyPanel titleAr="رحلة القراءة" titleEn="Reading Quest" subtitleAr="اقرأ بتأنٍ، تدبّر المعاني، وأكمل التحديات" subtitleEn="Read carefully, reflect and complete each challenge" icon="✦" progress={passages.length ? (completed ? 100 : currentIndex / passages.length * 100) : 0} progressLabelAr="تقدم القراءة" progressLabelEn="Reading progress" compact />
      <QuestMilestoneStrip current={completed ? passages.length : currentIndex} total={passages.length} labelAr="محطات رحلة القراءة" labelEn="Reading journey checkpoints" completed={completed} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.subtitle}>اقرأ النصوص بدقة وتدبر لتجيب على الأسئلة وتزيد أنوار السراج 🕯️</Text>
          </View>

          {!progressReady ? (
            <Text style={styles.subtitle}>{language === 'ar' ? 'جارٍ تحميل تقدمك…' : 'Loading your progress…'}</Text>
          ) : completed ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultEmoji}>📚</Text>
              <Text style={styles.resultTitle}>أنهيت القراءة بنجاح!</Text>
              <Text style={styles.resultSubtitle}>قراءة هادفة تغذي العقل والروح وتزيد حصيلتك من أنوار السراج</Text>
              
              <View style={styles.statBox}>
                <Text style={styles.statLbl}>{language === 'ar' ? `إجابات صحيحة: ${correctCount} من ${passages.length} · أفضل نتيجة: ${Math.max(bestCorrect, correctCount)}` : `Correct: ${correctCount}/${passages.length} · Best: ${Math.max(bestCorrect, correctCount)}`}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>+{scoreEarned} 🕯️</Text>
                <Text style={styles.statLbl}>أنوار السراج المكتسبة</Text>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={restartJourney} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>{language === 'ar' ? 'ابدأ رحلة جديدة ↻' : 'Start a new journey ↻'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, { marginTop: 10 }]} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>{backArrow}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.quizCard}>
              <Text style={[styles.subtitle, { marginBottom: 12 }]}>
                {language === 'ar'
                  ? `المحطة ${currentIndex + 1} من ${passages.length} · ${correctCount} إجابات صحيحة · يُحفظ تقدمك تلقائياً`
                  : `Passage ${currentIndex + 1} of ${passages.length} · ${correctCount} correct · Progress saved automatically`}
              </Text>
              {/* Passage Text */}
              <View style={styles.passageContainer}>
                <Text style={styles.passageTitle}>📖 {currentPassage.title}</Text>
                <Text style={styles.passageText}>{currentPassage.passage}</Text>
              </View>

              {/* Question Text */}
              <Text style={styles.questionText}>{currentPassage.question}</Text>

              {/* Options */}
              <View style={styles.optionsContainer}>
                {currentPassage.options.map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentPassage.answer;

                  let btnStyle: any = styles.optionButton;
                  let textStyle: any = styles.optionText;

                  if (answered) {
                    if (isCorrect) {
                      btnStyle = [styles.optionButton, styles.optionButtonCorrect];
                      textStyle = [styles.optionText, styles.optionTextWhite];
                    } else if (isSelected) {
                      btnStyle = [styles.optionButton, styles.optionButtonIncorrect];
                      textStyle = [styles.optionText, styles.optionTextWhite];
                    } else {
                      btnStyle = [styles.optionButton, styles.optionButtonDisabled];
                      textStyle = [styles.optionText, styles.optionTextMuted];
                    }
                  } else if (isSelected) {
                    btnStyle = [styles.optionButton, styles.optionButtonSelected];
                    textStyle = [styles.optionText, styles.optionTextSelected];
                  }

                  return (
                    <TouchableOpacity
                      key={option}
                      style={btnStyle}
                      onPress={() => !answered && setSelectedAnswer(option)}
                      disabled={answered}
                      activeOpacity={0.8}
                    >
                      <Text style={textStyle}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Feedback block */}
              {answered && (
                <View style={[
                  styles.feedbackBox,
                  selectedAnswer === currentPassage.answer ? styles.feedbackBoxCorrect : styles.feedbackBoxIncorrect
                ]}>
                  <Text style={styles.feedbackTitle}>{feedback}</Text>
                  {selectedAnswer !== currentPassage.answer && (
                    <Text style={styles.correctVal}>{currentPassage.answer}</Text>
                  )}
                  <Text style={styles.explanationText}>{currentPassage.explanation}</Text>
                </View>
              )}

              {/* Actions */}
              {answered ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
                  <Text style={styles.primaryButtonText}>
                    {currentIndex + 1 < passages.length ? 'النص التالي ➔' : 'إنهاء التحدي ✓'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} activeOpacity={0.85}>
                  <Text style={styles.primaryButtonText}>تأكيد الإجابة ✓</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerCustom: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
  },
  walletText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 12.5,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 6,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  resultSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  statBox: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
    width: '100%',
  },
  statVal: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  statLbl: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  quizCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  passageContainer: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
  },
  passageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'right',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  passageText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textPrimary,
    textAlign: 'right',
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 16,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 18,
  },
  optionButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  optionButtonCorrect: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  optionButtonIncorrect: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  optionButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E2E8F0',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  optionTextWhite: {
    color: Colors.surface,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  optionTextMuted: {
    color: '#A0AEC0',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  feedbackBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  feedbackBoxCorrect: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  feedbackBoxIncorrect: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'right',
    color: Colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  correctVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.error,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 6,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  explanationText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  emptyState: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 40,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
});
