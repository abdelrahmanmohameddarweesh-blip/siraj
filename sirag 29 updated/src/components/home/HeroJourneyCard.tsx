import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HomeColors, HomeRadii, HomeTypography } from '../../theme/tokens';
import { GuestPreferences } from '../../hooks/useGuestPreferences';

type Props = { preferences: GuestPreferences; language: 'ar' | 'en'; onStart: () => void; onCustomize: () => void };
const CONTENT = {
  quran: { ar: ['رحلتك مع القرآن', 'ابدأ باختبار حفظك، ثم راجع ما يحتاج إلى تقوية.', 'اختبر حفظي'], en: ['Your Quran journey', 'Check your memorization, then strengthen what needs revision.', 'Test my memorization'] },
  knowledge: { ar: ['اكتشف السيرة', 'تعلّم من أحداث السيرة في رحلة قصيرة وممتعة.', 'ابدأ الاستكشاف'], en: ['Explore the Sirah', 'Learn from the Prophet’s biography through short journeys.', 'Start exploring'] },
  habits: { ar: ['خطوة صغيرة كل يوم', 'اختر عادة بسيطة واستمر عليها بالوتيرة التي تناسبك.', 'ابدأ عادتي'], en: ['One small step daily', 'Choose a simple habit and grow at your own pace.', 'Start my habit'] },
  all: { ar: ['اكتشف عالم بطل مسلم', 'القرآن والسيرة والعادات — اختر رحلتك اليوم.', 'اكتشف الآن'], en: ['Explore Batl Muslim', 'Quran, Sirah and habits — choose your journey today.', 'Explore now'] },
} as const;
const AVATARS = { star: '★', book: '📖', moon: '☾', shield: '🛡' };
export function HeroJourneyCard({ preferences, language, onStart, onCustomize }: Props) {
  const ar = language === 'ar';
  const content = CONTENT[preferences.focus] ?? CONTENT.quran;
  const [title, description, action] = content[language];
  const name = preferences.nickname.trim() || (ar ? 'بطل مسلم' : 'Batl Muslim');
  return (
    <LinearGradient colors={['#063E37', '#0B584A', '#13715B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={[styles.top, { flexDirection: ar ? 'row-reverse' : 'row' }]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{AVATARS[preferences.avatar] ?? '★'}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { textAlign: ar ? 'right' : 'left' }]}>{ar ? `أهلًا يا ${name}` : `Welcome, ${name}`}</Text>
          <Text style={[styles.title, { textAlign: ar ? 'right' : 'left' }]}>{title}</Text>
        </View>
      </View>
      <Text style={[styles.description, { textAlign: ar ? 'right' : 'left' }]}>{description}</Text>
      <View style={[styles.actions, { flexDirection: ar ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity accessibilityRole="button" onPress={onStart} style={styles.primaryAction}>
          <Text style={styles.primaryText}>{action}  ←</Text>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" onPress={onCustomize} style={styles.secondaryAction}>
          <Text style={styles.secondaryText}>{ar ? 'تخصيص رحلتي' : 'Customize'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.privacy, { textAlign: ar ? 'right' : 'left' }]}>{ar ? 'بدون تسجيل · اختياراتك محفوظة على جهازك' : 'No sign-up · Preferences stay on your device'}</Text>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  card: { borderRadius: HomeRadii.prayerCard, padding: 20, gap: 14, overflow: 'hidden' },
  top: { alignItems: 'center', gap: 12 }, avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(242,198,109,0.16)', borderWidth: 1, borderColor: HomeColors.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: HomeColors.gold, fontSize: 28 }, kicker: { color: '#C9E6DA', fontSize: 12, fontFamily: HomeTypography.fontFamily.medium },
  title: { color: '#FFFFFF', fontSize: 23, fontFamily: HomeTypography.fontFamily.bold }, description: { color: '#E1F0E9', fontSize: 14, lineHeight: 23, fontFamily: HomeTypography.fontFamily.regular },
  actions: { gap: 10, flexWrap: 'wrap', alignItems: 'center' }, primaryAction: { backgroundColor: HomeColors.gold, borderRadius: 12, paddingHorizontal: 17, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  primaryText: { color: '#18382D', fontFamily: HomeTypography.fontFamily.bold, fontSize: 13 }, secondaryAction: { paddingHorizontal: 10, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  secondaryText: { color: '#FFFFFF', fontFamily: HomeTypography.fontFamily.medium, fontSize: 13 }, privacy: { color: '#B7D9CE', fontSize: 11 },
});
