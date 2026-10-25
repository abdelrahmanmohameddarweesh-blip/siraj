import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { requestNotificationPermission } from '../prayer/prayerNotificationService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 seconds per story slide

interface OnboardingStoriesProps {
  visible: boolean;
  onClose: () => void;
}

const ONBOARDING_SLIDES = [
  {
    id: 1,
    emoji: '🕌',
    title: 'أهلاً بك في صرح بطل مسلم! ✨',
    desc: 'مرحباً بك في رحلة إيمانية تفاعلية مبتكرة، مصممة لمساعدتك على تثبيت حفظ القرآن الكريم وتدارس السيرة النبوية العطرة والحديث الشريف بطرق ممتعة وشيقة.',
    colors: ['#0A2540', '#0052D4'] as [string, string],
  },
  {
    id: 2,
    emoji: '📖',
    title: 'تحدي المتشابهات القرآني 💡',
    desc: 'اختبر دقة وضبط حفظك لمتشابهات التنزيل الحكيم. أجب عن الأسئلة، وتعرف على الفروق اللفظية والتقديم والتأخير لتثبت حفظ الآيات بيسر وإتقان.',
    colors: ['#0052D4', '#4364F7'] as [string, string],
  },
  {
    id: 3,
    emoji: '🕯️',
    title: 'أنوار السراج والجوائز 🪙',
    desc: 'كل إجابة صحيحة تنجزها تضيء سراجاً يطير مباشرة لمحفظتك. اجمع السرج واستبدلها بسمات الصرح الفاخرة وخلفيات الكعبة والروضة الشريفة من المتجر!',
    colors: ['#4364F7', '#6FB1FC'] as [string, string],
  },
  {
    id: 4,
    emoji: '🛡️',
    title: 'محراب المقتنيات التاريخية ⚔️',
    desc: 'افتح مقتنيات أبطال المسلمين الشريفة مثل سيف ذي الفقار، وسيف خالد بن الوليد، وخاتم الرسول ﷺ. شاهد وثائقيات كرتونية مشوقة واقرأ قصص بطولاتهم.',
    colors: ['#1A365D', '#0F766E'] as [string, string],
  },
  {
    id: 5,
    emoji: '👑',
    title: 'الألقاب القرآنية وتجهيزها 🏆',
    desc: 'ثبّت إجاباتك لتفتح ألقاباً شريفة مثل (فارس المتشابهات) أو (الحافظ المتقن). جهز لقبك ليظهر بجانب اسمك في لوحة الصدارة ليرى الجميع إنجازك العظيم!',
    colors: ['#1E1B4B', '#4C1D95'] as [string, string],
  },
  {
    id: 6,
    emoji: '🕌',
    title: 'تنبيهات الأذان ومواقيت الصلاة ⏱️',
    desc: 'لا تفوّت فريضة بإذن الله! نرسل تذكيرات هادئة عند دخول وقت الصلاة وتفقداً خفيفاً بعد الصلاة دون إزعاج. يمكنك تخصيص الأوقات لكل صلاة أو كتمها في أي وقت.',
    colors: ['#0B4F44', '#10231F'] as [string, string],
  },
];

