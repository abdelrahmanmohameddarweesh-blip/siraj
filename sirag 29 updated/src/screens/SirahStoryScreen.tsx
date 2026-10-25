import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import { sirahCheckpoints } from '../data/sirahQuests';
import CinematicPortal from '../components/CinematicPortal';
const KEY='batl-sirah-story-v1';
type State={chapter:number;completed:number[]};
export default function SirahStoryScreen({navigation}:any){
 const {language}=useLanguage(),ar=language==='ar',t=(a:string,e:string)=>ar?a:e;
 const [state,setState]=useState<State>({chapter:0,completed:[]});
 const [loaded,setLoaded]=useState(false),[choice,setChoice]=useState<number|null>(null),[showQuestion,setShowQuestion]=useState(false),[feedback,setFeedback]=useState(false);
 useFocusEffect(useCallback(()=>{let alive=true;AsyncStorage.getItem(KEY).then(raw=>{if(alive&&raw){const saved=JSON.parse(raw);if(Number.isInteger(saved.chapter)&&Array.isArray(saved.completed))setState({chapter:Math.max(0,Math.min(sirahCheckpoints.length-1,saved.chapter)),completed:saved.completed.filter((x:any)=>Number.isInteger(x))});}}).catch(()=>{}).finally(()=>{if(alive)setLoaded(true)});return()=>{alive=false};},[]));
 const chapter=sirahCheckpoints[state.chapter];
 const select=(index:number)=>{setChoice(null);setShowQuestion(false);setFeedback(false);setState(s=>({...s,chapter:index}));};
 const complete=()=>{if(choice!==chapter.correctIndex){setFeedback(true);return;}const next={...state,completed:Array.from(new Set([...state.completed,chapter.id]))};setState(next);AsyncStorage.setItem(KEY,JSON.stringify(next)).catch(()=>{});setFeedback(true);};
 if(!loaded||!chapter)return <View style={styles.screen}><Text style={styles.muted}>{t('جارٍ التحميل…','Loading…')}</Text></View>;
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
  <TouchableOpacity onPress={()=>navigation.goBack()}><Text style={styles.back}>{t('‹ العودة','‹ Back')}</Text></TouchableOpacity>
  <CinematicPortal scene="sirah" eyebrow={t('رحلة السيرة النبوية','THE SIRAH JOURNEY')} title={t('من مكة إلى المدينة','From Makkah to Madinah')} subtitle={t('اقرأ القصة، تعلّم أحداثها، ثم راجع فهمك دون استعجال.','Discover historical events through stories and thoughtful review.')} progress={100*state.completed.length/sirahCheckpoints.length}/>
  <View style={styles.progressRow}><Text style={styles.gold}>{t('محطات مكتملة','Chapters completed')} {state.completed.length}/{sirahCheckpoints.length}</Text><Text style={styles.gold}>{state.chapter+1}/{sirahCheckpoints.length}</Text></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapterStrip}>
   {sirahCheckpoints.map((c,i)=><TouchableOpacity key={c.id} onPress={()=>select(i)} style={[styles.chapterChip,i===state.chapter&&styles.activeChip]}><Text style={styles.chapterChipText}>{state.completed.includes(c.id)?'✓':String(i+1)}</Text></TouchableOpacity>)}
  </ScrollView>
  <View style={styles.storyCard}>
   <Text style={styles.kicker}>{t('الفصل','CHAPTER')} {state.chapter+1}</Text>
   <Text style={styles.title}>{t(chapter.titleAr,chapter.titleEn)}</Text>
   <View style={styles.divider}/>
   <Text style={styles.narrative}>{t(chapter.narrativeAr,chapter.narrativeEn)}</Text>
   <Text style={styles.sourceNote}>{t('ملخص تعليمي من محتوى التطبيق الحالي. يجب تدقيق التفاصيل التاريخية والمصادر قبل النشر.','Learning summary from the existing app. Historical details and sources require verification before release.')}</Text>
  </View>
  {!showQuestion?<TouchableOpacity style={styles.goldButton} onPress={()=>setShowQuestion(true)}><Text style={styles.goldButtonText}>{t('راجِع ما تعلمته','Review what you learned')}</Text></TouchableOpacity>:
  <View style={styles.quizCard}><Text style={styles.kicker}>{t('سؤال للمراجعة','REFLECTION CHECKPOINT')}</Text><Text style={styles.question}>{t(chapter.questionAr,chapter.questionEn)}</Text>
   {(ar?chapter.optionsAr:chapter.optionsEn).map((option,i)=><TouchableOpacity key={i} onPress={()=>{setChoice(i);setFeedback(false)}} style={[styles.option,choice===i&&styles.selected]}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>)}
   {choice!==null&&<TouchableOpacity style={styles.goldButton} onPress={complete}><Text style={styles.goldButtonText}>{t('تحقق من الإجابة','Check answer')}</Text></TouchableOpacity>}
   {feedback&&<Text style={styles.response}>{choice===chapter.correctIndex?t('أحسنت! اكتملت المحطة.','Well done! Chapter completed.'):t('حاول مجددًا، ثم أعد قراءة القصة إن احتجت.','Try again; reread the story if helpful.')}</Text>}
  </View>}
  {state.completed.includes(chapter.id)&&state.chapter<sirahCheckpoints.length-1&&<TouchableOpacity style={styles.next} onPress={()=>select(state.chapter+1)}><Text style={styles.nextText}>{t('الفصل التالي ←','Next chapter →')}</Text></TouchableOpacity>}
  <Text style={styles.sourceNote}>{t('التقدم محفوظ على جهازك. لا تتضمن هذه الرحلة تصويرًا للأنبياء.','Progress is saved on this device. No depictions of prophets are used.')}</Text>
 </ScrollView>;
}
const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:'#061D1A'},content:{padding:16,paddingBottom:52,gap:16},back:{color:'#EBC67C',fontSize:15},
 progressRow:{flexDirection:'row',justifyContent:'space-between'},gold:{color:'#EBC67C',fontSize:13,fontWeight:'700'},
 chapterStrip:{gap:9,paddingBottom:3},chapterChip:{height:39,width:39,borderRadius:12,backgroundColor:'#245748',alignItems:'center',justifyContent:'center'},activeChip:{borderWidth:2,borderColor:'#EBC67C'},chapterChipText:{color:'#FFF3D8',fontWeight:'800'},
 storyCard:{padding:20,borderRadius:20,backgroundColor:'#113B32',borderColor:'#8C774F',borderWidth:1,gap:13},kicker:{color:'#EBC67C',fontSize:11,fontWeight:'800',letterSpacing:0.6,textAlign:'center'},title:{color:'#FFF0D4',fontSize:23,fontWeight:'900',textAlign:'center',lineHeight:34},divider:{width:70,height:2,backgroundColor:'#EBC67C',alignSelf:'center'},narrative:{color:'#F1F0E7',fontSize:17,lineHeight:31,textAlign:'center'},sourceNote:{color:'#A8C4B6',fontSize:11,lineHeight:18,textAlign:'center'},
 goldButton:{padding:15,borderRadius:13,backgroundColor:'#EBC67C',alignItems:'center'},goldButtonText:{color:'#123A30',fontSize:15,fontWeight:'900'},quizCard:{padding:16,borderRadius:18,backgroundColor:'#17443A',gap:11},question:{color:'#FFF0D4',fontSize:18,lineHeight:29,textAlign:'center',fontWeight:'700'},option:{padding:13,backgroundColor:'#245849',borderRadius:11},selected:{borderColor:'#EBC67C',borderWidth:2},optionText:{color:'#FFF4DF',textAlign:'center',fontSize:15},response:{color:'#EBC67C',textAlign:'center',lineHeight:22},next:{padding:15,borderRadius:13,borderWidth:1,borderColor:'#EBC67C',alignItems:'center'},nextText:{color:'#EBC67C',fontWeight:'800'},muted:{color:'#A8C4B6'}
});
