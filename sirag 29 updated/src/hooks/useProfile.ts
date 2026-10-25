import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { getCurrentUserProfile, updateUserCountry, updateUserPhoto, equipUserTitle } from '../firebase/auth';
import { checkUnlockedBadges } from '../data/badges';
import { countriesList, HistoricalArtifact } from '../components/profile/profileConstants';

export function useProfile(navigation: any) {
  const { user, logout, updateUserFields } = useAuth();
  const { language } = useLanguage();
  const { colors } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>([]);
  const [savedRecitations, setSavedRecitations] = useState<any[]>([]);

  // Daily Accountability Habits States
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`, [today]);

  const [prayers, setPrayers] = useState<{ [key: string]: 'congregation' | 'individual' | 'missed' | null }>({
    fajr: null,
    dhuhr: null,
    asr: null,
    maghrib: null,
    isha: null,
  });

  const [deeds, setDeeds] = useState<{ [key: string]: boolean }>({
    quran: false,
    morning_adhkar: false,
    evening_adhkar: false,
    charity: false,
    tongue: false,
    knowledge: false,
  });
  const [pledged, setPledged] = useState(false);
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<HistoricalArtifact | null>(null);

  const loadProfile = async () => {
    if (!user?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const currentProfile = await getCurrentUserProfile(user.uid);
      setProfile(currentProfile);

      const unlocked = await checkUnlockedBadges(currentProfile?.score ?? 0);
      setUnlockedBadgeIds(unlocked);

      const stored = await AsyncStorage.getItem('saved-recitations-list');
      setSavedRecitations(stored ? JSON.parse(stored) : []);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError(
        language === 'ar'
          ? 'تعذر تحميل بيانات الملف الشخصي. يرجى التحقق من اتصالك والمحاولة مجدداً.'
          : 'Could not load profile data. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadDailyLogs = async () => {
    try {
      const stored = await AsyncStorage.getItem(`accountability-log-${todayStr}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPrayers(parsed.prayers || {});
        setDeeds(parsed.deeds || {});
        setPledged(parsed.pledged || false);
      }

      // Generate history for past 7 days
      const history = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dStr = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        const log = await AsyncStorage.getItem(`accountability-log-${dStr}`);
        let completed = 0;
        let pLogs = {};
        let dLogs = {};
        if (log) {
          const parsedLog = JSON.parse(log);
          pLogs = parsedLog.prayers || {};
          dLogs = parsedLog.deeds || {};
          const pCompleted = Object.values(pLogs).filter(val => val === 'congregation' || val === 'individual').length;
          const dCompleted = Object.values(dLogs).filter(Boolean).length;
          completed = pCompleted + dCompleted;
        }
        history.push({
          dateStr: dStr,
          completedCount: completed,
          prayers: pLogs,
          deeds: dLogs,
        });
      }
      setWeeklyHistory(history);
    } catch (err) {
      console.error(err);
    }
  };

  const weeklyAnalytics = useMemo(() => {
    let congregationCount = 0;
    let individualCount = 0;
    let missedCount = 0;
    let totalPrayersLogged = 0;

    let fajrOnTimeCount = 0;
    let morningAzkarCount = 0;
    let eveningAzkarCount = 0;
    let totalDaysWithLogs = 0;

    weeklyHistory.forEach(day => {
      let dayHasLogs = false;
      if (day.prayers) {
        Object.keys(day.prayers).forEach(key => {
          const status = day.prayers[key];
          if (status) {
            dayHasLogs = true;
            totalPrayersLogged++;
            if (status === 'congregation') congregationCount++;
            else if (status === 'individual') individualCount++;
            else if (status === 'missed') missedCount++;

            if (key === 'fajr' && status === 'congregation') {
              fajrOnTimeCount++;
            }
          }
        });
      }

      if (day.deeds) {
        if (day.deeds.morning_adhkar) {
          dayHasLogs = true;
          morningAzkarCount++;
        }
        if (day.deeds.evening_adhkar) {
          dayHasLogs = true;
          eveningAzkarCount++;
        }
      }

      if (dayHasLogs) {
        totalDaysWithLogs++;
      }
    });

    const totalCount = congregationCount + individualCount + missedCount;
    const congregationPct = totalCount > 0 ? congregationCount / totalCount : 0;
    const individualPct = totalCount > 0 ? individualCount / totalCount : 0;
    const missedPct = totalCount > 0 ? missedCount / totalCount : 0;

    let assessmentAr = 'سجل صلواتك وطاعاتك يومياً لتبدأ في مراجعة التقرير الأسبوعي.';
    let assessmentEn = 'Log your prayers and habits daily to view your weekly performance review.';
    let alertColor = colors.neutralTint;
    let textThemeColor = colors.textPrimary;

    if (totalDaysWithLogs > 0) {
      if (missedCount > 4) {
        assessmentAr = '⚠️ تنبيه: لقد فاتتك بعض الصلوات المفروضة هذا الأسبوع. الصلاة عماد الدين، حاول إعطاءها الأولوية وضبط التنبيهات اللازمة لتأديتها في وقتها.';
        assessmentEn = '⚠️ Warning: You missed some obligatory prayers this week. Prayer is the pillar of faith. Prioritize it and set alarms to offer them on time.';
        alertColor = colors.cardErrorTint;
        textThemeColor = colors.error;
      } else if (congregationCount > 15) {
        assessmentAr = '🎉 ممتاز! ما شاء الله على حرصك العالي والتزامك بصلاة الجماعة في المسجد. أداء إيماني متميز ومبارك، استمر على هذا الدرب العظيم.';
        assessmentEn = "🎉 Excellent! Masha'Allah on your high commitment to praying in congregation. Outstanding spiritual dedication. Keep on this blessed path.";
        alertColor = colors.cardSuccessTint;
        textThemeColor = colors.primaryDeep;
      } else {
        assessmentAr = '👍 أداء طيب ومتوازن هذا الأسبوع. استمر في مجاهدة نفسك لزيادة صلوات الجماعة والمحافظة الدائمة على الأذكار لتزيد يومك بركة ونوراً.';
        assessmentEn = '👍 Balanced spiritual performance this week. Keep striving to increase congregation prayers and maintain daily Azkar for more blessings.';
        alertColor = colors.accentTint;
        textThemeColor = colors.accentDeep;
      }
    }

    return {
      congregationCount,
      individualCount,
      missedCount,
      totalPrayersLogged,
      fajrOnTimeCount,
      morningAzkarCount,
      eveningAzkarCount,
      totalDaysWithLogs,
      congregationPct,
      individualPct,
      missedPct,
      assessmentAr,
      assessmentEn,
      alertColor,
      textThemeColor,
    };
  }, [weeklyHistory, colors]);

  useEffect(() => {
    loadProfile();
    loadDailyLogs();
    if (navigation) {
      const unsubscribe = navigation.addListener('focus', () => {
        loadProfile();
        loadDailyLogs();
      });
      return unsubscribe;
    }
  }, [user?.uid, navigation]);

  const saveDailyLogs = async (
    updatedPrayers = prayers,
    updatedDeeds = deeds,
    updatedPledge = pledged
  ) => {
    try {
      const data = {
        prayers: updatedPrayers,
        deeds: updatedDeeds,
        pledged: updatedPledge,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(`accountability-log-${todayStr}`, JSON.stringify(data));

      const currentTotal =
        Object.values(updatedPrayers).filter(val => val === 'congregation' || val === 'individual').length +
        Object.values(updatedDeeds).filter(Boolean).length;

      setWeeklyHistory(prev => prev.map(h => (h.dateStr === todayStr ? { ...h, completedCount: currentTotal } : h)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleTogglePrayer = (prayerKey: string, status: 'congregation' | 'individual' | 'missed') => {
    const updated = {
      ...prayers,
      [prayerKey]: prayers[prayerKey] === status ? null : status,
    };
    setPrayers(updated);
    saveDailyLogs(updated, deeds, pledged);
  };

  const handleToggleDeed = (deedKey: string) => {
    const updated = {
      ...deeds,
      [deedKey]: !deeds[deedKey],
    };
    setDeeds(updated);
    saveDailyLogs(prayers, updated, pledged);
  };

  const handleTogglePledge = () => {
    const updated = !pledged;
    setPledged(updated);
    saveDailyLogs(prayers, deeds, updated);
    if (updated) {
      Alert.alert(
        language === 'ar' ? 'ميثاق الصدق 🤝' : 'Pledge of Honesty 🤝',
        language === 'ar'
          ? 'عاهدت الله تعالى على الصدق والأمانة في تدوين عبادتك اليومية.'
          : 'You have pledged before Allah to record your daily worship with total honesty.'
      );
    }
  };

  const handleDeleteSaved = async (id: string) => {
    Alert.alert(
      language === 'ar' ? 'حذف التلاوة 🗑️' : 'Delete Recitation 🗑️',
      language === 'ar'
        ? 'هل أنت متأكد من حذف هذه التلاوة المحفوظة لتوفير مساحة في حقيبتك؟'
        : 'Are you sure you want to delete this saved recitation to free up slots?',
      [
        { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: language === 'ar' ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedList = savedRecitations.filter((r: any) => r.id !== id);
              setSavedRecitations(updatedList);
              await AsyncStorage.setItem('saved-recitations-list', JSON.stringify(updatedList));
            } catch (err) {
              console.error(err);
            }
          },
        },
      ]
    );
  };

  const handleEquipTitle = async (titleId: string) => {
    if (!user?.uid) return;
    try {
      const updated = await equipUserTitle(user.uid, titleId);
      setProfile(updated);
      updateUserFields({ activeTitle: updated.activeTitle });
      Alert.alert(
        language === 'ar' ? 'تم بنجاح!' : 'Success!',
        language === 'ar' ? 'تم تجهيز لقبك الجديد بنجاح.' : 'Equipped your new title successfully.'
      );
    } catch (err) {
      console.error(err);
    }
  };

  const currentScore = profile?.score ?? 0;

  const levelName = useMemo(() => {
    if (currentScore >= 500) return language === 'ar' ? 'البطل الأسطوري' : 'Legendary Hero';
    if (currentScore >= 200) return language === 'ar' ? 'بطل ذهبي' : 'Gold Hero';
    if (currentScore >= 80) return language === 'ar' ? 'بطل فضي' : 'Silver Hero';
    return language === 'ar' ? 'بطل مبتدئ' : 'Novice Hero';
  }, [currentScore, language]);

  const formattedDate = useMemo(() => {
    if (!profile?.lastPlayedAt) return language === 'ar' ? 'لم تلعب بعد' : 'No activity yet';
    try {
      const date = new Date(profile.lastPlayedAt);
      return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return language === 'ar' ? 'تاريخ غير معروف' : 'Unknown date';
    }
  }, [profile?.lastPlayedAt, language]);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        language === 'ar' ? 'صلاحية الأستوديو' : 'Gallery Permission',
        language === 'ar'
          ? 'الرجاء تمكين الوصول للأستوديو لاختيار صورة.'
          : 'Please enable gallery access in settings to upload a photo.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      const photoUri = result.assets[0].uri;
      if (user?.uid) {
        try {
          await updateUserPhoto(user.uid, photoUri);
          updateUserFields({ photoUri });
          setProfile((prev: any) => ({ ...prev, photoUri }));
        } catch (err) {
          console.error('Error saving user photo:', err);
        }
      }
    }
  };

  const handleSelectCountry = async (countryCode: string) => {
    if (!user?.uid) return;
    try {
      const selected = countriesList.find(c => c.code === countryCode);
      const countryName = selected ? (language === 'ar' ? selected.nameAr : selected.nameEn) : countryCode;
      await updateUserCountry(user.uid, countryName, countryCode);
      updateUserFields({ country: countryCode });
      setProfile((prev: any) => (prev ? { ...prev, country: countryCode } : { country: countryCode }));
      Alert.alert(
        language === 'ar' ? 'تم التحديث!' : 'Updated!',
        language === 'ar' ? 'تم تحديث بلدك بنجاح.' : 'Your country was updated successfully.'
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      language === 'ar' ? 'تسجيل الخروج 🚪' : 'Logout 🚪',
      language === 'ar'
        ? 'هل أنت متأكد من أنك تريد تسجيل الخروج من حسابك؟'
        : 'Are you sure you want to log out of your account?',
      [
        { text: language === 'ar' ? 'إلغاء' : 'Cancel', style: 'cancel' },
        { text: language === 'ar' ? 'خروج' : 'Logout', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return {
    user,
    profile,
    loading,
    error,
    unlockedBadgeIds,
    savedRecitations,
    prayers,
    deeds,
    pledged,
    weeklyHistory,
    weeklyAnalytics,
    selectedArtifact,
    setSelectedArtifact,
    currentScore,
    levelName,
    formattedDate,
    loadProfile,
    loadDailyLogs,
    handleTogglePrayer,
    handleToggleDeed,
    handleTogglePledge,
    handleDeleteSaved,
    handleEquipTitle,
    handlePickAvatar,
    handleSelectCountry,
    handleLogout,
  };
}
