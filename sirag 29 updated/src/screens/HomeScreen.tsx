import JourneyPassport from '../components/JourneyPassport';
import CinematicPortal from '../components/CinematicPortal';
import React, { useState } from 'react';
import CinematicFeatureAtlas from '../components/CinematicFeatureAtlas';
import { View, ScrollView, RefreshControl, StyleSheet, Modal, Text, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeColors, HomeRadii, HomeSpacing, HomeTypography } from '../theme/tokens';
import { useHomeData } from '../hooks/useHomeData';
import { HomeHeader } from '../components/home/HomeHeader';
import { NextPrayerCard } from '../components/home/NextPrayerCard';
import { DailyPathCard } from '../components/home/DailyPathCard';
import { HabitCard } from '../components/home/HabitCard';
import { SectionHeader } from '../components/home/SectionHeader';
import { MiniAppGrid } from '../components/home/MiniAppGrid';
import { HomeSkeleton } from '../components/home/HomeSkeleton';
import { PrayerCheckinSheet } from '../components/prayer/PrayerCheckinSheet';
import { PREDEFINED_CITIES } from '../prayer/cities';
import { CinematicWelcome, CinematicQuickAccess, CinematicWorlds, CinematicArena } from '../components/home/CinematicHome';
import { useGuestPreferences } from '../hooks/useGuestPreferences';

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const d = useHomeData();
  const preferences = useGuestPreferences();
  const [activePrayer, setActivePrayer] = useState<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | null>(null);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: HomeSpacing.screenTop + insets.top, paddingBottom: HomeSpacing.bottomNavHeight + insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={d.isRefreshing} onRefresh={d.onRefresh} tintColor={HomeColors.primary} colors={[HomeColors.primary]} />}
      >
        {d.isLoading ? <HomeSkeleton /> : (
          <>
            <View style={styles.siragHeader}>
              <Text style={styles.siragName}>سِراج · Sirag</Text>
              <Text style={styles.siragSubtitle}>{d.language === 'ar' ? 'كل عمل طيب يترك أثرًا' : 'Every good action leaves a mark'}</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={d.language === 'ar' ? 'ادخل صحرائي' : 'Enter my desert'} onPress={() => navigation.navigate('SandWorld')} style={styles.desertPortal}>
              <Text style={styles.desertIcon}>🌱  🌴  💧</Text>
              <Text style={styles.desertTitle}>{d.language === 'ar' ? 'صحرائي الحية' : 'My Living Desert'}</Text>
              <Text style={styles.desertCopy}>{d.language === 'ar' ? 'ازرع بذرتك، اسقها بلمسك، وشاهد واحتك تنمو' : 'Plant, water by touch, and watch your oasis grow'}</Text>
              <Text style={styles.desertAction}>{d.language === 'ar' ? 'ادخل العالم ←' : 'Enter the world →'}</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>{d.language === 'ar' ? 'الصلوات الخمس' : 'Five daily prayers'}</Text>
            <NextPrayerCard
              nextPrayerName={d.nextPrayerName}
              countdown={d.countdown}
              cityName={d.cityName}
              methodName={d.methodName}
              isLocationGranted={d.isLocationGranted}
              prayers={d.prayers}
              onPressCard={() => navigation.navigate('PrayerTracker')}
              onPressPrayer={(id) => setActivePrayer(id)}
              onPressSelectCity={() => setCityPickerVisible(true)}
              language={d.language}
            />
            <Text style={styles.sectionTitle}>{d.language === 'ar' ? 'عباداتي اليوم' : 'My worship today'}</Text>
            <View style={styles.worshipLinks}>
              {[
                { route: 'QuranReader', ar: '📖  القرآن الكريم', en: '📖  Quran' },
                { route: 'Adhkar', ar: '🌿  الأذكار', en: '🌿  Adhkar' },
                { route: 'PrayerTracker', ar: '🕌  متابعة الصلاة', en: '🕌  Prayer tracker' },
                { route: 'HabitGarden', ar: '🌱  عاداتي', en: '🌱  Habits' },
              ].map(item => <TouchableOpacity key={item.route} style={styles.worshipLink} onPress={() => navigation.navigate(item.route)}><Text style={styles.worshipText}>{d.language === 'ar' ? item.ar : item.en}</Text><Text style={styles.worshipArrow}>›</Text></TouchableOpacity>)}
            </View>
          </>
        )}
      </ScrollView>

      {activePrayer && <PrayerCheckinSheet visible={!!activePrayer} prayer={activePrayer} onClose={() => setActivePrayer(null)} />}

      <Modal visible={cityPickerVisible} transparent animationType="slide" onRequestClose={() => setCityPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{d.language === 'ar' ? 'اختر مدينتك' : 'Select City'}</Text>
              <TouchableOpacity onPress={() => setCityPickerVisible(false)} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="إغلاق">
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={PREDEFINED_CITIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityItem}
                  onPress={async () => {
                    await d.changeCity(item);
                    setCityPickerVisible(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.cityNameAr}
                >
                  <Text style={styles.cityText}>{d.language === 'ar' ? item.cityNameAr : item.cityNameEn} ({d.language === 'ar' ? item.countryNameAr : item.countryNameEn})</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#041F1C' },
  siragHeader: { alignItems: 'center', paddingTop: 4, gap: 3 },
  siragName: { color: '#F3D49A', fontSize: 28, fontWeight: '800' },
  siragSubtitle: { color: '#E6DCC6', fontSize: 12 },
  desertPortal: { minHeight: 185, backgroundColor: '#1C4D3B', borderColor: '#BDA16D', borderWidth: 1, borderRadius: 24, padding: 20, justifyContent: 'center', alignItems: 'center', gap: 9 },
  desertIcon: { fontSize: 35 },
  desertTitle: { fontSize: 23, fontWeight: '800', color: '#F6D79B' },
  desertCopy: { fontSize: 13, color: '#F0E6D2', textAlign: 'center' },
  desertAction: { color: '#F7D995', fontWeight: '800', fontSize: 15 },
  sectionTitle: { fontSize: 21, fontWeight: '800', color: '#F4DEB6', textAlign: 'right' },
  worshipLinks: { gap: 10 },
  worshipLink: { backgroundColor: '#143B32', borderRadius: 15, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  worshipText: { color: '#FFF2D7', fontSize: 16, fontWeight: '700' },
  worshipArrow: { color: '#EACD92', fontSize: 23 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: HomeSpacing.screenHorizontal, gap: 20 },
  gridSection: { gap: 12, backgroundColor: '#103B34', padding: 14, borderRadius: 18, borderWidth: 1, borderColor: '#806D45' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: HomeColors.surface, borderTopStartRadius: HomeRadii.prayerCard, borderTopEndRadius: HomeRadii.prayerCard, padding: 20, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: HomeTypography.fontSize.sectionTitle, fontFamily: HomeTypography.fontFamily.semiBold, color: HomeColors.text },
  closeBtn: { minWidth: HomeSpacing.minTouchTarget, minHeight: HomeSpacing.minTouchTarget, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 18, color: HomeColors.textSecondary },
  cityItem: { minHeight: HomeSpacing.minTouchTarget, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: HomeColors.border, paddingVertical: 10 },
  cityText: { fontSize: HomeTypography.fontSize.task, fontFamily: HomeTypography.fontFamily.medium, color: HomeColors.text },
});
