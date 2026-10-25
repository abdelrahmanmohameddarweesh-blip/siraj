import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';
import { useLanguage } from '../contexts/LanguageContext';

type Props = {
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  icon?: string;
  progress?: number;
  progressLabelAr?: string;
  progressLabelEn?: string;
  compact?: boolean;
};

/** Decorative illustrated chapter card. All progress values are passed from real screen state. */
export default function CinematicJourneyPanel({ titleAr, titleEn, subtitleAr, subtitleEn, icon = '✦', progress, progressLabelAr, progressLabelEn, compact = false }: Props) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const pct = progress == null ? null : Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <LinearGradient colors={['#195747', '#0B3830', '#061E1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.card, compact && s.compact]}>
      <View style={s.art} pointerEvents="none">
        <Svg width="190" height="175" viewBox="0 0 190 175">
          <Circle cx="136" cy="35" r="31" fill="#E7BE66" opacity={0.11} />
          <Circle cx="136" cy="35" r="19" fill="#F4D995" opacity={0.18} />
          <G opacity={0.34}>
            <Path d="M22 153V92Q55 51 88 92V153Z" fill="#DDB767" />
            <Path d="M36 87Q55 58 74 87Z" fill="#F1D28B" />
            <Rect x="9" y="69" width="10" height="84" fill="#DDB767" />
            <Path d="M7 69L14 45L21 69Z" fill="#F1D28B" />
            <Rect x="105" y="99" width="13" height="54" fill="#DDB767" />
            <Path d="M103 99L111 76L120 99Z" fill="#F1D28B" />
            <Path d="M132 153V119Q153 95 174 119V153Z" fill="#DDB767" />
          </G>
          <Path d="M0 154H190" stroke="#F2C66D" strokeWidth="1.2" opacity={0.45}/>
          <Circle cx="45" cy="29" r="2" fill="#F2C66D" opacity={0.7}/>
          <Circle cx="87" cy="16" r="1.5" fill="#F2C66D" opacity={0.6}/>
          <Circle cx="174" cy="69" r="2" fill="#F2C66D" opacity={0.65}/>
        </Svg>
      </View>
      <View style={s.kickerRow}>
        <Text style={s.kicker}>{ar ? 'بَطَل مُسْلِم  /  رحلتك اليوم' : 'BATL MUSLIM  /  YOUR JOURNEY'}</Text>
        <Text style={s.icon}>{icon}</Text>
      </View>
      <Text style={[s.title, compact && s.compactTitle, { textAlign: ar ? 'right' : 'left' }]}>{ar ? titleAr : titleEn}</Text>
      <Text style={[s.subtitle, { textAlign: ar ? 'right' : 'left' }]}>{ar ? subtitleAr : subtitleEn}</Text>
      {pct !== null ? (
        <View style={s.progressSection}>
          <View style={s.progressHead}>
            <Text style={s.progressLabel}>{ar ? (progressLabelAr || 'إنجاز الرحلة') : (progressLabelEn || 'Journey progress')}</Text>
            <Text style={s.progressValue}>{pct}%</Text>
          </View>
          <View accessibilityRole="progressbar" accessibilityLabel={ar ? (progressLabelAr || 'إنجاز الرحلة') : (progressLabelEn || 'Journey progress')} accessibilityValue={{ min: 0, max: 100, now: pct }} style={s.track}><View style={[s.fill, { width: `${pct}%` }]} /></View>
        </View>
      ) : <View style={s.goldRule} />}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  card: { minHeight: 0, marginHorizontal: 16, marginTop: 8, marginBottom: 11, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 14, borderRadius: 18, borderWidth: 1, borderColor: '#987C43', overflow: 'hidden', shadowColor: '#061C17', shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  compact: { minHeight: 0, marginTop: 8, marginBottom: 11 },
  art: { position: 'absolute', bottom: -7, right: -8, opacity: 0.13 },
  kickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: '#E6C57D', fontSize: 11, letterSpacing: 0.2, fontWeight: '800' },
  icon: { color: '#F4D48B', fontSize: 21 },
  title: { color: '#FFFFFF', fontSize: 21, lineHeight: 31, fontWeight: '900', marginTop: 8, flexShrink: 1, writingDirection: 'auto' },
  compactTitle: { fontSize: 20, marginTop: 6 },
  subtitle: { color: '#D3E7DE', fontSize: 14, lineHeight: 22, marginTop: 4, flexShrink: 1, writingDirection: 'auto' },
  goldRule: { height: 3, width: 47, backgroundColor: '#F2C66D', marginTop: 9, borderRadius: 3 },
  progressSection: { marginTop: 10 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: '#E1EDE6', fontSize: 12, fontWeight: '600' },
  progressValue: { color: '#F2C66D', fontSize: 12, fontWeight: '800' },
  track: { height: 8, backgroundColor: 'rgba(255,255,255,0.17)', borderRadius: 5, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#F2C66D', borderRadius: 5 },
});
