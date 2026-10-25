import React, {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,Alert,FlatList,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {LOG_KEY,PLANS_KEY,localDay,HabitPlan} from '../habits/habitData';
import {surahsList} from '../data/surahs';
import {syncNotificationsSoon} from '../notifications/scheduler';
import {useListeningTracker} from '../tracking/useListeningTracker';
import {updateJSON} from '../storage/jsonStore';
import {logKind} from '../habits/habitLog';

import {splitBasmala} from '../quran/quranText';
const BASMALA='بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
const num=(n:number)=>n.toLocaleString('ar-EG');

const API='https://api.alquran.cloud/v1';
const STATE_KEY='sirag-quran-reader-v2';
const CACHE_PREFIX='sirag-quran-page-v2-';
const TOTAL_PAGES=604;
// Madinah Mushaf surah opening pages (1-indexed).
const SURAH_START_PAGES=[1,2,50,77,106,128,151,177,187,208,221,235,249,255,262,267,282,293,305,312,322,332,342,350,359,367,377,385,396,404,411,415,418,428,434,440,446,453,458,467,477,483,489,496,499,502,507,511,515,518,520,523,526,528,531,534,537,542,545,549,551,553,554,556,558,560,562,564,566,568,570,572,574,575,577,578,580,582,583,585,586,587,587,589,590,591,591,592,593,594,595,595,596,596,597,597,598,598,599,599,600,600,601,601,601,602,602,602,603,603,603,604,604,604];
type Ayah={number:number;numberInSurah:number;text:string;surah:{number:number;name:string;englishName:string};page:number};
type QuranState={page:number;bookmarks:number[];readDays:Record<string,number[]>;listenedSeconds:Record<string,number>};
const DEFAULT:QuranState={page:1,bookmarks:[],readDays:{},listenedSeconds:{}};
const audioUrl=(a:Ayah)=>`https://everyayah.com/data/Alafasy_128kbps/${String(a.surah.number).padStart(3,'0')}${String(a.numberInSurah).padStart(3,'0')}.mp3`;

export default function QuranMushafScreen({navigation,initialPage}:any){
 const [state,setState]=useState<QuranState>(DEFAULT);
 const [page,setPage]=useState<number>(initialPage||1);
 const [reloadTick,setReloadTick]=useState(0);
 const continueAudio=useRef(false);
 const [ayahs,setAyahs]=useState<Ayah[]>([]);
 const [busy,setBusy]=useState(true);
 const [error,setError]=useState('');
 const [selected,setSelected]=useState<number|null>(null);
 const [showIndex,setShowIndex]=useState(false);
 const [surahs,setSurahs]=useState<{number:number;name:string;englishName:string;startPage:number}[]>([]);
 const [audioAyah,setAudioAyah]=useState<number|null>(null);
 const [audioError,setAudioError]=useState('');
 const [readingMode,setReadingMode]=useState<'mushaf'|'accessible'>('mushaf');
 const player=useAudioPlayer(null);
 const audioStatus=useAudioPlayerStatus(player);
 const listening=useListeningTracker(audioStatus,String(audioAyah || ''));
 const seek=(position:number)=>{listening.beforeSeek();player.seekTo(position)};
 const [audioBusy,setAudioBusy]=useState(false);
 const day=localDay();
 const save=useCallback(async(next:QuranState)=>{try{const saved=await updateJSON<QuranState>(STATE_KEY,DEFAULT,previous=>({...previous,page:next.page,bookmarks:next.bookmarks}));setState(saved)}catch{Alert.alert('تعذّر الحفظ','لم نتمكن من حفظ موضع القراءة أو العلامة. تحقق من مساحة الجهاز.')}},[]);
 useEffect(()=>{AsyncStorage.getItem(STATE_KEY).then(raw=>{if(!raw)return;const saved=JSON.parse(raw) as QuranState;if(saved.page>=1&&saved.page<=TOTAL_PAGES){setState(prev=>({...DEFAULT,...saved,page:prev.page>1?prev.page:(initialPage||saved.page)}));if(!initialPage)setPage(saved.page)}}).catch(()=>{});},[]);
 useEffect(()=>{setSurahs(surahsList.map(x=>({number:x.number,name:'سورة '+x.name,englishName:x.english,startPage:SURAH_START_PAGES[x.number-1]||1})))},[]);
 useEffect(()=>{let live=true;setBusy(true);setError('');setAyahs([]);setSelected(null);
 (async()=>{try{const key=CACHE_PREFIX+page;let payload=await AsyncStorage.getItem(key);let items:Ayah[]|null=payload?JSON.parse(payload):null;
 if(!items){const response=await fetch(`${API}/page/${page}/quran-uthmani`);if(!response.ok)throw Error('network');const result=await response.json();items=result?.data?.ayahs;if(!Array.isArray(items)||!items.length)throw Error('empty');await AsyncStorage.setItem(key,JSON.stringify(items)).catch(()=>{});}
 if(live){setAyahs(items!);const saved=await updateJSON<QuranState>(STATE_KEY,DEFAULT,previous=>({...previous,page}));if(live)setState(saved);}
 }catch{if(live)setError('تعذّر تحميل الصفحة. اتصل بالإنترنت ثم أعد المحاولة. الصفحات التي فتحتها سابقًا متاحة دون اتصال.')}finally{if(live)setBusy(false)}})();
 return()=>{live=false};},[page,reloadTick]);
 const move=(next:number)=>{if(next<1||next>TOTAL_PAGES)return;player.pause();continueAudio.current=false;pendingPageStart.current=false;setAudioAyah(null);setPage(next);save({...state,page:next})};
 const bookmark=(number:number)=>save({...state,bookmarks:state.bookmarks.includes(number)?state.bookmarks.filter(n=>n!==number):[...state.bookmarks,number]});
 const readPages=state.readDays[day]||[];
 const marking=useRef(false);
 const markRead=async()=>{
  if(marking.current||busy||error||!ayahs.length)return;
  marking.current=true;
  try{
   const date=localDay();
   const next=await updateJSON<QuranState>(STATE_KEY,DEFAULT,previous=>({...previous,page,readDays:{...previous.readDays,[date]:[...new Set([...(previous.readDays[date]||[]),page])]}}));
   setState(next);
   await logKind(['quran_read','quran'],next.readDays[date].length,'max',date);
  }catch{Alert.alert('تعذّر الحفظ','لم نتمكن من حفظ تقدم القراءة. حاول مرة أخرى.')}finally{marking.current=false}
 };
 const play=async(a:Ayah)=>{try{setAudioBusy(true);setAudioError('');if(audioAyah===a.number){if(audioStatus.playing){player.pause();continueAudio.current=false}else{if(audioStatus.duration>0&&audioStatus.currentTime>=audioStatus.duration-0.3)seek(0);player.play();continueAudio.current=true}return}continueAudio.current=true;listening.beforeSeek();player.pause();player.replace({uri:audioUrl(a)});player.play();setAudioAyah(a.number)}catch{setAudioError('تعذّر تشغيل التلاوة. تأكد من الاتصال بالإنترنت.')}finally{setAudioBusy(false)}};
 const currentAudioIndex=ayahs.findIndex(a=>a.number===audioAyah);
 const pendingPageStart=useRef(false);
 useEffect(()=>{if(!audioStatus.didJustFinish||!continueAudio.current)return;
  const i=ayahs.findIndex(a=>a.number===audioAyah);
  if(i>=0&&i<ayahs.length-1){play(ayahs[i+1]);return}
  if(page<TOTAL_PAGES){pendingPageStart.current=true;setPage(page+1);setState(prev=>({...prev,page:page+1}));}
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[audioStatus.didJustFinish]);
 useEffect(()=>{if(pendingPageStart.current&&ayahs.length&&!busy){pendingPageStart.current=false;play(ayahs[0])}
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[ayahs,busy]);
 const skipAudio=(step:number)=>{const idx=currentAudioIndex<0?(step>0?0:ayahs.length-1):currentAudioIndex+step;if(idx>=0&&idx<ayahs.length)play(ayahs[idx]);};
 const currentSurah=ayahs[0]?.surah;
 const groups=useMemo(()=>{const out:{key:string;surah:Ayah['surah'];starts:boolean;first:boolean;ayahs:Ayah[]}[]=[];for(const a of ayahs){const last=out[out.length-1];if(last&&last.surah.number===a.surah.number)last.ayahs.push(a);else out.push({key:a.surah.number+'-'+a.number,surah:a.surah,starts:a.numberInSurah===1,first:out.length===0,ayahs:[a]})}return out},[ayahs]);
 const bookmarksOnPage=ayahs.filter(a=>state.bookmarks.includes(a.number));
 const ayahText=useMemo(()=>ayahs.map(a=>`${a.text} ﴿${a.numberInSurah.toLocaleString('ar-EG')}﴾`).join('  '),[ayahs]);
 return <SafeAreaView style={s.root} edges={['top','bottom']}>
  <View style={s.top}><Pressable onPress={()=>navigation.goBack()}><Text style={s.topLink}>رجوع ‹</Text></Pressable><View style={{alignItems:'center'}}><Text style={s.title}>القرآن الكريم</Text><Text style={s.subtitle}>الصفحة {page.toLocaleString('ar-EG')} من ٦٠٤</Text></View><Pressable onPress={()=>setShowIndex(v=>!v)}><Text style={s.topLink}>السور ☰</Text></Pressable></View>
  {showIndex?<View style={s.index}><Text style={s.indexTitle}>فهرس السور</Text><ScrollView>{surahs.length?surahs.map(x=><Pressable key={x.number} style={s.indexRow} onPress={()=>{move(x.startPage);setShowIndex(false)}}><Text style={s.indexText}>{x.number}. {x.name} — {x.englishName}</Text></Pressable>):<Text style={s.note}>يتطلب تحميل الفهرس اتصالًا بالإنترنت.</Text>}</ScrollView><Pressable onPress={()=>setShowIndex(false)}><Text style={s.topLink}>إغلاق</Text></Pressable></View>:
  <><View style={s.modeRow}><Pressable onPress={()=>setReadingMode('mushaf')}><Text style={[s.mode,readingMode==='mushaf'&&s.modeActive]}>المصحف</Text></Pressable><Pressable onPress={()=>setReadingMode('accessible')}><Text style={[s.mode,readingMode==='accessible'&&s.modeActive]}>آية بآية</Text></Pressable><Text style={s.readCount}>قُرئت اليوم: {readPages.length} صفحة</Text></View>
  <View style={s.audioBar}>
   <View style={s.audioHeader}><Text style={s.audioTitle}>🎧 الاستماع إلى التلاوة</Text><Text style={s.audioDetail}>{audioAyah!==null?`الآية ${ayahs.find(a=>a.number===audioAyah)?.numberInSurah||''} • مشاري العفاسي`:'مشاري العفاسي • اختر تشغيل للاستماع'}</Text></View>
   <View style={s.audioControls}>
    <Pressable accessibilityLabel="الآية السابقة" onPress={()=>skipAudio(-1)} disabled={!ayahs.length}><Text style={s.audioControlText}>❮ السابقة</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={audioStatus.playing?'إيقاف مؤقت':'تشغيل التلاوة'} onPress={()=>{const a=ayahs.find(a=>a.number===audioAyah)||ayahs[0];if(a)play(a)}} disabled={!ayahs.length||audioBusy} style={s.audioPlay}><Text style={s.audioPlayText}>{audioBusy?'جارٍ التحميل':audioStatus.playing?'Ⅱ إيقاف مؤقت':'▶ استمع الآن'}</Text></Pressable>
    <Pressable accessibilityLabel="الآية التالية" onPress={()=>skipAudio(1)} disabled={!ayahs.length}><Text style={s.audioControlText}>التالية ❯</Text></Pressable>
   </View>
   {audioError?<Text style={s.audioError}>{audioError}</Text>:null}
  </View>
  <View style={s.paper}>
   {busy?<ActivityIndicator size="large" color="#95723a" style={{marginTop:80}}/>:error?<View style={s.center}><Text style={s.note}>{error}</Text><Pressable onPress={()=>setReloadTick(t=>t+1)} style={s.retry}><Text style={s.retryText}>إعادة المحاولة</Text></Pressable></View>:
   <ScrollView key={page+'-'+readingMode} contentContainerStyle={s.paperContent}>
    {groups.map(g=><View key={g.key}>
     {g.starts?<><Text style={s.surahHeader}>{g.surah.name}</Text>{g.surah.number!==1&&g.surah.number!==9?<Text style={s.basmala}>{BASMALA}</Text>:null}</>:g.first?<Text style={s.surahRunning}>{g.surah.name}</Text>:null}
     {readingMode==='mushaf'?<Text style={s.mushafText} selectable>{g.ayahs.map(a=><Text key={a.number}>{splitBasmala(a)} <Text style={s.verseMarker}>﴿{num(a.numberInSurah)}﴾</Text>{' '}</Text>)}</Text>
     :g.ayahs.map(a=><Pressable key={a.number} onPress={()=>setSelected(a.number)} style={[s.ayahCard,selected===a.number&&s.ayahSelected,audioAyah===a.number&&s.ayahPlaying]}><Text style={s.ayahText} selectable>{splitBasmala(a)} <Text style={s.verseMarker}>﴿{num(a.numberInSurah)}﴾</Text></Text><View style={s.ayahActions}><Pressable onPress={()=>bookmark(a.number)}><Text style={s.action}>{state.bookmarks.includes(a.number)?'★ محفوظة':'☆ حفظ'}</Text></Pressable><Pressable onPress={()=>play(a)}><Text style={s.action}>{audioAyah===a.number&&audioStatus.playing?'إيقاف ◼':'استمع ▶'}</Text></Pressable></View></Pressable>)}
    </View>)}
    {readingMode==='mushaf'&&<Text style={s.note}>للاستماع استخدم مشغل التلاوة أعلى الصفحة. ولحفظ آية اختر «آية بآية».</Text>}
    <Pressable onPress={markRead} style={[s.complete,readPages.includes(page)&&s.completed]}><Text style={s.completeText}>{readPages.includes(page)?'✓ تم تسجيل قراءة هذه الصفحة اليوم':'✓ انتهيت من قراءة هذه الصفحة'}</Text></Pressable>

   </ScrollView>}
  </View>
  <View style={s.bottom}><Pressable onPress={()=>move(page+1)} disabled={page===TOTAL_PAGES}><Text style={s.nav}>الصفحة التالية ❮</Text></Pressable><Text style={s.pageNo}>{page.toLocaleString('ar-EG')}</Text><Pressable onPress={()=>move(page-1)} disabled={page===1}><Text style={s.nav}>❯ السابقة</Text></Pressable></View>
  <Text style={s.footnote}>نص عثماني عبر AlQuran Cloud • الصوت عبر EveryAyah • يتطلب الاتصال للصفحات غير المحفوظة</Text>
  </>}
 </SafeAreaView>;
}
const s=StyleSheet.create({root:{flex:1,backgroundColor:'#103c33'},top:{padding:13,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},topLink:{color:'#e9c784',fontSize:14,fontWeight:'700'},title:{color:'#fff6df',fontWeight:'800',fontSize:19},subtitle:{color:'#d4c9ad',fontSize:11},modeRow:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:14,paddingBottom:10},mode:{color:'#c8d7cb',padding:7},modeActive:{color:'#f5cf83',borderBottomWidth:2,borderColor:'#f5cf83'},readCount:{color:'#d5ddce',fontSize:11,marginLeft:'auto'},paper:{flex:1,marginHorizontal:9,backgroundColor:'#fbf5e7',borderRadius:12,overflow:'hidden'},paperContent:{padding:17,paddingBottom:40},surahHeader:{fontFamily:'AmiriQuran',color:'#6b512d',fontSize:24,lineHeight:44,textAlign:'center',paddingVertical:13,borderTopWidth:1,borderBottomWidth:1,borderColor:'#c7b18c',marginBottom:20},mushafText:{fontFamily:'AmiriQuran',fontSize:25,lineHeight:62,color:'#29231b',textAlign:'justify',writingDirection:'rtl'},basmala:{fontFamily:'AmiriQuran',fontSize:23,lineHeight:52,color:'#5c4524',textAlign:'center',marginBottom:10},surahRunning:{fontFamily:'PlexMedium',fontSize:12,color:'#9a7a4a',textAlign:'center',marginBottom:6},ayahPlaying:{borderColor:'#c9973f',backgroundColor:'#fbf0d9'},retry:{marginTop:12,backgroundColor:'#103c33',paddingVertical:10,paddingHorizontal:20,borderRadius:12},retryText:{color:'#f5cf83',fontFamily:'PlexBold',fontSize:14},mushafBody:{flexDirection:'row-reverse',flexWrap:'wrap',justifyContent:'center',alignItems:'baseline'},mushafVerse:{fontSize:26,lineHeight:53,color:'#29231b',textAlign:'right',writingDirection:'rtl'},verseMarker:{fontSize:17,color:'#9a753e'},audioBar:{backgroundColor:'#164b3d',paddingHorizontal:13,paddingVertical:9,borderTopWidth:1,borderColor:'#467361'},audioHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8,marginBottom:9},audioTitle:{color:'#fff1cc',fontSize:14,fontWeight:'800'},audioDetail:{color:'#c6d9c8',fontSize:11,flexShrink:1},audioControls:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},audioControlText:{color:'#eed59d',fontSize:12,fontWeight:'700'},audioPlay:{backgroundColor:'#e5c47e',borderRadius:30,paddingVertical:9,paddingHorizontal:19},audioPlayText:{color:'#123e32',fontWeight:'800',fontSize:14},audioError:{color:'#ffe0c9',fontSize:12,textAlign:'center',paddingTop:7},ayahCard:{borderBottomWidth:1,borderColor:'#e2d5bb',paddingVertical:12},ayahSelected:{backgroundColor:'#f1e5c8'},ayahText:{fontFamily:'AmiriQuran',fontSize:24,lineHeight:56,color:'#29231b',textAlign:'right',writingDirection:'rtl'},ayahActions:{flexDirection:'row',justifyContent:'space-between',paddingVertical:7},action:{color:'#846129',fontWeight:'700',fontSize:13},complete:{backgroundColor:'#12584b',borderRadius:12,padding:14,marginTop:24},completed:{backgroundColor:'#547a59'},completeText:{color:'#fff9e8',textAlign:'center',fontWeight:'800'},bottom:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:13},nav:{color:'#f4d492',fontWeight:'700',fontSize:14},pageNo:{color:'white',fontSize:18},footnote:{color:'#b6c7bb',fontSize:10,textAlign:'center',paddingBottom:7},note:{fontSize:12,color:'#846d4e',textAlign:'center',marginVertical:15,lineHeight:20},center:{padding:30,alignItems:'center',gap:18},index:{flex:1,backgroundColor:'#fbf5e7',padding:18},indexTitle:{color:'#12584b',fontSize:21,fontWeight:'800',textAlign:'right',marginBottom:12},indexRow:{paddingVertical:11,borderBottomWidth:1,borderColor:'#dfd5c1'},indexText:{color:'#184c3d',fontSize:16,textAlign:'right'}});
