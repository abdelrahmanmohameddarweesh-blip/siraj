import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';

type Props = { titleAr: string; titleEn: string; subtitleAr: string; subtitleEn: string; symbol?: string };
/** Shared cinematic chapter heading. Decorative artwork uses vector geometry, not unverified religious imagery. */
export default function CinematicSectionHeader({ titleAr, titleEn, subtitleAr, subtitleEn, symbol = '✦' }: Props) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  return (
    <LinearGradient colors={['#174F42', '#0A302B', '#071E1C']} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.card}>
      <View style={styles.art} pointerEvents="none">
        <Svg width="156" height="128" viewBox="0 0 156 128">
          <Circle cx="111" cy="25" r="17" fill="#F2C66D" opacity={0.17}/>
          <Path d="M0 110H156V128H0Z" fill="#E4B960" opacity={0.12}/>
          <Path d="M28 111V71Q52 40 76 71V111Z" fill="#D5A84D" opacity={0.24}/>
          <Path d="M44 60Q52 39 60 60Z" fill="#EFC76E" opacity={0.35}/>
          <Rect x="18" y="52" width="9" height="59" fill="#D5A84D" opacity={0.25}/>
          <Path d="M16 52L22.5 36L29 52Z" fill="#F2C66D" opacity={0.32}/>
          <Rect x="105" y="68" width="12" height="43" fill="#D5A84D" opacity={0.2}/>
          <Path d="M103 68L111 48L119 68Z" fill="#F2C66D" opacity={0.28}/>
          <Path d="M0 111H156" stroke="#F2C66D" strokeWidth="1" opacity={0.35}/>
        </Svg>
      </View>
      <View style={styles.top}><Text style={styles.eyebrow}>{ar ? 'بَطَل مُسْلِم • رحلتك' : 'BATL MUSLIM • YOUR JOURNEY'}</Text><Text style={styles.symbol}>{symbol}</Text></View>
      <Text style={[styles.title, { textAlign: ar ? 'right' : 'left' }]}>{ar ? titleAr : titleEn}</Text>
      <Text style={[styles.subtitle, { textAlign: ar ? 'right' : 'left' }]}>{ar ? subtitleAr : subtitleEn}</Text>
      <View style={styles.rule}/>
    </LinearGradient>
  );
}
const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 8, marginBottom: 10, padding: 16, minHeight: 0, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#A17E3D' },
  art: { position: 'absolute', right: 0, bottom: 0, opacity: 0.14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: '#D8B76E', fontSize: 11, letterSpacing: 0.4, fontWeight: '700' },
  symbol: { color: '#F2C66D', fontSize: 20 },
  title: { color: '#FFFFFF', fontSize: 20, lineHeight: 30, fontWeight: '800', marginTop: 8, flexShrink: 1, writingDirection: 'auto' },
  subtitle: { color: '#D0E5DD', fontSize: 14, lineHeight: 23, marginTop: 4, flexShrink: 1, writingDirection: 'auto' },
  rule: { height: 2, width: 46, backgroundColor: '#EAC16C', marginTop: 9, borderRadius: 3 },
});
