import { recordChallenge } from '../services/challengeProgress';
import CinematicJourneyPanel from '../components/CinematicJourneyPanel';
import { useLanguage } from '../contexts/LanguageContext';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Animated, Dimensions } from 'react-native';
import { hadiths, type HadithQuestion } from '../data/hadith';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile, addSirajPoints, incrementCorrectAnswers } from '../firebase/auth';
import { Colors } from '../config/colors';
import AdBanner from '../components/AdBanner';

export default function HadithChallengeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { language, backArrow } = useLanguage();
  const [questions] = useState<HadithQuestion[]>(() => [...hadiths].sort(() => Math.random() - 0.5));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [scoreEarned, setScoreEarned] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  const currentQuestion = questions[currentIndex];

  // Siraj and animation states
  const [profile, setProfile] = useState<any>(null);
  const [isFlying, setIsFlying] = useState(false);
  const lanternScale = useRef(new Animated.Value(0)).current;
  const lanternPos = useRef(new Animated.ValueXY({ x: 0, y: 150 })).current;
  const lanternOpacity = useRef(new Animated.Value(1)).current;
  const walletScale = useRef(new Animated.Value(1)).current;

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    if (!currentQuestion) return;

    if (!selectedAnswer.trim()) {
      Alert.alert('تنبيه', 'الرجاء اختيار إجابة واحدة للاستمرار.');
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;
    setAnswered(true);

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setFeedback('إجابة صحيحة! بورك علمك بالحديث الشريف 🌟');
      const earned = scoreEarned + 15;
      setScoreEarned(earned);

      // Start flying lantern animation
      setIsFlying(true);
      lanternScale.setValue(0);
      lanternPos.setValue({ x: 0, y: 120 });
      lanternOpacity.setValue(1);

      // 1. Pop scale in center
      Animated.spring(lanternScale, {
        toValue: 1.5,
        friction: 5,
        useNativeDriver: false,
      }).start(() => {
        // 2. Fly to top left wallet
        Animated.delay(400).start(() => {
          Animated.parallel([
            Animated.timing(lanternPos.x, {
              toValue: -(SCREEN_WIDTH / 2 - 45),
              duration: 700,
              useNativeDriver: false,
            }),
            Animated.timing(lanternPos.y, {
              toValue: -SCREEN_HEIGHT / 2 + 100, // align with wallet y
              duration: 700,
              useNativeDriver: false,
            }),
            Animated.timing(lanternScale, {
              toValue: 0.3,
              duration: 700,
              useNativeDriver: false,
            }),
            Animated.timing(lanternOpacity, {
              toValue: 0,
              duration: 700,
              useNativeDriver: false,
            })
          ]).start(async () => {
            setIsFlying(false);
            
            // Bounce wallet
            Animated.sequence([
              Animated.timing(walletScale, { toValue: 1.3, duration: 100, useNativeDriver: false }),
              Animated.timing(walletScale, { toValue: 1.0, duration: 100, useNativeDriver: false })
            ]).start();

            // Sync user profile score and Siraj points
            if (user?.uid) {
              try {
                // Increment trivia Correct Answers count (since Hadith is trivia category)
                await incrementCorrectAnswers(user.uid, 'trivia', 1);
                
                // Add 5 Siraj Points
                const updated = await addSirajPoints(user.uid, 5);
                setProfile(updated);

                // Add general score
                const currentScore = updated.score ?? 0;
                await saveUserScore(user.uid, currentScore + 15);
              } catch (err) {
                console.error(err);
              }
            }
          });
        });
      });
    } else {
      setFeedback(`إجابة غير صحيحة. الإجابة الصحيحة هي:`);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer('');
      setAnswered(false);
      setFeedback('');
    } else {
      setCompleted(true);
      recordChallenge({ id: `hadith-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        kind: 'hadith', completedAt: new Date().toISOString(), correct: correctAnswers,
        total: questions.length, points: scoreEarned }).catch(console.warn);
    }
  };

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyState}>لا توجد أسئلة حديث متوفرة حالياً.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* custom top header bar */}
      <View style={styles.headerCustom}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: Colors.primary }}>{backArrow}</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>تحدي الحديث الشريف</Text>

        <Animated.View style={[styles.walletBadge, { transform: [{ scale: walletScale }] }]}>
          <Text style={{ fontSize: 16, marginRight: 4 }}>🕯️</Text>
          <Text style={styles.walletText}>
            {profile?.sirajBalance ?? 50}
          </Text>
        </Animated.View>
      </View>

      <CinematicJourneyPanel titleAr="كنوز الحديث" titleEn="Hadith Treasures" subtitleAr="تعرّف على الحديث الشريف واختبر ما تعلمته" subtitleEn="Explore hadith and test what you have learned" icon="✧" progress={questions.length ? (completed ? 100 : currentIndex / questions.length * 100) : 0} progressLabelAr="تقدم التحدي" progressLabelEn="Challenge progress" compact />
      <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.subtitle}>تعلّم الأحاديث النبوية المأثورة وميّز صحتها ورواتها لزيادة نقاط معرفتك</Text>
          </View>

          {completed ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultEmoji}>💬</Text>
              <Text style={styles.resultTitle}>أنهيت تحدي الحديث!</Text>
              <Text style={styles.resultSubtitle}>أحسنت تعلماً وسيراً على خطى السنة النبوية</Text>
              
              <Text style={{ color: '#D5E6DE', textAlign: 'center', marginBottom: 12 }}>
                {language === 'ar' ? `إجابات صحيحة: ${correctAnswers} من ${questions.length}` : `Correct answers: ${correctAnswers} / ${questions.length}`}
              </Text>
              <View style={styles.statBox}>
                <Text style={styles.statVal}>{scoreEarned}</Text>
                <Text style={styles.statLbl}>النقاط المكتسبة</Text>
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>{backArrow}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.quizCard}>
              {/* Authenticity Indicator Badge */}
              <View style={styles.metaRow}>
                <View style={styles.authBadge}>
                  <Text style={styles.authBadgeText}>درجة الصحة: {currentQuestion.authenticity}</Text>
                </View>
                <Text style={styles.progressText}>سؤال {currentIndex + 1} من {questions.length}</Text>
              </View>

              {/* Hadith Quote Box */}
              <View style={styles.hadithQuoteBox}>
                <Text style={styles.quoteMark}>«</Text>
                <Text style={styles.hadithQuoteText}>{currentQuestion.hadithText}</Text>
                <Text style={styles.quoteMark}>»</Text>
              </View>

              {/* Question Title */}
              <Text style={styles.questionText}>{currentQuestion.question}</Text>

              {/* Options List */}
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.answer;

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

              {/* Feedback Detail */}
              {answered && (
                <View style={[
                  styles.feedbackBox,
                  selectedAnswer === currentQuestion.answer ? styles.feedbackBoxCorrect : styles.feedbackBoxIncorrect
                ]}>
                  <Text style={styles.feedbackTitle}>{feedback}</Text>
                  {selectedAnswer !== currentQuestion.answer && (
                    <Text style={styles.correctVal}>{currentQuestion.answer}</Text>
                  )}
                  <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
                </View>
              )}

              {/* Primary Action Button */}
              {answered ? (
                <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.85}>
                  <Text style={styles.primaryButtonText}>
                    {currentIndex + 1 < questions.length ? 'السؤال التالي ➔' : 'إنهاء التحدي ✓'}
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
      <AdBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Colors.background,
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
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
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
  },
  resultSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    width: '100%',
  },
  statVal: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLbl: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  quizCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  authBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  authBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  hadithQuoteBox: {
    backgroundColor: Colors.background,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 18,
    alignItems: 'center',
  },
  quoteMark: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.accent,
    lineHeight: 20,
  },
  hadithQuoteText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginVertical: 4,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 16,
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
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  optionTextWhite: {
    color: Colors.surface,
    fontWeight: '700',
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
  },
  correctVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.error,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  emptyState: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 40,
  },
  headerCustom: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  walletText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#137333',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  flyingFanoos: {
    position: 'absolute',
    left: Dimensions.get('window').width / 2 - 24,
    top: Dimensions.get('window').height / 2 - 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
});
