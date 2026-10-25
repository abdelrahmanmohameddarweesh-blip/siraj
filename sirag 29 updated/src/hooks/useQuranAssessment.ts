import { useState, useEffect, useMemo, useRef } from 'react';
import { Alert, Share, Animated, Dimensions } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { surahsList } from '../data/surahs';
import { quranVerses, QuranVerse } from '../data/quranVerses';
import { getCurrentUserProfile, addSirajPoints, incrementCorrectAnswers } from '../firebase/auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface DynamicQuestion {
  id: string;
  type: 'missing_ayah' | 'identify_surah';
  prompt: string;
  options: string[];
  answer: string;
  surah: string;
  surahEn: string;
  juz: number;
  ayahNumber: number;
  introContext?: string;
  outroContext?: string;
}

export function useQuranAssessment(navigation: any) {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [screenState, setScreenState] = useState<'lobby' | 'introduction' | 'assessment' | 'results'>('lobby');
  const [wrongAnswers, setWrongAnswers] = useState<{ question: string; selected: string; correct: string }[]>([]);

  // Siraj and animation states
  const [profile, setProfile] = useState<any>(null);
  const [isFlying, setIsFlying] = useState(false);
  const lanternScale = useRef(new Animated.Value(0)).current;
  const lanternPos = useRef(new Animated.ValueXY({ x: 0, y: 150 })).current;
  const lanternOpacity = useRef(new Animated.Value(1)).current;
  const walletScale = useRef(new Animated.Value(1)).current;

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

  // Lobby Configuration Choices
  const [filterMode, setFilterMode] = useState<'juz' | 'surah'>('juz');
  const [selectedJuz, setSelectedJuz] = useState<number>(30);
  const [selectedSurah, setSelectedSurah] = useState<string>('الملك');
  const [selectedLimit, setSelectedLimit] = useState<number>(5);
  const [fetching, setFetching] = useState(false);

  const allowedLimits = useMemo(() => {
    if (filterMode === 'juz') {
      return [5, 10, 15, 20];
    }
    const surahObj = surahsList.find(s => s.name === selectedSurah);
    const total = surahObj ? surahObj.totalAyahs : 30;
    const standard = [5, 10, 15, 20].filter(l => l <= total);
    if (standard.length === 0) {
      return [total];
    }
    return standard;
  }, [filterMode, selectedSurah]);

  useEffect(() => {
    if (allowedLimits.length > 0 && !allowedLimits.includes(selectedLimit)) {
      setSelectedLimit(allowedLimits[allowedLimits.length - 1]);
    }
  }, [allowedLimits, selectedLimit]);

  // Active Assessment States
  const [questions, setQuestions] = useState<DynamicQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = questions[currentIndex];
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Word Builder States
  const [wordPool, setWordPool] = useState<{ id: string; text: string }[]>([]);
  const [builtWords, setBuiltWords] = useState<{ id: string; text: string }[]>([]);

  const mcqQuestionsLimit = useMemo(() => {
    return Math.ceil(questions.length / 2);
  }, [questions]);

  const isCurrentQuestionVoice = useMemo(() => {
    if (!currentQuestion) return false;
    return currentIndex >= mcqQuestionsLimit && currentQuestion.type === 'missing_ayah';
  }, [currentIndex, mcqQuestionsLimit, currentQuestion]);

  useEffect(() => {
    if (currentQuestion && isCurrentQuestionVoice) {
      const correctWords = currentQuestion.answer.trim().split(/\s+/);
      const distractors: string[] = [];
      currentQuestion.options.forEach(opt => {
        if (opt !== currentQuestion.answer) {
          const optWords = opt.trim().split(/\s+/);
          const lastWord = optWords[optWords.length - 1];
          if (lastWord && !correctWords.includes(lastWord) && !distractors.includes(lastWord)) {
            distractors.push(lastWord);
          }
        }
      });

      const distractorCount = Math.max(3, Math.min(5, Math.floor(correctWords.length * 0.6)));
      const fallbackDistractors = [
        'عَلِيمٌ', 'حَكِيمٌ', 'خَبِيرٌ', 'بَصِيرٌ', 'رَحِيمٌ', 'عَظِيمٌ', 'أَلِيمٌ', 'قَدِيرٌ', 'غَفُورٌ', 'شَدِيدٌ',
      ];
      let fallbackIdx = 0;
      while (distractors.length < distractorCount) {
        const nextFallback = fallbackDistractors[fallbackIdx % fallbackDistractors.length];
        if (!correctWords.includes(nextFallback) && !distractors.includes(nextFallback)) {
          distractors.push(nextFallback);
        }
        fallbackIdx++;
      }

      const mixed = [...correctWords, ...distractors.slice(0, distractorCount)].map((text, idx) => ({
        id: `${text}_${idx}_${Math.random()}`,
        text,
      }));

      setWordPool(mixed.sort(() => Math.random() - 0.5));
      setBuiltWords([]);
    }
  }, [currentIndex, currentQuestion, isCurrentQuestionVoice]);

  const handleTapPoolWord = (word: { id: string; text: string }) => {
    if (answered) return;
    setWordPool(prev => prev.filter(w => w.id !== word.id));
    setBuiltWords(prev => [...prev, word]);
  };

  const handleTapBuiltWord = (word: { id: string; text: string }) => {
    if (answered) return;
    setBuiltWords(prev => prev.filter(w => w.id !== word.id));
    setWordPool(prev => [...prev, word]);
  };

  const triggerFlyAnimation = () => {
    setIsFlying(true);
    lanternScale.setValue(0);
    lanternPos.setValue({ x: 0, y: 120 });
    lanternOpacity.setValue(1);

    Animated.spring(lanternScale, {
      toValue: 1.5,
      friction: 5,
      useNativeDriver: false,
    }).start(() => {
      Animated.delay(400).start(() => {
        Animated.parallel([
          Animated.timing(lanternPos.x, {
            toValue: -(SCREEN_WIDTH / 2 - 45),
            duration: 700,
            useNativeDriver: false,
          }),
          Animated.timing(lanternPos.y, {
            toValue: -SCREEN_HEIGHT / 2 + 100,
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
          }),
        ]).start(async () => {
          setIsFlying(false);
          Animated.sequence([
            Animated.timing(walletScale, { toValue: 1.3, duration: 100, useNativeDriver: false }),
            Animated.timing(walletScale, { toValue: 1.0, duration: 100, useNativeDriver: false }),
          ]).start();

          if (user?.uid) {
            try {
              await incrementCorrectAnswers(user.uid, 'quran', 1);
              const updated = await addSirajPoints(user.uid, 5);
              setProfile(updated);
            } catch (err) {
              console.error(err);
            }
          }
        });
      });
    });
  };

  const handleSubmitBuilder = () => {
    const constructed = builtWords.map(w => w.text).join(' ').trim();
    const correct = currentQuestion.answer.trim();
    const normalizeText = (txt: string) => txt.replace(/\s+/g, ' ').trim();
    const isCorrect = normalizeText(constructed) === normalizeText(correct);

    setAnswered(true);
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback(
        language === 'ar'
          ? 'رائع! ترتيب الكلمات للآية الكريمة صحيح تماماً 🌟'
          : 'Excellent! The word order for the verse is perfectly correct 🌟'
      );
      triggerFlyAnimation();
    } else {
      setFeedback(
        language === 'ar'
          ? 'الترتيب غير صحيح. يرجى مراجعة الترتيب الصحيح للآية أدناه:'
          : 'Incorrect word order. Please review the correct order below:'
      );
      setWrongAnswers(prev => [
        ...prev,
        {
          question: currentQuestion.prompt,
          selected: constructed || (language === 'ar' ? 'فارغ' : 'Empty'),
          correct: correct,
        },
      ]);
    }
  };

  const compileQuestionsFromVerses = (versesSource: QuranVerse[]): DynamicQuestion[] => {
    const generatePrecisionDistractors = (correctText: string): string[] => {
      const words = correctText.trim().split(' ');
      if (words.length < 3) return [];
      const lastWord = words[words.length - 1];
      const baseText = words.slice(0, -1).join(' ');

      const endings_een = ['لِلْمُتَّقِينَ', 'الْمُؤْمِنِينَ', 'الْكَافِرِينَ', 'الظَّالِمِينَ', 'الْفَاسِقِينَ', 'الصَّابِرِينَ'];
      const endings_oon = ['الْمُفْلِحُونَ', 'يُوقِنُونَ', 'يَعْمَلُونَ', 'تَشْكُرُونَ', 'يَعْقِلُونَ', 'تَعْلَمُونَ'];
      const endings_un = ['عَظِيمٌ', 'أَلِيمٌ', 'حَكِيمٌ', 'عَلِيمٌ', 'خَبِيرٌ', 'بَصِيرٌ', 'قَدِيرٌ', 'رَحِيمٌ'];

      let pool = endings_een;
      if (lastWord.includes('ون')) pool = endings_oon;
      else if (lastWord.includes('ين')) pool = endings_een;
      else if (lastWord.endsWith('ٌ')) pool = endings_un;
      else pool = [...endings_een, ...endings_oon, ...endings_un];

      const filteredPool = pool.filter(w => w !== lastWord && !lastWord.includes(w));
      const selectedEndings = filteredPool.sort(() => Math.random() - 0.5).slice(0, 3);
      return selectedEndings.map(ending => `${baseText} ${ending}`);
    };

    const versesBySurah: Record<string, QuranVerse[]> = {};
    versesSource.forEach(v => {
      if (!versesBySurah[v.surah]) versesBySurah[v.surah] = [];
      versesBySurah[v.surah].push(v);
    });

    const surahsListInJuz = Object.keys(versesBySurah);
    surahsListInJuz.forEach(sName => {
      versesBySurah[sName].sort(() => Math.random() - 0.5);
    });

    const generated: DynamicQuestion[] = [];
    let surahIndex = 0;
    const offsets: Record<string, number> = {};
    surahsListInJuz.forEach(sName => {
      offsets[sName] = 0;
    });

    let attempt = 0;
    const maxAttempts = selectedLimit * 15;

    while (generated.length < selectedLimit && attempt < maxAttempts && surahsListInJuz.length > 0) {
      attempt++;
      const currentSurahName = surahsListInJuz[surahIndex % surahsListInJuz.length];
      surahIndex++;

      const surahVerses = versesBySurah[currentSurahName];
      if (!surahVerses || surahVerses.length === 0) continue;

      const offset = offsets[currentSurahName];
      const targetVerse = surahVerses[offset % surahVerses.length];
      offsets[currentSurahName] = offset + 1;

      const prevVerse = versesSource.find(v => v.surah === targetVerse.surah && v.ayahNumber === targetVerse.ayahNumber - 1);
      const nextVerse = versesSource.find(v => v.surah === targetVerse.surah && v.ayahNumber === targetVerse.ayahNumber + 1);

      const words = targetVerse.text.split(' ');
      if (words.length < 4 && !prevVerse && !nextVerse) continue;

      const stripDiacritics = (txt: string) => txt.replace(/[\u064B-\u065F\u0670]/g, '').trim();
      const strippedText = stripDiacritics(targetVerse.text);
      if (strippedText === 'بسم الله الرحمن الرحيم' || strippedText === 'بسم الله الرحمن الرحيم ') continue;

      let type: 'missing_ayah' | 'identify_surah' = 'missing_ayah';
      if (filterMode === 'juz') {
        type = Math.random() > 0.5 ? 'identify_surah' : 'missing_ayah';
      }

      if (type === 'missing_ayah') {
        let promptText = '';
        let answer = '';
        let distractors: string[] = [];
        let introContext = '';
        let outroContext = '';

        const contextType = attempt % 4;
        let canDoFullVerseQuiz = false;
        if (contextType === 0 && prevVerse && nextVerse) canDoFullVerseQuiz = true;
        if (contextType === 1 && prevVerse) canDoFullVerseQuiz = true;
        if (contextType === 2 && nextVerse) canDoFullVerseQuiz = true;

        if (canDoFullVerseQuiz) {
          answer = targetVerse.text;
          if (contextType === 0 && prevVerse && nextVerse) {
            promptText = `... ۞ ${prevVerse.text} ۞ [ ....... ] ۞ ${nextVerse.text} ۞ ...`;
            const firstWord = targetVerse.text.split(' ').slice(0, 3).join(' ');
            const lastWord = targetVerse.text.split(' ').slice(-2).join(' ');
            introContext = language === 'ar' ? `تبدأ بـ: "${firstWord}..."` : `Starts with: "${firstWord}..."`;
            outroContext = language === 'ar' ? `وتنتهي بـ: "...${lastWord}"` : `Ends with: "...${lastWord}"`;
          } else if (contextType === 1 && prevVerse) {
            promptText = `... ۞ ${prevVerse.text} ۞ [ ....... ]`;
            const firstWord = targetVerse.text.split(' ').slice(0, 3).join(' ');
            const lastWord = targetVerse.text.split(' ').slice(-2).join(' ');
            introContext = language === 'ar' ? `تبدأ بـ: "${firstWord}..."` : `Starts with: "${firstWord}..."`;
            outroContext = language === 'ar' ? `وتنتهي بـ: "...${lastWord}" ۞` : `Ends with: "...${lastWord}" ۞`;
          } else if (nextVerse) {
            promptText = `[ ....... ] ۞ ${nextVerse.text} ۞ ...`;
            const firstWord = targetVerse.text.split(' ').slice(0, 3).join(' ');
            const lastWord = targetVerse.text.split(' ').slice(-2).join(' ');
            introContext = language === 'ar' ? `تبدأ بـ: "${firstWord}..."` : `Starts with: "${firstWord}..."`;
            outroContext = language === 'ar' ? `وتنتهي بـ: "...${lastWord}"` : `Ends with: "...${lastWord}"`;
          }

          distractors = generatePrecisionDistractors(answer);
          if (distractors.length < 3) {
            let distractorPool = versesSource.filter(
              v => v.text !== answer && v.text !== prevVerse?.text && v.text !== nextVerse?.text
            );
            if (filterMode === 'surah') distractorPool = distractorPool.filter(v => v.surah === selectedSurah);
            if (distractorPool.length < 3) distractorPool = quranVerses.filter(v => v.text !== answer);
            distractors = distractorPool.sort(() => Math.random() - 0.5).slice(0, 3).map(v => v.text);
          }
        } else {
          const half = Math.max(3, Math.floor(words.length / 2));
          if (words.length > 3) {
            const firstHalf = words.slice(0, half).join(' ');
            promptText = `${firstHalf} [ ....... ]`;
            answer = words.slice(half).join(' ');
            const lastWord = words.slice(-2).join(' ');
            introContext = language === 'ar' ? `أكمل بعد: "${firstHalf.split(' ').slice(-2).join(' ')}..."` : `Continue after: "...${firstHalf.split(' ').slice(-2).join(' ')}"`;
            outroContext = language === 'ar' ? `حتى نهاية الآية (تنتهي بـ: "${lastWord}") ۞` : `Until end of verse (ends with: "${lastWord}") ۞`;

            distractors = generatePrecisionDistractors(answer);
            if (distractors.length < 3) {
              let distractorPool = versesSource.filter(v => v.text !== targetVerse.text);
              if (filterMode === 'surah') distractorPool = distractorPool.filter(v => v.surah === selectedSurah);
              if (distractorPool.length < 3) distractorPool = quranVerses.filter(v => v.text !== targetVerse.text);
              distractors = distractorPool.sort(() => Math.random() - 0.5).slice(0, 3).map(v => {
                const dWords = v.text.split(' ');
                return dWords.slice(Math.max(3, Math.floor(dWords.length / 2))).join(' ');
              });
            }
          } else {
            answer = targetVerse.text;
            promptText = prevVerse ? `... ۞ ${prevVerse.text} ۞ [ ....... ]` : `[ ....... ]`;
            distractors = generatePrecisionDistractors(answer);
            if (distractors.length < 3) {
              distractors = quranVerses.filter(v => v.text !== answer).sort(() => Math.random() - 0.5).slice(0, 3).map(v => v.text);
            }
          }
        }

        const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
        generated.push({
          id: `dyn_${targetVerse.surah}_${targetVerse.ayahNumber}_${attempt}_${generated.length}`,
          type,
          prompt: promptText,
          options,
          answer,
          surah: targetVerse.surah,
          surahEn: targetVerse.surahEn,
          juz: targetVerse.juz,
          ayahNumber: targetVerse.ayahNumber,
          introContext,
          outroContext,
        });
      } else {
        const promptText = targetVerse.text;
        const answer = targetVerse.surah;
        const surahsInPool = Array.from(new Set(versesSource.map(v => v.surah)));
        const cleanPool = surahsInPool.filter(name => name !== answer);

        let distractors: string[] = [];
        if (cleanPool.length >= 3) {
          distractors = cleanPool.sort(() => Math.random() - 0.5).slice(0, 3);
        } else {
          distractors = surahsList.filter(s => s.name !== answer).sort(() => Math.random() - 0.5).slice(0, 3).map(s => s.name);
        }

        const options = [answer, ...distractors].sort(() => Math.random() - 0.5);
        generated.push({
          id: `dyn_id_${targetVerse.surah}_${targetVerse.ayahNumber}_${attempt}_${generated.length}`,
          type,
          prompt: promptText,
          options,
          answer,
          surah: targetVerse.surah,
          surahEn: targetVerse.surahEn,
          juz: targetVerse.juz,
          ayahNumber: targetVerse.ayahNumber,
        });
      }
    }

    return generated.sort((a, b) => {
      if (a.type === 'identify_surah' && b.type !== 'identify_surah') return -1;
      if (a.type !== 'identify_surah' && b.type === 'identify_surah') return 1;
      return 0;
    });
  };

  const handleStartLobby = async () => {
    setFetching(true);
    let finalVerses: QuranVerse[] = [];
    const surahObj = surahsList.find(s => s.name === selectedSurah);
    const surahNumber = surahObj ? surahObj.number : 67;

    const downloadVerses = async (mode: 'surah' | 'juz', val: number): Promise<QuranVerse[]> => {
      try {
        const url = mode === 'surah'
          ? `https://api.alquran.cloud/v1/surah/${val}`
          : `https://api.alquran.cloud/v1/juz/${val}`;
        const response = await fetch(url);
        const json = await response.json();
        if (json.code === 200 && json.data && json.data.ayahs) {
          if (mode === 'surah') {
            return json.data.ayahs.map((a: any) => ({
              surah: selectedSurah,
              surahEn: surahObj?.english || 'Al-Mulk',
              juz: a.juz,
              ayahNumber: a.numberInSurah,
              text: a.text,
            }));
          } else {
            return json.data.ayahs.map((a: any) => {
              const matchSurah = surahsList.find(s => s.number === a.surah.number);
              return {
                surah: matchSurah ? matchSurah.name : a.surah.name,
                surahEn: matchSurah ? matchSurah.english : a.surah.english,
                juz: val,
                ayahNumber: a.numberInSurah,
                text: a.text,
              };
            });
          }
        }
      } catch (err) {
        console.log('Primary API failed, trying fallback...', err);
      }

      try {
        const url = mode === 'surah'
          ? `https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${val}`
          : `https://api.quran.com/api/v4/quran/verses/uthmani?juz_number=${val}`;
        const response = await fetch(url);
        const json = await response.json();
        if (json && Array.isArray(json.verses)) {
          return json.verses.map((v: any) => {
            const [surahNumStr, ayahNumStr] = v.verse_key.split(':');
            const sNum = parseInt(surahNumStr, 10);
            const aNum = parseInt(ayahNumStr, 10);
            const matchSurah = surahsList.find(s => s.number === sNum);
            return {
              surah: matchSurah ? matchSurah.name : `سورة ${sNum}`,
              surahEn: matchSurah ? matchSurah.english : `Surah ${sNum}`,
              juz: mode === 'juz' ? val : 30,
              ayahNumber: aNum,
              text: v.text_uthmani,
            };
          });
        }
      } catch (err) {
        console.log('Secondary API mirror failed', err);
      }

      return [];
    };

    if (filterMode === 'surah') {
      finalVerses = await downloadVerses('surah', surahNumber);
      if (finalVerses.length === 0) finalVerses = quranVerses.filter(v => v.surah === selectedSurah);
    } else {
      finalVerses = await downloadVerses('juz', selectedJuz);
      if (finalVerses.length === 0) finalVerses = quranVerses.filter(v => v.juz === selectedJuz);
    }

    if (finalVerses.length === 0) {
      setFetching(false);
      Alert.alert(
        language === 'ar' ? 'فشل الاتصال بالشبكة' : 'Network Connection Failed',
        language === 'ar'
          ? 'عذراً، يتطلب الاختبار اتصالاً بالإنترنت لتحميل الآيات أو تجربة جزء ٣٠ المتاح دون اتصال.'
          : 'Testing requires an active network connection or try offline Juz 30.'
      );
      return;
    }

    setFetching(false);
    const generated = compileQuestionsFromVerses(finalVerses);
    if (generated.length === 0) {
      Alert.alert(language === 'ar' ? 'خطأ' : 'Error', language === 'ar' ? 'فشل في توليد الأسئلة.' : 'Failed to generate questions.');
      return;
    }

    setQuestions(generated);
    setCurrentIndex(0);
    setSelectedAnswer('');
    setAnswered(false);
    setCorrectCount(0);
    setFeedback('');
    setWrongAnswers([]);
    setScreenState('introduction');
  };

  const handleSubmitMCQ = () => {
    if (!selectedAnswer.trim()) {
      Alert.alert(language === 'ar' ? 'تنبيه' : 'Alert', language === 'ar' ? 'الرجاء اختيار إجابة واحدة للاستمرار.' : 'Please select an option to submit.');
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.answer;
    setAnswered(true);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      setFeedback(language === 'ar' ? 'إجابة صحيحة! أحسنت وحفظك مبارك 🌟' : 'Correct answer! Excellent memorization 🌟');
      triggerFlyAnimation();
    } else {
      setFeedback(language === 'ar' ? 'إجابة غير صحيحة. الإجابة الصحيحة هي:' : 'Incorrect answer. The correct answer is:');
      setWrongAnswers(prev => [
        ...prev,
        {
          question: currentQuestion.prompt,
          selected: selectedAnswer,
          correct: currentQuestion.answer,
        },
      ]);
    }
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
      setSelectedAnswer('');
      setAnswered(false);
      setFeedback('');
    } else {
      setScreenState('results');
    }
  };

  const activeTargetLabel = useMemo(() => {
    if (filterMode === 'juz') {
      return language === 'ar' ? `جزء ${selectedJuz}` : `Juz' ${selectedJuz}`;
    }
    return language === 'ar' ? `سورة ${selectedSurah}` : `Surah ${selectedSurah}`;
  }, [filterMode, selectedJuz, selectedSurah, language]);

  const handleShareResults = async () => {
    try {
      const accuracy = Math.round((correctCount / (questions.length || 1)) * 100);
      const textAr = `لقد أكملت تقييم حفظ [${activeTargetLabel}] عبر تطبيق بطل مسلم بنجاح! النتيجة: ${accuracy}% (${correctCount}/${questions.length} إجابات صحيحة) 🏆`;
      const textEn = `I have successfully completed the memorization assessment for [${activeTargetLabel}] on Batal Moslem! Result: ${accuracy}% (${correctCount}/${questions.length} correct answers) 🏆`;
      await Share.share({ message: language === 'ar' ? textAr : textEn });
    } catch (err) {
      console.error(err);
    }
  };

  const difficultyLabel = useMemo(() => {
    if (selectedLimit === 5) return language === 'ar' ? 'مبتدئ (سهل)' : 'Easy (Beginner)';
    if (selectedLimit === 10) return language === 'ar' ? 'متوسط (عادي)' : 'Medium (Normal)';
    if (selectedLimit === 15) return language === 'ar' ? 'متقدم (صعب)' : 'Hard (Advanced)';
    return language === 'ar' ? 'بطل (خبير)' : 'Expert (Hero)';
  }, [selectedLimit, language]);

  return {
    screenState,
    setScreenState,
    filterMode,
    setFilterMode,
    selectedJuz,
    setSelectedJuz,
    selectedSurah,
    setSelectedSurah,
    selectedLimit,
    setSelectedLimit,
    allowedLimits,
    fetching,
    questions,
    currentIndex,
    currentQuestion,
    selectedAnswer,
    setSelectedAnswer,
    answered,
    correctCount,
    feedback,
    wrongAnswers,
    wordPool,
    builtWords,
    isCurrentQuestionVoice,
    profile,
    isFlying,
    lanternScale,
    lanternPos,
    lanternOpacity,
    walletScale,
    activeTargetLabel,
    difficultyLabel,
    handleTapPoolWord,
    handleTapBuiltWord,
    handleSubmitBuilder,
    handleSubmitMCQ,
    handleNext,
    handleStartLobby,
    handleShareResults,
  };
}
