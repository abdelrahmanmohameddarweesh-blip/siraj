import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Sharing from 'expo-sharing';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

interface FilterAyahItem {
  id: string;
  surahName: string;
  ayahNumber: number;
  promptText: string;
}

const SPINNING_AYAH_LIST: FilterAyahItem[] = [
  { id: '1', surahName: 'سورة الفاتحة', ayahNumber: 6, promptText: '﴿ اهْدِنَا الصِّرَاطَ... ﴾' },
  { id: '2', surahName: 'سورة النبأ', ayahNumber: 1, promptText: '﴿ عَمَّ يَتَسَاءَلُونَ * عَنِ... ﴾' },
  { id: '3', surahName: 'سورة الفاتحة', ayahNumber: 5, promptText: '﴿ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ... ﴾' },
  { id: '4', surahName: 'سورة الملك', ayahNumber: 1, promptText: '﴿ تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ... ﴾' },
  { id: '5', surahName: 'سورة الرحمن', ayahNumber: 60, promptText: '﴿ هَلْ جَزَاءُ الإِحْسَانِ... ﴾' },
  { id: '6', surahName: 'سورة الكهف', ayahNumber: 10, promptText: '﴿ رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً... ﴾' },
  { id: '7', surahName: 'سورة الإخلاص', ayahNumber: 3, promptText: '﴿ لَمْ يَلِدْ... ﴾' },
  { id: '8', surahName: 'سورة آل عمران', ayahNumber: 103, promptText: '﴿ وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا... ﴾' },
  { id: '9', surahName: 'سورة العصر', ayahNumber: 2, promptText: '﴿ إِنَّ الإِنسَانَ لَفِي... ﴾' },
  { id: '10', surahName: 'سورة النجم', ayahNumber: 39, promptText: '﴿ وَأَن لَّيْسَ لِلإِنسَانِ إِلاَّ... ﴾' },
  { id: '11', surahName: 'سورة يس', ayahNumber: 12, promptText: '﴿ إِنَّا نَحْنُ نُحْيِي الْمَوْتَىٰ... ﴾' },
  { id: '12', surahName: 'سورة الحشر', ayahNumber: 21, promptText: '﴿ لَوْ أَنزَلْنَا هَذَا الْقُرْآنَ... ﴾' },
];

