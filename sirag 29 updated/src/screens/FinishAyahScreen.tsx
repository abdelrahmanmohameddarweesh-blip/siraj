import CinematicQuestBanner from '../components/CinematicQuestBanner';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { saveUserScore, addSirajPoints, incrementCorrectAnswers } from '../firebase/auth';
import AdBanner from '../components/AdBanner';

interface AyahChallengeQuestion {
  id: string;
  surahName: string;
  surahNameEn: string;
  ayahNumber: number;
  juzNumber: number;
  promptText: string; // The start of the ayah
  correctCompletion: string; // The correct rest of the ayah
  options: string[]; // 4 options for finishing the ayah
  difficulty: 'easy' | 'medium' | 'hard';
}

const AYAH_QUESTIONS: AyahChallengeQuestion[] = [
  {
    id: 'q1',
    surahName: 'سورة الفاتحة',
    surahNameEn: 'Al-Fatiha',
    ayahNumber: 6,
    juzNumber: 1,
    promptText: '﴿ اهْدِنَا الصِّرَاطَ... ﴾',
    correctCompletion: 'الْمُسْتَقِيمَ',
    options: ['الْمُسْتَقِيمَ', 'الْعَظِيمَ', 'الْكَرِيمَ', 'الْعَلِيمَ'],
    difficulty: 'easy',
  },
  {
    id: 'q2',
    surahName: 'سورة الملك',
    surahNameEn: 'Al-Mulk',
    ayahNumber: 1,
    juzNumber: 29,
    promptText: '﴿ تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ... ﴾',
    correctCompletion: 'وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
    options: [
      'وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ',
      'وَهُوَ الْعَزِيزُ الْغَفُورُ',
      'وَهُوَ السَّمِيعُ الْبَصِيرُ',
      'وَهُوَ الْعَلِيمُ الْحَكِيمُ',
    ],
    difficulty: 'easy',
  },
  {
    id: 'q3',
    surahName: 'سورة النبأ',
    surahNameEn: 'An-Naba',
    ayahNumber: 1,
    juzNumber: 30,
    promptText: '﴿ عَمَّ يَتَسَاءَلُونَ * عَنِ... ﴾',
    correctCompletion: 'النَّبَإِ الْعَظِيمِ',
    options: ['النَّبَإِ الْعَظِيمِ', 'الْيَوْمِ الْمَوْعُودِ', 'الْقَارِعَةِ الْكُبْرَى', 'السَّاعَةِ الآتِيَةِ'],
    difficulty: 'easy',
  },
  {
    id: 'q4',
    surahName: 'سورة الكهف',
    surahNameEn: 'Al-Kahf',
    ayahNumber: 10,
    juzNumber: 15,
    promptText: '﴿ إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ فَقَالُوا رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً... ﴾',
    correctCompletion: 'وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا',
    options: [
      'وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا',
      'وَاغْفِرْ لَنَا وَارْحَمْنَا وَأَنتَ خَيْرُ الرَّاحِمِينَ',
      'وَاجْعَل لَّنَا مِن لَّدُنكَ وَلِيًّا',
      'وَاهْدِنَا صِرَاطًا مُّسْتَقِيمًا',
    ],
    difficulty: 'medium',
  },
  {
    id: 'q5',
    surahName: 'سورة يس',
    surahNameEn: 'Yasin',
    ayahNumber: 12,
    juzNumber: 22,
    promptText: '﴿ إِنَّا نَحْنُ نُحْيِي الْمَوْتَىٰ وَنَكْتُبُ مَا قَدَّمُوا وَآثَارَهُمْ ۚ وَكُلَّ شَيْءٍ أَحْصَيْنَاهُ... ﴾',
    correctCompletion: 'فِي إِمَامٍ مُّبِينٍ',
    options: ['فِي إِمَامٍ مُّبِينٍ', 'فِي كِتَابٍ مَّكْنُونٍ', 'فِي لَوْحٍ مَّحْفُوظٍ', 'فِي زُبُرِ الأَوَّلِينَ'],
    difficulty: 'medium',
  },
  {
    id: 'q6',
    surahName: 'سورة الرحمن',
    surahNameEn: 'Ar-Rahman',
    ayahNumber: 60,
    juzNumber: 27,
    promptText: '﴿ هَلْ جَزَاءُ الإِحْسَانِ... ﴾',
    correctCompletion: 'إِلَّا الإِحْسَانُ',
    options: ['إِلَّا الإِحْسَانُ', 'إِلَّا الْغُفْرَانُ', 'إِلَّا الْجَنَّةُ', 'إِلَّا التَّوْفِيقُ'],
    difficulty: 'easy',
  },
  {
    id: 'q7',
    surahName: 'سورة البقرة',
    surahNameEn: 'Al-Baqarah',
    ayahNumber: 255,
    juzNumber: 3,
    promptText: '﴿ اللَّهُ لا إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ ۚ لاَ تَأْخُذُهُ سِنَةٌ وَلاَ نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلاَّ بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلاَ يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلاَّ بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالأَرْضَ ۖ... ﴾',
    correctCompletion: 'وَلاَ يَؤُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
    options: [
      'وَلاَ يَؤُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
      'وَهُوَ السَّمِيعُ الْعَلِيمُ',
      'وَهُوَ الْغَفُورُ الرَّحِيمُ',
      'وَهُوَ الْعَزِيزُ الْحَكِيمُ',
    ],
    difficulty: 'medium',
  },
  {
    id: 'q8',
    surahName: 'سورة الإخلاص',
    surahNameEn: 'Al-Ikhlas',
    ayahNumber: 3,
    juzNumber: 30,
    promptText: '﴿ لَمْ يَلِدْ... ﴾',
    correctCompletion: 'وَلَمْ يُولَدْ',
    options: ['وَلَمْ يُولَدْ', 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', 'وَلَمْ يَكُن لَّهُ شَرِيكٌ', 'وَلَمْ يَتَّخِذْ وَلَدًا'],
    difficulty: 'easy',
  },
  {
    id: 'q9',
    surahName: 'سورة آل عمران',
    surahNameEn: "Ali 'Imran",
    ayahNumber: 103,
    juzNumber: 4,
    promptText: '﴿ وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا... ﴾',
    correctCompletion: 'وَلاَ تَفَرَّقُوا',
    options: ['وَلاَ تَفَرَّقُوا', 'وَاذْكُرُوا نِعْمَتَ اللَّهِ', 'وَأَطِيعُوا اللَّهَ وَرَسُولَهُ', 'وَاتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ'],
    difficulty: 'medium',
  },
  {
    id: 'q10',
    surahName: 'سورة العصر',
    surahNameEn: 'Al-Asr',
    ayahNumber: 2,
    juzNumber: 30,
    promptText: '﴿ إِنَّ الإِنسَانَ لَفِي... ﴾',
    correctCompletion: 'خُسْرٍ',
    options: ['خُسْرٍ', 'نَعِيمٍ', 'ضَلاَلٍ', 'عَذَابٍ'],
    difficulty: 'easy',
  },
  {
    id: 'q11',
    surahName: 'سورة الحشر',
    surahNameEn: 'Al-Hashr',
    ayahNumber: 21,
    juzNumber: 28,
    promptText: '﴿ لَوْ أَنزَلْنَا هَذَا الْقُرْآنَ عَلَى جَبَلٍ لَّرَأَيْتَهُ خَاشِعًا مُّتَصَدِّعًا مِّنْ... ﴾',
    correctCompletion: 'خَشْيَةِ اللَّهِ',
    options: ['خَشْيَةِ اللَّهِ', 'أَمْرِ اللَّهِ', 'رَحْمَةِ اللَّهِ', 'عَذَابِ اللَّهِ'],
    difficulty: 'medium',
  },
  {
    id: 'q12',
    surahName: 'سورة الفرقان',
    surahNameEn: 'Al-Furqan',
    ayahNumber: 63,
    juzNumber: 19,
    promptText: '﴿ وَعِبَادُ الرَّحْمَنِ الَّذِينَ يَمْشُونَ عَلَى الأَرْضِ هَوْنًا وَإِذَا خَاطَبَهُمُ الْجَاهِلُونَ قَالُوا... ﴾',
    correctCompletion: 'سَلامًا',
    options: ['سَلامًا', 'خَيْرًا', 'حَقًّا', 'صَبْرًا'],
    difficulty: 'hard',
  },
  {
    id: 'q13',
    surahName: 'سورة مريم',
    surahNameEn: 'Maryam',
    ayahNumber: 96,
    juzNumber: 16,
    promptText: '﴿ إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ سَيَجْعَلُ لَهُمُ الرَّحْمَنُ... ﴾',
    correctCompletion: 'وُدًّا',
    options: ['وُدًّا', 'أَجْرًا', 'نُورًا', 'مَقَامًا'],
    difficulty: 'hard',
  },
  {
    id: 'q14',
    surahName: 'سورة النجم',
    surahNameEn: 'An-Najm',
    ayahNumber: 39,
    juzNumber: 27,
    promptText: '﴿ وَأَن لَّيْسَ لِلإِنسَانِ إِلاَّ... ﴾',
    correctCompletion: 'مَا سَعَى',
    options: ['مَا سَعَى', 'مَا عَمِلَ', 'مَا كَسَبَ', 'مَا قَدَّمَ'],
    difficulty: 'easy',
  },
  {
    id: 'q15',
    surahName: 'سورة الزمر',
    surahNameEn: 'Az-Zumar',
    ayahNumber: 53,
    juzNumber: 24,
    promptText: '﴿ قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَى أَنفُسِهِمْ لا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا ۚ إِنَّهُ هُوَ... ﴾',
    correctCompletion: 'الْغَفُورُ الرَّحِيمُ',
    options: [
      'الْغَفُورُ الرَّحِيمُ',
      'التَّوَّابُ الرَّحِيمُ',
      'الْعَزِيزُ الْحَكِيمُ',
      'الْعَلِيُّ الْعَظِيمُ',
    ],
    difficulty: 'medium',
  },
];

export default function FinishAyahScreen({ navigation }: any) {
  const { user, updateUserFields } = useAuth();
  const { colors } = useTheme();
  const { language, backArrow } = useLanguage();
  const styles = getStyles(colors);

  // Lobby States
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'ended'>('lobby');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [questionLimit, setQuestionLimit] = useState<number>(10);

  // Active Game States
  const [questions, setQuestions] = useState<AyahChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [unlockedTitle, setUnlockedTitle] = useState<any | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);

  // Sound/Audio Simulation state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const currentQuestion = questions[currentIndex];

  const handleStartGame = () => {
    let filtered = AYAH_QUESTIONS.filter(q => q.difficulty === difficulty);
    if (filtered.length < questionLimit) {
      filtered = [...AYAH_QUESTIONS];
    }
    // Shuffle array
    const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, questionLimit);

    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setGameState('playing');
  };

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);

    const isCorrect = option === currentQuestion.correctCompletion;
    if (isCorrect) {
      const newScore = score + 10;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
    } else {
      setStreak(0);
    }

    // Delay before auto-advancing to next question or ending
    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setIsPlayingAudio(false);
      } else {
        handleEndGame(isCorrect ? score + 10 : score);
      }
    }, 1400);
  };

  const handleEndGame = async (finalScore: number) => {
    setGameState('ended');
    const correctAnswersCount = Math.floor(finalScore / 10);
    const lanternsEarned = Math.floor(finalScore / 20);

    if (user?.uid) {
      try {
        await saveUserScore(user.uid, finalScore);
        if (lanternsEarned > 0) {
          await addSirajPoints(user.uid, lanternsEarned);
        }
        if (correctAnswersCount > 0) {
          const updatedUser = await incrementCorrectAnswers(user.uid, 'quran', correctAnswersCount);
          if (updatedUser?.unlockedTitles?.includes('title_hafidh')) {
            setUnlockedTitle('الحافظ المتقن 👑');
            setShowUnlockModal(true);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleAudioSim = () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  return (
    <View style={styles.container}>
      {/* Arabic RTL Icon-Only Back Button Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backBtnIcon}>{backArrow}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {language === 'ar' ? 'تحدي إكمال الآية 📖' : 'Finish the Ayah 📖'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* LOBBY SCREEN */}
      {gameState === 'lobby' && (
        <ScrollView contentContainerStyle={styles.lobbyScroll} showsVerticalScrollIndicator={false}>
          <CinematicQuestBanner chapter={13} icon="📖" titleAr="أكمل الآية" titleEn="Finish the Ayah" descriptionAr="تذكر الآيات وأكمل التحدي خطوة بخطوة" descriptionEn="Recall the verses and progress one step at a time" compact />
          {/* Yahya Raaby Challenge Banner */}
          <View style={styles.heroCard}>
            <View style={styles.heroAvatarBg}>
              <Text style={{ fontSize: 36 }}>🎙️</Text>
            </View>
            <Text style={styles.heroTitle}>
              {language === 'ar' ? 'تحدي "أكمل الآية" 🎯' : 'Finish the Ayah Challenge 🎯'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {language === 'ar'
                ? 'استمع إلى بداية الآية القرآنية أو اقرأها، واختبر سرعتك ودقة حفظك لإكمال نهايتها الصحيحة!'
                : 'Test your Quranic memorization speed by finishing the correct ending of each Ayah!'}
            </Text>
            <View style={styles.sheikhQuoteBox}>
              <Text style={styles.sheikhQuoteText}>
                {language === 'ar'
                  ? 'قال رسول الله ﷺ: «يُقَالُ لِصَاحِبِ الْقُرْآنِ: اقْرَأْ وَارْتَقِ وَرَتِّلْ كَمَا كُنْتَ تُرَتِّلُ فِي الدُّنْيَا»'
                  : 'Recite and ascend through the noble verses of the Glorious Quran.'}
              </Text>
            </View>
          </View>

          {/* Difficulty Selector */}
          <Text style={styles.sectionLabel}>
            {language === 'ar' ? 'اختر مستوى التحدي:' : 'Select Difficulty:'}
          </Text>
          <View style={styles.diffRow}>
            {[
              { id: 'easy', labelAr: '🟢 مبتدئ', labelEn: '🟢 Easy' },
              { id: 'medium', labelAr: '🟡 متوسط', labelEn: '🟡 Medium' },
              { id: 'hard', labelAr: '🔴 محترف', labelEn: '🔴 Hard' },
            ].map(d => (
              <TouchableOpacity
                key={d.id}
                style={[styles.diffBtn, difficulty === d.id && styles.diffBtnActive]}
                onPress={() => setDifficulty(d.id as any)}
                activeOpacity={0.8}
              >
                <Text style={[styles.diffBtnText, difficulty === d.id && styles.diffBtnTextActive]}>
                  {language === 'ar' ? d.labelAr : d.labelEn}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Questions Count Selector */}
          <Text style={styles.sectionLabel}>
            {language === 'ar' ? 'عدد أسئلة التحدي:' : 'Question Count:'}
          </Text>
          <View style={styles.countRow}>
            {[5, 10, 15, 20].map(count => (
              <TouchableOpacity
                key={count}
                style={[styles.countBtn, questionLimit === count && styles.countBtnActive]}
                onPress={() => setQuestionLimit(count)}
                activeOpacity={0.8}
              >
                <Text style={[styles.countBtnText, questionLimit === count && styles.countBtnTextActive]}>
                  {count} {language === 'ar' ? 'أسئلة' : 'Q'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Start Challenge CTA Button */}
          <TouchableOpacity style={styles.startBtn} onPress={handleStartGame} activeOpacity={0.85}>
            <Text style={styles.startBtnText}>
              {language === 'ar' ? 'ابدأ تحدي إكمال الآية 🚀' : 'Start Challenge 🚀'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* GAMEPLAY SCREEN */}
      {gameState === 'playing' && currentQuestion && (
        <ScrollView contentContainerStyle={styles.gameScroll} showsVerticalScrollIndicator={false}>
          {/* Progress Header */}
          <View style={styles.progressHeaderRow}>
            <View style={styles.questionCounterBadge}>
              <Text style={styles.questionCounterText}>
                {currentIndex + 1} / {questions.length}
              </Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakBadgeText}>🔥 {streak} {language === 'ar' ? 'متتالي' : 'Streak'}</Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>⭐ {score} {language === 'ar' ? 'نقطة' : 'pts'}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
          </View>

          {/* Question Card */}
          <View style={styles.questionCard}>
            <View style={styles.surahMetaRow}>
              <Text style={styles.surahTag}>
                {currentQuestion.surahName} (الآية {currentQuestion.ayahNumber})
              </Text>
              <Text style={styles.juzTag}>الجزء {currentQuestion.juzNumber}</Text>
            </View>

            {/* Audio Recitation Sim */}
            <TouchableOpacity style={styles.audioSimBtn} onPress={toggleAudioSim} activeOpacity={0.8}>
              <Text style={{ fontSize: 20 }}>{isPlayingAudio ? '🔊' : '🎧'}</Text>
              <Text style={styles.audioSimText}>
                {isPlayingAudio ? (language === 'ar' ? 'جاري استماع التلاوة...' : 'Playing Recitation...') : (language === 'ar' ? 'استمع إلى المقطع الصوتي' : 'Listen to Ayah Audio')}
              </Text>
            </TouchableOpacity>

            {/* Ayah Prompt Text */}
            <Text style={styles.promptAyahText}>{currentQuestion.promptText}</Text>
            <Text style={styles.promptInstruction}>
              {language === 'ar' ? 'أكمل الآية بالاختيار الصحيح:' : 'Complete the Ayah correctly:'}
            </Text>
          </View>

          {/* Options Grid */}
          <View style={styles.optionsList}>
            {currentQuestion.options.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrectOpt = opt === currentQuestion.correctCompletion;

              let btnStyle = styles.optionBtnDefault;
              let txtStyle = styles.optionTextDefault;

              if (isAnswered) {
                if (isCorrectOpt) {
                  btnStyle = styles.optionBtnCorrect;
                  txtStyle = styles.optionTextCorrect;
                } else if (isSelected) {
                  btnStyle = styles.optionBtnWrong;
                  txtStyle = styles.optionTextWrong;
                }
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.optionBtnBase, btnStyle]}
                  onPress={() => handleSelectOption(opt)}
                  disabled={isAnswered}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionTextBase, txtStyle]}>{opt}</Text>
                  {isAnswered && isCorrectOpt && <Text style={{ fontSize: 18, color: '#FFFFFF' }}>✓</Text>}
                  {isAnswered && isSelected && !isCorrectOpt && <Text style={{ fontSize: 18, color: '#FFFFFF' }}>✕</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* GAME OVER SCREEN */}
      {gameState === 'ended' && (
        <ScrollView contentContainerStyle={styles.endedScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.endedCard}>
            <Text style={{ fontSize: 54, marginBottom: 8 }}>🏆</Text>
            <Text style={styles.endedTitle}>
              {language === 'ar' ? 'ممتاز! اكتمل التحدي' : 'Challenge Completed!'}
            </Text>
            <Text style={styles.endedSubtitle}>
              {language === 'ar'
                ? 'أداء إيماني مبارك ومتميز في تثبيت الحفظ وإكمال الآيات الشريفة.'
                : 'Outstanding performance in completing the noble Quranic verses!'}
            </Text>

            <View style={styles.endedStatsRow}>
              <View style={styles.endedStatBox}>
                <Text style={styles.endedStatVal}>{score}</Text>
                <Text style={styles.endedStatLbl}>{language === 'ar' ? 'مجموع النقاط' : 'Score'}</Text>
              </View>
              <View style={styles.endedStatBox}>
                <Text style={styles.endedStatVal}>{maxStreak}</Text>
                <Text style={styles.endedStatLbl}>{language === 'ar' ? 'أعلى تتابع' : 'Max Streak'}</Text>
              </View>
              <View style={styles.endedStatBox}>
                <Text style={styles.endedStatVal}>+{Math.floor(score / 10)} 🕯️</Text>
                <Text style={styles.endedStatLbl}>{language === 'ar' ? 'قناديل السراج' : 'Siraj Earned'}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.startBtn} onPress={handleStartGame} activeOpacity={0.85}>
              <Text style={styles.startBtnText}>
                {language === 'ar' ? 'إعادة التحدي 🔄' : 'Try Again 🔄'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>
                {language === 'ar' ? 'العودة للرئيسية 🏠' : 'Back to Home 🏠'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* UNLOCKED TITLE POPUP MODAL */}
      {showUnlockModal && unlockedTitle && (
        <Modal animationType="fade" transparent={true} visible={showUnlockModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>👑</Text>
              <Text style={styles.modalTitle}>
                {language === 'ar' ? 'مبارك! حصلت على لقب جديد' : 'New Title Unlocked!'}
              </Text>
              <Text style={styles.modalBadgeText}>{unlockedTitle.titleAr}</Text>
              <Text style={styles.modalDescText}>{unlockedTitle.descAr}</Text>

              <TouchableOpacity
                style={styles.modalEquipBtn}
                onPress={() => {
                  setShowUnlockModal(false);
                  Alert.alert(
                    language === 'ar' ? 'تم التجهيز!' : 'Equipped!',
                    language === 'ar' ? 'تم تجهيز لقبك الجديد بنجاح.' : 'Title equipped successfully.'
                  );
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modalEquipBtnText}>
                  {language === 'ar' ? 'تجهيز اللقب فوراً ⚔️' : 'Equip Title Now ⚔️'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.adWrapper}>
        <AdBanner />
      </View>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 12,
    },
    topHeader: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    backBtnIcon: {
      fontSize: 18,
      color: colors.textPrimary,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    lobbyScroll: {
      padding: 20,
      paddingBottom: 40,
    },
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    heroAvatarBg: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.primaryTint,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    heroTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: colors.primaryDeep,
      fontFamily: 'IBMPlexSansArabic-Bold',
      marginBottom: 6,
    },
    heroSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 14,
      fontFamily: 'IBMPlexSansArabic-Regular',
    },
    sheikhQuoteBox: {
      backgroundColor: colors.neutralTint,
      borderRadius: 12,
      padding: 12,
      width: '100%',
    },
    sheikhQuoteText: {
      fontSize: 11,
      color: colors.textPrimary,
      textAlign: 'center',
      fontStyle: 'italic',
      lineHeight: 16,
      fontFamily: 'IBMPlexSansArabic-Medium',
    },
    sectionLabel: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'right',
      marginBottom: 10,
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    diffRow: {
      flexDirection: 'row-reverse',
      gap: 10,
      marginBottom: 20,
    },
    diffBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
    },
    diffBtnActive: {
      backgroundColor: colors.primaryTint,
      borderColor: colors.primary,
    },
    diffBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'IBMPlexSansArabic-SemiBold',
    },
    diffBtnTextActive: {
      color: colors.primaryDeep,
      fontWeight: '700',
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    countRow: {
      flexDirection: 'row-reverse',
      gap: 10,
      marginBottom: 24,
    },
    countBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
    },
    countBtnActive: {
      backgroundColor: colors.primaryDeep,
      borderColor: colors.primaryDeep,
    },
    countBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'IBMPlexSansArabic-SemiBold',
    },
    countBtnTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    startBtn: {
      backgroundColor: colors.primaryDeep,
      paddingVertical: 15,
      borderRadius: 16,
      alignItems: 'center',
      shadowColor: colors.primaryDeep,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    startBtnText: {
      fontSize: 14.5,
      fontWeight: '700',
      color: '#FFFFFF',
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    gameScroll: {
      padding: 20,
      paddingBottom: 40,
    },
    progressHeaderRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    questionCounterBadge: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    questionCounterText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    streakBadge: {
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    streakBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#D97706',
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    scoreBadge: {
      backgroundColor: colors.primaryTint,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    scoreBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryDeep,
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    progressBarBg: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 20,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    questionCard: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    surahMetaRow: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    surahTag: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryDeep,
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    juzTag: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'IBMPlexSansArabic-Regular',
    },
    audioSimBtn: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.neutralTint,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 8,
      marginBottom: 16,
    },
    audioSimText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.textPrimary,
      fontFamily: 'IBMPlexSansArabic-SemiBold',
    },
    promptAyahText: {
      fontSize: 19,
      fontWeight: '700',
      color: colors.primaryDeep,
      textAlign: 'center',
      lineHeight: 32,
      marginBottom: 14,
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    promptInstruction: {
      fontSize: 11.5,
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'IBMPlexSansArabic-Regular',
    },
    optionsList: {
      gap: 12,
    },
    optionBtnBase: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 15,
      borderRadius: 16,
      borderWidth: 1.5,
    },
    optionBtnDefault: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    optionBtnCorrect: {
      backgroundColor: '#10B981',
      borderColor: '#10B981',
    },
    optionBtnWrong: {
      backgroundColor: '#EF4444',
      borderColor: '#EF4444',
    },
    optionTextBase: {
      fontSize: 14,
      fontFamily: 'IBMPlexSansArabic-SemiBold',
      flex: 1,
      textAlign: 'right',
    },
    optionTextDefault: {
      color: colors.textPrimary,
    },
    optionTextCorrect: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    optionTextWrong: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    endedScroll: {
      padding: 20,
    },
    endedCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    endedTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      fontFamily: 'IBMPlexSansArabic-Bold',
      marginBottom: 6,
    },
    endedSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 20,
      fontFamily: 'IBMPlexSansArabic-Regular',
    },
    endedStatsRow: {
      flexDirection: 'row-reverse',
      gap: 12,
      width: '100%',
      marginBottom: 24,
    },
    endedStatBox: {
      flex: 1,
      backgroundColor: colors.neutralTint,
      borderRadius: 16,
      padding: 14,
      alignItems: 'center',
    },
    endedStatVal: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primaryDeep,
      marginBottom: 2,
    },
    endedStatLbl: {
      fontSize: 10.5,
      color: colors.textSecondary,
      fontFamily: 'IBMPlexSansArabic-Medium',
    },
    secondaryBtn: {
      marginTop: 12,
      paddingVertical: 12,
      alignItems: 'center',
      width: '100%',
    },
    secondaryBtnText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      fontFamily: 'IBMPlexSansArabic-SemiBold',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 24,
      alignItems: 'center',
      width: '100%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.textPrimary,
      marginBottom: 8,
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    modalBadgeText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 4,
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    modalDescText: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
      fontFamily: 'IBMPlexSansArabic-Regular',
    },
    modalEquipBtn: {
      backgroundColor: colors.primaryDeep,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 14,
      width: '100%',
      alignItems: 'center',
    },
    modalEquipBtnText: {
      fontSize: 13.5,
      fontWeight: '700',
      color: '#FFFFFF',
      fontFamily: 'IBMPlexSansArabic-Bold',
    },
    adWrapper: {
      alignItems: 'center',
      marginBottom: 10,
    },
  });
