import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';
import { quranVerses } from '../data/quranVerses';
import CinematicPortal from '../components/CinematicPortal';

type Stage = 'read' | 'understand' | 'remember' | 'reflect';
type Progress = { verseIndex: number; completed: number[]; review: number[]; stage: Stage };
const KEY = 'batl-quran-journey-fatiha-v1';
const stages: Stage[] = ['read', 'understand', 'remember', 'reflect'];
const initial: Progress = { verseIndex: 0, completed: [], review: [], stage: 'read' };
const lessons = [
  { ar: 'البسملة تذكّرنا بالبدء باسم الله ورحمته.', en: 'The opening reminds us to begin in Allah’s name and of His mercy.', word: 'الرَّحْمَٰنِ', meaningAr: 'واسع الرحمة', meaningEn: 'The Entirely Merciful', blank: 'بِسْمِ اللَّهِ ____ الرَّحِيمِ', choices: ['الرَّحْمَٰنِ', 'الْعَالَمِينَ', 'الصِّرَاطَ'] },
  { ar: 'الحمد ثناء على الله، ربّ جميع العالمين.', en: 'Praise belongs to Allah, Lord of all worlds.', word: 'الْعَالَمِينَ', meaningAr: 'الخلق جميعًا', meaningEn: 'All worlds', blank: 'الْحَمْدُ لِلَّهِ رَبِّ ____', choices: ['الْعَالَمِينَ', 'الرَّحِيمِ', 'الدِّينِ'] },
  { ar: 'تكرار اسمي الرحمة يذكّرنا بسعة رحمة الله.', en: 'The names of mercy remind us of Allah’s vast mercy.', word: 'الرَّحِيمِ', meaningAr: 'اسم من أسماء الله الحسنى', meaningEn: 'One of Allah’s beautiful names', blank: 'الرَّحْمَٰنِ ____', choices: ['الرَّحِيمِ', 'الْمُسْتَقِيمَ', 'نَعْبُدُ'] },
  { ar: 'تذكّر الآية بملك الله ليوم الجزاء.', en: 'This verse reminds us of Allah’s sovereignty over the Day of Judgment.', word: 'الدِّينِ', meaningAr: 'الجزاء والحساب', meaningEn: 'Judgment and recompense', blank: 'مَالِكِ يَوْمِ ____', choices: ['الدِّينِ', 'الْعَالَمِينَ', 'الرَّحِيمِ'] },
  { ar: 'نخصّ الله بالعبادة ونطلب منه العون.', en: 'We worship Allah alone and seek His help.', word: 'نَسْتَعِينُ', meaningAr: 'نطلب العون', meaningEn: 'We seek help', blank: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ ____', choices: ['نَسْتَعِينُ', 'الْحَمْدُ', 'الضَّالِّينَ'] },
  { ar: 'ندعو الله أن يهدينا إلى الطريق المستقيم.', en: 'We ask Allah to guide us to the straight path.', word: 'الْمُسْتَقِيمَ', meaningAr: 'القويم الذي لا اعوجاج فيه', meaningEn: 'Straight and upright', blank: 'اهْدِنَا الصِّرَاطَ ____', choices: ['الْمُسْتَقِيمَ', 'الرَّحِيمِ', 'الْعَالَمِينَ'] },
  { ar: 'نسأل الله طريق من أنعم عليهم، لا طريق الضلال.', en: 'We ask for the path of those blessed with guidance, not misguidance.', word: 'أَنْعَمْتَ', meaningAr: 'تفضّلت وأحسنت', meaningEn: 'You bestowed favor', blank: 'صِرَاطَ الَّذِينَ ____ عَلَيْهِمْ', choices: ['أَنْعَمْتَ', 'نَسْتَعِينُ', 'الْحَمْدُ'] },
] as const;
const verses = quranVerses.filter(v => v.surah === 'الفاتحة').sort((a,b) => a.ayahNumber - b.ayahNumber).slice(0,7);
export default function QuranJourneyScreen({ navigation }: any) {
  const { language } = useLanguage();
  const ar = language === 'ar';
  const [progress, setProgress] = useState<Progress>(initial);
  const [loaded, setLoaded] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [reveal, setReveal] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    AsyncStorage.getItem(KEY).then(raw => {
      if (!active) return;
      if (raw) {
        const value = JSON.parse(raw);
        if (Number.isInteger(value.verseIndex) && value.verseIndex >= 0 && value.verseIndex < 7 &&
            stages.includes(value.stage) && Array.isArray(value.completed) && Array.isArray(value.review)) {
          setProgress(value);
        }
      }
    }).catch(() => setSaveError(true)).finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []));
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEY, JSON.stringify(progress)).then(() => setSaveError(false)).catch(() => setSaveError(true));
  }, [progress, loaded]);
  const verse = verses[progress.verseIndex];
  const lesson = lessons[progress.verseIndex];
  const finished = progress.completed.length === 7;
  const update = (patch: Partial<Progress>) => setProgress(old => ({ ...old, ...patch }));
  const next = () => {
    if (progress.stage === 'read') update({stage:'understand'});
    else if (progress.stage === 'understand') { setAnswer(null); setReveal(false); update({stage:'remember'}); }
    else if (progress.stage === 'remember') { setShowReflection(false); update({stage:'reflect'}); }
    else {
      const completed = Array.from(new Set([...progress.completed, progress.verseIndex])).sort();
      setSessionCompleted(completed.length === 7);
      update({completed, verseIndex: Math.min(progress.verseIndex+1,6), stage:'read'});
      setAnswer(null); setReveal(false); setShowReflection(false);
    }
  };
  const selectVerse = (index: number) => {
    setSessionCompleted(false); setAnswer(null); setReveal(false); setShowReflection(false);
    update({verseIndex:index,stage:'read'});
  };
  const correct = answer === lesson.word;
  const canAdvance = progress.stage !== 'remember' || correct;
  const label = (a:string,e:string) => ar ? a : e;
  const stageLabels = [label('اقرأ','Read'), label('افهم','Understand'), label('راجع','Recall'), label('تدبّر','Reflect')];
  if (!loaded || !verse) return <View style={styles.root}><Text style={styles.body}>{label('جارٍ تحميل رحلتك…','Loading your journey…')}</Text></View>;
  return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
    <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button"><Text style={styles.back}>{label('‹ العودة','‹ Back')}</Text></TouchableOpacity>
    <CinematicPortal scene="quran" compact eyebrow={label('رحلة القرآن • سورة الفاتحة','QURAN JOURNEY • AL-FATIHA')} title={label('نور القرآن','The Light of the Quran')} subtitle={label('اقرأ وافهم واحفظ وتدبّر','Read, understand, remember and reflect')} progress={progress.completed.length / 7 * 100} />
    <Text style={styles.eyebrow}>{label('رحلة القرآن • سورة الفاتحة','QURAN JOURNEY • AL-FATIHA')}</Text>
    <Text style={styles.title}>{label('اقرأ · افهم · احفظ · تدبّر','Read · Understand · Remember · Reflect')}</Text>
    <Text style={styles.sub}>{label('تعلّم آية واحدة في كل محطة، بلا مؤقّت أو عقوبة على الخطأ.','Learn one ayah at a time, without a timer or penalties.')}</Text>
    <View style={styles.progressRow}><Text style={styles.progressText}>{label('آيات مكتملة','Ayahs completed')}: {progress.completed.length}/7</Text><Text style={styles.progressText}>{progress.verseIndex+1}/7</Text></View>
    <View style={styles.verseNav}>{verses.map((v,i) =>
      <TouchableOpacity key={v.ayahNumber} accessibilityRole="button" accessibilityLabel={`${label('الآية','Ayah')} ${i+1}`} onPress={() => selectVerse(i)}
        style={[styles.verseChip, i===progress.verseIndex && styles.activeChip, progress.completed.includes(i) && styles.doneChip]}>
        <Text style={styles.chipText}>{progress.completed.includes(i) ? '✓' : i+1}</Text>
      </TouchableOpacity>)}</View>
    {finished && <View style={styles.success}><Text style={styles.successText}>{label('أتممت محطات الفاتحة السبع. يمكنك مراجعة أي آية في أي وقت.','You completed all seven Al-Fatiha stations. Revisit any ayah anytime.')}</Text></View>}
    {sessionCompleted && <Text style={styles.successText}>{label('أحسنت! اكتملت رحلتك الأولى.','Well done! Your first journey is complete.')}</Text>}
    <View style={styles.ayahCard}>
      <Text style={styles.ayahNumber}>{label('سورة الفاتحة · الآية','Al-Fatiha · Ayah')} {verse.ayahNumber}</Text>
      <Text style={styles.ayahText}>{verse.text}</Text>
      <Text style={styles.note}>{label('نص الآية مأخوذ من بيانات القرآن المضمنة في التطبيق. يحتاج إلى تدقيق مصحفي قبل النشر.','Ayah text uses the app’s bundled Quran data; independent mushaf verification is required before release.')}</Text>
    </View>
    <View style={styles.stageRow}>{stages.map((s,i)=><View key={s} style={[styles.stagePill,progress.stage===s && styles.stageActive]}><Text style={styles.stageText}>{stageLabels[i]}</Text></View>)}</View>
    {progress.stage==='read' && <View style={styles.panel}>
      <Text style={styles.panelTitle}>{label('تلاوة بتأنٍ','Read attentively')}</Text>
      <Text style={styles.body}>{label('اقرأ الآية من المصحف بهدوء، ولا تتعجل الانتقال.','Read the ayah slowly from the text before continuing.')}</Text>
      <Text style={styles.note}>{label('التلاوة الصوتية والتقييم الآلي غير متاحين في هذا الدرس؛ لن ندّعي تقييم تجويدك.','Audio recitation and automated tajweed assessment are not available in this lesson.')}</Text>
    </View>}
    {progress.stage==='understand' && <View style={styles.panel}>
      <Text style={styles.panelTitle}>{label('المعنى الأساسي','Core meaning')}</Text>
      <Text style={styles.body}>{label(lesson.ar,lesson.en)}</Text>
      <View style={styles.wordBox}><Text style={styles.word}>{lesson.word}</Text><Text style={styles.body}>{label(lesson.meaningAr,lesson.meaningEn)}</Text></View>
      <Text style={styles.note}>{label('هذه ملخصات تعليمية موجزة وليست تفسيرًا معتمدًا. راجع تفسيرًا موثوقًا عند التوسع.','These are brief learning notes, not a certified tafsir. Consult a trusted tafsir for deeper study.')}</Text>
    </View>}
    {progress.stage==='remember' && <View style={styles.panel}>
      <Text style={styles.panelTitle}>{label('أكمل موضع الكلمة','Recall the missing word')}</Text>
      <Text style={styles.prompt}>{lesson.blank}</Text>
      {lesson.choices.map(choice => <TouchableOpacity key={choice} accessibilityRole="button" onPress={() => setAnswer(choice)} style={[styles.choice,answer===choice && styles.selected]}><Text style={styles.choiceText}>{choice}</Text></TouchableOpacity>)}
      {answer && <Text style={styles.feedback}>{correct ? label('صحيح، أحسنت.','Correct, well done.') : label('حاول مجددًا. لا تُخصم منك نقاط.','Try again. No points are deducted.')}</Text>}
      <TouchableOpacity onPress={()=>setReveal(v=>!v)}><Text style={styles.hint}>{reveal ? lesson.word : label('إظهار تلميح','Show a hint')}</Text></TouchableOpacity>
    </View>}
    {progress.stage==='reflect' && <View style={styles.panel}>
      <Text style={styles.panelTitle}>{label('تدبّر في المعنى','Reflect on the meaning')}</Text>
      <Text style={styles.body}>{label('كيف يمكن أن تتذكر معنى هذه الآية في يومك؟ خذ لحظة للتفكر قبل المتابعة.','How might you remember the meaning of this ayah in daily life? Take a moment before continuing.')}</Text>
      <TouchableOpacity onPress={()=>setShowReflection(v=>!v)} style={styles.choice}><Text style={styles.choiceText}>{showReflection ? label('✓ تأملت المعنى','✓ I reflected') : label('أخذت وقتًا للتدبر','I took time to reflect')}</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>update({review:Array.from(new Set([...progress.review,progress.verseIndex]))})}><Text style={styles.hint}>{progress.review.includes(progress.verseIndex) ? label('✓ أضيفت إلى المراجعة','✓ Added to review') : label('أضف الآية للمراجعة لاحقًا','Save this ayah for review')}</Text></TouchableOpacity>
    </View>}
    <TouchableOpacity accessibilityRole="button" disabled={!canAdvance} style={[styles.next,!canAdvance && styles.disabled]} onPress={next}><Text style={styles.nextText}>{progress.stage==='reflect' ? label('إتمام المحطة','Complete station') : label('متابعة','Continue')}  ←</Text></TouchableOpacity>
    <Text style={styles.note}>{label(`آيات تحتاج مراجعة: ${progress.review.length} • يتم حفظ التقدم على جهازك`, `Ayahs marked for review: ${progress.review.length} • Progress saved on this device`)}</Text>
    {saveError && <Text style={styles.error}>{label('تعذّر حفظ التقدم. تحقق من مساحة التخزين.','Could not save progress. Check device storage.')}</Text>}
  </ScrollView>;
}
const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#061D1A'},content:{padding:18,paddingBottom:55,gap:14},
  back:{color:'#E8CA85',fontSize:15},eyebrow:{color:'#E8CA85',fontSize:11,fontWeight:'700',letterSpacing:1},
  title:{color:'#FFF4DC',fontSize:24,fontWeight:'800',textAlign:'center'},sub:{color:'#C5DBD2',fontSize:13,textAlign:'center',lineHeight:21},
  progressRow:{flexDirection:'row',justifyContent:'space-between'},progressText:{color:'#E8CA85',fontSize:12},
  verseNav:{flexDirection:'row',justifyContent:'space-between',gap:3},verseChip:{flex:1,borderRadius:10,backgroundColor:'#17473C',paddingVertical:10,alignItems:'center'},
  activeChip:{borderColor:'#E8CA85',borderWidth:2},doneChip:{backgroundColor:'#266D53'},chipText:{color:'#FFF4DC',fontWeight:'800'},
  ayahCard:{backgroundColor:'#0D382F',borderWidth:1,borderColor:'#92723B',borderRadius:22,padding:19,gap:16},
  ayahNumber:{color:'#E8CA85',textAlign:'center',fontSize:13},ayahText:{fontSize:26,lineHeight:49,color:'#FFF9EB',textAlign:'center',writingDirection:'rtl'},
  note:{fontSize:11,color:'#9EB8B0',lineHeight:18,textAlign:'center'},stageRow:{flexDirection:'row',gap:5},
  stagePill:{flex:1,backgroundColor:'#17473C',borderRadius:10,paddingVertical:9,alignItems:'center'},
  stageActive:{backgroundColor:'#9B7436'},stageText:{fontSize:11,color:'#FFFFFF',fontWeight:'700'},
  panel:{padding:17,borderRadius:18,backgroundColor:'#123C32',gap:13},
  panelTitle:{color:'#F2D58F',fontSize:19,fontWeight:'800',textAlign:'center'},
  body:{color:'#F0F5EC',fontSize:15,lineHeight:26,textAlign:'center'},
  wordBox:{borderRadius:12,backgroundColor:'#205444',padding:12,alignItems:'center',gap:4},
  word:{color:'#F7D58B',fontSize:21},prompt:{color:'#FFF7E4',fontSize:21,textAlign:'center',lineHeight:35},
  choice:{padding:13,borderRadius:12,backgroundColor:'#245547',borderWidth:1,borderColor:'#426F5E'},
  selected:{borderColor:'#E8CA85',backgroundColor:'#346D53'},choiceText:{color:'#FFFFFF',textAlign:'center',fontSize:17},
  feedback:{color:'#F2D58F',textAlign:'center'},hint:{color:'#F2D58F',textAlign:'center',padding:8,textDecorationLine:'underline'},
  next:{backgroundColor:'#B58B45',padding:17,borderRadius:15,alignItems:'center'},disabled:{opacity:0.35},
  nextText:{color:'#09251F',fontSize:16,fontWeight:'900'},success:{padding:12,borderRadius:12,backgroundColor:'#245547'},
  successText:{color:'#D6F5D9',textAlign:'center'},error:{color:'#FFB7A9',textAlign:'center'}
});
