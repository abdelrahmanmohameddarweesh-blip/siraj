import CinematicSectionHeader from '../components/CinematicSectionHeader';
import CinematicPortal from '../components/CinematicPortal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { prayers, PrayerInfo } from '../data/prayers';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { usePrayer } from '../prayer/PrayerContext';
import { PREDEFINED_CITIES, PredefinedCity } from '../prayer/cities';
import { formatPrayerClock } from '../prayer/prayerTimesService';
import { CalculationMethodName, MadhabName, PrayerKey } from '../prayer/types';
import { PrayerCheckinSheet, describeCheckin } from '../components/prayer/PrayerCheckinSheet';

const METHOD_LABELS: Record<CalculationMethodName, { ar: string; en: string }> = {
  Egyptian: { ar: 'الهيئة المصرية العامة للمساحة', en: 'Egyptian General Authority' },
  UmmAlQura: { ar: 'أم القرى - مكة المكرمة', en: 'Umm Al-Qura, Makkah' },
  MuslimWorldLeague: { ar: 'رابطة العالم الإسلامي', en: 'Muslim World League' },
  NorthAmerica: { ar: 'الجمعية الإسلامية لأمريكا الشمالية', en: 'Islamic Society of North America (ISNA)' },
  Karachi: { ar: 'جامعة العلوم الإسلامية بكراتشي', en: 'University of Islamic Sciences, Karachi' },
  Dubai: { ar: 'دبي - الإمارات', en: 'Dubai, UAE' },
  Qatar: { ar: 'قطر', en: 'Qatar' },
  Kuwait: { ar: 'الكويت', en: 'Kuwait' },
};

