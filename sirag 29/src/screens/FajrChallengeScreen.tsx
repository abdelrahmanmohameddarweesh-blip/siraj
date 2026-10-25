import CinematicQuestBanner from '../components/CinematicQuestBanner';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { saveUserScore, getCurrentUserProfile } from '../firebase/auth';
import { Colors } from '../config/colors';

const FAJR_STREAK_KEY = 'batl-muslim-fajr-streak-v1';
const FAJR_LAST_DATE_KEY = 'batl-muslim-fajr-last-date-v1';

export default function FajrChallengeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  useEffect(() => {
    const loadFajrStatus = async () => {
      setLoading(true);
      try {
        const todayStr = getTodayString();
        const lastDate = await AsyncStorage.getItem(FAJR_LAST_DATE_KEY);
        const storedStreak = await AsyncStorage.getItem(FAJR_STREAK_KEY);

        if (storedStreak) {
          setStreak(parseInt(storedStreak, 10));
        }

        if (lastDate === todayStr) {
          setIsCompletedToday(true);
        }

        if (user?.uid) {
          const currentProfile = await getCurrentUserProfile(user.uid);
          setProfile(currentProfile);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFajrStatus();
  }, [user?.uid]);

  const handleConfirmFajr = async () => {
    if (saving || isCompletedToday) return;

    setSaving(true);
    try {
      const todayStr = getTodayString();
      const lastDate = await AsyncStorage.getItem(FAJR_LAST_DATE_KEY);
      let nextStreak = streak;

      // Calculate streak logic
      if (lastDate) {
        const lastDateObj = new Date(lastDate);
        const todayObj = new Date(todayStr);
        const diffTime = Math.abs(todayObj.getTime() - lastDateObj.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          nextStreak += 1;
        } else if (diffDays > 1) {
          nextStreak = 1; // Streak broken, reset to 1
        }
      } else {
        nextStreak = 1; // First time
      }

      await AsyncStorage.setItem(FAJR_LAST_DATE_KEY, todayStr);
      await AsyncStorage.setItem(FAJR_STREAK_KEY, nextStreak.toString());
      setStreak(nextStreak);
      setIsCompletedToday(true);

      // Award +20 points
      if (user?.uid && profile) {
        const newScore = (profile.score ?? 0) + 20;
        await saveUserScore(user.uid, newScore);
        setProfile({ ...profile, score: newScore });
      }

      Alert.alert('تقبل الله منك! 🌅', `تم تسجيل صلاة الفجر اليوم. رصيدك الحالي زاد بمقدار ٢٠ نقطة.\nمتتالية صلاة الفجر: ${nextStreak} أيام.`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <CinematicQuestBanner chapter={16} icon="☀" titleAr="نور الفجر" titleEn="Light of Fajr" descriptionAr="ابدأ يومك بنية صادقة، وتابع مواظبتك على الصلاة" descriptionEn="Begin with intention and follow your prayer consistency" compact />
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.content}>
          {/* Streak details card */}
          <View style={styles.card}>
            <Text style={styles.streakEmoji}>🌅</Text>
            <Text style={styles.streakLabel}>متتالية صلاة الفجر</Text>
            <Text style={styles.streakCount}>{streak} أيام متواصلة</Text>
            <Text style={styles.pointsLabel}>النقاط الحالية: {profile?.score ?? 0} نقطة</Text>
          </View>

          {/* Active button confirm */}
          {isCompletedToday ? (
            <View style={styles.completedCard}>
              <Text style={styles.completedIcon}>✓</Text>
              <Text style={styles.completedText}>الحمد لله، تم تأكيد صلاة الفجر اليوم!</Text>
              <Text style={styles.completedSub}>عد غداً لتأكيد صلاة الفجر الجديدة والحفاظ على متتاليتك.</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmFajr} activeOpacity={0.85} disabled={saving}>
              <Text style={styles.confirmButtonText}>صليت الفجر في وقتها اليوم 🌅</Text>
            </TouchableOpacity>
          )}

          {/* Hadith Section */}
          <View style={styles.hadithCard}>
            <Text style={styles.hadithTitle}>من فضائل صلاة الفجر:</Text>
            <Text style={styles.hadithText}>
              قال رسول الله ﷺ: «مَنْ صَلَّى صَلَاةَ الصُّبْحِ فَهُو فِي ذِمَّةِ اللَّهِ، فَلَا يَطْلُبَنَّكُمُ اللَّهُ مِنْ ذِمَّتِهِ بِشَيْءٍ» [صحيح مسلم]
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  loader: {
    marginTop: 40,
  },
  content: {
    flex: 1,
    gap: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  streakEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  streakLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  streakCount: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 10,
  },
  pointsLabel: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '700',
  },
  confirmButton: {
    backgroundColor: Colors.accent,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmButtonText: {
    color: Colors.surface,
    fontWeight: '800',
    fontSize: 16,
  },
  completedCard: {
    backgroundColor: '#F0F9F4',
    borderWidth: 1,
    borderColor: Colors.primary + '33',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  completedIcon: {
    fontSize: 32,
    color: Colors.primary,
    fontWeight: '900',
    marginBottom: 8,
  },
  completedText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  completedSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  hadithCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '22',
  },
  hadithTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'right',
    marginBottom: 6,
  },
  hadithText: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.primary,
    textAlign: 'right',
    fontStyle: 'italic',
  },
});
