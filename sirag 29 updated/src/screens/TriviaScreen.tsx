import { recordChallenge } from '../services/challengeProgress';
import CinematicJourneyPanel from '../components/CinematicJourneyPanel';
import QuestMilestoneStrip from '../components/QuestMilestoneStrip';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Share, Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { questionBank, type Question } from '../data/questions';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { saveUserScore, getCurrentUserProfile, saveUserChampionshipResult, addSirajPoints, incrementCorrectAnswers } from '../firebase/auth';
import { Colors } from '../config/colors';
import { useInterstitialAd } from '../config/adsService';
import { AdMobConfig } from '../config/ads';
import AdBanner from '../components/AdBanner';

const tiers = ['Beginner', 'Intermediate', 'Advanced', 'Hero'] as const;
type TierType = (typeof tiers)[number];

const tierTranslations: Record<TierType, string> = {
  Beginner: 'مبتدئ',
  Intermediate: 'متوسط',
  Advanced: 'متقدم',
  Hero: 'بطل',
};

const categories = ['الكل', 'القرآن', 'السنة', 'الفقه', 'السيرة', 'العقيدة', 'التاريخ'] as const;
type CategoryType = (typeof categories)[number];

const questionLimits = [5, 10, 15, 20] as const;
type LimitType = (typeof questionLimits)[number];

