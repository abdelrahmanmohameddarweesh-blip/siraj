import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';
import { Colors } from '../config/colors';

const DUEL_QUESTIONS = [
  {
    questionAr: 'كم عدد سور القرآن الكريم؟',
    questionEn: 'How many Surahs are in the Holy Quran?',
    optionsAr: ['١١٠', '١١٤', '١٢٠', '١٠٨'],
    optionsEn: ['110', '114', '120', '108'],
    answerIndex: 1,
  },
  {
    questionAr: 'من هو أول الخلفاء الراشدين؟',
    questionEn: 'Who was the first of the Rightly Guided Caliphs?',
    optionsAr: ['عمر بن الخطاب', 'علي بن أبي طالب', 'أبو بكر الصديق', 'عثمان بن عفان'],
    optionsEn: ['Umar ibn al-Khattab', 'Ali ibn Abi Talib', 'Abu Bakr As-Siddiq', 'Uthman ibn Affan'],
    answerIndex: 2,
  },
  {
    questionAr: 'ما هي أطول سورة في القرآن الكريم؟',
    questionEn: 'What is the longest Surah in the Holy Quran?',
    optionsAr: ['سورة آل عمران', 'سورة البقرة', 'سورة النساء', 'سورة المائدة'],
    optionsEn: ['Surah Ali-Imran', 'Surah Al-Baqarah', 'Surah An-Nisa', 'Surah Al-Maidah'],
    answerIndex: 1,
  },
  {
    questionAr: 'في أي شهر هجري يفرض الصيام؟',
    questionEn: 'In which Hijri month is fasting obligatory?',
    optionsAr: ['شعبان', 'رمضان', 'شوال', 'رجب'],
    optionsEn: ['Sha\'ban', 'Ramadan', 'Shawwal', 'Rajab'],
    answerIndex: 1,
  },
  {
    questionAr: 'أي مدينة هي قبلة المسلمين الأولى؟',
    questionEn: 'Which city was the first Qibla of Muslims?',
    optionsAr: ['مكة المكرمة', 'المدينة المنورة', 'القدس الشريف', 'القاهرة'],
    optionsEn: ['Makkah', 'Madinah', 'Al-Quds (Jerusalem)', 'Cairo'],
    answerIndex: 2,
  },
];

