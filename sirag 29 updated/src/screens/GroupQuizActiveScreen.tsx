import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { questionBank, Question } from '../data/questions';
import { SafeAudio as Audio } from '../utils/safeAudio';

const { width } = Dimensions.get('window');

interface PlayerScore {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  lastAnswerStatus: 'correct' | 'incorrect' | 'waiting' | 'none';
  isBot?: boolean;
}

export default function GroupQuizActiveScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  const { roomId, settings, players: initialPlayers } = route.params || {};

  // Loaded questions pool
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Active game states
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Animation values
  const timerAnim = useRef(new Animated.Value(1)).current;
  const questionStartTime = useRef<number>(Date.now());
  const timerInterval = useRef<any>(null);
  const botsAnswerTimer = useRef<any[]>([]);

  // Floating emojis list
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string; emoji: string; playerId: string; xOffset: number }[]>([]);
  const emojiIdCounter = useRef(0);

  // Countdown Overlay states
  const [countdown, setCountdown] = useState<number | string | null>(3);
  const countdownScale = useRef(new Animated.Value(0)).current;

  // Sound play helper
  const playBeepSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav' }
      );
      await sound.playAsync();
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  useEffect(() => {
    if (countdown !== null) {
      // Play beep sound
      playBeepSound();

      // Trigger scale animation (pop effect)
      countdownScale.setValue(0);
      Animated.spring(countdownScale, {
        toValue: 2.2,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        if (countdown === 3) {
          setCountdown(2);
        } else if (countdown === 2) {
          setCountdown(1);
        } else if (countdown === 1) {
          setCountdown(language === 'ar' ? 'انطلق! ⚡' : 'GO! ⚡');
        } else {
          setCountdown(null);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 1. Initial configuration: Load questions & initialize player scores
  useEffect(() => {
    // Aggregation & strict category/difficulty filtering
    let pool = questionBank.filter(q => {
      // Category check
      let categoryMatch = false;
      if (settings.category === 'القرآن') categoryMatch = q.category === 'القرآن';
      else if (settings.category === 'السنة') categoryMatch = q.category === 'السنة';
      else if (settings.category === 'الفقه') categoryMatch = q.category === 'الفقه';
      else if (settings.category === 'السيرة') categoryMatch = q.category === 'السيرة';
      else if (settings.category === 'التاريخ') categoryMatch = q.category === 'التاريخ';

      // Difficulty check
      let difficultyMatch = false;
      if (settings.difficulty === 'easy') difficultyMatch = q.tier === 'Beginner';
      else if (settings.difficulty === 'medium') difficultyMatch = q.tier === 'Intermediate';
      else if (settings.difficulty === 'hard') difficultyMatch = q.tier === 'Advanced' || q.tier === 'Hero';

      return categoryMatch && difficultyMatch;
    });

    // Safeguard: Fallback to general pool if category has too few questions
    if (pool.length < settings.questionCount) {
      pool = questionBank.filter(q => {
        if (settings.difficulty === 'easy') return q.tier === 'Beginner';
        if (settings.difficulty === 'medium') return q.tier === 'Intermediate';
        return q.tier === 'Advanced' || q.tier === 'Hero';
      });
    }

    // Shuffle and slice
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, settings.questionCount);
    setQuestions(selected);

    // Initialize scores
    const initialScores = initialPlayers.map((p: any) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      score: 0,
      streak: 0,
      lastAnswerStatus: 'waiting',
      isBot: p.isBot,
    }));
    setPlayerScores(initialScores);
  }, [settings, initialPlayers]);

  // 2. Start timer & Bot answers simulation loop
  useEffect(() => {
    if (questions.length > 0 && currentIdx < questions.length && countdown === null) {
      // Reset state for new question
      setTimeLeft(15);
      setSelectedOption(null);
      setHasAnswered(false);
      setShowExplanation(false);
      questionStartTime.current = Date.now();

      // Reset players status to waiting
      setPlayerScores(prev => prev.map(p => ({ ...p, lastAnswerStatus: 'waiting' })));

      // Animate timer progress bar
      timerAnim.setValue(1);
      Animated.timing(timerAnim, {
        toValue: 0,
        duration: 15000,
        useNativeDriver: false,
      }).start();

      // Start countdown interval
      if (timerInterval.current) clearInterval(timerInterval.current);
      timerInterval.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval.current);
            handleTimeOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Simulate Bot answers with random latencies
      botsAnswerTimer.current.forEach(t => clearTimeout(t));
      botsAnswerTimer.current = [];

      const currentQuestion = questions[currentIdx];
      playerScores.forEach(p => {
        if (p.isBot) {
          const delay = Math.random() * 8 + 1.5; // Bot answers in 1.5 - 9.5s
          const willAnswerCorrect = Math.random() > (settings.difficulty === 'easy' ? 0.3 : settings.difficulty === 'medium' ? 0.2 : 0.1);

          const timer = setTimeout(() => {
            setPlayerScores(prev =>
              prev.map(ps => {
                if (ps.id === p.id) {
                  // Speed bonus for bots
                  const pointsEarned = willAnswerCorrect ? (delay <= 3.5 ? 15 : 10) : 0;
                  const newStreak = willAnswerCorrect ? ps.streak + 1 : 0;
                  const streakBonus = newStreak >= 3 ? 5 : 0; // extra points for streak

                  // Trigger simulated taunts on streak/win
                  if (willAnswerCorrect && newStreak >= 3 && Math.random() > 0.4) {
                    triggerFloatingEmoji('🔥', ps.id);
                  }

                  return {
                    ...ps,
                    score: ps.score + pointsEarned + streakBonus,
                    streak: newStreak,
                    lastAnswerStatus: willAnswerCorrect ? 'correct' : 'incorrect',
                  };
                }
                return ps;
              })
            );
          }, delay * 1000);

          botsAnswerTimer.current.push(timer);
        }
      });

      return () => {
        clearInterval(timerInterval.current);
        botsAnswerTimer.current.forEach(t => clearTimeout(t));
      };
    }
  }, [questions, currentIdx]);

  const handleTimeOver = () => {
    setHasAnswered(true);
    setShowExplanation(true);
    setPlayerScores(prev =>
      prev.map(p => (p.id === 'local-user' || p.id === 'admin-user' ? { ...p, lastAnswerStatus: 'incorrect', streak: 0 } : p))
    );

    // Auto advance after 4.5 seconds
    setTimeout(() => {
      advanceQuiz();
    }, 4500);
  };

  const handleSelectOption = (option: string) => {
    if (hasAnswered) return;
    setSelectedOption(option);
    setHasAnswered(true);
    clearInterval(timerInterval.current);
    timerAnim.stopAnimation();

    const currentQuestion = questions[currentIdx];
    const isCorrect = option === currentQuestion.answer;
    const timeTaken = (Date.now() - questionStartTime.current) / 1000;

    // Calculate score
    let points = 0;
    let newStreak = 0;
    if (isCorrect) {
      points = 10;
      // Speed bonus: answered within 3 seconds
      if (timeTaken <= 3) {
        points += 5;
      }
      // Streak calculations
      setPlayerScores(prev => {
        const local = prev.find(p => p.id === 'local-user' || p.id === 'admin-user');
        newStreak = (local?.streak ?? 0) + 1;
        return prev;
      });
    } else {
      newStreak = 0;
    }

    // Streak bonus
    const streakBonus = newStreak >= 3 ? 5 : 0;
    
    // Update local score
    const targetUserId = isAdminUserInLobby() ? 'admin-user' : 'local-user';
    setPlayerScores(prev =>
      prev.map(p => {
        if (p.id === targetUserId) {
          return {
            ...p,
            score: p.score + points + streakBonus,
            streak: newStreak,
            lastAnswerStatus: isCorrect ? 'correct' : 'incorrect',
          };
        }
        return p;
      })
    );

    if (isCorrect && newStreak >= 3) {
      triggerFloatingEmoji('🔥', targetUserId);
    }

    setShowExplanation(true);

    // Auto advance after 4.5 seconds
    setTimeout(() => {
      advanceQuiz();
    }, 4500);
  };

  const isAdminUserInLobby = () => {
    return playerScores.some(p => p.id === 'admin-user' && p.name.includes('أنت'));
  };

  const triggerFloatingEmoji = (emoji: string, playerId: string) => {
    const id = `emoji-${emojiIdCounter.current++}`;
    const xOffset = Math.random() * 40 - 20;
    setFloatingEmojis(prev => [...prev, { id, emoji, playerId, xOffset }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(item => item.id !== id));
    }, 1800);
  };

  const advanceQuiz = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      // Sort scores to determine positions
      const finalRankings = [...playerScores].sort((a, b) => b.score - a.score);
      navigation.navigate('GroupQuizResults', {
        roomId,
        rankings: finalRankings,
        settings,
        initialPlayers,
      });
    }
  };

  if (questions.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>
          {language === 'ar' ? '⏳ جاري استدعاء الأسئلة من المصادر الإسلامية...' : '⏳ Loading questions database...'}
        </Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <View style={styles.container}>
      {/* Top Header progress */}
      <View style={styles.header}>
        <Text style={styles.roomCodeText}>{roomId}</Text>
        <Text style={styles.progressText}>
          {language === 'ar'
            ? `السؤال ${currentIdx + 1} من ${questions.length}`
            : `Question ${currentIdx + 1} of ${questions.length}`}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Countdown Timer bar */}
      <View style={styles.timerTrack}>
        <Animated.View
          style={[
            styles.timerFill,
            {
              width: timerAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: timeLeft <= 4 ? '#EF4444' : '#10B981',
            },
          ]}
        />
      </View>

      {/* Question Card */}
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <Text style={styles.categoryBadge}>🏷️ {currentQuestion.category} - {settings.difficulty === 'easy' ? 'سهل' : settings.difficulty === 'medium' ? 'متوسط' : 'صعب'}</Text>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* Options List */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === option;
            const isCorrect = option === currentQuestion.answer;
            const isWrongSelected = isSelected && !isCorrect;

            let cardStyle: any = styles.optionCard;
            let textStyle: any = styles.optionCardText;

            if (showExplanation) {
              if (isCorrect) {
                cardStyle = [styles.optionCard, styles.optionCardCorrect];
                textStyle = [styles.optionCardText, styles.optionTextCorrect];
              } else if (isWrongSelected) {
                cardStyle = [styles.optionCard, styles.optionCardWrong];
                textStyle = [styles.optionCardText, styles.optionTextWrong];
              }
            } else if (isSelected) {
              cardStyle = [styles.optionCard, styles.optionCardSelected];
              textStyle = [styles.optionCardText, styles.optionTextSelected];
            }

            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleSelectOption(option)}
                disabled={hasAnswered}
                style={cardStyle}
                activeOpacity={0.8}
              >
                <Text style={textStyle}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation Card */}
        {showExplanation && (
          <View style={styles.explanationCard}>
            <Text style={styles.explanationTitle}>💡 {language === 'ar' ? 'الفائدة التربوية:' : 'Educational Insight:'}</Text>
            <Text style={styles.explanationText}>{currentQuestion.explanation}</Text>
          </View>
        )}
      </ScrollView>

      {/* Real-time score ticker list at bottom */}
      <View style={styles.scoreboardContainer}>
        <Text style={styles.scoreboardTitle}>📊 {language === 'ar' ? 'لوحة النقاط المباشرة' : 'Live Scoreboard'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scoreboardScroll}>
          {playerScores
            .sort((a, b) => b.score - a.score)
            .map((player) => {
              const isLocal = player.id === 'local-user' || player.id === 'admin-user';
              return (
                <View key={player.id} style={[styles.playerScoreCard, isLocal && { borderColor: colors.primaryDeep, borderWidth: 1.5 }]}>
                  {/* Avatar & Floating Emojis */}
                  <View style={styles.scoreAvatarWrapper}>
                    <Text style={{ fontSize: 22 }}>{player.avatar}</Text>
                    {player.streak >= 3 && <Text style={styles.fireBadge}>🔥</Text>}
                    
                    {floatingEmojis
                      .filter((e) => e.playerId === player.id)
                      .map((e) => (
                        <AnimatedEmoji key={e.id} emoji={e.emoji} xOffset={e.xOffset} />
                      ))}
                  </View>
                  <Text style={styles.scorePlayerName} numberOfLines={1}>
                    {player.name.replace(' (أنت)', '')}
                  </Text>
                  <Text style={styles.scorePlayerVal}>{player.score} {language === 'ar' ? 'نقطة' : 'pts'}</Text>
                  
                  {/* Status Indicator bubble */}
                  {player.lastAnswerStatus === 'correct' && <Text style={styles.statusCorrect}>✅</Text>}
                  {player.lastAnswerStatus === 'incorrect' && <Text style={styles.statusWrong}>❌</Text>}
                  {player.lastAnswerStatus === 'waiting' && <Text style={styles.statusWaiting}>⏳</Text>}
                </View>
              );
            })}
        </ScrollView>
      </View>

      {/* Full-screen Countdown Overlay */}
      {countdown !== null && (
        <View style={styles.countdownOverlay}>
          <Animated.View
            style={[
              styles.countdownBox,
              {
                transform: [{ scale: countdownScale }],
              },
            ]}
          >
            <Text style={styles.countdownNumberText}>{countdown}</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// Floating Emoji animation component
function AnimatedEmoji({ emoji, xOffset }: { emoji: string; xOffset: number }) {
  const animatedY = useRef(new Animated.Value(0)).current;
  const animatedScale = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedY, {
        toValue: -70,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(animatedScale, {
          toValue: 1.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animatedScale, {
          toValue: 1.0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(animatedOpacity, {
        toValue: 0,
        delay: 1000,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingEmoji,
        {
          transform: [
            { translateY: animatedY },
            { translateX: xOffset },
            { scale: animatedScale },
          ],
          opacity: animatedOpacity,
        },
      ]}
    >
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingEmoji: {
    position: 'absolute',
    top: -10,
    zIndex: 999,
  },
});

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: colors.surface,
  },
  roomCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  timerTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
  },
  timerFill: {
    height: '100%',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 150,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  categoryBadge: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 10,
  },
  questionText: {
    fontSize: 15.5,
    lineHeight: 24,
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
  },
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionCardSelected: {
    borderColor: colors.primaryDeep,
    backgroundColor: '#E6F4EA',
  },
  optionCardCorrect: {
    borderColor: '#34A853',
    backgroundColor: '#E6F4EA',
  },
  optionCardWrong: {
    borderColor: '#EA4335',
    backgroundColor: '#FCE8E6',
  },
  optionCardText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  optionTextSelected: {
    color: '#137333',
    fontWeight: '700',
  },
  optionTextCorrect: {
    color: '#137333',
    fontWeight: '700',
  },
  optionTextWrong: {
    color: '#C5221F',
    fontWeight: '700',
  },
  explanationCard: {
    backgroundColor: '#FFF8E6',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    marginTop: 16,
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B8860B',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#5C4033',
    fontFamily: 'IBMPlexSansArabic-Medium',
    textAlign: 'right',
  },
  scoreboardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  scoreboardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'right',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  scoreboardScroll: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row-reverse',
  },
  playerScoreCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    width: 90,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  scoreAvatarWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fireBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    fontSize: 12,
  },
  scorePlayerName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginTop: 4,
    width: '100%',
    textAlign: 'center',
  },
  scorePlayerVal: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primaryDeep,
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginTop: 2,
  },
  statusCorrect: {
    position: 'absolute',
    top: 4,
    left: 4,
    fontSize: 10,
  },
  statusWrong: {
    position: 'absolute',
    top: 4,
    left: 4,
    fontSize: 10,
  },
  statusWaiting: {
    position: 'absolute',
    top: 4,
    left: 4,
    fontSize: 10,
  },
  countdownOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  countdownBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumberText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F59E0B',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textShadowColor: 'rgba(245, 158, 11, 0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
});