export default function OnboardingStories({ visible, onClose }: OnboardingStoriesProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideCount = ONBOARDING_SLIDES.length;

  // Trackers for holding down the screen to pause
  const pressStartTime = useRef<number>(0);
  const pausedValue = useRef<number>(0);
  const isPaused = useRef<boolean>(false);
  const activeAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const currentSlide = ONBOARDING_SLIDES[currentSlideIndex];

  // Auto-progress animation controller
  const startProgress = (fromValue = 0, duration = STORY_DURATION) => {
    progressAnim.setValue(fromValue);
    
    // Stop any running animations first
    if (activeAnimation.current) {
      activeAnimation.current.stop();
    }

    activeAnimation.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    });

    activeAnimation.current.start(({ finished }) => {
      if (finished) {
        handleNextSlide();
      }
    });
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slideCount - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    } else {
      // Re-start current slide if first slide
      startProgress(0, STORY_DURATION);
    }
  };

  const handleFinish = async (enableNotifications = false) => {
    try {
      if (enableNotifications) {
        await requestNotificationPermission();
      }
      await AsyncStorage.setItem('user-has-seen-onboarding', 'true');
    } catch (err) {
      console.error(err);
    }
    onClose();
  };

  useEffect(() => {
    if (visible) {
      startProgress(0, STORY_DURATION);
    } else {
      progressAnim.setValue(0);
    }
    return () => {
      if (activeAnimation.current) {
        activeAnimation.current.stop();
      }
    };
  }, [currentSlideIndex, visible]);

  // Touch handlers to support Hold to Pause
  const handlePressIn = () => {
    pressStartTime.current = Date.now();
    isPaused.current = true;
    
    // Stop animation and save paused value
    progressAnim.stopAnimation((value) => {
      pausedValue.current = value;
    });
  };

  const handlePressOut = (evt: any) => {
    const elapsed = Date.now() - pressStartTime.current;
    isPaused.current = false;

    if (elapsed < 200) {
      // It was a short tap: perform slide navigation
      const x = evt.nativeEvent.locationX;
      if (x < SCREEN_WIDTH * 0.35) {
        handlePrevSlide();
      } else {
        handleNextSlide();
      }
    } else {
      // It was a long press hold: resume animation from exact paused value
      const remainingTime = STORY_DURATION * (1 - pausedValue.current);
      startProgress(pausedValue.current, remainingTime);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="fade">
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.container}
      >
        <LinearGradient 
          colors={currentSlide.colors} 
          style={styles.gradient}
        >
          {/* Top Skip Button */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => handleFinish(false)} activeOpacity={0.75}>
            <Text style={styles.skipBtnText}>تخطي</Text>
          </TouchableOpacity>

          {/* Progress Indicators Bar */}
          <View style={styles.progressContainer}>
            {ONBOARDING_SLIDES.map((_, index) => {
              // Calculate width fill for each progress segment
              let fillWidth: any = '0%';
              if (index < currentSlideIndex) {
                fillWidth = '100%';
              } else if (index === currentSlideIndex) {
                fillWidth = progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                });
              }

              return (
                <View key={index} style={styles.progressBarBg}>
                  <Animated.View style={[styles.progressBarFill, { width: fillWidth }]} />
                </View>
              );
            })}
          </View>

          {/* Main Story Content Card */}
          <View style={styles.cardContainer} pointerEvents="none">
            <Text style={styles.emojiText}>{currentSlide.emoji}</Text>
            
            <Text style={styles.titleText}>
              {currentSlide.title}
            </Text>

            <Text style={styles.descText}>
              {currentSlide.desc}
            </Text>
          </View>

          {/* Bottom Action Button (Only on last slide) */}
          {currentSlideIndex === slideCount - 1 ? (
            <View style={styles.actionButtonsCol}>
              <TouchableOpacity 
                style={styles.startBtn} 
                onPress={() => handleFinish(true)} 
                activeOpacity={0.85}
              >
                <Text style={styles.startBtnText}>تفعيل تنبيهات الصلاة والأذان 🔔</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.skipSecondaryBtn} 
                onPress={() => handleFinish(false)} 
                activeOpacity={0.7}
              >
                <Text style={styles.skipSecondaryText}>المتابعة بدون تنبيهات</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.swipeHintRow}>
              <Text style={styles.swipeHintText}>اضغط مطولاً للإيقاف المؤقت • اضغط على اليمين للمتابعة ←</Text>
            </View>
          )}

        </LinearGradient>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 65,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 60,
  },
  skipBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 5,
    zIndex: 9999,
  },
  skipBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  progressContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 5,
    marginTop: 20,
    paddingHorizontal: 5,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  emojiText: {
    fontSize: 84,
    marginBottom: 25,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'IBMPlexSansArabic-Bold',
    lineHeight: 34,
  },
  descText: {
    color: '#EEEEEE',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  startBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 9999,
  },
  startBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  actionButtonsCol: {
    width: '100%',
    gap: 12,
    zIndex: 9999,
  },
  skipSecondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  skipSecondaryText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  swipeHintRow: {
    alignItems: 'center',
  },
  swipeHintText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
});
