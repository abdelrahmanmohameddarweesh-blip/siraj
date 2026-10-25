import { useState, useEffect, useRef } from 'react';
import { Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAudio as Audio } from '../utils/safeAudio';
import { type Reader } from '../data/readers';
import { ayahs, type Ayah } from '../data/ayahs';
import { generateReferenceProfile, analyzeVocalImitation, calculateTextMatchScore } from '../data/voiceTemplates';
import { surahsList } from '../data/surahs';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';
import { addCommunityPost } from '../data/communityFeed';
import { Env } from '../config/env';
import { useInterstitialAd } from '../config/adsService';
import { AdMobConfig } from '../config/ads';

export function useVoiceRecording() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const [step, setStep] = useState<'select-reader' | 'setup-ayah' | 'ready' | 'recording' | 'recorded' | 'analyzing' | 'scored'>('select-reader');
  const [hasShared, setHasShared] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(1);
  const [startAyahNumber, setStartAyahNumber] = useState<number>(1);
  const [endAyahNumber, setEndAyahNumber] = useState<number>(1);
  const [recordWholeSurah, setRecordWholeSurah] = useState<boolean>(false);
  const [fetchingAyah, setFetchingAyah] = useState<boolean>(false);

  const [pendingScoreData, setPendingScoreData] = useState<{ results: any; earnedPoints: number } | null>(null);

  // Interstitial Ad setup
  const { isLoaded, isClosed, load, show } = useInterstitialAd(AdMobConfig.interstitialAdUnitID, {
    requestNonPersonalizedAdsOnly: true,
  });

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isClosed) {
      load();
    }
  }, [isClosed, load]);

  const completeScoring = async (results: any, earnedPoints: number) => {
    setStep('scored');
    if (user?.uid && results.overall > 15) {
      try {
        const profile = await getCurrentUserProfile(user.uid);
        const currentScore = profile?.score ?? 0;
        await saveUserScore(user.uid, currentScore + earnedPoints);

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        await AsyncStorage.setItem(`quest-voice-done-${todayStr}`, 'true');

        const count = await AsyncStorage.getItem('completed-recitations-count');
        const nextCount = count ? parseInt(count, 10) + 1 : 1;
        await AsyncStorage.setItem('completed-recitations-count', nextCount.toString());
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (isClosed && pendingScoreData !== null) {
      completeScoring(pendingScoreData.results, pendingScoreData.earnedPoints);
      setPendingScoreData(null);
    }
  }, [isClosed, pendingScoreData]);

  const [selectedReader, setSelectedReader] = useState<Reader | null>(null);
  const [currentAyah, setCurrentAyah] = useState<Ayah | null>(null);
  const [recitationStyle, setRecitationStyle] = useState<'murattal' | 'mujawwad'>('murattal');
  const [seconds, setSeconds] = useState(0);

  // Audio state
  const [recording, setRecording] = useState<any>(null);
  const [meteringHistory, setMeteringHistory] = useState<number[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [liveVolume, setLiveVolume] = useState(0);

  // Scoring parameters
  const [scoreBreakdown, setScoreBreakdown] = useState({
    pronunciation: 0,
    tone: 0,
    rhythm: 0,
    tajweed: 0,
    overall: 0,
  });

  // Speech Recognition States
  const [transcribedText, setTranscribedText] = useState('');
  const [textMatchDetails, setTextMatchDetails] = useState<{ matches: string[]; missing: string[] } | null>(null);
  const [isTranscriptionSuccess, setIsTranscriptionSuccess] = useState(false);

  // Pulse animation for recording button
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation;
    if (step === 'recording') {
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [step]);

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  const handleSelectReader = (reader: Reader) => {
    setSelectedReader(reader);
    setStep('setup-ayah');
  };

  const handleStartRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('صلاحية الميكروفون', 'الرجاء تمكين الوصول إلى الميكروفون في إعدادات جهازك للمتابعة.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setMeteringHistory([]);
      setRecordingDuration(0);
      setLiveVolume(0);
      setSeconds(0);

      const recordingInstance = new Audio.Recording();
      await recordingInstance.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {},
        isMeteringEnabled: true,
      });

      recordingInstance.setProgressUpdateInterval(120);

      const history: number[] = [];
      recordingInstance.setOnRecordingStatusUpdate((status) => {
        if (status.durationMillis) {
          setSeconds(Math.floor(status.durationMillis / 1000));
          setRecordingDuration(status.durationMillis);
        }

        if (status.metering !== undefined) {
          history.push(status.metering);
          setMeteringHistory([...history]);

          const normVol = status.metering <= -60 ? 0 : (status.metering + 60) / 60;
          setLiveVolume(normVol);
        }
      });

      await recordingInstance.startAsync();
      setRecording(recordingInstance);
      setStep('recording');
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ في التسجيل', 'فشل في تهيئة ميكروفون الهاتف للتسجيل.');
    }
  };

  const handleStopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      setStep('recorded');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnalyzeRecitation = async () => {
    if (!currentAyah || !selectedReader) return;

    const maxDb = meteringHistory.length > 0 ? Math.max(...meteringHistory) : -160;

    if (recordingDuration < 1200 || meteringHistory.length === 0 || maxDb < -25) {
      Alert.alert(
        language === 'ar' ? 'لم يتم اكتشاف صوت 🎙️' : 'No Voice Detected 🎙️',
        language === 'ar'
          ? 'التسجيل فارغ أو هادئ جداً. يرجى التأكد من التحدث بوضوح بالقرب من الميكروفون.'
          : 'The recording is empty or too quiet. Please speak clearly near the microphone.'
      );
      setStep('recorded');
      return;
    }

    setStep('analyzing');

    let transcribed = '';
    let textScore = 0;
    let matchDetails: any = null;
    let apiSuccess = false;

    try {
      const fileUri = recording?.getURI();
      if (fileUri) {
        const fileResponse = await fetch(fileUri);
        const audioBlob = await fileResponse.blob();

        let attempts = 0;
        const maxAttempts = 3;

        while (attempts < maxAttempts && !apiSuccess) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const hfResponse = await fetch(
              'https://api-inference.huggingface.co/models/tarteel-ai/whisper-base-ar-quran',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'audio/m4a',
                },
                body: audioBlob,
                signal: controller.signal,
              }
            );

            clearTimeout(timeoutId);
            const data = await hfResponse.json();

            if (data?.text) {
              transcribed = data.text;
              apiSuccess = true;
            } else if (data?.error && data.error.includes('loading')) {
              await new Promise((resolve) => setTimeout(resolve, 3000));
              attempts++;
            } else {
              break;
            }
          } catch (e) {
            console.warn('Network or server error during transcription attempt:', e);
            break;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load local recording file for transcription:', err);
    }

    let dspResults = null;
    let dspSuccess = false;

    if (Env.dspServerUrl) {
      try {
        const fileUri = recording?.getURI();
        if (fileUri) {
          const formData = new FormData();
          formData.append('audio', {
            uri: fileUri,
            name: 'recitation.m4a',
            type: 'audio/m4a',
          } as any);
          formData.append('reader', selectedReader.id);
          formData.append('ayah', currentAyah.id);
          formData.append('style', recitationStyle);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const targetUrl = Env.dspServerUrl.endsWith('/')
            ? `${Env.dspServerUrl}analyze`
            : `${Env.dspServerUrl}/analyze`;

          const dspResponse = await fetch(targetUrl, {
            method: 'POST',
            body: formData,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          const dspData = await dspResponse.json();
          if (dspData && !dspData.error) {
            dspResults = dspData;
            dspSuccess = true;
          } else {
            console.warn('DSP Server error response:', dspData?.error);
          }
        }
      } catch (e) {
        console.warn('Failed to communicate with DSP Server, falling back to local analysis:', e);
      }
    }

    const refProfile = generateReferenceProfile(currentAyah.id, selectedReader.id, recitationStyle, currentAyah.text);
    const fallbackResults = analyzeVocalImitation(meteringHistory, recordingDuration, refProfile);
    const results = dspSuccess && dspResults ? dspResults : fallbackResults;

    let finalResults = { ...results } as any;

    if (apiSuccess && transcribed) {
      const textMatch = calculateTextMatchScore(transcribed, currentAyah.text);
      textScore = textMatch.score;
      matchDetails = { matches: textMatch.matches, missing: textMatch.missing };

      setTranscribedText(transcribed);
      setTextMatchDetails(matchDetails);
      setIsTranscriptionSuccess(true);

      if (textScore < 15) {
        finalResults = {
          pronunciation: 0,
          tone: 0,
          rhythm: 0,
          tajweed: 0,
          overall: 0,
        };
      } else {
        const blendedOverall = Math.round((textScore * 0.55) + (results.tone * 0.25) + (results.rhythm * 0.20));
        finalResults = {
          pronunciation: textScore,
          tone: results.tone,
          rhythm: results.rhythm,
          tajweed: (results as any).tajweed || 0,
          overall: Math.min(100, Math.max(5, blendedOverall)),
        };
      }
    } else {
      setTranscribedText('');
      setTextMatchDetails(null);
      setIsTranscriptionSuccess(false);

      const fallbackPronunciation = results.pronunciation || 80;
      const offlineOverall = Math.round(
        (fallbackPronunciation * 0.35) +
        (results.tone * 0.30) +
        (results.rhythm * 0.20) +
        (((results as any).tajweed || 0) * 0.15)
      );

      finalResults = {
        pronunciation: fallbackPronunciation,
        tone: results.tone,
        rhythm: results.rhythm,
        tajweed: (results as any).tajweed || 0,
        overall: Math.min(100, Math.max(5, offlineOverall)),
      };
    }

    setScoreBreakdown(finalResults);

    const earnedPoints = (!apiSuccess || finalResults.overall === 0)
      ? 0
      : Math.round((finalResults.overall / 100) * 25);
    setPendingScoreData({ results: finalResults, earnedPoints });

    if (isLoaded) {
      show();
    } else {
      completeScoring(finalResults, earnedPoints);
    }
  };

  const handleReset = () => {
    setRecording(null);
    setSelectedReader(null);
    setCurrentAyah(null);
    setMeteringHistory([]);
    setRecordingDuration(0);
    setLiveVolume(0);
    setHasShared(false);
    setHasSaved(false);
    setStep('select-reader');
  };

  const handleShareToFeed = async () => {
    if (!selectedReader || !currentAyah) return;
    try {
      const userProfile = user?.uid ? await getCurrentUserProfile(user.uid) : null;
      await addCommunityPost({
        userName: userProfile?.displayName || user?.displayName || 'بطل مسلم',
        userLevel: Math.max(1, Math.floor((userProfile?.score ?? 0) / 100)),
        countryCode: userProfile?.countryCode || 'EG',
        surahName: currentAyah.surah,
        ayahNumber: currentAyah.number,
        readerId: selectedReader.id,
        readerName: selectedReader.name,
        matchPercentage: selectedReader.id === 'free_voice' ? 100 : scoreBreakdown.overall,
        style: recitationStyle,
        duration: seconds > 0 ? `00:${seconds < 10 ? '0' + seconds : seconds}` : '01:20',
        ayahsCount: typeof currentAyah.number === 'number' ? `الآية ${currentAyah.number}` : `${currentAyah.number} آيات`,
      });
      setHasShared(true);
      Alert.alert(
        language === 'ar' ? 'تم النشر بنجاح! 🎉' : 'Published Successfully! 🎉',
        language === 'ar'
          ? 'لقد تم نشر تلاوتك في ساحة التلاوة ليراها ويتفاعل معها مجتمع الأبطال.'
          : 'Your recitation was posted in the Recitation Square feed!'
      );
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'فشل في نشر التلاوة على Feed.');
    }
  };

  const handleSaveToProfile = async () => {
    if (!selectedReader || !currentAyah) return;
    try {
      const storedStr = await AsyncStorage.getItem('saved-recitations-list');
      const savedList = storedStr ? JSON.parse(storedStr) : [];

      if (savedList.length >= 3) {
        Alert.alert(
          language === 'ar' ? 'وصلت للحد الأقصى (3/3) 🔒' : 'Freemium Limit Reached (3/3) 🔒',
          language === 'ar'
            ? 'قمت بحفظ 3 تلاوات مجانية. قم بالترقية للحصول على سعة غير محدودة، أو احذف تلاوة قديمة لتوفير مساحة.'
            : 'You have saved 3 free recitations. Upgrade to unlock unlimited storage, or delete older records from your profile.'
        );
        return;
      }

      const newItem = {
        id: Date.now().toString(),
        surahName: currentAyah.surah,
        ayahNumber: currentAyah.number,
        readerName: selectedReader.name,
        matchPercentage: scoreBreakdown.overall,
        style: recitationStyle,
        createdAt: new Date().toISOString(),
      };

      savedList.push(newItem);
      await AsyncStorage.setItem('saved-recitations-list', JSON.stringify(savedList));
      setHasSaved(true);

      if (user?.uid) {
        const userProfile = await getCurrentUserProfile(user.uid);
        const currentScore = userProfile?.score ?? 0;
        await saveUserScore(user.uid, currentScore + 5);
      }

      Alert.alert(
        language === 'ar' ? 'تم الحفظ بنجاح! 💾' : 'Saved Successfully! 💾',
        language === 'ar'
          ? 'تمت إضافة التلاوة إلى حقيبتك الخاصة في حسابك الشخصي وحصلت على +٥ نقاط خبرة!'
          : 'Added to your private portfolio inside your Profile. You earned +5 XP!'
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to save recitation.');
    }
  };

  const loadSelectedAyahRange = async (surahNum: number, startNum: number, endNum: number) => {
    setFetchingAyah(true);
    let success = false;
    let combinedText = '';

    try {
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}`);
      const resJson = await response.json();
      if (resJson?.data?.ayahs) {
        const allAyahs = resJson.data.ayahs;
        const rangeAyahs = allAyahs.slice(startNum - 1, endNum);
        combinedText = rangeAyahs.map((a: any) => a.text.trim()).join(' ۞ ');
        success = true;
      }
    } catch (primaryErr) {
      console.warn('Primary Quran API failed, trying mirror...', primaryErr);
    }

    if (!success) {
      try {
        const response = await fetch(`https://quranapi.pages.dev/api/${surahNum}.json`);
        const resJson = await response.json();
        if (resJson?.arabic1) {
          const allAyahs = resJson.arabic1;
          const rangeAyahs = allAyahs.slice(startNum - 1, endNum);
          combinedText = rangeAyahs.join(' ۞ ');
          success = true;
        }
      } catch (mirrorErr) {
        console.warn('Mirror Quran API failed too...', mirrorErr);
      }
    }

    if (success && combinedText) {
      const bismillah = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
      const bismillahAlt = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ';
      if (surahNum !== 1 && startNum === 1) {
        if (combinedText.startsWith(bismillah)) {
          combinedText = combinedText.replace(bismillah, '').trim();
        } else if (combinedText.startsWith(bismillahAlt)) {
          combinedText = combinedText.replace(bismillahAlt, '').trim();
        }
      }

      setCurrentAyah({
        id: `dynamic-${surahNum}-${startNum}-${endNum}`,
        text: combinedText,
        surah: `سورة ${surahsList.find((s) => s.number === surahNum)?.name || 'مخصصة'}`,
        number: startNum === endNum ? startNum : `${startNum} - ${endNum}`,
      });
      setStep('ready');
    } else {
      const localAyah = ayahs[Math.floor(Math.random() * ayahs.length)];
      setCurrentAyah({
        id: `local-fallback-${Date.now()}`,
        text: localAyah.text,
        surah: localAyah.surah,
        number: localAyah.number,
      });
      setStep('ready');
      Alert.alert(
        language === 'ar' ? 'الوضع غير المتصل 📡' : 'Offline Mode 📡',
        language === 'ar'
          ? 'تعذر الاتصال بخوادم القرآن. تم تحميل آية مخزنة محلياً للاستمرار بالتحدي.'
          : 'Could not connect to online servers. Loaded local fallback verses to continue the challenge.'
      );
    }
    setFetchingAyah(false);
  };

  return {
    step,
    setStep,
    selectedReader,
    setSelectedReader,
    currentAyah,
    setCurrentAyah,
    recitationStyle,
    setRecitationStyle,
    seconds,
    meteringHistory,
    liveVolume,
    scoreBreakdown,
    transcribedText,
    textMatchDetails,
    isTranscriptionSuccess,
    pulseAnim,
    hasShared,
    hasSaved,
    selectedSurahNumber,
    setSelectedSurahNumber,
    startAyahNumber,
    setStartAyahNumber,
    endAyahNumber,
    setEndAyahNumber,
    recordWholeSurah,
    setRecordWholeSurah,
    fetchingAyah,
    handleSelectReader,
    handleStartRecording,
    handleStopRecording,
    handleAnalyzeRecitation,
    handleReset,
    handleShareToFeed,
    handleSaveToProfile,
    loadSelectedAyahRange,
  };
}
