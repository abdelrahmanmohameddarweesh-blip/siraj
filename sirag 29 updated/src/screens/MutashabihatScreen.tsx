import CinematicJourneyPanel from '../components/CinematicJourneyPanel';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Modal, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { mutashabihatQuestions, type MutashabahQuestion } from '../data/mutashabihat';
import { addSirajPoints, getCurrentUserProfile, incrementCorrectAnswers, equipUserTitle } from '../firebase/auth';
import AdBanner from '../components/AdBanner';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MutashabihatScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { language, backArrow } = useLanguage();
  const { user, updateUserFields } = useAuth();

  const [screenState, setScreenState] = useState<'lobby' | 'quiz' | 'results'>('lobby');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | 'expert'>('medium');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState<number>(10);

  const [questions, setQuestions] = useState<MutashabahQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const [profile, setProfile] = useState<any>(null);
  const [isFlying, setIsFlying] = useState(false);

  const [wrongAnswers, setWrongAnswers] = useState<{ question: string; selected: string; correct: string }[]>([]);

  // Snapshot trackers for newly unlocked titles pop-up
  const [initialTitles, setInitialTitles] = useState<string[]>([]);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // Animated values for the flying Fanoos lantern on the same screen
  const lanternScale = useRef(new Animated.Value(0)).current;
  const lanternPos = useRef(new Animated.ValueXY({ x: 0, y: 150 })).current;
  const lanternOpacity = useRef(new Animated.Value(1)).current;
  const walletScale = useRef(new Animated.Value(1)).current;

  const currentQuestion = questions[currentIndex];

  const loadProfile = async () => {
    if (!user?.uid) return;
    try {
      const currentProfile = await getCurrentUserProfile(user.uid);
      setProfile(currentProfile);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user?.uid]);

  const handleStartQuiz = () => {
    const filtered = mutashabihatQuestions.filter(q => q.difficulty === selectedDifficulty);
    const shuffledFiltered = [...filtered].sort(() => Math.random() - 0.5);
    
    let selected = shuffledFiltered.slice(0, selectedQuestionCount);
    if (selected.length < selectedQuestionCount) {
      const remainingNeeded = selectedQuestionCount - selected.length;
      const existingIds = new Set(selected.map(q => q.id));
      const others = mutashabihatQuestions.filter(q => !existingIds.has(q.id)).sort(() => Math.random() - 0.5);
      selected = [...selected, ...others.slice(0, remainingNeeded)];
    }

    // Save snapshot of currently unlocked titles before starting
    setInitialTitles(profile?.unlockedTitles || []);
    setShowUnlockModal(false);

    setQuestions(selected);
    setCurrentIndex(0);
    setSelectedAnswer('');
    setAnswered(false);
    setCorrectCount(0);
    setWrongAnswers([]);
    setScreenState('quiz');
  };

  const handleSelectOption = async (option: string) => {
    if (answered) return;
    setSelectedAnswer(option);
    setAnswered(true);

    const isCorrect = option === currentQuestion.answer;
    const points = { easy: 5, medium: 10, hard: 15, expert: 20 }[selectedDifficulty];

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);

      // Start the flying animation on the same screen
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

            // Save to DB
            if (user?.uid) {
              try {
                // Increment total correct answers count for Mutashabihat and check title unlocks
                await incrementCorrectAnswers(user.uid, 'mutashabihat', 1);
                
                // Add Siraj points
                const updated = await addSirajPoints(user.uid, points);
                setProfile(updated);
                updateUserFields({ 
                  sirajBalance: updated.sirajBalance,
                  unlockedTitles: updated.unlockedTitles,
                  mutashabihatCorrectCount: updated.mutashabihatCorrectCount,
                });
              } catch (err) {
                console.error(err);
              }
            }
          });
        });
      });
    } else {
      setWrongAnswers(prev => [...prev, {
        question: currentQuestion.prompt,
        selected: option,
        correct: currentQuestion.answer
      }]);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer('');
      setAnswered(false);
    } else {
      setScreenState('results');
    }
  };

  const handleReset = () => {
    setScreenState('lobby');
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer('');
    setAnswered(false);
    setCorrectCount(0);
    setWrongAnswers([]);
    loadProfile();
  };

  const finalScore = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round((correctCount / questions.length) * 100);
  }, [correctCount, questions]);

  const earnedSiraj = useMemo(() => {
    const pointsPerQuestion = { easy: 5, medium: 10, hard: 15, expert: 20 }[selectedDifficulty];
    return correctCount * pointsPerQuestion;
  }, [correctCount, selectedDifficulty]);

  // Check if any new title got unlocked during this test run
  const newlyUnlocked = useMemo(() => {
    const unlockedNow = profile?.unlockedTitles?.filter((t: string) => !initialTitles.includes(t)) || [];
    return unlockedNow;
  }, [profile?.unlockedTitles, initialTitles]);

  useEffect(() => {
    if (screenState === 'results' && newlyUnlocked.length > 0) {
      setShowUnlockModal(true);
    }
  }, [screenState, newlyUnlocked]);

  // Metadata of the unlocked titles for the popup display
  const titleInfo = useMemo(() => {
    if (newlyUnlocked.length === 0) return null;
    const firstUnlockedId = newlyUnlocked[0];
    const catalog = {
      title_knight: { 
        title: 'فارس المتشابهات', 
        desc: 'لقد نلت هذا اللقب الرفيع بعد أن أنجزت ٣٠ إجابة صحيحة في متشابهات التنزيل الكريم! إن تمييزك للفروق الدقيقة والروابط اللفظية بين الآيات يعكس دقة حفظك وجودة مراجعتك وعظيم جهدك في تثبيت كتاب الله.', 
        emoji: '🛡️' 
      },
      title_hafidh: { 
        title: 'الحافظ المتقن', 
        desc: 'لقد نلت هذا اللقب الرفيع بعد أن أنجزت ٥٠ إجابة صحيحة في تقييم الحفظ! إن ثبات إجاباتك ودقتها يوضح الساعات الطويلة والجهد المبارك الذي بذلته في مراجعة وتثبيت سور القرآن العظيم.', 
        emoji: '🏆' 
      },
      title_pulpit: { 
        title: 'سراج المنبر', 
        desc: 'لقد نلت هذا اللقب الرفيع بعد أن أنجزت ٤٠ إجابة صحيحة في تحدي المعلومات والحديث! إن اتساع علمك وسرعة بديهتك تظهر سعة اطلاعك وحرصك الدائم على تعلم أحاديث المصطفى ﷺ وسيرته العطرة.', 
        emoji: '🕯️' 
      },
      title_heavens: { 
        title: 'قارئ الجنان', 
        desc: 'لقد نلت اللقب الأسمى والأشرف بعد أن أنجزت ١٠٠ إجابة صحيحة إجمالاً عبر التطبيق! هذا التاج النوراني يتوج مسيرة طويلة ومستمرة من المحاولات والتعلم والارتقاء في رحاب الوحي الشريف.', 
        emoji: '👑' 
      },
    };
    return (catalog as any)[firstUnlockedId] || { title: firstUnlockedId, desc: '', emoji: '🎉' };
  }, [newlyUnlocked]);

  const handleAddTitleToProfile = async () => {
    if (!user?.uid || newlyUnlocked.length === 0) return;
    const titleId = newlyUnlocked[0];
    
    // Immediately close the first pop-up modal so it disappears from behind
    setShowUnlockModal(false);

    try {
      const updated = await equipUserTitle(user.uid, titleId);
      setProfile(updated);
      updateUserFields({ activeTitle: updated.activeTitle });
      
      setTimeout(() => {
        Alert.alert(
          language === 'ar' ? 'تهانينا! 🎉' : 'Congratulations! 🎉',
          language === 'ar' ? 'تم تجهيز لقبك الجديد وإضافته لملفك الشخصي بنجاح!' : 'Your new title has been equipped and added to your profile!'
        );
      }, 100);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* HEADER SECTION */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => screenState === 'lobby' ? navigation.goBack() : handleReset()}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'رجوع' : 'Back'}
        >
          <Text style={{ fontSize: 20, color: colors.primary }}>{backArrow}</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
          تحدي المتشابهات القرآني
        </Text>

        {/* Global Wallet Display with Bounce Animation */}
        <Animated.View style={[styles.walletBadge, { backgroundColor: colors.primaryLight, transform: [{ scale: walletScale }] }]}>
          <Text style={{ fontSize: 16, marginRight: 4 }}>🕯️</Text>
          <Text style={[styles.walletText, { color: colors.primary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
            {profile?.sirajBalance ?? 50}
          </Text>
        </Animated.View>
      </View>

      {screenState === 'lobby' && <CinematicJourneyPanel titleAr="رحلة المتشابهات" titleEn="Similar Verses Quest" subtitleAr="تدرّب على تمييز الآيات المتشابهة وثبّت حفظك" subtitleEn="Practice distinguishing similar verses and strengthen memorization" icon="✦" compact />}
      {/* LOBBY STATE */}
      {screenState === 'lobby' && (
        <ScrollView contentContainerStyle={styles.lobbyScroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🕯️</Text>
            <Text style={[styles.infoTitle, { color: colors.primary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
              أنوار السراج للمتشابهات
            </Text>
            <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
              اختبر قوة حفظك لمواضع متشابهات القرآن الكريم. كل إجابة صحيحة تضيء سراجاً جديداً في محفظتك لتستبدله بألقاب وسمات رائعة من المتجر!
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
            اختر مستوى الصعوبة:
          </Text>

          {(['easy', 'medium', 'hard', 'expert'] as const).map(diff => {
            const isSelected = selectedDifficulty === diff;
            const diffMeta = {
              easy: { title: 'سهل (Easy)', desc: 'مواضع متشابهة يسيرة في السور القصيرة (+5 سرج)', color: '#EBF7F3', border: '#B2E5D4' },
              medium: { title: 'متوسط (Medium)', desc: 'تداخلات الألفاظ الشائعة والتقديم والتأخير (+10 سرج)', color: '#FFF8E6', border: '#FAD7A0' },
              hard: { title: 'صعب (Hard)', desc: 'مواضع الجار والمجرور ودقائق الحروف (+15 سرج)', color: '#F7EBEB', border: '#F1948A' },
              expert: { title: 'خبير (Expert)', desc: 'مواضع التشابه الكبرى في السور الطوال (+20 سراجاً)', color: '#F7EBF7', border: '#D7BDE2' }
            }[diff];

            return (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.diffCard,
                  { backgroundColor: diffMeta.color, borderColor: isSelected ? colors.primary : diffMeta.border, borderWidth: isSelected ? 2.5 : 1.5 }
                ]}
                onPress={() => setSelectedDifficulty(diff)}
                activeOpacity={0.8}
              >
                <View style={styles.diffHeader}>
                  <Text style={[styles.diffTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>{diffMeta.title}</Text>
                  {isSelected && <Text style={{ color: colors.primary, fontSize: 18 }}>✓</Text>}
                </View>
                <Text style={[styles.diffDesc, { color: colors.textSecondary }]}>{diffMeta.desc}</Text>
              </TouchableOpacity>
            );
          })}

          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold', marginTop: 20 }]}>
            عدد الأسئلة في التحدي:
          </Text>

          <View style={styles.countSelectorRow}>
            {[5, 10, 15, 20].map(count => {
              const isSelected = selectedQuestionCount === count;
              return (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.countPill,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => setSelectedQuestionCount(count)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.countPillText,
                      {
                        color: isSelected ? colors.white : colors.textPrimary,
                        fontFamily: isSelected ? 'IBMPlexSansArabic-Bold' : 'IBMPlexSansArabic-Regular',
                      }
                    ]}
                  >
                    {count} أسئلة
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary, marginTop: 24 }]}
            onPress={handleStartQuiz}
          >
            <Text style={styles.startBtnText}>ابدأ التحدي الآن ({selectedQuestionCount} أسئلة)</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* QUIZ PLAYING STATE */}
      {screenState === 'quiz' && currentQuestion && (
        <ScrollView contentContainerStyle={styles.quizScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              السؤال {currentIndex + 1} من {questions.length}
            </Text>
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${((currentIndex + 1) / questions.length) * 100}%`
                  }
                ]}
              />
            </View>
          </View>

          <View style={[styles.questionBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.ayahText, { color: colors.textPrimary }]}>
              {currentQuestion.prompt}
            </Text>
          </View>

          <Text style={[styles.hintLabel, { color: colors.textSecondary }]}>اختر الكلمة أو التكملة الصحيحة:</Text>
          
          {currentQuestion.options.map((option, idx) => {
            const isCorrectAnswer = option === currentQuestion.answer;
            const isSelectedAnswer = option === selectedAnswer;

            // Compute dynamic color styling once answered
            let btnStyle = { backgroundColor: colors.surface, borderColor: colors.border };
            let textStyle = { color: colors.textPrimary };

            if (answered) {
              if (isCorrectAnswer) {
                // Color correct green
                btnStyle = { backgroundColor: colors.cardSuccessTint, borderColor: colors.primaryDeep };
                textStyle = { color: colors.primaryDeep };
              } else if (isSelectedAnswer) {
                // Color incorrect red
                btnStyle = { backgroundColor: colors.cardErrorTint, borderColor: colors.error };
                textStyle = { color: colors.error };
              } else {
                // Dim other options
                btnStyle = { backgroundColor: colors.surface, borderColor: colors.border };
                textStyle = { color: colors.textSecondary };
              }
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.optionBtn, btnStyle, { minHeight: 48 }]}
                onPress={() => handleSelectOption(option)}
                disabled={answered}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${option}${
                  answered
                    ? isCorrectAnswer
                      ? language === 'ar' ? '، إجابة صحيحة' : ', correct answer'
                      : isSelectedAnswer
                        ? language === 'ar' ? '، إجابة خاطئة' : ', incorrect answer'
                        : ''
                    : isSelectedAnswer
                      ? language === 'ar' ? '، محدد' : ', selected'
                      : ''
                }`}
                accessibilityState={{
                  selected: isSelectedAnswer,
                  disabled: answered,
                }}
              >
                <Text style={[styles.optionText, textStyle, answered && isCorrectAnswer && { fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                  {option} {answered && isCorrectAnswer && '✓'} {answered && isSelectedAnswer && !isCorrectAnswer && '❌'}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* INLINE EXPLANATION & NEXT BUTTON ONCE ANSWERED */}
          {answered && (
            <View style={{ marginTop: 20 }}>
              <View style={styles.parchmentScrollCard}>
                <Text style={styles.parchmentHeader}>💡 توضيح متشابهة الآية:</Text>
                <Text style={styles.parchmentText}>{currentQuestion.explanation}</Text>
              </View>

              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: colors.primary, marginTop: 10, minHeight: 48 }]}
                onPress={handleNextQuestion}
                accessibilityRole="button"
                accessibilityLabel={
                  currentIndex === questions.length - 1
                    ? language === 'ar' ? 'عرض النتيجة النهائية' : 'Show final results'
                    : language === 'ar' ? 'السؤال التالي' : 'Next question'
                }
              >
                <Text style={styles.startBtnText}>
                  {currentIndex === questions.length - 1 ? 'عرض النتيجة النهائية' : 'السؤال التالي'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* RESULTS DISPLAY STATE */}
      {screenState === 'results' && (
        <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.trophyContainer}>
            <Text style={{ fontSize: 80, marginBottom: 15 }}>🏺</Text>
            <Text style={[styles.resultTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
              {finalScore === 100 
                ? 'ما شاء الله! حفظك متقن ومثالي.' 
                : finalScore >= 70 
                  ? 'أداء رائع ولديك علم واسع بالمتشابهات.' 
                  : 'أداء جيد، استمر في المراجعة لتثبيت مواضع التشابه.'}
            </Text>
          </View>

          <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
            <Text style={[styles.scorePercent, { color: colors.primary }]}>
              {finalScore}%
            </Text>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
              إجابات صحيحة
            </Text>
          </View>

          <View style={[styles.xpCard, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.xpText, { color: colors.primary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
              🎉 لقد حصلت على +{earnedSiraj} سراج أضيفت لمحفظتك
            </Text>
          </View>

          {/* Wrong answers report card block */}
          {wrongAnswers.length > 0 && (
            <View style={styles.wrongAnswersBlock}>
              <Text style={styles.wrongAnswersBlockTitle}>📋 تقرير الإجابات التي تحتاج مراجعة:</Text>
              {wrongAnswers.map((item, idx) => (
                <View key={idx} style={styles.wrongAnswerCard}>
                  <Text style={styles.wrongAnswerQuestion}>{item.question}</Text>
                  
                  <View style={styles.wrongAnswerRow}>
                    <Text style={styles.wrongAnswerLabel}>إجابتك:</Text>
                    <View style={styles.answerTextCardWrong}>
                      <Text style={styles.answerTextWrong}>{item.selected} ❌</Text>
                    </View>
                  </View>

                  <View style={styles.wrongAnswerRow}>
                    <Text style={styles.wrongAnswerLabel}>الإجابة الصحيحة:</Text>
                    <View style={styles.answerTextCardCorrect}>
                      <Text style={styles.answerTextCorrect}>{item.correct} ✅</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.startBtn, { backgroundColor: colors.primary, width: '100%' }]}
            onPress={() => navigation.navigate('Shop')}
          >
            <Text style={styles.startBtnText}>زيارة متجر الفوانيس 🕯️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.homeBtn, { borderColor: colors.primary, width: '100%', marginTop: 12 }]}
            onPress={handleReset}
          >
            <Text style={[styles.homeBtnText, { color: colors.primary }]}>تحدي جديد</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* FLYING LANTERN REWARD CELEBRATION (IN-SCREEN ABSOLUTE OVERLAY) */}
      {isFlying && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View
            style={[
              styles.flyingFanoosAbsolute,
              {
                transform: [
                  { translateX: lanternPos.x },
                  { translateY: lanternPos.y },
                  { scale: lanternScale }
                ],
                opacity: lanternOpacity
              }
            ]}
          >
            <Text style={{ fontSize: 48 }}>🕯️</Text>
            <Text style={styles.glowingBeacon}>✨</Text>
          </Animated.View>
        </View>
      )}

      {/* NEWLY UNLOCKED TITLE CONGRATULATIONS MODAL */}
      {showUnlockModal && titleInfo && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={showUnlockModal}
          onRequestClose={() => setShowUnlockModal(false)}
        >
          <View style={styles.congratsCenteredView}>
            <View style={[styles.unlockModalCard, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
              <Text style={styles.starsEmitter}>✨ 🎉 ✨</Text>
              
              <Text style={styles.unlockModalCongrats}>
                إنجاز عظيم جديد!
              </Text>
              <Text style={styles.unlockModalSubtitle}>
                لقد تميز حفظك ونلت لقباً قرآنياً شريفاً:
              </Text>

              <View style={styles.unlockedTitleBadgeBig}>
                <Text style={{ fontSize: 44, marginBottom: 8 }}>{titleInfo.emoji}</Text>
                <Text style={styles.unlockedTitleNameBig}>{titleInfo.title}</Text>
              </View>

              <Text style={styles.unlockedTitleDescBig}>
                {titleInfo.desc}
              </Text>

              <TouchableOpacity
                style={styles.addProfileBtn}
                onPress={handleAddTitleToProfile}
              >
                <Text style={styles.addProfileBtnText}>
                  تجهيز وإضافة اللقب لملفي الشخصي 🛡️
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dismissUnlockBtn}
                onPress={() => setShowUnlockModal(false)}
              >
                <Text style={styles.dismissUnlockBtnText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      <AdBanner />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  walletText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  lobbyScroll: {
    padding: 20,
  },
  infoBox: {
    padding: 24,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'right',
  },
  diffCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  diffHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  diffTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  diffDesc: {
    fontSize: 13,
    textAlign: 'right',
    lineHeight: 18,
  },
  startBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 25,
  },
  startBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  quizScroll: {
    padding: 20,
  },
  progressRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    flex: 1,
    marginRight: 15,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  questionBox: {
    borderWidth: 1,
    borderRadius: 15,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    minHeight: 160,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ayahText: {
    fontSize: 20,
    textAlign: 'center',
    lineHeight: 34,
    fontWeight: '600',
  },
  hintLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'right',
  },
  optionBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultsScroll: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  trophyContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  scorePercent: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  xpCard: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  xpText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  homeBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  flyingFanoosAbsolute: {
    position: 'absolute',
    left: SCREEN_WIDTH / 2 - 24,
    top: SCREEN_HEIGHT / 2 - 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  glowingBeacon: {
    position: 'absolute',
    fontSize: 20,
    top: -8,
    right: -8,
  },
  parchmentScrollCard: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  parchmentHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.accentDeep,
    marginBottom: 10,
    textAlign: 'right',
  },
  parchmentText: {
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: 'right',
    lineHeight: 24,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  congratsCenteredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  unlockModalCard: {
    width: SCREEN_WIDTH * 0.88,
    borderRadius: 24,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  starsEmitter: {
    fontSize: 32,
    marginBottom: 8,
  },
  unlockModalCongrats: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.accentDeep,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  unlockModalSubtitle: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  unlockedTitleBadgeBig: {
    backgroundColor: colors.accentTint,
    borderColor: colors.accentTintBorder,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  unlockedTitleNameBig: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  unlockedTitleDescBig: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 25,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  addProfileBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  addProfileBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  dismissUnlockBtn: {
    marginTop: 14,
    padding: 6,
  },
  dismissUnlockBtnText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  wrongAnswersBlock: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  wrongAnswersBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textBody,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  wrongAnswerCard: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  wrongAnswerQuestion: {
    fontSize: 13.5,
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    lineHeight: 20,
    marginBottom: 10,
  },
  wrongAnswerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  wrongAnswerLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  answerTextCardWrong: {
    backgroundColor: colors.cardErrorTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dangerTintBorder,
  },
  answerTextWrong: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  answerTextCardCorrect: {
    backgroundColor: colors.cardSuccessTint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryTintBorder,
  },
  answerTextCorrect: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  countSelectorRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  countPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPillText: {
    fontSize: 13,
  },
});