export default function TriviaScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { language, formatNumber, backArrow } = useLanguage();
  
  // Game states: 'config' | 'quiz' | 'completed'
  const [gameState, setGameState] = useState<'config' | 'quiz' | 'completed'>('config');
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const correctAnswersRef = useRef(0);

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

  // Timers
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [countdownTimeLeft, setCountdownTimeLeft] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Interstitial Ad setup
  const { isLoaded, isClosed, load, show } = useInterstitialAd(AdMobConfig.interstitialAdUnitID, {
    requestNonPersonalizedAdsOnly: true,
  });

  // Load interstitial on mount
  useEffect(() => {
    load();
  }, [load]);

  // Reload interstitial when closed
  useEffect(() => {
    if (isClosed) {
      load();
    }
  }, [isClosed, load]);

  const completeQuiz = async (finalScore: number) => {
    setGameState('completed');
    recordChallenge({ id: `trivia-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      kind: 'trivia', completedAt: new Date().toISOString(),
      correct: correctAnswersRef.current,
      total: Math.min(questions.length, currentIndex + 1), points: finalScore,
      detail: `${selectedTier} / ${selectedCategory}` }).catch(console.warn);
    if (user?.uid) {
      try {
        if (route?.params?.mode === 'championship') {
          // Save championship score and elapsed seconds
          await saveUserChampionshipResult(user.uid, finalScore, Math.round(secondsElapsed));
        } else {
          const profile = await getCurrentUserProfile(user.uid);
          const currentScore = profile?.score ?? 0;
          await saveUserScore(user.uid, currentScore + finalScore);
        }

        // Track daily trivia quest completion
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        await AsyncStorage.setItem(`quest-trivia-played-${todayStr}`, 'true');
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (isClosed && pendingScore !== null) {
      completeQuiz(pendingScore);
      setPendingScore(null);
    }
  }, [isClosed, pendingScore]);

  // Config States
  const [selectedTier, setSelectedTier] = useState<TierType>('Beginner');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('الكل');
  const [questionLimit, setQuestionLimit] = useState<LimitType>(10);

  // Play States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [answered, setAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [explanation, setExplanation] = useState('');

  const currentQuestion = questions[currentIndex];

  // Dynamic point calculation
  const getPointsPerQuestion = () => {
    let base = 5;
    if (selectedTier === 'Intermediate') base = 10;
    if (selectedTier === 'Advanced') base = 15;
    if (selectedTier === 'Hero') base = 25;

    const multiplier = selectedCategory === 'الكل' ? 1.0 : 1.2;
    return Math.round(base * multiplier);
  };

  // Direct Launch Hook
  useEffect(() => {
    const mode = route?.params?.mode;
    if (mode === 'championship') {
      // Seeded random Daily Quiz selector
      const today = new Date();
      const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
      
      const pool = questionBank.filter((item) => item.tier === 'Hero');
      
      const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      };

      const shuffled = [...pool].sort((a, b) => {
        const r1 = seededRandom(dateSeed + a.question.charCodeAt(0));
        const r2 = seededRandom(dateSeed + b.question.charCodeAt(0));
        return r1 - r2;
      });

      const selectedSet = shuffled.slice(0, 10);

      setSelectedTier('Hero');
      setSelectedCategory('الكل');
      setQuestionLimit(10);
      setQuestions(selectedSet);
      setCurrentIndex(0);
      setScore(0);
      setSecondsElapsed(0);
      setSelectedAnswer('');
      setFeedback('');
      setAnswered(false);
      setStreak(0);
      setExplanation('');
      correctAnswersRef.current = 0;
    setGameState('quiz');

    } else if (mode === 'hardcore') {
      const pool = questionBank.filter((item) => item.tier === 'Advanced');
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const selectedSet = shuffled.slice(0, 10);

      setSelectedTier('Advanced');
      setSelectedCategory('الكل');
      setQuestionLimit(10);
      setQuestions(selectedSet);
      setCurrentIndex(0);
      setScore(0);
      setCountdownTimeLeft(5);
      setSelectedAnswer('');
      setFeedback('');
      setAnswered(false);
      setStreak(0);
      setExplanation('');
      setGameState('quiz');
    }
  }, [route?.params?.mode]);

  // Championship Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (gameState === 'quiz' && route?.params?.mode === 'championship' && !answered) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 0.1);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, answered, route?.params?.mode]);

  // Countdown Timer Effect (For Hardcore and Championship modes)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    const mode = route?.params?.mode;
    if (gameState === 'quiz' && (mode === 'hardcore' || mode === 'championship') && !answered) {
      const maxSeconds = mode === 'hardcore' ? 5 : 12;
      setCountdownTimeLeft(maxSeconds);
      interval = setInterval(() => {
        setCountdownTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            if (mode === 'hardcore') {
              handleTimeout();
            } else {
              handleChampionshipTimeout();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState, currentIndex, answered, route?.params?.mode]);

  const handleTimeout = () => {
    setFeedback('انتهى الوقت! انتهت المحاولة.');
    if (currentQuestion) {
      setExplanation(currentQuestion.explanation);
    }
    setAnswered(true);
    setStreak(0);
    
    // Hardcore mode timeout is immediate sudden-death game over!
    setTimeout(() => {
      completeQuiz(score);
    }, 2000);
  };

  const handleChampionshipTimeout = () => {
    setFeedback(language === 'ar' ? 'انتهى الوقت! تم احتساب الإجابة خاطئة.' : 'Time out! Answer marked as incorrect.');
    if (currentQuestion) {
      setExplanation(currentQuestion.explanation || '');
    }
    setAnswered(true);
    setStreak(0);
  };

  const startChallenge = () => {
    let pool = questionBank.filter((item) => item.tier === selectedTier);
    if (selectedCategory !== 'الكل') {
      pool = pool.filter((item) => item.category === selectedCategory);
    }

    if (pool.length === 0) {
      Alert.alert('تخصيص فارغ', 'عذراً، لا توجد أسئلة متوفرة حالياً تطابق هذا التصنيف ومستوى الصعوبة. جرب تصنيفاً آخر.');
      return;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selectedSet = shuffled.slice(0, Math.min(questionLimit, shuffled.length));

    setQuestions(selectedSet);
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer('');
    setFeedback('');
    setAnswered(false);
    setStreak(0);
    setExplanation('');
    setGameState('quiz');
  };

  const handleSubmit = async () => {
    if (!currentQuestion) return;

    if (!selectedAnswer.trim()) {
      Alert.alert('تنبيه', 'الرجاء اختيار إجابة واحدة للاستمرار.');
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;
    if (isCorrect) correctAnswersRef.current += 1;
    const nextStreak = isCorrect ? streak + 1 : 0;
    
    const pointsPerQuestion = getPointsPerQuestion();
    const streakBonus = isCorrect ? Math.min(8, nextStreak * 2) : 0;
    const earnedPoints = isCorrect ? (pointsPerQuestion + streakBonus) : 0;
    const nextScore = score + earnedPoints;

    setScore(nextScore);
    setStreak(nextStreak);
    setFeedback(isCorrect ? 'إجابة صحيحة! أحسنت 🌟' : `إجابة غير صحيحة. الإجابة الصحيحة هي:`);
    setExplanation(currentQuestion.explanation);
    setAnswered(true);

    if (isCorrect) {
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
                // Increment trivia correct count (since trivia category)
                await incrementCorrectAnswers(user.uid, 'trivia', 1);
                
                // Add 5 Siraj Points
                const updated = await addSirajPoints(user.uid, 5);
                setProfile(updated);
              } catch (err) {
                console.error(err);
              }
            }
          });
        });
      });
    }

    if (!isCorrect && route?.params?.mode === 'hardcore') {
      // Hardcore Mode: Sudden death! Ends the game immediately upon mistake.
      setTimeout(() => {
        completeQuiz(score);
      }, 2000);
      return;
    }

    if (currentIndex + 1 >= questions.length) {
      setPendingScore(nextScore);
      setTimeout(() => {
        if (isLoaded) {
          show();
        } else {
          completeQuiz(nextScore);
        }
      }, 1000);
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedAnswer('');
      setFeedback('');
      setAnswered(false);
      setExplanation('');
    }
  };

  const handleShareChallenge = async () => {
    try {
      const mode = route?.params?.mode;
      const message = mode === 'championship' ? 
      `🏆 لقد أتممت تحدي *البطولة اليومية* لتطبيق بطل مسلم!
📊 النتيجة المحرزة: *${score} نقطة*
⏱️ الزمن المستغرق: *${secondsElapsed.toFixed(1)} ثانية*

هل يمكنك التغلب على زمني في البطولة اليومية؟ شارك الآن! 🚀`
      :
      `🏆 لقد أتممت تحدي *بطل مسلم* بنجاح!
📖 نوع التحدي: تفوق في قسم *${selectedCategory === 'الكل' ? 'المعرفة العامة' : selectedCategory}*
💪 مستوى الصعوبة: *${tierTranslations[selectedTier]}*
📊 عدد الأسئلة: *${questions.length} أسئلة*
⭐ النقاط المحرزة: *${score} نقطة إيمانية*

هل تجرؤ على منافستي وتحقيق لقب "بطل مسلم"؟ حمّل التطبيق الآن وابدأ التحدي! 🚀`;

      await Share.share({ message });
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackToConfig = () => {
    setGameState('config');
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* custom top header bar */}
      <View style={styles.headerCustom}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => gameState === 'config' ? navigation.goBack() : handleBackToConfig()}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'رجوع' : 'Back'}
        >
          <Text style={{ fontSize: 20, color: Colors.primary }}>{backArrow}</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>تحدي المعرفة الإسلامية</Text>

        <Animated.View style={[styles.walletBadge, { transform: [{ scale: walletScale }] }]}>
          <Text style={{ fontSize: 16, marginRight: 4 }}>🕯️</Text>
          <Text style={styles.walletText}>
            {profile?.sirajBalance ?? 50}
          </Text>
        </Animated.View>
      </View>

      <CinematicJourneyPanel titleAr="ساحة المعرفة" titleEn="Knowledge Arena" subtitleAr="تحديات متدرجة تختبر معلوماتك وتنمّي رحلتك التعليمية" subtitleEn="Level up with knowledge challenges and grow your learning journey" icon="✦" progress={gameState === 'completed' ? 100 : undefined} compact />
      {gameState !== 'config' && <QuestMilestoneStrip current={gameState === 'completed' ? questions.length : currentIndex} total={questions.length} labelAr="مسار تحدي المعرفة" labelEn="Knowledge challenge route" completed={gameState === 'completed'} />}
      <ScrollView style={styles.outerContainer} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          
          {/* GAME STATE 1: Config Dashboard */}
          {gameState === 'config' && (
            <View style={styles.configCard}>
              <Text style={styles.configHeaderTitle}>تخصيص تحدي المعرفة</Text>
              <Text style={styles.configHeaderSub}>اختر مستوى الصعوبة، التصنيف، وعدد الأسئلة لبدء رحلة التحدي</Text>


              {/* 1. Difficulty Level */}
              <View style={styles.configSection}>
                <Text style={styles.configSectionTitle}>💪 مستوى الصعوبة:</Text>
                <View style={styles.configRow}>
                  {tiers.map((tier) => (
                    <TouchableOpacity
                      key={tier}
                      style={[styles.configBtn, selectedTier === tier && styles.configBtnActive]}
                      onPress={() => setSelectedTier(tier)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`${language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty'}: ${tierTranslations[tier]}`}
                      accessibilityState={{ selected: selectedTier === tier }}
                    >
                      <Text style={[styles.configBtnText, selectedTier === tier && styles.configBtnTextActive]}>
                        {tierTranslations[tier]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 2. Category Selector */}
              <View style={styles.configSection}>
                <Text style={styles.configSectionTitle}>📖 تصنيف الأسئلة:</Text>
                <View style={styles.categoryGrid}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
                      onPress={() => setSelectedCategory(cat)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`${language === 'ar' ? 'تصنيف' : 'Category'}: ${cat}`}
                      accessibilityState={{ selected: selectedCategory === cat }}
                    >
                      <Text style={[styles.categoryBtnText, selectedCategory === cat && styles.categoryBtnTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 3. Number of Questions Selector */}
              <View style={styles.configSection}>
                <Text style={styles.configSectionTitle}>❓ عدد الأسئلة:</Text>
                <View style={styles.configRow}>
                  {questionLimits.map((limit) => (
                    <TouchableOpacity
                      key={limit}
                      style={[styles.configBtn, questionLimit === limit && styles.configBtnActive]}
                      onPress={() => setQuestionLimit(limit)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`${limit} ${language === 'ar' ? 'أسئلة' : 'questions'}`}
                      accessibilityState={{ selected: questionLimit === limit }}
                    >
                      <Text style={[styles.configBtnText, questionLimit === limit && styles.configBtnTextActive]}>
                        {limit} {language === 'ar' ? 'سؤال' : 'Qs'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Play Button */}
              <TouchableOpacity
                style={styles.startButton}
                onPress={startChallenge}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={language === 'ar' ? 'ابدأ التحدي الآن' : 'Start challenge now'}
              >
                <Text style={styles.startButtonText}>ابدأ التحدي الآن 🚀</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* GAME STATE 2: Quiz Question */}
          {gameState === 'quiz' && currentQuestion && (
            <View style={styles.quizCard}>
              {/* Header info */}
              <View style={styles.quizHeader}>
                <View style={styles.metaRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>📖 {currentQuestion.category}</Text>
                  </View>
                  <Text style={styles.progressText}>
                    {language === 'ar'
                      ? `سؤال ${formatNumber(currentIndex + 1)} من ${formatNumber(questions.length)}`
                      : `Question ${currentIndex + 1} of ${questions.length}`}
                  </Text>
                </View>
                
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
                </View>

                {/* Active Timer Indicator inside Championship mode */}
                {route?.params?.mode === 'championship' && (
                  <View style={styles.activeTimerRow}>
                    <Text style={styles.activeTimerText}>{secondsElapsed.toFixed(1)}ث</Text>
                    <Text style={styles.activeTimerLabel}>الزمن المنقضي:</Text>
                  </View>
                )}
              </View>

              {/* Question Text */}
              <Text style={styles.questionText}>
                {currentQuestion.question}
              </Text>

              {/* Options List */}
              <View style={styles.optionsContainer}>
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrectAnswer = option === currentQuestion.answer;

                  let btnStyle: any = styles.optionButton;
                  let textStyle: any = styles.optionText;

                  if (answered) {
                    if (isCorrectAnswer) {
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
                      style={[btnStyle, { minHeight: 48 }]}
                      onPress={() => !answered && setSelectedAnswer(option)}
                      disabled={answered}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`${option}${
                        answered
                          ? isCorrectAnswer
                            ? language === 'ar' ? '، إجابة صحيحة' : ', correct answer'
                            : isSelected
                              ? language === 'ar' ? '، إجابة خاطئة' : ', incorrect answer'
                              : ''
                          : isSelected
                            ? language === 'ar' ? '، محدد' : ', selected'
                            : ''
                      }`}
                      accessibilityState={{
                        selected: isSelected,
                        disabled: answered,
                      }}
                    >
                      <Text style={textStyle}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Feedback and Explanation Details */}
              {answered && (
                <View style={[
                  styles.feedbackBox,
                  selectedAnswer === currentQuestion.answer ? styles.feedbackBoxCorrect : styles.feedbackBoxIncorrect
                ]}>
                  <Text style={styles.feedbackTitle}>{feedback}</Text>
                  {selectedAnswer !== currentQuestion.answer && (
                    <Text style={styles.correctAnswerVal}>{currentQuestion.answer}</Text>
                  )}
                  {explanation.trim() !== '' && (
                    <Text style={styles.explanationText}>{explanation}</Text>
                  )}
                </View>
              )}

              {/* Next/Finish quiz trigger button */}
              {answered && (
                <TouchableOpacity
                  style={[styles.primaryButton, { minHeight: 48 }]}
                  onPress={handleNext}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={
                    currentIndex + 1 < questions.length
                      ? language === 'ar' ? 'السؤال التالي' : 'Next question'
                      : language === 'ar' ? 'إنهاء المسابقة' : 'Finish quiz'
                  }
                >
                  <Text style={styles.primaryButtonText}>
                    {currentIndex + 1 < questions.length ? 'السؤال التالي ➔' : 'إنهاء المسابقة ✓'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Submit answer verification button */}
              {!answered && (
                <TouchableOpacity
                  style={[styles.primaryButton, { minHeight: 48, opacity: selectedAnswer ? 1 : 0.6 }]}
                  onPress={handleSubmit}
                  activeOpacity={0.85}
                  disabled={!selectedAnswer}
                  accessibilityRole="button"
                  accessibilityLabel={language === 'ar' ? 'تأكيد الإجابة' : 'Submit answer'}
                  accessibilityState={{ disabled: !selectedAnswer }}
                >
                  <Text style={styles.primaryButtonText}>تأكيد الإجابة ✓</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* GAME STATE 3: Completed Scoreboard */}
          {gameState === 'completed' && (
            <View style={styles.resultCard}>
              <Text style={styles.resultEmoji}>🏆</Text>
              <Text style={styles.resultTitle}>انتهت المسابقة!</Text>
              <Text style={styles.resultSubtitle}>
                {score >= 70 
                  ? 'أداء رائع وحصيلة معرفية متميزة ما شاء الله! 🌟' 
                  : 'أداء جيد، استمر في المطالعة وزيادة معلوماتك الدينية.'}
              </Text>
              
              <View style={styles.resultStatsRow}>
                <View style={styles.resultStatBox}>
                  <Text style={styles.resultStatVal}>{score}</Text>
                  <Text style={styles.resultStatLbl}>النقاط المكتسبة</Text>
                </View>
                {route?.params?.mode === 'championship' ? (
                  <View style={styles.resultStatBox}>
                    <Text style={styles.resultStatVal}>{secondsElapsed.toFixed(1)}ث</Text>
                    <Text style={styles.resultStatLbl}>الزمن الإجمالي</Text>
                  </View>
                ) : (
                  <View style={styles.resultStatBox}>
                    <Text style={styles.resultStatVal}>{streak}</Text>
                    <Text style={styles.resultStatLbl}>أعلى متتالية</Text>
                  </View>
                )}
              </View>

              {/* Share on WhatsApp Button */}
              <TouchableOpacity style={styles.whatsappButton} onPress={handleShareChallenge} activeOpacity={0.85}>
                <Text style={styles.whatsappButtonText}>شارك النتيجة على واتساب 💬</Text>
              </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={handleBackToConfig} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>تحدي جديد 🔄</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
              <Text style={styles.secondaryButtonText}>{backArrow}</Text>
            </TouchableOpacity>
          </View>
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

const styles = StyleSheet.create({
  activeTimerRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: Colors.neutralTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeTimerText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryDeep,
  },
  activeTimerLabel: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
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
  configCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  configHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  configHeaderSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  configSection: {
    marginBottom: 18,
  },
  configSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 10,
  },
  configRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
  },
  configBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  configBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  configBtnText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  configBtnTextActive: {
    color: Colors.surface,
  },
  categoryGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  categoryBtn: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: 2,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryBtnText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  categoryBtnTextActive: {
    color: Colors.surface,
  },
  pointsPreviewCard: {
    backgroundColor: Colors.accentTint,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accentTintBorder,
    marginBottom: 20,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.accent,
    marginBottom: 10,
  },
  previewStatsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  previewStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  previewVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 2,
  },
  previewLbl: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  previewDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2DDCB',
  },
  startButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  startButtonText: {
    color: Colors.surface,
    fontWeight: '800',
    fontSize: 15,
  },
  quizCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quizHeader: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
    marginBottom: 20,
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
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: Colors.primaryTint,
    borderColor: Colors.primaryDeep,
  },
  optionButtonCorrect: {
    backgroundColor: Colors.primaryTint,
    borderColor: Colors.primary,
  },
  optionButtonIncorrect: {
    backgroundColor: Colors.dangerTint,
    borderColor: Colors.danger,
  },
  optionButtonDisabled: {
    backgroundColor: Colors.neutralTint,
    borderColor: Colors.border,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: Colors.primaryOnTint,
    fontWeight: '700',
  },
  optionTextWhite: {
    color: Colors.primaryOnTint,
    fontWeight: '700',
  },
  optionTextMuted: {
    color: Colors.textTertiary,
  },
  feedbackBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  feedbackBoxCorrect: {
    backgroundColor: Colors.primaryTint,
    borderWidth: 1,
    borderColor: Colors.primaryTintBorder,
  },
  feedbackBoxIncorrect: {
    backgroundColor: Colors.dangerTint,
    borderWidth: 1,
    borderColor: Colors.dangerTintBorder,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    color: Colors.textPrimary,
  },
  correctAnswerVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.error,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },
  actionRow: {
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    width: '100%',
  },
  primaryButtonText: {
    color: Colors.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 14,
  },
  scoreRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  resultCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  resultEmoji: {
    fontSize: 60,
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 6,
  },
  resultSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  resultStatsRow: {
    flexDirection: 'row-reverse',
    gap: 16,
    marginBottom: 20,
    width: '100%',
  },
  resultStatBox: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultStatVal: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  resultStatLbl: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  whatsappButtonText: {
    color: Colors.surface,
    fontWeight: '800',
    fontSize: 15,
  },
  headerCustom: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardSuccessTint,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  walletText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryOnTint,
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