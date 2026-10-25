import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { GuestPreferences } from '../../hooks/useGuestPreferences';

const C = { bg: '#041F1C', card: '#07362F', edge: '#286253', gold: '#F5CE7A', cream: '#FFF1D2', muted: '#B1D2C4' };
const avatarGlyph: Record<string,string> = { star: '★', book: '▣', moon: '☾', shield: '⬡' };
const worlds = [
  { key: 'sirah', ar: 'مستكشف السيرة', en: 'Sirah Explorer', subAr: 'رحلة في أحداث السيرة', subEn: 'Explore the Sirah', icon: '✦', route: 'SirahStory' },
  { key: 'quran', ar: 'اكتشاف القرآن', en: 'Quran Discovery', subAr: 'اختبر حفظك وتدبر', subEn: 'Test and revise', icon: '۞', route: 'QuranJourney' },
  { key: 'habits', ar: 'حديقة العادات', en: 'Garden of Habits', subAr: 'ازرع عادة كل يوم', subEn: 'Grow daily habits', icon: '❀', route: 'HabitGarden' },
];
function Skyline() {
  return <Svg width="100%" height="105" viewBox="0 0 350 105" preserveAspectRatio="xMidYMax slice" style={StyleSheet.absoluteFill}>
    <Circle cx="275" cy="28" r="26" fill="#F3CA76" opacity={0.16}/>
    <Path d="M0 105V75h28V62l8-8 8 8v13h16V48l12-13 12 13v27h18V57h8V40l9-10 9 10v17h12V72h17V51l13-15 13 15v21h20V59h12V35l13-17 13 17v24h12V77h20V55l10-11 10 11v22h20V66h14V53l8-9 8 9v13h16v39Z" fill="#174A3E" opacity={0.9}/>
    <Path d="M0 105V91h40V80h18V69h16V58h10v11h16v11h22V92h25V79h16V65h16V50h8v15h16v14h25v13h20V78h16V65h11v13h20v14h35v13Z" fill="#0A312B"/>
    <Path d="M78 58V45m93 5V35m79 30V48" stroke="#E9C47C" strokeWidth="1.5" opacity={0.8}/>
    <Circle cx="78" cy="43" r="2" fill="#E9C47C"/><Circle cx="171" cy="33" r="2" fill="#E9C47C"/>
  </Svg>;
}
export function CinematicWelcome({ preferences, language, level, points, streak, onProfile, onQuran }: { preferences: GuestPreferences; language: 'ar'|'en'; level: number; points: number; streak: number; onProfile:()=>void; onQuran:()=>void }) {
  const ar = language === 'ar';
  const name = preferences.nickname.trim() || (ar ? 'بطل مسلم' : 'Batl Muslim');
  return <View style={s.welcome}>
    <View style={[s.identity,{flexDirection:ar?'row-reverse':'row'}]}>
      <TouchableOpacity onPress={onProfile} style={s.avatar} accessibilityRole="button" accessibilityLabel={ar?'تعديل ملف البطل':'Edit hero profile'}><Text style={s.avatarGlyph}>{avatarGlyph[preferences.avatar] || '★'}</Text></TouchableOpacity>
      <View style={{flex:1}}><Text style={[s.salutation,{textAlign:ar?'right':'left'}]}>{ar?'السلام عليكم':'Assalamu alaikum'}</Text><Text style={[s.heroName,{textAlign:ar?'right':'left'}]}>{name}</Text><Text style={[s.level,{textAlign:ar?'right':'left'}]}>{ar?`المستوى ${level} · رحلتك مستمرة`:`Level ${level} · Keep growing`}</Text></View>
      <View style={s.stat}><Text style={s.statValue}>✦ {points}</Text><Text style={s.statValue}>♨ {streak}</Text></View>
    </View>

  </View>;
}
export function CinematicQuickAccess({ language, onNavigate }: {language:'ar'|'en';onNavigate:(route:string)=>void}) {
  const ar=language==='ar';
  const actions=[{icon:'۞',ar:'القرآن',en:'Quran',route:'QuranAssessment'},{icon:'☾',ar:'الأذكار',en:'Athkar',route:'Adhkar'},{icon:'◈',ar:'القبلة',en:'Qibla',route:'Qibla'},{icon:'✦',ar:'الصلوات',en:'Prayer',route:'PrayerTracker'}];
  return <View style={s.quickRow}>{actions.map(a=><TouchableOpacity key={a.route} style={s.quickItem} onPress={()=>onNavigate(a.route)} accessibilityRole="button"><Text style={s.quickIcon}>{a.icon}</Text><Text style={s.quickText}>{ar?a.ar:a.en}</Text></TouchableOpacity>)}</View>;
}
export function CinematicWorlds({ language, onNavigate }: {language:'ar'|'en';onNavigate:(route:string)=>void}) {
  const ar=language==='ar';
  return <View style={{gap:12}}>
    <View style={[s.headingRow,{flexDirection:ar?'row-reverse':'row'}]}><Text style={s.sectionTitle}>{ar?'عوالم بطل':'Batl Worlds'}</Text><Text style={s.sectionHint}>{ar?'تعلّم · اكتشف · انمُ':'Learn · Explore · Grow'}</Text></View>
    {worlds.map((w,i)=><TouchableOpacity key={w.key} style={[s.world,{flexDirection:ar?'row-reverse':'row'}]} onPress={()=>onNavigate(w.route)} accessibilityRole="button">
      <LinearGradient colors={i===0?['#B77F3C','#6A4726']:i===1?['#0D7564','#08453C']:['#658E45','#2E5638']} style={s.worldArt}><Text style={s.worldIcon}>{w.icon}</Text></LinearGradient>
      <View style={{flex:1}}><Text style={[s.worldTitle,{textAlign:ar?'right':'left'}]}>{ar?w.ar:w.en}</Text><Text style={[s.worldSub,{textAlign:ar?'right':'left'}]}>{ar?w.subAr:w.subEn}</Text></View><Text style={s.chevron}>{ar?'‹':'›'}</Text>
    </TouchableOpacity>)}
  </View>;
}
export function CinematicArena({ language, onNavigate }: {language:'ar'|'en';onNavigate:(route:string)=>void}) {
 const ar=language==='ar';return <LinearGradient colors={['#113E36','#092C28']} style={s.arena}>
   <Text style={[s.arenaKicker,{textAlign:ar?'right':'left'}]}>✦  {ar?'ساحة بطل':'BATL ARENA'}</Text>
   <Text style={[s.arenaTitle,{textAlign:ar?'right':'left'}]}>{ar?'تحدَّ نفسك في القرآن':'Challenge your Quran skills'}</Text>
   <Text style={[s.arenaSub,{textAlign:ar?'right':'left'}]}>{ar?'اختبر حفظك، وأكمل الآية، واكتشف المتشابهات.':'Assess memorization, finish verses, and explore similar ayahs.'}</Text>
   <View style={[s.arenaButtons,{flexDirection:ar?'row-reverse':'row'}]}><TouchableOpacity onPress={()=>onNavigate('QuranJourney')} style={s.arenaPrimary}><Text style={s.goldButtonText}>{ar?'اختبر حفظك':'Assessment'}</Text></TouchableOpacity><TouchableOpacity onPress={()=>onNavigate('ArenaHub')} style={s.arenaSecondary}><Text style={s.arenaSecondaryText}>{ar?'جميع التحديات':'All challenges'}</Text></TouchableOpacity></View>
 </LinearGradient>;
}
const s=StyleSheet.create({
 welcome:{gap:15},identity:{alignItems:'center',gap:11},avatar:{width:55,height:55,borderRadius:18,borderWidth:1,borderColor:C.gold,backgroundColor:'#17483E',alignItems:'center',justifyContent:'center'},avatarGlyph:{color:C.gold,fontSize:30},salutation:{color:C.muted,fontSize:12},heroName:{color:C.cream,fontSize:19,fontWeight:'700'},level:{color:'#DBBD7C',fontSize:11,marginTop:3},stat:{gap:5,backgroundColor:'#123D34',borderRadius:12,paddingHorizontal:11,paddingVertical:8},statValue:{color:C.gold,fontSize:12,fontWeight:'700'},
 feature:{minHeight:228,borderRadius:22,padding:20,borderWidth:1,borderColor:'#3B6D56',overflow:'hidden',justifyContent:'center',gap:9},skyline:{position:'absolute',bottom:0,left:0,right:0,height:105},eyebrow:{color:C.gold,fontSize:12,fontWeight:'700'},featureTitle:{color:'#FFF2D5',fontSize:25,fontWeight:'800'},featureDescription:{color:'#D3E4D8',fontSize:13,lineHeight:22,maxWidth:'80%'},goldButton:{backgroundColor:C.gold,paddingHorizontal:19,paddingVertical:12,borderRadius:12,marginTop:5},goldButtonText:{color:'#183A2F',fontSize:13,fontWeight:'800'},
 quickRow:{flexDirection:'row',gap:8},quickItem:{flex:1,minHeight:86,backgroundColor:C.card,borderRadius:16,borderWidth:1,borderColor:C.edge,alignItems:'center',justifyContent:'center',gap:6},quickIcon:{fontSize:28,color:C.gold},quickText:{fontSize:12,color:C.cream,fontWeight:'700'},
 headingRow:{justifyContent:'space-between',alignItems:'center'},sectionTitle:{fontSize:20,fontWeight:'800',color:C.cream},sectionHint:{fontSize:11,color:C.muted},world:{backgroundColor:'#0A302B',borderColor:'#24584A',borderWidth:1,borderRadius:16,overflow:'hidden',alignItems:'center',gap:13,padding:9},worldArt:{height:72,width:88,borderRadius:11,alignItems:'center',justifyContent:'center'},worldIcon:{fontSize:38,color:C.cream},worldTitle:{color:C.cream,fontSize:16,fontWeight:'800'},worldSub:{color:C.muted,fontSize:12,marginTop:4},chevron:{color:C.gold,fontSize:28,paddingHorizontal:6},
 arena:{borderRadius:20,borderColor:'#476B51',borderWidth:1,padding:20,gap:9},arenaKicker:{fontSize:12,color:C.gold,fontWeight:'700'},arenaTitle:{fontSize:21,color:C.cream,fontWeight:'800'},arenaSub:{fontSize:13,color:C.muted,lineHeight:22},arenaButtons:{gap:10,marginTop:7},arenaPrimary:{backgroundColor:C.gold,borderRadius:11,padding:13},arenaSecondary:{borderRadius:11,borderWidth:1,borderColor:'#709C82',padding:12},arenaSecondaryText:{color:C.cream,fontSize:13,fontWeight:'700'},
});
