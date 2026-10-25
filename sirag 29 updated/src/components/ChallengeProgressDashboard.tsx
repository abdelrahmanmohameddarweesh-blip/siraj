import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import { loadChallengeHistory, summarizeChallenges, calculateChallengeStreak, unlockedChallengeBadges, CHALLENGE_KINDS, type ChallengeEvent } from '../services/challengeProgress';
const labels = {
  reading: ['القراءة','Reading'], hadith: ['الحديث','Hadith'],
  trivia: ['المعرفة','Trivia'], sirah: ['السيرة','Sirah'],
} as const;
export default function ChallengeProgressDashboard({ navigation }: { navigation: any }) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [history,setHistory] = useState<ChallengeEvent[]>([]);
  const [expanded,setExpanded] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    loadChallengeHistory().then(events => { if (active) setHistory(events); });
    return () => { active = false; };
  }, []));
  const summary = summarizeChallenges(history);
  const badges = unlockedChallengeBadges(history);
  const stats = [
    [String(summary.sessions), ar ? 'تحديات منجزة' : 'Completed'],
    [String(summary.points), ar ? 'نقاط محلية' : 'Local points'],
    [String(calculateChallengeStreak(history)), ar ? 'أيام متتالية' : 'Day streak'],
    [String(summary.bestAccuracy)+'%', ar ? 'أفضل دقة' : 'Best accuracy'],
  ];
  return <View style={{ backgroundColor:'#0C4036', borderRadius:20, padding:16, marginBottom:16, borderWidth:1, borderColor:'#A98A46' }}>
    <Text style={{ color:'#F5D48D', fontWeight:'800', fontSize:19, textAlign:ar?'right':'left' }}>{ar?'سجل إنجازاتك':'Your challenge progress'}</Text>
    <Text style={{ color:'#D3E5DE', fontSize:12, marginTop:5, textAlign:ar?'right':'left' }}>{ar?'تُحفظ نتائجك على هذا الجهاز، حتى كضيف':'Results are saved on this device, including guest play'}</Text>
    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:14 }}>{stats.map(([value,label]) =>
      <View key={label} style={{ backgroundColor:'#155748', borderRadius:12, padding:10, width:'48%', flexGrow:1 }}>
        <Text style={{ color:'#FFE4A8', fontWeight:'900', fontSize:20, textAlign:'center' }}>{value}</Text>
        <Text style={{ color:'#E4F0E9', fontSize:11, textAlign:'center' }}>{label}</Text>
      </View>)}</View>
    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:12 }}>{CHALLENGE_KINDS.map(kind => {
      const item = summarizeChallenges(history,kind);
      return <View key={kind} style={{ width:'48%', flexGrow:1, padding:9, backgroundColor:'#164D40', borderRadius:10 }}>
        <Text style={{ color:'#F8E6B4', fontSize:12, textAlign:'center' }}>{labels[kind][ar?0:1]}</Text>
        <Text style={{ color:'#FFFFFF', fontSize:12, textAlign:'center' }}>{item.sessions} {ar?'مكتمل':'completed'}</Text>
      </View>;
    })}</View>
    <TouchableOpacity accessibilityRole="button" onPress={() => setExpanded(!expanded)} style={{ paddingVertical:12 }}>
      <Text style={{ color:'#F5D48D', fontWeight:'700', textAlign:'center' }}>{expanded?(ar?'إخفاء التفاصيل ▲':'Hide details ▲'):(ar?'الإنجازات وآخر النتائج ▼':'Achievements & recent results ▼')}</Text>
    </TouchableOpacity>
    {expanded && <View>
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>{badges.map(b => <View key={b.id} style={{ width:'48%', flexGrow:1, backgroundColor:'#18594A', borderRadius:10, padding:8, opacity:b.unlocked?1:0.45 }}>
        <Text style={{ textAlign:'center', fontSize:20 }}>{b.unlocked?b.icon:'🔒'}</Text>
        <Text style={{ textAlign:'center', color:'#FFFFFF', fontSize:11 }}>{ar?b.ar:b.en}</Text>
      </View>)}</View>
      {history.length===0 && <Text style={{ color:'#D3E5DE', textAlign:'center', marginTop:10 }}>{ar?'أكمل أول تحدٍ لبدء سجلك':'Complete your first challenge to start your history'}</Text>}
      {history.slice(0,5).map(event => <Text key={event.id} style={{ color:'#E3EFE8', fontSize:12, marginTop:8, textAlign:ar?'right':'left' }}>
        {labels[event.kind][ar?0:1]} · {event.points} {ar?'نقطة':'points'} · {new Date(event.completedAt).toLocaleDateString(ar?'ar-EG':'en-US')}
      </Text>)}
    </View>}
  </View>;
}
