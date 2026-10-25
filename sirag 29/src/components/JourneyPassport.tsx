import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';

const quests = [
  { id: 'quran', route: 'QuranAssessment', glyph: '۞', ar: 'رحلة القرآن', en: 'Quran Journey', detailAr: 'ابدأ بتقييم الحفظ ثم واصل التعلم', detailEn: 'Assess memorization and continue learning', accent: '#A6D9B7' },
  { id: 'reading', route: 'ReadingChallenge', glyph: '✧', ar: 'تحدي القراءة', en: 'Reading Quest', detailAr: 'اقرأ وأجب عن أسئلة الفهم', detailEn: 'Read and answer comprehension questions', accent: '#F1D18A' },
  { id: 'sirah', route: 'SirahStory', glyph: '☪', ar: 'مغامرة السيرة', en: 'Sirah Adventure', detailAr: 'استكشف محطات السيرة النبوية', detailEn: 'Explore chapters of the Prophetic biography', accent: '#E8C07B' },
  { id: 'trivia', route: 'Trivia', glyph: '✦', ar: 'ميدان المعرفة', en: 'Knowledge Arena', detailAr: 'اختبر معلوماتك في تحديات متنوعة', detailEn: 'Test your knowledge in varied challenges', accent: '#A8D6D0' },
  { id: 'prayer', route: 'PrayerTracker', glyph: '◈', ar: 'متابعة الصلاة', en: 'Prayer Tracker', detailAr: 'راجع مواقيتك وسجّل صلواتك', detailEn: 'Review times and log your prayers', accent: '#E9CF9A' },
  { id: 'habits', route: 'HabitGarden', glyph: '❀', ar: 'حديقة العادات', en: 'Habit Garden', detailAr: 'اعتنِ بعاداتك الإيجابية', detailEn: 'Grow your daily positive habits', accent: '#B4E1B2' },
] as const;
type QuestId = typeof quests[number]['id'];
type QuestGroup = 'all' | 'learn' | 'worship';
const dateKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; };
const storageKey = (day: string) => `batl:quest-passport:v1:${day}`;