export default function PrayerTrackerScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const {
    location,
    method,
    madhab,
    todayTimes,
    rollingWeek,
    windowInfo,
    notificationConfig,
    checkins,
    isRestDayToday,
    changeCity,
    changeMethod,
    changeMadhab,
    detectLocation,
    updateNotifications,
    requestNotifications,
    toggleRestDay,
  } = usePrayer();

  // Modals state
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'city' | 'method' | 'notifications'>('city');
  const [detectingGps, setDetectingGps] = useState(false);

  // Check-in Sheet state
  const [checkinModalVisible, setCheckinModalVisible] = useState(false);
  const [selectedPrayerForCheckin, setSelectedPrayerForCheckin] = useState<
    'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
  >('dhuhr');

  const todayStr = todayTimes.dateStr;

  // Next prayer
  const nextPrayerKey = windowInfo.nextPrayer;
  const nextPrayerInfo = prayers.find((p) => p.id === nextPrayerKey) || prayers[0];
  const nextPrayerTime = nextPrayerKey && todayTimes[nextPrayerKey]
    ? formatPrayerClock(todayTimes[nextPrayerKey], language === 'ar' ? 'ar' : 'en')
    : '--:--';

  // Completed count for today
  const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
  const completedCount = prayerKeys.reduce((acc, k) => {
    return acc + (checkins[`${k}_${todayStr}`] ? 1 : 0);
  }, 0);

  const handleOpenCheckin = (prayerId: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => {
    setSelectedPrayerForCheckin(prayerId);
    setCheckinModalVisible(true);
  };

  // opened from «هل صليت الظهر؟»: go straight to that prayer's check-in
  React.useEffect(() => {
    const p = route?.params?.checkin;
    if (p && ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].includes(p)) handleOpenCheckin(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.checkin]);

  const handleGpsDetect = async () => {
    setDetectingGps(true);
    try {
      const granted = await detectLocation();
      if (!granted) {
        Alert.alert(
          language === 'ar' ? 'إذن الموقع' : 'Location Permission',
          language === 'ar'
            ? 'تم رفض إذن الموقع، تم الاحتفاظ بالمدينة الحالية لتحديد مواقيت الصلاة بدقة.'
            : 'Location permission was denied. Current city is retained.'
        );
      }
    } finally {
      setDetectingGps(false);
    }
  };

  const handleTogglePrayerNotification = async (prayerId: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => {
    if (!notificationConfig) return;
    const current = notificationConfig[prayerId]?.enabled;
    await updateNotifications({
      [prayerId]: {
        ...notificationConfig[prayerId],
        enabled: !current,
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerStyle, { paddingTop: Math.max(insets.top, 12) + 8, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.textPrimary}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: [{ scaleX: language === 'ar' ? -1 : 1 }] }}
          >
            <Path d="m15 18-6-6 6-6" />
          </Svg>
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {language === 'ar' ? 'الصلوات الخمس' : 'Daily Prayers'}
        </Text>

        <TouchableOpacity
          style={styles.settingsIconBtn}
          onPress={() => setSettingsVisible(true)}
          activeOpacity={0.7}
        >
          <Svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.textPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="3" />
            <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]} showsVerticalScrollIndicator={false}>
        <CinematicPortal scene="mosque" compact title={language === 'ar' ? 'رحلتي مع الصلاة' : 'My Prayer Journey'} subtitle={language === 'ar' ? 'تابع صلواتك الخمس واستمرّ كل يوم' : 'Track the five daily prayers and build consistency'} />
        {/* Quick Location & Method Strip */}
        <TouchableOpacity
          style={[styles.locationStrip, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setSettingsVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.locationTextCol}>
            <Text style={[styles.locationTitle, { color: colors.textPrimary }]}>
              📍 {language === 'ar' ? location.cityNameAr : location.cityNameEn}، {language === 'ar' ? location.countryNameAr : location.countryNameEn}
            </Text>
            <Text style={[styles.methodSubtitle, { color: colors.textSecondary }]}>
              {METHOD_LABELS[method]?.[language === 'ar' ? 'ar' : 'en'] || method} • {madhab === 'hanafi' ? (language === 'ar' ? 'المذهب الحنفي' : 'Hanafi') : (language === 'ar' ? 'جمهور الفقهاء (الشافعي)' : 'Shafi/Standard')}
            </Text>
          </View>
          <View style={[styles.settingsBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.settingsBadgeText, { color: colors.primaryDeep }]}>
              {language === 'ar' ? 'تعديل ⚙️' : 'Edit ⚙️'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Rest Day Banner */}
        {isRestDayToday && (
          <View style={[styles.restDayNotice, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}>
            <Text style={styles.restDayNoticeEmoji}>🌿</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.restDayNoticeTitle}>
                {language === 'ar' ? 'يوم راحة مبارك' : 'Rest Day Active'}
              </Text>
              <Text style={styles.restDayNoticeDesc}>
                {language === 'ar'
                  ? 'تم إيقاف تتبع الصلوات لليوم بناءً على رغبتك دون كسر التتابع ودون أي نقص في رصيدك.'
                  : 'Prayer tracking paused for today without breaking streaks or penalties.'}
              </Text>
            </View>
            <TouchableOpacity onPress={toggleRestDay} style={styles.cancelRestBtn}>
              <Text style={styles.cancelRestBtnText}>
                {language === 'ar' ? 'استئناف' : 'Resume'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Summary Hero Card */}
        <View style={styles.heroShadowWrapper}>
          <LinearGradient
            colors={['#0B4F44', '#04342C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroCol}>
                <Text style={styles.heroLabel}>
                  {language === 'ar' ? 'صلوات اليوم' : "Today's Prayers"}
                </Text>
                <Text style={styles.heroVal}>{completedCount} من ٥</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroCol}>
                <Text style={styles.heroLabel}>
                  {language === 'ar' ? 'الصلاة القادمة' : 'Next Prayer'}
                </Text>
                <Text style={styles.heroVal}>{nextPrayerInfo.name} · {nextPrayerTime}</Text>
              </View>
            </View>

            {/* Time Remaining Hint */}
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownBadgeText}>
                ⏳ {language === 'ar' ? `متبقي على الأذان: ${windowInfo.timeRemainingFormatted}` : `Time remaining: ${windowInfo.timeRemainingFormatted}`}
              </Text>
            </View>

            {/* Progress Track */}
            <View style={styles.progressTrackBg}>
              <LinearGradient
                colors={['#F2C66D', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressTrackFill, { width: `${(completedCount / 5) * 100}%` }]}
              />
            </View>

            {/* Rest Day Action Button */}
            {!isRestDayToday && (
              <TouchableOpacity
                style={styles.restDayActionBtn}
                onPress={toggleRestDay}
                activeOpacity={0.8}
              >
                <Text style={styles.restDayActionText}>
                  {language === 'ar' ? 'خذ استراحة اليوم (يوم راحة 🌿)' : 'Take a Rest Day 🌿'}
                </Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>

        {/* List of 5 Prayers */}
        <View style={styles.prayerList}>
          {prayers.map((prayer) => {
            const prayerKey = prayer.id as 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
            const prayerTimeDate = todayTimes[prayerKey];
            const timeStr = prayerTimeDate
              ? formatPrayerClock(prayerTimeDate, language === 'ar' ? 'ar' : 'en')
              : '--:--';

            const checkinRecord = checkins[`${prayerKey}_${todayStr}`];
            const isChecked = !!checkinRecord;
            const isNext = nextPrayerKey === prayerKey;
            const isActive = windowInfo.activePrayer === prayerKey;
            const notifEnabled = notificationConfig?.[prayerKey]?.enabled ?? true;

            return (
              <TouchableOpacity
                key={prayer.id}
                style={[
                  styles.prayerCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isActive && { borderColor: '#F2C66D', borderWidth: 2 },
                  isChecked && { borderColor: '#0B4F44' },
                ]}
                onPress={() => handleOpenCheckin(prayerKey)}
                activeOpacity={0.85}
              >
                {/* Status indicator on the side */}
                <View style={styles.prayerCardSide}>
                  <View
                    style={[
                      styles.statusCircle,
                      isChecked && { backgroundColor: '#0B4F44', borderColor: '#0B4F44' },
                      isActive && !isChecked && { borderColor: '#F2C66D', backgroundColor: '#FFFBEB' },
                    ]}
                  >
                    {isChecked ? (
                      <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <Path d="M20 6 9 17l-5-5" />
                      </Svg>
                    ) : isActive ? (
                      <Text style={{ fontSize: 11 }}>⏳</Text>
                    ) : null}
                  </View>
                </View>

                {/* Main Prayer Info */}
                <View style={styles.prayerInfoCol}>
                  <View style={styles.prayerTitleRow}>
                    <Text style={[styles.prayerName, { color: colors.textPrimary }]}>
                      {prayer.name}
                    </Text>
                    <View style={styles.timeTag}>
                      <Text style={styles.timeTagText}>{timeStr}</Text>
                    </View>
                    <Text style={[styles.rakatChip, { backgroundColor: colors.neutralTint || '#F3F4F6', color: colors.textSecondary }]}>
                      {prayer.rakats === 2 ? 'ركعتان' : `${prayer.rakats} ركعات`}
                    </Text>
                  </View>

                  {/* Subline status / Hadith */}
                  {isChecked ? (
                    <View style={styles.checkinBadgeRow}>
                      <View style={styles.checkinBadgeSuccess}>
                        <Text style={styles.checkinBadgeSuccessText}>
                          {describeCheckin(checkinRecord)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={[styles.sublineText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {isActive
                        ? (language === 'ar' ? 'الوقت حاضر الآن • اضغط للتفقد ✍️' : 'Active prayer time • Tap to check in ✍️')
                        : prayer.hadith}
                    </Text>
                  )}
                </View>

                {/* Bell notification quick toggle */}
                <TouchableOpacity
                  style={styles.bellBtn}
                  onPress={() => handleTogglePrayerNotification(prayerKey)}
                  activeOpacity={0.7}
                >
                  <Svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={notifEnabled ? '#F2C66D' : 'none'}
                    stroke={notifEnabled ? '#D97706' : colors.textSecondary}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </Svg>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 7-Day Rolling Schedule Overview */}
        <View style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyCountText, { color: colors.primaryDeep }]}>
              {language === 'ar' ? 'مواقيت الأسبوع القادم' : 'Rolling 7-Day Window'}
            </Text>
            <Text style={[styles.historyTitleText, { color: colors.textPrimary }]}>
              {language === 'ar' ? 'الجدول الزمني 📅' : 'Schedule 📅'}
            </Text>
          </View>

          <View style={styles.rollingList}>
            {rollingWeek.map((day) => {
              const isToday = day.dateStr === todayStr;
              return (
                <View
                  key={day.dateStr}
                  style={[
                    styles.rollingRow,
                    isToday && { backgroundColor: colors.primaryLight || '#E6F4EA', borderRadius: 8 },
                  ]}
                >
                  <Text style={[styles.rollingDateText, { color: isToday ? colors.primaryDeep : colors.textPrimary }]}>
                    {isToday ? (language === 'ar' ? 'اليوم' : 'Today') : day.dateStr}
                  </Text>
                  <Text style={[styles.rollingTimeText, { color: colors.textSecondary }]}>
                    {formatPrayerClock(day.fajr, 'ar')} • {formatPrayerClock(day.dhuhr, 'ar')} • {formatPrayerClock(day.maghrib, 'ar')}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Settings Modal (City, Method, Notifications) */}
      <Modal visible={settingsVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSettingsVisible(false)} style={styles.modalCloseBtn}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {language === 'ar' ? 'إعدادات المواقيت والتنبيهات' : 'Prayer & Notification Settings'}
              </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeSettingsTab === 'city' && styles.tabBtnActive]}
                onPress={() => setActiveSettingsTab('city')}
              >
                <Text style={[styles.tabBtnText, activeSettingsTab === 'city' && styles.tabBtnTextActive]}>
                  {language === 'ar' ? 'المدينة والموقع' : 'City & Location'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeSettingsTab === 'method' && styles.tabBtnActive]}
                onPress={() => setActiveSettingsTab('method')}
              >
                <Text style={[styles.tabBtnText, activeSettingsTab === 'method' && styles.tabBtnTextActive]}>
                  {language === 'ar' ? 'طريقة الحساب' : 'Method & Madhab'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeSettingsTab === 'notifications' && styles.tabBtnActive]}
                onPress={() => setActiveSettingsTab('notifications')}
              >
                <Text style={[styles.tabBtnText, activeSettingsTab === 'notifications' && styles.tabBtnTextActive]}>
                  {language === 'ar' ? 'التنبيهات' : 'Notifications'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab 1: City & Location */}
            {activeSettingsTab === 'city' && (
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[styles.gpsDetectBtn, { backgroundColor: colors.primaryDeep }]}
                  onPress={handleGpsDetect}
                  disabled={detectingGps}
                >
                  {detectingGps ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.gpsDetectBtnText}>
                      {language === 'ar' ? '🛰️ تحديد موقعي الحالي تلقائياً' : '🛰️ Auto-detect My Location'}
                    </Text>
                  )}
                </TouchableOpacity>

                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'أو اختر مدينتك يدوياً:' : 'Or choose your city manually:'}
                </Text>

                <FlatList
                  data={PREDEFINED_CITIES}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => {
                    const isSelected = location.cityNameAr === item.cityNameAr;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.cityItem,
                          isSelected && { backgroundColor: colors.primaryLight },
                        ]}
                        onPress={async () => {
                          await changeCity(item);
                          setSettingsVisible(false);
                        }}
                      >
                        <Text style={[styles.cityName, { color: colors.textPrimary }]}>
                          {language === 'ar' ? item.cityNameAr : item.cityNameEn} ({language === 'ar' ? item.countryNameAr : item.countryNameEn})
                        </Text>
                        {isSelected && <Text style={{ color: colors.primaryDeep, fontWeight: 'bold' }}>✓</Text>}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            {/* Tab 2: Method & Madhab */}
            {activeSettingsTab === 'method' && (
              <ScrollView style={{ flex: 1 }}>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  {language === 'ar' ? 'طريقة حساب المواقيت:' : 'Calculation Method:'}
                </Text>
                {(Object.keys(METHOD_LABELS) as CalculationMethodName[]).map((mKey) => (
                  <TouchableOpacity
                    key={mKey}
                    style={[
                      styles.methodItem,
                      method === mKey && { backgroundColor: colors.primaryLight, borderColor: colors.primaryDeep },
                    ]}
                    onPress={() => changeMethod(mKey)}
                  >
                    <Text style={[styles.methodNameText, { color: colors.textPrimary }]}>
                      {METHOD_LABELS[mKey][language === 'ar' ? 'ar' : 'en']}
                    </Text>
                    {method === mKey && <Text style={{ color: colors.primaryDeep, fontWeight: 'bold' }}>✓</Text>}
                  </TouchableOpacity>
                ))}

                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginTop: 16 }]}>
                  {language === 'ar' ? 'المذهب الفقهي (تحديد وقت صلاة العصر):' : 'Madhab (Asr Prayer Time):'}
                </Text>
                <View style={styles.madhabRow}>
                  <TouchableOpacity
                    style={[
                      styles.madhabOption,
                      madhab === 'shafii' && { backgroundColor: colors.primaryDeep },
                    ]}
                    onPress={() => changeMadhab('shafii')}
                  >
                    <Text style={[styles.madhabText, madhab === 'shafii' && { color: '#FFF' }]}>
                      {language === 'ar' ? 'الجمهور (الشافعي، المالكي، الحنبلي)' : 'Shafi, Maliki, Hanbali'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.madhabOption,
                      madhab === 'hanafi' && { backgroundColor: colors.primaryDeep },
                    ]}
                    onPress={() => changeMadhab('hanafi')}
                  >
                    <Text style={[styles.madhabText, madhab === 'hanafi' && { color: '#FFF' }]}>
                      {language === 'ar' ? 'الحنفي (مثلان)' : 'Hanafi'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}

            {/* Tab 3: Notifications */}
            {activeSettingsTab === 'notifications' && (
              <ScrollView style={{ flex: 1 }}>
                <TouchableOpacity
                  style={[styles.notifToggleRow, { borderColor: colors.border }]}
                  onPress={async () => {
                    if (!notificationConfig?.notificationsEnabled) {
                      await requestNotifications();
                    } else {
                      await updateNotifications({ notificationsEnabled: false });
                    }
                  }}
                >
                  <Text style={[styles.notifToggleTitle, { color: colors.textPrimary }]}>
                    {language === 'ar' ? 'تفعيل تنبيهات الصلاة العامة' : 'Enable Prayer Reminders'}
                  </Text>
                  <Text style={{ fontSize: 18 }}>
                    {notificationConfig?.notificationsEnabled ? '🔔 مفعلة' : '🔕 معطلة'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.notifToggleRow, { borderColor: colors.border }]}
                  onPress={() =>
                    updateNotifications({
                      quietHoursEnabled: !notificationConfig?.quietHoursEnabled,
                    })
                  }
                >
                  <View>
                    <Text style={[styles.notifToggleTitle, { color: colors.textPrimary }]}>
                      {language === 'ar' ? 'ساعات الهدوء 🌙' : 'Quiet Hours 🌙'}
                    </Text>
                    <Text style={[styles.methodSubtitle, { color: colors.textSecondary }]}>
                      {language === 'ar' ? 'كتم تنبيهات التفقد أثناء ساعات النوم' : 'Silence check-in prompts during sleep'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18 }}>
                    {notificationConfig?.quietHoursEnabled ? '✅' : '○'}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, marginTop: 16 }]}>
                  {language === 'ar' ? 'التنبيه لكل صلاة مفردة:' : 'Per-prayer reminders:'}
                </Text>
                {prayerKeys.map((pKey) => {
                  const cfg = notificationConfig?.[pKey];
                  const isEn = cfg?.enabled ?? true;
                  return (
                    <TouchableOpacity
                      key={pKey}
                      style={[styles.notifToggleRow, { borderColor: colors.border }]}
                      onPress={() => handleTogglePrayerNotification(pKey)}
                    >
                      <Text style={[styles.notifToggleTitle, { color: colors.textPrimary }]}>
                        {prayers.find((p) => p.id === pKey)?.name}
                      </Text>
                      <Text style={{ fontSize: 16 }}>{isEn ? '🔔 مفعل' : '🔕 صامت'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Prayer Check-in Bottom Sheet Modal */}
      <PrayerCheckinSheet
        visible={checkinModalVisible}
        prayer={selectedPrayerForCheckin}
        onClose={() => setCheckinModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerStyle: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  backBtn: {
    padding: 6,
  },
  settingsIconBtn: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 28,
  },
  locationStrip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  locationTextCol: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  methodSubtitle: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 2,
  },
  settingsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  settingsBadgeText: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  restDayNotice: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  restDayNoticeEmoji: {
    fontSize: 22,
  },
  restDayNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  restDayNoticeDesc: {
    fontSize: 11,
    color: '#388E3C',
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 2,
  },
  cancelRestBtn: {
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cancelRestBtnText: {
    fontSize: 11,
    color: '#1B5E20',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  heroShadowWrapper: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 10,
  },
  heroCard: {
    borderRadius: 16,
    padding: 14,
  },
  heroTopRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  heroCol: {
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  heroVal: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    marginTop: 4,
  },
  countdownBadge: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  countdownBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  progressTrackBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressTrackFill: {
    height: '100%',
    borderRadius: 4,
  },
  restDayActionBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
  },
  restDayActionText: {
    color: '#F2C66D',
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  prayerList: {
    gap: 10,
    marginBottom: 16,
  },
  prayerCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  prayerCardSide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerInfoCol: {
    flex: 1,
  },
  prayerTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  prayerName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  timeTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  timeTagText: {
    fontSize: 11,
    color: '#1F2937',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  rakatChip: {
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  sublineText: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Regular',
    marginTop: 4,
  },
  checkinBadgeRow: {
    marginTop: 4,
  },
  checkinBadgeSuccess: {
    alignSelf: 'flex-start',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  checkinBadgeSuccessText: {
    color: '#0B4F44',
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  bellBtn: {
    padding: 6,
  },
  historyCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  historyHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitleText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  historyCountText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  rollingList: {
    gap: 8,
  },
  rollingRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  rollingDateText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  rollingTimeText: {
    fontSize: 11,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
    minHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6B7280',
  },
  tabsRow: {
    flexDirection: 'row-reverse',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  tabBtnTextActive: {
    color: '#0B4F44',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  gpsDetectBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  gpsDetectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic-Medium',
    marginBottom: 8,
  },
  cityItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cityName: {
    fontSize: 13,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  methodItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  methodNameText: {
    fontSize: 12,
    fontFamily: 'IBMPlexSansArabic-Regular',
  },
  madhabRow: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  madhabOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  madhabText: {
    fontSize: 11,
    color: '#374151',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
  },
  notifToggleRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  notifToggleTitle: {
    fontSize: 13,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
});