export default function LiveDuelScreen({ navigation }: any) {
  const { user } = useAuth();
  const { language } = useLanguage();
  
  const [profile, setProfile] = useState<any>(null);
  const [stage, setStage] = useState<'matchmaking' | 'ready' | 'playing' | 'result'>('matchmaking');
  const [matchmakingTime, setMatchmakingTime] = useState(0);
  
  // Game Play States
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [myScore, setMyScore] = useState(0);
  const [rivalScore, setRivalScore] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  
  // Rival Simulation trackers
  const [rivalAnswers, setRivalAnswers] = useState<boolean[]>([]);
  const [myAnswers, setMyAnswers] = useState<boolean[]>([]);

  const radarAnim = useRef(new Animated.Value(0)).current;
  const readyCountdown = useRef(3);
  const [readyCount, setReadyCount] = useState(3);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.uid) {
        const p = await getCurrentUserProfile(user.uid);
        setProfile(p);
      }
    };
    fetchProfile();
  }, [user?.uid]);

  // Matchmaking radar animation
  useEffect(() => {
    if (stage === 'matchmaking') {
      Animated.loop(
        Animated.timing(radarAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      const matchmakingInterval = setInterval(() => {
        setMatchmakingTime((prev) => {
          if (prev >= 3) {
            clearInterval(matchmakingInterval);
            setStage('ready');
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(matchmakingInterval);
    }
  }, [stage]);

  // Ready Countdown (3, 2, 1, GO!)
  useEffect(() => {
    if (stage === 'ready') {
      const countdownInterval = setInterval(() => {
        readyCountdown.current -= 1;
        setReadyCount(readyCountdown.current);
        if (readyCountdown.current === 0) {
          clearInterval(countdownInterval);
          setStage('playing');
        }
      }, 1000);
      return () => clearInterval(countdownInterval);
    }
  }, [stage]);

  // Game timer & simulated Rival behavior loop
  useEffect(() => {
    if (stage === 'playing') {
      setTimeLeft(10);
      setSelectedOptionIndex(null);
      setHasAnswered(false);

      // Setup simulated rival answer timing
      const rivalAnswerDelay = Math.random() * 5 + 2; // Rival answers in 2-7 seconds
      const willRivalBeCorrect = Math.random() > 0.3; // 70% chance of correct answer

      const timerInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            handleTimeOver(willRivalBeCorrect);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Rival simulated answer handler
      const rivalTimer = setTimeout(() => {
        if (stage === 'playing') {
          if (willRivalBeCorrect) {
            setRivalScore((prev) => prev + 10);
          }
        }
      }, rivalAnswerDelay * 1000);

      return () => {
        clearInterval(timerInterval);
        clearTimeout(rivalTimer);
      };
    }
  }, [stage, currentQuestionIndex]);

  const handleTimeOver = (rivalCorrect: boolean) => {
    // Save answers track
    setRivalAnswers((prev) => [...prev, rivalCorrect]);
    setMyAnswers((prev) => [...prev, false]); // Player timed out

    advanceQuestion();
  };

  const selectAnswer = (index: number) => {
    if (hasAnswered) return;
    setSelectedOptionIndex(index);
    setHasAnswered(true);

    const currentQuestion = DUEL_QUESTIONS[currentQuestionIndex];
    const isCorrect = index === currentQuestion.answerIndex;

    // Simulated rival answer logic
    const rivalCorrect = Math.random() > 0.3;
    if (isCorrect) {
      setMyScore((prev) => prev + 10);
    }
    if (rivalCorrect) {
      setRivalScore((prev) => prev + 10);
    }

    setMyAnswers((prev) => [...prev, isCorrect]);
    setRivalAnswers((prev) => [...prev, rivalCorrect]);

    setTimeout(() => {
      advanceQuestion();
    }, 1500); // Wait 1.5s so they see the result colors
  };

  const advanceQuestion = () => {
    if (currentQuestionIndex < DUEL_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleGameFinish();
    }
  };

  const handleGameFinish = async () => {
    setStage('result');
    if (user?.uid) {
      const finalXP = (profile?.score ?? 0) + (myScore > rivalScore ? 50 : myScore === rivalScore ? 25 : 10);
      await saveUserScore(user.uid, finalXP);
    }
  };

  const currentQuestion = DUEL_QUESTIONS[currentQuestionIndex];

  return (
    <View style={styles.container}>
      {stage === 'matchmaking' && (
        <View style={styles.contentCenter}>
          <Text style={styles.arenaTitle}>
            {language === 'ar' ? 'ساحة المبارزة المباشرة ⚔️' : 'Live Arena Matchmaker ⚔️'}
          </Text>
          <Text style={styles.arenaSubtitle}>
            {language === 'ar' ? 'البحث عن غريم نشط في منطقتك...' : 'Searching for an active rival online...'}
          </Text>
          
          <View style={styles.radarWrapper}>
            <Animated.View
              style={[
                styles.radarCircle,
                {
                  transform: [
                    {
                      scale: radarAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.6, 2.5],
                      }),
                    },
                  ],
                  opacity: radarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 0],
                  }),
                },
              ]}
            />
            <View style={styles.avatarCenter}>
              <Text style={{ fontSize: 32 }}>👤</Text>
            </View>
          </View>

          <Text style={styles.timerText}>00:0{matchmakingTime}</Text>
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 24 }} />
        </View>
      )}

      {stage === 'ready' && (
        <View style={styles.contentCenter}>
          <Text style={styles.battleFoundTitle}>
            {language === 'ar' ? 'تم العثور على خصم! ⚔️' : 'Match Found! ⚔️'}
          </Text>
          
          <View style={styles.versusRow}>
            <View style={styles.avatarBox}>
              <View style={[styles.avatarRound, { borderColor: '#10B981', backgroundColor: '#10B9811A' }]}>
                <Text style={styles.avatarTxt}>👤</Text>
              </View>
              <Text style={styles.avatarName}>{profile?.displayName || 'أنت'}</Text>
            </View>

            <Text style={styles.vsBadge}>VS</Text>

            <View style={styles.avatarBox}>
              <View style={[styles.avatarRound, { borderColor: '#EF4444', backgroundColor: '#EF44441A' }]}>
                <Text style={styles.avatarTxt}>⚔️</Text>
              </View>
              <Text style={styles.avatarName}>
                {language === 'ar' ? 'خالد 🇪🇬' : 'Khalid 🇪🇬'}
              </Text>
            </View>
          </View>

          <View style={styles.countdownContainer}>
            <Text style={styles.countdownNumber}>{readyCount}</Text>
            <Text style={styles.countdownLabel}>
              {language === 'ar' ? 'استعد للسرعة!' : 'Prepare for speed!'}
            </Text>
          </View>
        </View>
      )}

      {stage === 'playing' && (
        <View style={{ flex: 1 }}>
          {/* Top Score Bar */}
          <View style={styles.scoreBar}>
            <View style={styles.scorePlayer}>
              <Text style={styles.scoreVal}>{myScore} XP</Text>
              <Text style={styles.scoreName}>{profile?.displayName || 'أنت'}</Text>
              <View style={styles.indicatorDots}>
                {DUEL_QUESTIONS.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      myAnswers[idx] === true && styles.dotCorrect,
                      myAnswers[idx] === false && styles.dotWrong,
                    ]}
                  />
                ))}
              </View>
            </View>

            <View style={styles.timerBubble}>
              <Text style={styles.timerBubbleText}>{timeLeft}</Text>
            </View>

            <View style={styles.scorePlayer}>
              <Text style={styles.scoreVal}>{rivalScore} XP</Text>
              <Text style={styles.scoreName}>{language === 'ar' ? 'خالد' : 'Khalid'}</Text>
              <View style={styles.indicatorDots}>
                {DUEL_QUESTIONS.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.dot,
                      rivalAnswers[idx] === true && styles.dotCorrect,
                      rivalAnswers[idx] === false && styles.dotWrong,
                    ]}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Question Box */}
          <View style={styles.questionCard}>
            <Text style={styles.questionIndex}>
              {language === 'ar' ? `السؤال ${currentQuestionIndex + 1} من ٥` : `Question ${currentQuestionIndex + 1} of 5`}
            </Text>
            <Text style={styles.questionText}>
              {language === 'ar' ? currentQuestion.questionAr : currentQuestion.questionEn}
            </Text>
          </View>

          {/* Options Grid */}
          <View style={styles.optionsList}>
            {(language === 'ar' ? currentQuestion.optionsAr : currentQuestion.optionsEn).map((option, idx) => {
              const isSelected = selectedOptionIndex === idx;
              const isCorrect = idx === currentQuestion.answerIndex;
              
              let cardStyle: any = styles.optionBtn;
              let textStyle: any = styles.optionBtnText;

              if (hasAnswered) {
                if (isCorrect) {
                  cardStyle = [styles.optionBtn, styles.optionBtnCorrect];
                  textStyle = [styles.optionBtnText, styles.optionBtnTextCorrect];
                } else if (isSelected) {
                  cardStyle = [styles.optionBtn, styles.optionBtnWrong];
                  textStyle = [styles.optionBtnText, styles.optionBtnTextWrong];
                }
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={cardStyle}
                  onPress={() => selectAnswer(idx)}
                  disabled={hasAnswered}
                  activeOpacity={0.7}
                >
                  <Text style={textStyle}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {stage === 'result' && (
        <View style={styles.contentCenter}>
          <Text style={styles.resultEmote}>
            {myScore > rivalScore ? '🏆' : myScore === rivalScore ? '🤝' : '🛡️'}
          </Text>
          <Text style={styles.resultTitle}>
            {myScore > rivalScore 
              ? (language === 'ar' ? 'انتصار ساحق! ⚔️' : 'Victory! ⚔️')
              : myScore === rivalScore 
                ? (language === 'ar' ? 'تعادل ودّي!' : 'Friendly Draw!')
                : (language === 'ar' ? 'هزيمة مشرفة!' : 'Defeat!')}
          </Text>

          <View style={styles.resultDetailsCard}>
            <View style={styles.resultScoreRow}>
              <Text style={styles.resultScoreVal}>{myScore} Pts</Text>
              <Text style={styles.resultScoreLabel}>{language === 'ar' ? 'نقاطك' : 'Your Score'}</Text>
            </View>
            <View style={styles.resultScoreRow}>
              <Text style={styles.resultScoreVal}>{rivalScore} Pts</Text>
              <Text style={styles.resultScoreLabel}>{language === 'ar' ? 'نقاط غريمك' : 'Rival Score'}</Text>
            </View>
            
            <View style={[styles.rewardBadge, { backgroundColor: myScore > rivalScore ? '#FEF3C7' : '#0B2E21' }]}>
              <Text style={[styles.rewardBadgeText, { color: myScore > rivalScore ? '#D97706' : '#10B981' }]}>
                {myScore > rivalScore 
                  ? (language === 'ar' ? '+50 XP مكافأة الانتصار 🏆' : '+50 XP Victory Reward 🏆')
                  : myScore === rivalScore
                    ? (language === 'ar' ? '+25 XP مكافأة التعادل 🎁' : '+25 XP Draw Reward 🎁')
                    : (language === 'ar' ? '+10 XP مكافأة التحدي 🛡️' : '+10 XP Challenge Reward 🛡️')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Text style={styles.doneBtnText}>➔</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  contentCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arenaTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  arenaSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  radarWrapper: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#09120F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E3A2F',
    position: 'relative',
    marginBottom: 30,
  },
  radarCircle: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarCenter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1E3A2F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    zIndex: 2,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.accent,
  },
  battleFoundTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  versusRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 20,
    marginBottom: 40,
  },
  avatarBox: {
    alignItems: 'center',
    width: 100,
  },
  avatarRound: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 10,
  },
  avatarTxt: {
    fontSize: 32,
  },
  avatarName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  vsBadge: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.accent,
    fontStyle: 'italic',
  },
  countdownContainer: {
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: Colors.accent,
    marginBottom: 8,
  },
  countdownLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  scoreBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    marginTop: 30,
  },
  scorePlayer: {
    alignItems: 'center',
    flex: 1,
  },
  scoreVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 2,
  },
  scoreName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  indicatorDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1E3A2F',
  },
  dotCorrect: {
    backgroundColor: '#10B981',
  },
  dotWrong: {
    backgroundColor: '#EF4444',
  },
  timerBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#09120F',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timerBubbleText: {
    color: '#09120F',
    fontWeight: '900',
    fontSize: 16,
  },
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    minHeight: 140,
    justifyContent: 'center',
  },
  questionIndex: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
    fontWeight: '800',
    textAlign: 'center',
  },
  optionsList: {
    gap: 12,
  },
  optionBtn: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  optionBtnCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#10B9811A',
  },
  optionBtnWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#EF44441A',
  },
  optionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  optionBtnTextCorrect: {
    color: '#10B981',
  },
  optionBtnTextWrong: {
    color: '#EF4444',
  },
  resultEmote: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 20,
  },
  resultDetailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    marginBottom: 30,
    gap: 12,
  },
  resultScoreRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: Colors.background,
  },
  resultScoreLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  resultScoreVal: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '800',
  },
  rewardBadge: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  rewardBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    width: '100%',
  },
  doneBtnText: {
    color: '#09120F',
    fontWeight: '900',
    fontSize: 14,
  },
});