/** A manual daily journey checklist, separate from game scores and worship records. */
export default function JourneyPassport({ navigation, compact = false }: { navigation: any; compact?: boolean }) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [done, setDone] = useState<QuestId[]>([]);
  const [group, setGroup] = useState<QuestGroup>('all');
  const [day, setDay] = useState(dateKey);
  useEffect(() => {
    let active = true;
    const key = storageKey(day);
    setDone([]);
    AsyncStorage.getItem(key).then(raw => {
      if (!active) return;
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setDone(parsed.filter((id): id is QuestId => quests.some(q => q.id === id)));
    }).catch(() => {});
    return () => { active = false; };
  }, [day]);
  const toggle = (id: QuestId) => {
    const next = done.includes(id) ? done.filter(item => item !== id) : [...done, id];
    setDone(next);
    AsyncStorage.setItem(storageKey(day), JSON.stringify(next)).catch(() => {});
  };
  const visible = useMemo(() => quests.filter((_, index) => group === 'all' || (group === 'learn' ? index < 4 : index >= 4)), [group]);
  const pct = Math.round(done.length / quests.length * 100);
  return (
    <View style={s.wrap}>
      <LinearGradient colors={['#1B604E', '#0C3B34', '#061F1D']} style={s.hero}>
        <View style={s.art} pointerEvents="none">
          <Svg width="190" height="180" viewBox="0 0 190 180">
            <Circle cx="138" cy="44" r="31" fill="#F2CC77" opacity={0.17}/>
            <Path d="M0 155H190" stroke="#F0C876" strokeWidth="2" opacity={0.5}/>
            <Path d="M30 155V90Q62 45 94 90V155Z" fill="#D8AF5F" opacity={0.24}/>
            <Path d="M40 80Q62 45 84 80" stroke="#EEC980" strokeWidth="2" fill="none" opacity={0.55}/>
            <Rect x="11" y="70" width="11" height="85" fill="#D8AF5F" opacity={0.28}/>
            <Path d="M9 70L16 44L24 70Z" fill="#EEC980" opacity={0.5}/>
            <Rect x="118" y="98" width="13" height="57" fill="#D8AF5F" opacity={0.25}/>
            <Path d="M115 98L124 72L134 98Z" fill="#EEC980" opacity={0.43}/>
          </Svg>
        </View>
        <Text style={s.eyebrow}>{ar ? 'بَطَل مُسْلِم  •  خارطة اليوم' : 'BATL MUSLIM  •  DAILY MAP'}</Text>
        <Text style={[s.title, { textAlign: ar ? 'right' : 'left' }]}>{ar ? 'جواز رحلة البطل' : 'Your Hero Passport'}</Text>
        <Text style={[s.subtitle, { textAlign: ar ? 'right' : 'left' }]}>{ar ? 'ست محطات للتعلّم والعبادة، على وتيرتك' : 'Six learning and worship stops, at your own pace'}</Text>
        <View style={s.progressRow}><Text style={s.progressLabel}>{ar ? `${done.length} من ${quests.length} محطات` : `${done.length} of ${quests.length} stops`}</Text><Text style={s.progressValue}>{pct}%</Text></View>
        <View style={s.track}><View style={[s.fill, { width: `${pct}%` }]} /></View>
      </LinearGradient>
      {!compact && <View style={s.tabs}>{(['all','learn','worship'] as const).map(t => <Pressable key={t} accessibilityRole="button" accessibilityState={{selected: group === t}} onPress={() => setGroup(t)} style={[s.tab, group === t && s.tabActive]}><Text style={[s.tabText, group === t && s.tabTextActive]}>{t === 'all' ? (ar ? 'الكل' : 'All') : t === 'learn' ? (ar ? 'تعلّم' : 'Learn') : (ar ? 'عبادة' : 'Worship')}</Text></Pressable>)}</View>}
      <View style={s.list}>{(compact ? quests.slice(0,3) : visible).map((q, i) => <View key={q.id} style={s.item}>
        <View style={[s.medallion, {borderColor: q.accent}]}><Text style={[s.glyph, {color:q.accent}]}>{q.glyph}</Text></View>
        <View style={s.itemBody}><Text style={[s.itemTitle, {textAlign:ar?'right':'left'}]}>{ar?q.ar:q.en}</Text><Text style={[s.itemDetail, {textAlign:ar?'right':'left'}]}>{ar?q.detailAr:q.detailEn}</Text><View style={s.actions}><Pressable accessibilityRole="button" onPress={() => navigation.navigate(q.route)} style={s.goButton}><Text style={s.goText}>{ar?'ابدأ الرحلة ←':'Open journey →'}</Text></Pressable><Pressable accessibilityRole="checkbox" accessibilityState={{checked:done.includes(q.id)}} onPress={() => toggle(q.id)} style={[s.check,done.includes(q.id)&&s.checked]}><Text style={s.checkText}>{done.includes(q.id)?'✓':(ar?'تم؟':'Done?')}</Text></Pressable></View></View>
      </View>)}</View>
      <Text style={s.note}>{ar ? 'علامات الإنجاز هنا يدوية ولا تغيّر نقاط اللعب أو سجلّ الصلاة.' : 'Passport checkmarks are manual and do not change game scores or prayer records.'}</Text>
      {compact && <Pressable onPress={() => navigation.navigate('JourneyPassport')} style={s.fullButton} accessibilityRole="button"><Text style={s.fullText}>{ar ? 'افتح خريطة الرحلة الكاملة  ←' : 'Open full journey map  →'}</Text></Pressable>}
    </View>
  );
}
export function JourneyPassportScreen({ navigation }: any) {
  const { language } = useLanguage();
  
  return <ScrollView style={{ flex:1, backgroundColor:'#061E1B' }} contentContainerStyle={{ paddingTop: 58, paddingBottom: 90 }}>
    <Pressable onPress={() => navigation.goBack()} accessibilityRole="button" style={{marginHorizontal:20, marginBottom:10, alignSelf:'flex-start', padding:8}}><Text style={{color:'#F2D28C', fontSize:16}}>{language==='ar'?'→ رجوع':'← Back'}</Text></Pressable>
    <JourneyPassport navigation={navigation}/>
  </ScrollView>;
}
const s=StyleSheet.create({
  wrap:{marginHorizontal:16,marginTop:12,marginBottom:20},hero:{borderRadius:26,padding:22,paddingBottom:24,borderWidth:1,borderColor:'#A58A4B',overflow:'hidden',minHeight:207},art:{position:'absolute',right:-4,bottom:-10},eyebrow:{color:'#F2CC7D',fontSize:10,fontWeight:'800',letterSpacing:1},title:{color:'#FFF9EA',fontSize:26,fontWeight:'900',marginTop:14,maxWidth:'85%'},subtitle:{color:'#CDE4D8',fontSize:12,lineHeight:20,marginTop:8,maxWidth:'77%'},progressRow:{flexDirection:'row',justifyContent:'space-between',marginTop:20},progressLabel:{color:'#DCEDE2',fontSize:12,fontWeight:'700'},progressValue:{color:'#F6D587',fontSize:14,fontWeight:'900'},track:{height:8,backgroundColor:'#436C60',borderRadius:8,overflow:'hidden',marginTop:8},fill:{height:8,backgroundColor:'#F4CC77',borderRadius:8},tabs:{flexDirection:'row',gap:8,marginTop:18,marginBottom:12},tab:{flex:1,borderWidth:1,borderColor:'#386154',borderRadius:16,paddingVertical:12,alignItems:'center',backgroundColor:'#0B2C28'},tabActive:{borderColor:'#E2BC73',backgroundColor:'#31513F'},tabText:{color:'#B4CFC3',fontWeight:'700'},tabTextActive:{color:'#FBE2A5'},list:{gap:11,marginTop:14},item:{backgroundColor:'#102E29',borderWidth:1,borderColor:'#42644F',borderRadius:20,padding:14,flexDirection:'row',alignItems:'flex-start',gap:12},medallion:{width:52,height:52,borderRadius:17,backgroundColor:'#1B473C',borderWidth:1,alignItems:'center',justifyContent:'center'},glyph:{fontSize:28},itemBody:{flex:1},itemTitle:{color:'#FFF4DD',fontWeight:'800',fontSize:17},itemDetail:{color:'#B8CFC4',fontSize:11,lineHeight:18,marginTop:4},actions:{flexDirection:'row',gap:9,marginTop:12,flexWrap:'wrap'},goButton:{backgroundColor:'#EAC77F',borderRadius:12,paddingVertical:10,paddingHorizontal:13},goText:{color:'#18362B',fontSize:12,fontWeight:'800'},check:{borderWidth:1,borderColor:'#7D987F',borderRadius:12,paddingVertical:9,paddingHorizontal:12},checked:{backgroundColor:'#2D6751',borderColor:'#A5C59D'},checkText:{color:'#F8E7B8',fontWeight:'800',fontSize:12},note:{color:'#91B4A5',fontSize:11,lineHeight:17,marginTop:14,textAlign:'center'},fullButton:{alignItems:'center',marginTop:16,padding:15,borderRadius:16,borderWidth:1,borderColor:'#BFA060'},fullText:{color:'#F0CE88',fontWeight:'800',fontSize:14}
});
