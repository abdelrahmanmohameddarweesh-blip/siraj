import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../contexts/LanguageContext';
import { hadiths } from '../data/hadith';
import CinematicPortal from '../components/CinematicPortal';

const KEY = 'batl-hadith-action-v1';
const scenarios = [
 { id:'intention', hadith:hadiths[0], sourceAr:'صحيح البخاري، الحديث 1', sourceEn:'Sahih al-Bukhari, Hadith 1',
   ar:'تريد مساعدة زميلك في عمله. ما الخطوة الأولى الأنسب؟',en:'You want to help a classmate. What is the best first step?',
   choicesAr:['أصحّح نيّتي وأساعده بإخلاص','أساعده فقط كي يمدحني الآخرون','أتوقف عن مساعدته'],
   choicesEn:['Set a sincere intention and help','Help only to receive praise','Refuse to help'],
   correct:0, whyAr:'الحديث يعلّمنا أهمية النيّة في الأعمال. هذا مثال تطبيقي وليس فتوى.',whyEn:'The hadith teaches the importance of intention. This is a learning example, not a legal ruling.' },
 { id:'kindness', hadith:hadiths[1], sourceAr:'صحيح البخاري وصحيح مسلم (متفق عليه)',sourceEn:'Sahih al-Bukhari and Sahih Muslim (agreed upon)',
   ar:'حصل صديقك على فرصة كنت تتمناها. ما التصرف الأقرب لمعنى الحديث؟',en:'Your friend receives an opportunity you hoped for. Which response best reflects the hadith?',
   choicesAr:['أفرح له وأتمنى له الخير','أحاول إفساد فرصته','أُشيع عنه كلامًا سيئًا'],
   choicesEn:['Wish them well and be happy for them','Sabotage their opportunity','Spread rumors'],
   correct:0,whyAr:'محبة الخير للآخرين من المعاني التي يرشد إليها الحديث.',whyEn:'Wishing good for others is one of the teachings of this hadith.' },
] as const;
export default function HadithInActionScreen({navigation}:any) {
 const {language}=useLanguage();const ar=language==='ar';const t=(a:string,e:string)=>ar?a:e;
 const [index,setIndex]=useState(0);const [completed,setCompleted]=useState<string[]>([]);
 const [selected,setSelected]=useState<number|null>(null);const [explained,setExplained]=useState(false);
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{let active=true;AsyncStorage.getItem(KEY).then(v=>{if(active&&v){const ids=JSON.parse(v);if(Array.isArray(ids))setCompleted(ids.filter(x=>scenarios.some(s=>s.id===x)));}}).catch(()=>{}).finally(()=>{if(active)setLoaded(true);});return()=>{active=false};},[]);
 const scenario=scenarios[index];const done=completed.includes(scenario.id);
 const complete=()=>{
   if (selected === scenario.correct) {
     const next=Array.from(new Set([...completed,scenario.id]));setCompleted(next);
     AsyncStorage.setItem(KEY,JSON.stringify(next)).catch(()=>{});
   }
   setExplained(true);
 };
 const go=(i:number)=>{setIndex(i);setSelected(null);setExplained(false)};
 return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
  <TouchableOpacity onPress={()=>navigation.goBack()}><Text style={styles.gold}>{t('‹ العودة','‹ Back')}</Text></TouchableOpacity>
  <CinematicPortal scene="mosque" compact eyebrow={t('العلم والعمل','KNOWLEDGE INTO ACTION')} title={t('الحديث والعمل','Hadith in Action')} subtitle={t('تعلّم المعنى، ثم فكّر في التطبيق.','Learn the meaning, then consider how to apply it.')} progress={completed.length / scenarios.length * 100} />
  <Text style={styles.title}>{t('الحديث والعمل','Hadith in Action')}</Text>
  <Text style={styles.sub}>{t('افهم الحديث ثم فكّر في تطبيقه على موقف من حياتك.','Understand a hadith, then consider how it applies to daily life.')}</Text>
  <Text style={styles.gold}>{t('دروس مكتملة','Lessons completed')}: {completed.length}/{scenarios.length}</Text>
  <View style={styles.nav}>{scenarios.map((s,i)=><TouchableOpacity key={s.id} onPress={()=>go(i)} style={[styles.tab,index===i&&styles.active]}><Text style={styles.white}>{completed.includes(s.id)?'✓':i+1}</Text></TouchableOpacity>)}</View>
  <View style={styles.card}><Text style={styles.small}>{t('نص الحديث (مقتطف)','Hadith excerpt')}</Text><Text style={styles.arabic}>{scenario.hadith.hadithText}</Text>
    <Text style={styles.gold}>{t(scenario.sourceAr,scenario.sourceEn)}</Text>
    <Text style={styles.note}>{t('مقتطف من الحديث، وليس النص الكامل. يجب تدقيق المصدر والنص قبل النشر.','Excerpt, not the complete hadith. Verify the source and wording before publication.')}</Text>
  </View>
  <View style={styles.card}><Text style={styles.heading}>{t('موقف من الحياة','Everyday situation')}</Text><Text style={styles.body}>{t(scenario.ar,scenario.en)}</Text>
   {(ar?scenario.choicesAr:scenario.choicesEn).map((choice,i)=><TouchableOpacity key={i} onPress={()=>{setSelected(i);setExplained(false)}} style={[styles.choice,selected===i&&styles.chosen]}><Text style={styles.white}>{choice}</Text></TouchableOpacity>)}
   {selected!==null && <TouchableOpacity style={styles.button} onPress={complete}><Text style={styles.buttonText}>{t('افهم الإجابة','Understand the answer')}</Text></TouchableOpacity>}
   {explained && <View style={styles.feedback}><Text style={styles.body}>{selected===scenario.correct?t('اختيار مناسب لهذا المثال.','A fitting choice for this example.'):t('لنراجع الفكرة دون خصم نقاط.','Review the teaching; no points are deducted.')}</Text>
     <Text style={styles.body}>{t(scenario.whyAr,scenario.whyEn)}</Text></View>}
   {done && <Text style={styles.gold}>{t('✓ تمت مراجعة هذا الدرس','✓ Lesson reviewed')}</Text>}
  </View>
  <TouchableOpacity onPress={()=>go((index+1)%scenarios.length)} style={styles.button}><Text style={styles.buttonText}>{t('الدرس التالي','Next lesson')} ←</Text></TouchableOpacity>
  <Text style={styles.note}>{t('التعلّم والتطبيق أهم من السرعة. التقدم محفوظ محليًا.','Understanding and practice matter more than speed. Progress is saved locally.')}</Text>
 </ScrollView>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:'#061D1A'},content:{padding:18,paddingBottom:48,gap:14},
 title:{color:'#FFF4D6',fontSize:27,fontWeight:'900',textAlign:'center'},
 sub:{color:'#C6DED3',fontSize:14,lineHeight:23,textAlign:'center'},
 gold:{color:'#E8C47C',fontSize:13,textAlign:'center'},nav:{flexDirection:'row',gap:8},
 tab:{flex:1,alignItems:'center',padding:12,borderRadius:12,backgroundColor:'#245447'},active:{backgroundColor:'#99753C'},
 white:{color:'#FFF9E9',fontSize:15,textAlign:'center',lineHeight:24},
 card:{borderRadius:18,backgroundColor:'#123B32',padding:18,gap:14,borderWidth:1,borderColor:'#567458'},
 small:{color:'#D8BD83',fontSize:12,textAlign:'center'},arabic:{color:'#FFF5E3',fontSize:22,lineHeight:40,textAlign:'center',writingDirection:'rtl'},
 note:{color:'#A6BDB5',fontSize:11,textAlign:'center',lineHeight:18},
 heading:{color:'#F1D28A',fontSize:20,fontWeight:'800',textAlign:'center'},
 body:{color:'#F2F3E8',fontSize:15,lineHeight:26,textAlign:'center'},
 choice:{backgroundColor:'#245647',padding:14,borderRadius:12},chosen:{borderWidth:2,borderColor:'#F0C678'},
 button:{backgroundColor:'#B9904B',padding:16,borderRadius:12,alignItems:'center'},
 buttonText:{color:'#09251F',fontSize:16,fontWeight:'800'},feedback:{backgroundColor:'#1C5341',padding:12,borderRadius:12,gap:10}
});
