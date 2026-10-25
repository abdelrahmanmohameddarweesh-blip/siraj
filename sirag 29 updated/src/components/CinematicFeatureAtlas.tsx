import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';

const destinations = [
  { route: 'QuranJourney', ar: 'رحلة القرآن', en: 'Quran Journey', descAr: 'اقرأ وافهم واحفظ وتدبّر', descEn: 'Read, understand, recall, reflect', glyph: '۞', colors: ['#155F4E','#0A3934'] as const },
  { route: 'SirahStory', ar: 'مغامرة السيرة', en: 'Sirah Adventure', descAr: 'رحلة عبر المواقف', descEn: 'Explore the stories', glyph: '☪', colors: ['#554124','#302A24'] as const },
  { route: 'QuranReader', ar: 'المصحف', en: 'Quran Reader', descAr: 'اقرأ السور واحفظ موضعك', descEn: 'Read and bookmark ayahs', glyph: '۞', colors: ['#125445','#0A342D'] as const },
  { route: 'HadithInAction', ar: 'الحديث والعمل', en: 'Hadith in Action', descAr: 'افهم الحديث وطبّقه', descEn: 'Understand and apply', glyph: '✧', colors: ['#4D4230','#292D25'] as const },
  { route: 'HabitGarden', ar: 'حديقة العادات', en: 'Habit Garden', descAr: 'ازرع عادة كل يوم', descEn: 'Grow a daily habit', glyph: '❀', colors: ['#265B42','#17392E'] as const },
  { route: 'ArenaHub', ar: 'ميدان الأبطال', en: 'Heroes Arena', descAr: 'اختبر معلوماتك', descEn: 'Challenge yourself', glyph: '✦', colors: ['#53402D','#2C2824'] as const },
  { route: 'Adhkar', ar: 'أذكار اليوم', en: 'Daily Athkar', descAr: 'لحظات من الذكر', descEn: 'Moments of remembrance', glyph: '✧', colors: ['#1D5056','#103037'] as const },
  { route: 'PrayerTracker', ar: 'رحلة الصلاة', en: 'Prayer Journey', descAr: 'تابع صلواتك', descEn: 'Track your prayers', glyph: '◈', colors: ['#344F56','#1A3037'] as const },
  { route: 'Qibla', ar: 'اتجاه القبلة', en: 'Qibla Compass', descAr: 'اعرف الاتجاه', descEn: 'Find your direction', glyph: '✥', colors: ['#3E5040','#26342A'] as const },
  { route: 'Leaderboard', ar: 'مجلس الأبطال', en: 'Hall of Heroes', descAr: 'شاهد إنجازات الأبطال', descEn: 'Celebrate achievements', glyph: '★', colors: ['#59452B','#342A23'] as const },
];

type Props = { language: string; onNavigate: (route: string) => void; compact?: boolean };
export default function CinematicFeatureAtlas({ language, onNavigate, compact = false }: Props) {
  const ar = language === 'ar';
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <View style={styles.headingText}>
          <Text style={[styles.title, { textAlign: ar ? 'right' : 'left' }]}>{ar ? 'اكتشف عوالم بطل مسلم' : 'Explore Batl Muslim Worlds'}</Text>
          <Text style={[styles.subtitle, { textAlign: ar ? 'right' : 'left' }]}>{ar ? 'كل رحلة تقرّبك من هدفك' : 'Every journey brings you closer'}</Text>
        </View>
        <Text style={styles.headingStar}>✦</Text>
      </View>
      <View style={styles.grid}>
        {destinations.slice(0, compact ? 4 : destinations.length).map((item, index) => (
          <Pressable key={item.route} onPress={() => onNavigate(item.route)} accessibilityRole="button" accessibilityLabel={ar ? item.ar : item.en} style={styles.tileWrap}>
            <LinearGradient colors={[item.colors[0], item.colors[1]]} style={styles.tile}>
              <View style={styles.art} pointerEvents="none">
                <Svg width="110" height="92" viewBox="0 0 110 92">
                  <Circle cx="87" cy="20" r="18" fill="#EFC97C" opacity="0.12" />
                  <Path d="M12 87V57Q34 27 56 57V87" stroke="#EFC97C" strokeWidth="2" fill="#EFC97C" fillOpacity="0.08" />
                  <Path d="M72 87V65Q85 47 98 65V87" stroke="#EFC97C" strokeWidth="1.5" fill="none" opacity="0.4" />
                  <Path d="M0 87H110" stroke="#EFC97C" strokeWidth="1" opacity="0.45" />
                </Svg>
              </View>
              <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
              <Text style={styles.glyph}>{item.glyph}</Text>
              <Text style={[styles.tileTitle, { textAlign: ar ? 'right' : 'left' }]}>{ar ? item.ar : item.en}</Text>
              <Text style={[styles.tileDescription, { textAlign: ar ? 'right' : 'left' }]}>{ar ? item.descAr : item.descEn}</Text>
              <Text style={[styles.open, { textAlign: ar ? 'left' : 'right' }]}>{ar ? 'ابدأ ←' : 'Explore →'}</Text>
            </LinearGradient>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { paddingVertical: 8, marginTop: 4 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headingText: { flex: 1 },
  title: { color: '#F6E4B6', fontSize: 21, fontWeight: '800' },
  subtitle: { color: '#A9C6BC', fontSize: 12, marginTop: 5 },
  headingStar: { fontSize: 28, color: '#EBC473', marginHorizontal: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  tileWrap: { width: '48%' },
  tile: { borderRadius: 21, borderWidth: 1, borderColor: '#8B7548', padding: 15, minHeight: 177, overflow: 'hidden' },
  art: { position: 'absolute', right: -10, bottom: -8 },
  number: { color: '#C8AC73', fontSize: 10, letterSpacing: 1.8, fontWeight: '700' },
  glyph: { fontSize: 33, color: '#F6D58C', marginTop: 7, marginBottom: 9 },
  tileTitle: { color: '#FFF7E8', fontSize: 16, fontWeight: '800' },
  tileDescription: { color: '#C8DCD2', fontSize: 11, marginTop: 5 },
  open: { color: '#F1CA7D', fontSize: 11, fontWeight: '800', marginTop: 14 },
});