export default function FinishAyahCameraScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);

  // Camera & Mic Permissions
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const cameraRef = useRef<any>(null);

  // Camera Settings
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const recordingIntervalRef = useRef<any>(null);

  // AR Head Card Roulette State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinIndex, setSpinIndex] = useState<number>(0);
  const [selectedAyah, setSelectedAyah] = useState<FilterAyahItem | null>(null);

  // Saved Video File Uri for Sharing
  const [recordedVideoUri, setRecordedVideoUri] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Animations
  const cardScale = useRef(new Animated.Value(1)).current;
  const cardRotateY = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for AR filter card
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Duration timer during recording
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setRecordingDuration(0);
    }
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  // Request permissions if missing
  const ensurePermissions = async () => {
    if (!cameraPermission?.granted) {
      const resCam = await requestCameraPermission();
      if (!resCam.granted) return false;
    }
    if (!micPermission?.granted) {
      await requestMicPermission();
    }
    return true;
  };

  // Trigger head card roulette rotation animation
  const startRouletteSpin = (onComplete?: (finalAyah: FilterAyahItem) => void) => {
    setIsSpinning(true);
    setSelectedAyah(null);

    let count = 0;
    const maxSpins = 20; // Number of fast cycles before stopping
    const speed = 80; // Delay in ms between flips

    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * SPINNING_AYAH_LIST.length);
      setSpinIndex(randomIdx);
      count++;

      // Card scale bounce effect per tick
      Animated.sequence([
        Animated.timing(cardScale, { toValue: 1.08, duration: 40, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1, duration: 40, useNativeDriver: true }),
      ]).start();

      if (count >= maxSpins) {
        clearInterval(interval);
        const chosen = SPINNING_AYAH_LIST[randomIdx];
        setSelectedAyah(chosen);
        setIsSpinning(false);

        // Final lock animation
        Animated.sequence([
          Animated.timing(cardScale, { toValue: 1.18, duration: 150, useNativeDriver: true }),
          Animated.timing(cardScale, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();

        if (onComplete) onComplete(chosen);
      }
    }, speed);
  };

  // Start Video Recording & Trigger Auto Roulette Spin
  const handleStartStoryRecording = async () => {
    const hasPerms = await ensurePermissions();
    if (!hasPerms) {
      Alert.alert('الإذن مطلوب', 'يرجى تفعيل صلاحية الكاميرا والميكروفون لبدء تسجيل الاستوري.');
      return;
    }

    // Start video recording with cameraRef
    if (cameraRef.current) {
      try {
        setIsRecording(true);

        // Start Head Card Roulette Spin while recording!
        startRouletteSpin();

        const videoRecordPromise = cameraRef.current.recordAsync({
          maxDuration: 60,
          quality: '720p',
        });

        // Store promise to resolve on stop
        videoRecordPromise
          .then((data: any) => {
            if (data?.uri) {
              setRecordedVideoUri(data.uri);
              setShowShareModal(true);
            }
          })
          .catch((err: any) => {
            console.error('Camera recording error:', err);
          });
      } catch (err) {
        console.error(err);
        setIsRecording(false);
      }
    } else {
      // Fallback simulation mode if camera hardware preview is not active
      setIsRecording(true);
      startRouletteSpin();
    }
  };

  // Stop Recording Video
  const handleStopStoryRecording = async () => {
    setIsRecording(false);
    if (cameraRef.current) {
      try {
        cameraRef.current.stopRecording();
      } catch (err) {
        console.error(err);
      }
    } else {
      // Simulation mode modal fallback
      setRecordedVideoUri('simulation');
      setShowShareModal(true);
    }
  };

  // Share to Instagram Story / Facebook Story / Social media
  const handleShareToStory = async () => {
    try {
      if (recordedVideoUri && recordedVideoUri !== 'simulation') {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(recordedVideoUri, {
            mimeType: 'video/mp4',
            dialogTitle: 'مشاركة التلاوة في ستوري إنستغرام أو فيسبوك 📸',
          });
        } else {
          Alert.alert('تنبيه', 'المشاركة غير متاحة على هذا الجهاز حالياً.');
        }
      } else {
        // Fallback info modal
        Alert.alert(
          'جاهز للمشاركة! 🚀',
          'يمكنك رفع مقطع الفيديو المسجل مباشرة إلى ستوري إنستغرام أو فيسبوك أو تيك توك!'
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCameraFacing = () => {
    setFacing(prev => (prev === 'front' ? 'back' : 'front'));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeDisplayAyah = selectedAyah || SPINNING_AYAH_LIST[spinIndex];

  return (
    <View style={styles.container}>
      {/* CAMERA VIEWFINDER */}
      {cameraPermission?.granted ? (
        <CameraView
          ref={cameraRef}
          style={styles.cameraView}
          facing={facing}
          mode="video"
        >
          {/* CAMERA OVERLAY CONTENT */}
          <View style={styles.cameraOverlay}>
            {/* TOP BAR */}
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.headerBackBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M5 12h14" />
                  <Path d="M12 5l7 7-7 7" />
                </Svg>
              </TouchableOpacity>

              {/* Title Badge */}
              <View style={styles.filterTitleBadge}>
                <Text style={styles.filterTitleText}>📸 فلتر أكمل الآية (Instagram Reel)</Text>
              </View>

              <TouchableOpacity style={styles.headerFlipBtn} onPress={toggleCameraFacing}>
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8" />
                  <Path d="M4 14c0 4.4 3.6 8 8 8s8-3.6 8-8" />
                  <Path d="M20 6l3 4h-4" />
                  <Path d="M4 18l-3-4h4" />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* INSTAGRAM AR FILTER HEAD CARD (POSITIONED DIRECTLY OVER USER'S HEAD) */}
            <View style={styles.headFilterWrapper}>
              <Animated.View
                style={[
                  styles.arHeadCard,
                  {
                    transform: [
                      { scale: Animated.multiply(pulseAnim, cardScale) },
                    ],
                  },
                  isSpinning && styles.arHeadCardSpinning,
                  selectedAyah && styles.arHeadCardLocked,
                ]}
              >
                {/* Crown & Filter Header */}
                <View style={styles.arCardCrownRow}>
                  <Text style={styles.arCrownEmoji}>👑</Text>
                  <Text style={styles.arCrownText}>
                    {isSpinning ? 'جاري تدوير الآية... 🎲' : selectedAyah ? 'أكمل تلاوة الآية 📖' : 'تحدي تلاوة الآيات'}
                  </Text>
                </View>

                {/* Surah Name & Ayah Number */}
                <View style={styles.arSurahHeader}>
                  <Text style={styles.arSurahName}>{activeDisplayAyah.surahName}</Text>
                  <Text style={styles.arAyahNum}>الآية {activeDisplayAyah.ayahNumber}</Text>
                </View>

                {/* Main Incomplete Verse Box */}
                <View style={styles.arAyahPromptBox}>
                  <Text style={styles.arAyahPromptText}>
                    {activeDisplayAyah.promptText}
                  </Text>
                </View>

                {/* Status Footer */}
                <View style={styles.arFooterNote}>
                  <Text style={styles.arFooterNoteText}>
                    {isSpinning
                      ? '⚡ يدور الفلتر لاختيار آية عشوائية...'
                      : selectedAyah
                      ? '🎙️ انظر للكاميرا ورتل التكملة بصوتك العذب!'
                      : 'اضغط على زر التسجيل لتدوير الآية وتسجيل الاستوري'}
                  </Text>
                </View>
              </Animated.View>

              {/* Anchor pointer triangle below the head card */}
              <View style={styles.arAnchorPointer} />
            </View>

            {/* RECORDING LIVE COUNTER BADGE */}
            {isRecording && (
              <View style={styles.liveRecordingBadge}>
                <View style={styles.redPulseDot} />
                <Text style={styles.liveRecordingTimerText}>
                  جاري تسجيل الاستوري: {formatTime(recordingDuration)}
                </Text>
              </View>
            )}

            {/* BOTTOM SHUTTER / RECORDING CONTROLS */}
            <View style={styles.bottomControlsContainer}>
              {/* Manual Spin / Shuffle Button */}
              <TouchableOpacity
                style={styles.sideSpinBtn}
                onPress={() => startRouletteSpin()}
                disabled={isSpinning}
                activeOpacity={0.8}
              >
                <Text style={styles.sideSpinIcon}>🎲</Text>
                <Text style={styles.sideSpinText}>تدوير آية</Text>
              </TouchableOpacity>

              {/* Main Shutter Record Button */}
              {!isRecording ? (
                <TouchableOpacity
                  style={styles.mainStartShutterBtn}
                  onPress={handleStartStoryRecording}
                  activeOpacity={0.85}
                >
                  <View style={styles.mainStartShutterInner}>
                    <Text style={styles.mainStartShutterIcon}>🎥</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.mainStopShutterBtn}
                  onPress={handleStopStoryRecording}
                  activeOpacity={0.85}
                >
                  <View style={styles.mainStopShutterSquare} />
                </TouchableOpacity>
              )}

              {/* Share directly info button */}
              <TouchableOpacity
                style={styles.sideShareBtn}
                onPress={() => {
                  if (recordedVideoUri) {
                    setShowShareModal(true);
                  } else {
                    Alert.alert('تأطير الاستوري', 'سجل مقطعك أولاً لتدوير الآية ومشاركتها في الاستوري!');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.sideShareIcon}>📸</Text>
                <Text style={styles.sideShareText}>مشاركة</Text>
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      ) : (
        /* CAMERA PERMISSIONS PROMPT */
        <View style={styles.permissionScreen}>
          <View style={styles.permissionBox}>
            <Text style={styles.permissionEmoji}>📸🎥</Text>
            <Text style={styles.permissionHeader}>فلتر تدوير الآيات فوق الرأس</Text>
            <Text style={styles.permissionSubtitle}>
              يرجى السماح بالكاميرا والميكروفون لتشغيل بطاقات الآيات المتدوّرة فوق رأسك وتسجيل تلاوتك لمشاركتها في ستوري إنستغرام وفيسبوك!
            </Text>

            <TouchableOpacity
              style={styles.grantCameraBtn}
              onPress={requestCameraPermission}
              activeOpacity={0.85}
            >
              <Text style={styles.grantCameraBtnText}>تفعيل الكاميرا 📹</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButtonSimple}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonSimpleText}>الرجوع</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* INSTANT SOCIAL STORY SHARE MODAL */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View style={styles.shareModalCard}>
            <Text style={styles.shareModalEmoji}>🎉📸</Text>
            <Text style={styles.shareModalTitle}>جاهز للمشاركة في الاستوري!</Text>
            <Text style={styles.shareModalSub}>
              تم تسجيل فيديو تدوير الآيات وتلاوتك بنجاح. شارك مقطعك المميز الآن مع أصدقائك!
            </Text>

            {/* Share to Instagram Story Button */}
            <TouchableOpacity
              style={styles.instagramShareBtn}
              onPress={handleShareToStory}
              activeOpacity={0.85}
            >
              <Text style={styles.instagramShareIcon}>📸</Text>
              <Text style={styles.instagramShareText}>مشاركة في ستوري Instagram / Facebook</Text>
            </TouchableOpacity>

            {/* Spin again / New Story Button */}
            <TouchableOpacity
              style={styles.spinAgainBtn}
              onPress={() => {
                setShowShareModal(false);
                startRouletteSpin();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.spinAgainText}>🔄 تسجيل استوري جديد (آية جديدة)</Text>
            </TouchableOpacity>

            {/* Close Modal */}
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowShareModal(false)}
            >
              <Text style={styles.closeModalText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000000',
    },
    cameraView: {
      flex: 1,
    },
    cameraOverlay: {
      flex: 1,
      justifyContent: 'space-between',
      paddingTop: 12,
      paddingBottom: 40,
      paddingHorizontal: 20,
    },

    /* TOP BAR Navigation */
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 10,
    },
    headerBackBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    filterTitleBadge: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.5)',
    },
    filterTitleText: {
      fontSize: 12,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#F59E0B',
    },
    headerFlipBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },

    /* INSTAGRAM AR FILTER HEAD CARD OVER USER'S HEAD */
    headFilterWrapper: {
      alignItems: 'center',
      marginTop: 24,
      zIndex: 5,
    },
    arHeadCard: {
      width: width * 0.88,
      backgroundColor: 'rgba(15, 23, 42, 0.94)',
      borderRadius: 24,
      padding: 18,
      alignItems: 'center',
      borderWidth: 2.5,
      borderColor: '#F59E0B',
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 12,
    },
    arHeadCardSpinning: {
      borderColor: '#3B82F6',
      shadowColor: '#3B82F6',
    },
    arHeadCardLocked: {
      borderColor: '#10B981',
      shadowColor: '#10B981',
    },
    arCardCrownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#F59E0B',
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 10,
    },
    arCrownEmoji: {
      fontSize: 14,
    },
    arCrownText: {
      fontSize: 12,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#0F172A',
    },
    arSurahHeader: {
      alignItems: 'center',
      marginBottom: 8,
    },
    arSurahName: {
      fontSize: 17,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#10B981',
    },
    arAyahNum: {
      fontSize: 11,
      fontFamily: 'IBMPlexSansArabic-Regular',
      color: '#94A3B8',
    },
    arAyahPromptBox: {
      width: '100%',
      backgroundColor: 'rgba(2, 44, 34, 0.75)',
      paddingVertical: 16,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.4)',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 84,
      marginVertical: 6,
    },
    arAyahPromptText: {
      fontSize: 20,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#FFFFFF',
      textAlign: 'center',
      lineHeight: 30,
    },
    arFooterNote: {
      marginTop: 4,
    },
    arFooterNoteText: {
      fontSize: 11,
      fontFamily: 'IBMPlexSansArabic-Medium',
      color: '#CBD5E1',
      textAlign: 'center',
    },
    arAnchorPointer: {
      width: 0,
      height: 0,
      borderLeftWidth: 12,
      borderRightWidth: 12,
      borderTopWidth: 14,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      borderTopColor: '#F59E0B',
      marginTop: -2,
    },

    /* LIVE RECORDING BADGE */
    liveRecordingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: 'rgba(220, 38, 38, 0.95)',
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 8,
    },
    redPulseDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FFFFFF',
    },
    liveRecordingTimerText: {
      fontSize: 14,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#FFFFFF',
    },

    /* BOTTOM CONTROLS */
    bottomControlsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 10,
    },
    sideSpinBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(30, 41, 59, 0.85)',
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    sideSpinIcon: {
      fontSize: 22,
    },
    sideSpinText: {
      fontSize: 10,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#FFFFFF',
      marginTop: 2,
    },

    mainStartShutterBtn: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 4,
      borderColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 4,
    },
    mainStartShutterInner: {
      width: '100%',
      height: '100%',
      borderRadius: 36,
      backgroundColor: '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
    },
    mainStartShutterIcon: {
      fontSize: 24,
    },

    mainStopShutterBtn: {
      width: 84,
      height: 84,
      borderRadius: 42,
      borderWidth: 4,
      borderColor: '#EF4444',
      justifyContent: 'center',
      alignItems: 'center',
    },
    mainStopShutterSquare: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: '#EF4444',
    },

    sideShareBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(30, 41, 59, 0.85)',
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    sideShareIcon: {
      fontSize: 22,
    },
    sideShareText: {
      fontSize: 10,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#FFFFFF',
      marginTop: 2,
    },

    /* PERMISSION PROMPT SCREEN */
    permissionScreen: {
      flex: 1,
      backgroundColor: '#0F172A',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    permissionBox: {
      backgroundColor: '#1E293B',
      borderRadius: 24,
      padding: 28,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      width: '100%',
    },
    permissionEmoji: {
      fontSize: 54,
      marginBottom: 16,
    },
    permissionHeader: {
      fontSize: 20,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 10,
    },
    permissionSubtitle: {
      fontSize: 14,
      fontFamily: 'IBMPlexSansArabic-Regular',
      color: '#94A3B8',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 24,
    },
    grantCameraBtn: {
      backgroundColor: '#10B981',
      paddingHorizontal: 24,
      paddingVertical: 14,
      borderRadius: 16,
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
    },
    grantCameraBtnText: {
      fontSize: 15,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#FFFFFF',
    },
    backButtonSimple: {
      paddingVertical: 10,
    },
    backButtonSimpleText: {
      fontSize: 13,
      fontFamily: 'IBMPlexSansArabic-Medium',
      color: '#64748B',
    },

    /* STORY SHARE MODAL */
    shareModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    shareModalCard: {
      width: '100%',
      backgroundColor: '#1E293B',
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#F59E0B',
    },
    shareModalEmoji: {
      fontSize: 48,
      marginBottom: 8,
    },
    shareModalTitle: {
      fontSize: 19,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#FFFFFF',
      marginBottom: 6,
      textAlign: 'center',
    },
    shareModalSub: {
      fontSize: 13,
      fontFamily: 'IBMPlexSansArabic-Regular',
      color: '#CBD5E1',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    instagramShareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#E1306C',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 16,
      width: '100%',
      gap: 10,
      marginBottom: 12,
    },
    instagramShareIcon: {
      fontSize: 20,
    },
    instagramShareText: {
      fontSize: 14,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#FFFFFF',
    },
    spinAgainBtn: {
      backgroundColor: '#044E3F',
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 16,
      width: '100%',
      alignItems: 'center',
      marginBottom: 12,
    },
    spinAgainText: {
      fontSize: 13,
      fontFamily: 'IBMPlexSansArabic-Bold',
      color: '#FFFFFF',
    },
    closeModalBtn: {
      paddingVertical: 8,
    },
    closeModalText: {
      fontSize: 13,
      fontFamily: 'IBMPlexSansArabic-Medium',
      color: '#64748B',
    },
  });
