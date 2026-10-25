import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';

type Props = { current: number; total: number; labelAr: string; labelEn: string; completed?: boolean };
/** Shows only real progress supplied by the game screen. */
export default function QuestMilestoneStrip({ current, total, labelAr, labelEn, completed = false }: Props) {
  const { language } = useLanguage();
  const count = Math.max(0, total);
  const step = Math.max(0, Math.min(current, count));
  const pct = count ? Math.round(step / count * 100) : 0;
  return <LinearGradient colors={['#153F37', '#092B27']} style={s.wrap}>
    <View style={s.heading}>
      <Text style={s.percent}>{pct}%</Text>
      <Text style={s.title}>{language === 'ar' ? labelAr : labelEn}</Text>
    </View>
    <View style={s.rail}><View style={[s.fill, { width: `${pct}%` }]} /></View>
    <View style={s.steps}>
      {Array.from({ length: Math.min(count, 12) }, (_, i) => {
        const reached = completed || i < step;
        return <View key={i} style={[s.step, reached && s.stepDone]}><Text style={[s.stepText, reached && s.stepTextDone]}>{reached ? '✦' : String(i + 1)}</Text></View>;
      })}
    </View>
    <Text style={s.footer}>{language === 'ar' ? `${step} من ${count} مراحل` : `${step} of ${count} stages`}</Text>
  </LinearGradient>;
}
const s = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginVertical: 9, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#9E824B' },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#F5E1B1', fontSize: 15, fontWeight: '800', textAlign: 'right' },
  percent: { color: '#E8C06F', fontSize: 19, fontWeight: '900' },
  rail: { height: 6, backgroundColor: '#42645B', borderRadius: 6, overflow: 'hidden', marginTop: 13 },
  fill: { height: 6, backgroundColor: '#E9C573', borderRadius: 6 },
  steps: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 15 },
  step: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#63857A', backgroundColor: '#163D35' },
  stepDone: { backgroundColor: '#C5A05B', borderColor: '#F5D78D' },
  stepText: { color: '#AECAC0', fontSize: 11, fontWeight: '700' },
  stepTextDone: { color: '#0B332C', fontSize: 15, fontWeight: '900' },
  footer: { textAlign: 'center', color: '#C9DBD2', marginTop: 10, fontSize: 11 },
});
