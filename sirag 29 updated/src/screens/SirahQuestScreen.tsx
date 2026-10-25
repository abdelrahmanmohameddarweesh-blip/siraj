import { recordChallenge } from '../services/challengeProgress';
import CinematicSectionHeader from '../components/CinematicSectionHeader';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, Animated, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile, addSirajPoints, incrementCorrectAnswers } from '../firebase/auth';
import { sirahCheckpoints, type SirahCheckpoint } from '../data/sirahQuests';
import AdBanner from '../components/AdBanner';

export default function SirahQuestScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language, backArrow } = useLanguage();
  const { user } = useAuth();
  const styles = getStyles(colors);

  const [currentScore, setCurrentScore] = useState(0);
  const [unlockedCheckpoint, setUnlockedCheckpoint] = useState<number>(1);
  const [completedCheckpoints, setCompletedCheckpoints] = useState<number[]>([]);

  // Modal State
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<SirahCheckpoint | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Siraj and animation states
  const [profile, setProfile] = useState<any>(null);
  const [isFlying, setIsFlying] = useState(false);
  const lanternScale = useRef(new Animated.Value(0)).current;
  const lanternPos = useRef(new Animated.ValueXY({ x: 0, y: 150 })).current;
  const lanternOpacity = useRef(new Animated.Value(1)).current;
  const walletScale = useRef(new Animated.Value(1)).current;

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

  const loadProgress = async () => {
    try {
      // 1. Get user score & profile details
      if (user?.uid) {
        const data = await getCurrentUserProfile(user.uid);
        setProfile(data);
        setCurrentScore(data.score ?? 0);
      }

      // 2. Load completed checkpoints
      const completed: number[] = [];
      let nextUnlocked = 1;
      for (let id = 1; id <= sirahCheckpoints.length; id++) {
        const done = await AsyncStorage.getItem(`completed-sirah-checkpoint-${id}`);
        if (done === 'true') {
          completed.push(id);
          nextUnlocked = Math.max(nextUnlocked, id + 1);
        }
      }
      setCompletedCheckpoints(completed);
      setUnlockedCheckpoint(Math.min(sirahCheckpoints.length, nextUnlocked));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [user]);

  const handleOpenCheckpoint = (checkpoint: SirahCheckpoint) => {
    const isCompleted = completedCheckpoints.includes(checkpoint.id);
    const isLocked = checkpoint.id > unlockedCheckpoint && !isCompleted;

    if (isLocked) {
      Alert.alert(
        language === 'ar' ? 'المرحلة مغلقة 🔒' : 'Stage Locked 🔒',
        language === 'ar' 
          ? 'الرجاء إكمال المراحل السابقة في السيرة النبوية لفتح هذه المرحلة.'
          : 'Please complete the previous stages in the Sirah map to unlock this stage.'
      );
      return;
    }

    setSelectedCheckpoint(checkpoint);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsCorrect(false);
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !selectedCheckpoint) return;

    const correct = selectedAnswer === selectedCheckpoint.correctIndex;
    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      // Complete checkpoint
      try {
        const alreadyCompleted = completedCheckpoints.includes(selectedCheckpoint.id);
        
        if (!alreadyCompleted) {
          // 1. Save checkpoint status
          await AsyncStorage.setItem(`completed-sirah-checkpoint-${selectedCheckpoint.id}`, 'true');
          recordChallenge({ id: `sirah-checkpoint-${selectedCheckpoint.id}`, kind: 'sirah',
            completedAt: new Date().toISOString(), correct: 1, total: 1, points: 0,
            detail: `Checkpoint ${selectedCheckpoint.id}` }).catch(console.warn);

          // Trigger flying lantern animation
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
                    // Add 50 Siraj Points
                    const updated = await addSirajPoints(user.uid, 50);
                    setProfile(updated);

                    // Save score
                    const currentScore = updated.score ?? 0;
                    await saveUserScore(user.uid, currentScore + 50);
                  } catch (err) {
                    console.error(err);
                  }
                }
              });
            });
          });
        }
        
        // Reload map progress
        await loadProgress();
      } catch (err) {
        console.error(err);
      }
    } else {
      Alert.alert(
        language === 'ar' ? 'إجابة غير صحيحة ❌' : 'Incorrect Answer ❌',
        language === 'ar' ? 'حاول مرة أخرى لترسيخ المعلومة في ذهنك.' : 'Try again to strengthen your knowledge.'
      );
    }
  };

  const handleCloseModal = () => {
    setSelectedCheckpoint(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* custom top header bar */}
      <View style={styles.headerCustom}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={{ fontSize: 20, color: colors.primary }}>{backArrow}</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'خريطة السيرة النبوية 🗺️' : 'Prophet\'s Sirah Map 🗺️'}
        </Text>

        <Animated.View style={[styles.walletBadge, { transform: [{ scale: walletScale }] }]}>
          <Text style={{ fontSize: 16, marginRight: 4 }}>🕯️</Text>
          <Text style={styles.walletText}>
            {profile?.sirajBalance ?? 50}
          </Text>
        </Animated.View>
      </View>

      {/* Subheader info stats card */}
      <View style={styles.subheaderCard}>
        <Text style={styles.subtitle}>
          {language === 'ar'
            ? 'تتبع محطات السيرة العطرة، تعلم مواقف الهداية، واكسب أوسمة ونقاط تميز'
            : 'Trace the milestones of the Prophet\'s life, solve trivia, and unlock badges'}
        </Text>
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>
            🏆 {language === 'ar' ? `رصيدك: ${currentScore} XP` : `Your Score: ${currentScore} XP`}
          </Text>
        </View>
      </View>

      {/* Vertical Map Path */}
      <ScrollView style={styles.mapScroll} contentContainerStyle={styles.mapContent} showsVerticalScrollIndicator={false}>
        <CinematicSectionHeader titleAr="مغامرة السيرة" titleEn="Sirah Adventure" subtitleAr="اكتشف المحطات وأكمل رحلة التعلّم" subtitleEn="Discover chapters and continue your learning journey" symbol="✧" />
        {sirahCheckpoints.map((checkpoint, index) => {
          const isCompleted = completedCheckpoints.includes(checkpoint.id);
          const isActive = checkpoint.id === unlockedCheckpoint;
          const isLocked = checkpoint.id > unlockedCheckpoint && !isCompleted;

          // Determine horizontal zigzag offset for nodes (Pokemon Go / Duolingo style)
          const offsetDirection = index % 2 === 0 ? 'right' : 'left';
          const nodeOffset = offsetDirection === 'right' ? { marginRight: 50 } : { marginLeft: 50 };

          return (
            <View key={checkpoint.id} style={styles.checkpointWrapper}>
              {/* Vertical Path Connector Lines */}
              {index < sirahCheckpoints.length - 1 && (
                <View style={[
                  styles.connectorLine,
                  offsetDirection === 'right' ? styles.connectorRight : styles.connectorLeft,
                  (isCompleted || checkpoint.id < unlockedCheckpoint) && styles.connectorLineActive
                ]} />
              )}

              {/* Map Checkpoint Circle Node */}
              <TouchableOpacity
                style={[
                  styles.mapNode,
                  nodeOffset,
                  isCompleted && styles.nodeCompleted,
                  isActive && styles.nodeActive,
                  isLocked && styles.nodeLocked,
                ]}
                onPress={() => handleOpenCheckpoint(checkpoint)}
                activeOpacity={0.8}
              >
                <Text style={styles.nodeEmoji}>
                  {isCompleted ? '✅' : isLocked ? '🔒' : checkpoint.badgeEmoji}
                </Text>
                {isActive && <View style={styles.pulseIndicator} />}
              </TouchableOpacity>

              {/* Label Card */}
              <View style={[styles.labelCard, nodeOffset, isActive && styles.labelCardActive]}>
                <Text style={styles.labelCardStep}>
                  {language === 'ar' ? `المحطة ${checkpoint.id}` : `Stage ${checkpoint.id}`}
                </Text>
                <Text style={styles.labelCardTitle}>
                  {language === 'ar' ? checkpoint.titleAr : checkpoint.titleEn}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Quest Challenge Modal */}
      <Modal visible={selectedCheckpoint !== null} animationType="slide" transparent={true} onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCheckpoint && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
                {/* Header Badge */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalEmoji}>{selectedCheckpoint.badgeEmoji}</Text>
                  <Text style={styles.modalTitle}>
                    {language === 'ar' ? selectedCheckpoint.titleAr : selectedCheckpoint.titleEn}
                  </Text>
                  <Text style={styles.modalReward}>
                    🎁 +{selectedCheckpoint.xpReward} XP + {language === 'ar' ? `وسام: ${selectedCheckpoint.badgeNameAr}` : `Badge: ${selectedCheckpoint.badgeNameEn}`}
                  </Text>
                </View>

                {/* Narrative Description */}
                <View style={styles.narrativeBox}>
                  <Text style={styles.narrativeText}>
                    {language === 'ar' ? selectedCheckpoint.narrativeAr : selectedCheckpoint.narrativeEn}
                  </Text>
                </View>

                {/* Question Section */}
                <View style={styles.questionBox}>
                  <Text style={styles.questionText}>
                    {language === 'ar' ? selectedCheckpoint.questionAr : selectedCheckpoint.questionEn}
                  </Text>

                  {/* Multiple Choice Options */}
                  <View style={styles.optionsList}>
                    {(language === 'ar' ? selectedCheckpoint.optionsAr : selectedCheckpoint.optionsEn).map((opt, i) => {
                      const isSelected = selectedAnswer === i;
                      const isOptionCorrect = i === selectedCheckpoint.correctIndex;

                      let optStyle: any = styles.optionItem;
                      let txtStyle: any = styles.optionText;

                      if (isSelected) {
                        optStyle = [styles.optionItem, styles.optionItemValActive];
                        txtStyle = [styles.optionText, styles.optionTextActive];
                      }

                      if (isAnswered) {
                        if (isOptionCorrect) {
                          optStyle = [styles.optionItem, styles.optionItemCorrect];
                          txtStyle = [styles.optionText, styles.optionTextCorrect];
                        } else if (isSelected && !isCorrect) {
                          optStyle = [styles.optionItem, styles.optionItemWrong];
                          txtStyle = [styles.optionText, styles.optionTextWrong];
                        }
                      }

                      return (
                        <TouchableOpacity
                          key={i}
                          style={optStyle}
                          onPress={() => handleSelectOption(i)}
                          disabled={isAnswered}
                          activeOpacity={0.7}
                        >
                          <Text style={txtStyle}>{opt}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Action Buttons */}
                {!isAnswered ? (
                  <TouchableOpacity
                    style={[styles.submitBtn, selectedAnswer === null && styles.submitBtnDisabled]}
                    onPress={handleSubmitAnswer}
                    disabled={selectedAnswer === null}
                  >
                    <Text style={styles.submitBtnText}>
                      {language === 'ar' ? 'تأكيد الإجابة 🚀' : 'Submit Answer 🚀'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.feedbackRow}>
                    {isCorrect ? (
                      <View style={styles.successBlock}>
                        <Text style={styles.successEmoji}>🎉 أحسنت!</Text>
                        <Text style={styles.successMsg}>
                          {language === 'ar'
                            ? `تم فتح وسام [${selectedCheckpoint.badgeNameAr}] المضافة لمعرض أوسمتك!`
                            : `Unlocked badge [${selectedCheckpoint.badgeNameEn}] inside your Profile!`}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.wrongBlock}>
                        <Text style={styles.wrongEmoji}>❌ إجابة خاطئة</Text>
                        <TouchableOpacity 
                          style={styles.retryBtn} 
                          onPress={() => {
                            setSelectedAnswer(null);
                            setIsAnswered(false);
                          }}
                        >
                          <Text style={styles.retryBtnText}>
                            {language === 'ar' ? 'حاول مجدداً 🔄' : 'Try Again 🔄'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity style={styles.closeBtn} onPress={handleCloseModal}>
                      <Text style={styles.closeBtnText}>
                        {language === 'ar' ? 'إغلاق المحطة' : 'Close Stage'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

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

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
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
    borderBottomColor: colors.border,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
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
  subheaderCard: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  flyingFanoos: {
    position: 'absolute',
    left: Dimensions.get('window').width / 2 - 24,
    top: Dimensions.get('window').height / 2 - 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  scoreRow: {
    marginTop: 10,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.primary,
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.primary,
  },
  mapScroll: {
    flex: 1,
  },
  mapContent: {
    paddingBottom: 40,
    paddingTop: 20,
    alignItems: 'center',
  },
  checkpointWrapper: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
    width: '100%',
  },
  connectorLine: {
    position: 'absolute',
    width: 6,
    height: 90,
    backgroundColor: colors.border,
    borderWidth: 1.5,
    borderColor: colors.border,
    top: 50,
    zIndex: -1,
  },
  connectorLineActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  connectorRight: {
    transform: [{ rotate: '25deg' }],
    left: '42%',
  },
  connectorLeft: {
    transform: [{ rotate: '-25deg' }],
    right: '42%',
  },
  mapNode: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  nodeCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  nodeActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  nodeLocked: {
    backgroundColor: colors.neutralTint,
    borderColor: colors.border,
  },
  nodeEmoji: {
    fontSize: 30,
  },
  pulseIndicator: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 2.5,
    borderColor: colors.accent,
    opacity: 0.45,
  },
  labelCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  labelCardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentLight,
  },
  labelCardStep: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  labelCardTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalEmoji: {
    fontSize: 54,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  modalReward: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accent,
    textAlign: 'center',
  },
  narrativeBox: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 18,
  },
  narrativeText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  questionBox: {
    marginBottom: 18,
  },
  questionText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.textPrimary,
    textAlign: 'right',
    marginBottom: 14,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  optionItemValActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentTint,
  },
  optionItemCorrect: {
    borderColor: colors.success,
    backgroundColor: colors.primaryTint,
  },
  optionItemWrong: {
    borderColor: colors.error,
    backgroundColor: colors.dangerTint,
  },
  optionText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '800',
  },
  optionTextActive: {
    color: colors.accent,
    fontWeight: '900',
  },
  optionTextCorrect: {
    color: colors.success,
    fontWeight: '900',
  },
  optionTextWrong: {
    color: colors.error,
    fontWeight: '900',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.surface,
  },
  feedbackRow: {
    alignItems: 'center',
    gap: 14,
  },
  successBlock: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  successEmoji: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.success,
    marginBottom: 4,
  },
  successMsg: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '700',
  },
  wrongBlock: {
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  wrongEmoji: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.error,
  },
  retryBtn: {
    backgroundColor: colors.error,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
  },
  closeBtn: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  closeBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '900',
  },
});
