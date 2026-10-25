import React,{useEffect,useMemo,useRef,useState} from 'react';
import {AppState,FlatList,Pressable,ScrollView,StyleSheet,Text,TextInput,View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {setAudioModeAsync,useAudioPlayer,useAudioPlayerStatus} from 'expo-audio';
import {surahsList} from '../data/surahs';
import QuranMushafScreen from './QuranMushafScreen';

const START=[1,2,50,77,106,128,151,177,187,208,221,235,249,255,262,267,282,293,305,312,322,332,342,350,359,367,377,385,396,404,411,415,418,428,434,440,446,453,458,467,477,483,489,496,499,502,507,511,515,518,520,523,526,528,531,534,537,542,545,549,551,553,554,556,558,560,562,564,566,568,570,572,574,575,577,578,580,582,583,585,586,587,587,589,590,591,591,592,593,594,595,595,596,596,597,597,598,598,599,599,600,600,601,601,601,602,602,602,603,603,603,604,604,604];
// Full-surah recordings from mp3quran.net (all six checked for surahs 1, 2 and 114).
// The previous source only served two of the five reciters; the other three failed silently.
const RECITERS=[{id:'mishary-alafasy/r1',name:'مشاري راشد العفاسي'},{id:'mahmoud-husary/r1',name:'محمود خليل الحصري'},{id:'muhammad-minshawi/r1',name:'محمد صديق المنشاوي'},{id:'abdulbasit-abdulsamad/r3',name:'عبد الباسط عبد الصمد'},{id:'maher-muaiqly/r1',name:'ماهر المعيقلي'},{id:'abdulrahman-sudais/r1',name:'عبد الرحمن السديس'}];
const surahAudioUrl=(reciterId:string,surahNumber:number)=>`https://cdn.mp3quran.net/audio/${reciterId}/${String(surahNumber).padStart(3,'0')}.mp3`;
const LOAD_TIMEOUT_MS=15000;
type Mode='library'|'choice'|'read'|'listen';
const fmt=(n:number)=>String(n).padStart(3,'0');
export default function QuranReaderScreen({navigation}:any){
 const [mode,setMode]=useState<Mode>('library');const [selected,setSelected]=useState(1);const [search,setSearch]=useState('');const [reciter,setReciter]=useState(RECITERS[0]);const [reciterOpen,setReciterOpen]=useState(false);const [verse,setVerse]=useState(1);const [audioError,setAudioError]=useState('');const [busy,setBusy]=useState(false);const [repeat,setRepeat]=useState(false);const [lastPage,setLastPage]=useState(1);const [readPage,setReadPage]=useState(1);
 const player=useAudioPlayer(null);const status=useAudioPlayerStatus(player);
 const statusRef=useRef(status);statusRef.current=status;
 const loadTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{if(status.isLoaded&&status.duration>0){setAudioError('');if(loadTimer.current){clearTimeout(loadTimer.current);loadTimer.current=null}}},[status.isLoaded,status.duration]);
 useEffect(()=>()=>{if(loadTimer.current)clearTimeout(loadTimer.current)},[]);
 const surah=surahsList[selected-1];
 const [loadedKey,setLoadedKey]=useState('');
 const track=useRef({last:0,playing:false,source:'',pending:0});
 const flush=useRef(Promise.resolve());
 const recordSeconds=(seconds:number)=>{
  if(seconds<=0)return;
  const day=new Date().toLocaleDateString('en-CA');
  const key='sirag-quran-listen-seconds-'+day;
  // Serialize writes to prevent lost increments from rapid playback updates.
  flush.current=flush.current.then(async()=>{
   const previous=Number(await AsyncStorage.getItem(key))||0;
   await AsyncStorage.setItem(key,String(previous+seconds));
  }).catch(()=>{});
 };
 const commit=()=>{if(track.current.pending>0){recordSeconds(track.current.pending);track.current.pending=0}};
 useEffect(()=>{
  const current=Number(status.currentTime)||0;
  const t=track.current;
  // The native player can advance while JS is suspended. Reconcile its position on resume.
  if(t.source===loadedKey && t.playing && current>=t.last){
   const delta=current-t.last;
   if(delta>0 && delta<86400)t.pending+=delta;
  }
  t.last=current;t.playing=!!status.playing;t.source=loadedKey;
  if(!status.playing || t.pending>=5)commit();
 },[status.currentTime,status.playing,loadedKey]);
 useEffect(()=>{
  setAudioModeAsync({playsInSilentMode:true,shouldPlayInBackground:true,interruptionMode:'doNotMix'}).catch(()=>{});
  const subscription=AppState.addEventListener('change',state=>{if(state==='active')commit()});
  return ()=>{commit();subscription.remove()};
 },[]);
 useEffect(()=>{if(mode!=='library')return;AsyncStorage.getItem('sirag-quran-reader-v2').then(raw=>{if(raw){const p=JSON.parse(raw)?.page;if(typeof p==='number')setLastPage(p)}}).catch(()=>{})},[mode]);
 useEffect(()=>{AsyncStorage.getItem('sirag-quran-favorite-reciter').then(id=>{const found=RECITERS.find(r=>r.id===id);if(found)setReciter(found)}).catch(()=>{});AsyncStorage.getItem('sirag-quran-reader-v2').then(raw=>{if(raw){const p=JSON.parse(raw)?.page;if(typeof p==='number')setLastPage(p)}}).catch(()=>{});},[]);
 // Leave playback running when the app goes into the background; stop only when exiting the listening view.
 useEffect(()=>{if(mode!=='listen'){player.pause();commit()}},[mode]);
 const play=async(reader=reciter,number=selected)=>{
  try{
   setBusy(true);setAudioError('');commit();
   const key=`${reader.id}-${number}`;
   track.current={last:0,playing:false,source:key,pending:0};
   player.pause();
   player.replace({uri:surahAudioUrl(reader.id,number)});
   setLoadedKey(key);
   player.setActiveForLockScreen(true,{
    title:`سورة ${surahsList[number-1].name}`,
    artist:reader.name,
    albumTitle:'القرآن الكريم · سراج',
   });
   player.play();
   if(loadTimer.current)clearTimeout(loadTimer.current);
   loadTimer.current=setTimeout(()=>{const st=statusRef.current;if(!(st.isLoaded&&st.duration>0)){player.pause();setAudioError('تعذّر تحميل التلاوة. تحقق من اتصالك بالإنترنت، ثم اضغط تشغيل مرة أخرى أو اختر قارئًا آخر.')}},LOAD_TIMEOUT_MS);
  }catch{setAudioError('تعذّر تحميل تسجيل السورة. تحقق من الإنترنت أو اختر قارئًا آخر.')}finally{setBusy(false)}
 };
 useEffect(()=>{if(status.didJustFinish){commit();if(repeat&&mode==='listen'){player.seekTo(0);player.play()}}},[status.didJustFinish,repeat,mode]);
 const filtered=useMemo(()=>surahsList.filter(x=>x.name.includes(search.trim())||x.english.toLowerCase().includes(search.toLowerCase())||String(x.number)===search.trim()),[search]);
 const back=()=>{player.pause();commit();if(mode==='library')navigation.goBack();else if(mode==='choice')setMode('library');else setMode('choice')};
 if(mode==='read')return <QuranMushafScreen initialPage={readPage} navigation={{goBack:()=>setMode('library')}}/>;
 return <SafeAreaView style={st.root} edges={['top','bottom']}>
 <View style={st.header}><Pressable onPress={back} accessibilityRole="button"><Text style={st.back}>‹ رجوع</Text></Pressable><Text style={st.headerTitle}>{mode==='library'?'القرآن الكريم':mode==='choice'?'اختر طريقتك':'مشغل القرآن'}</Text><Text style={st.symbol}>۞</Text></View>
 {mode==='library'?<><View style={st.hero}><Text style={st.ornament}>۞ ﷽ ۞</Text><Text style={st.heroTitle}>القرآن الكريم</Text><Text style={st.heroSub}>نورٌ لقلبك، ورفيقٌ لرحلتك</Text><Pressable style={st.resume} onPress={()=>{const n=START.reduce((a,p,i)=>p<=lastPage?i+1:a,1);setSelected(n);setReadPage(lastPage);setMode('read')}}><Text style={st.resumeText}>متابعة القراءة  ·  الصفحة {lastPage.toLocaleString('ar-EG')}  ←</Text></Pressable></View><View style={st.library}><View style={st.sectionRow}><Text style={st.sectionTitle}>فهرس السور</Text><Text style={st.sectionMeta}>١١٤ سورة</Text></View><TextInput style={st.search} placeholder="ابحث عن سورة..." placeholderTextColor="#8a968c" value={search} onChangeText={setSearch} textAlign="right"/><FlatList data={filtered} keyExtractor={x=>String(x.number)} keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:30}} renderItem={({item})=><Pressable style={st.surahRow} onPress={()=>{setSelected(item.number);setMode('choice')}}><Text style={st.chevron}>‹</Text><View style={st.surahInfo}><Text style={st.surahName}>سورة {item.name}</Text><Text style={st.surahSub}>{item.english}  ·  {item.totalAyahs.toLocaleString('ar-EG')} آية</Text></View><View style={st.numberMedal}><Text style={st.numberText}>{item.number.toLocaleString('ar-EG')}</Text></View></Pressable>}/></View></>:
 mode==='choice'?<ScrollView contentContainerStyle={st.choice}><Text style={st.choiceOrnament}>۞</Text><Text style={st.choiceLabel}>سورة {surah.name}</Text><Text style={st.choiceSub}>{surah.totalAyahs.toLocaleString('ar-EG')} آية  ·  {surah.english}</Text><Text style={st.prompt}>كيف تحب أن تتلو اليوم؟</Text><Pressable style={st.choiceCard} onPress={()=>{setReadPage(START[selected-1]);setMode('read')}}><Text style={st.choiceIcon}>﴿ ﷽ ﴾</Text><View style={{flex:1}}><Text style={st.choiceTitle}>اقرأ السورة</Text><Text style={st.choiceDescription}>صفحات المصحف والخط العثماني</Text></View><Text style={st.choiceArrow}>‹</Text></Pressable><Pressable style={[st.choiceCard,st.listenCard]} onPress={()=>{setMode('listen');setLoadedKey('')}}><Text style={st.choiceIcon}>♫</Text><View style={{flex:1}}><Text style={st.choiceTitle}>استمع للسورة</Text><Text style={st.choiceDescription}>مشغل التلاوة مع قارئك المفضل</Text></View><Text style={st.choiceArrow}>‹</Text></Pressable></ScrollView>:
 <ScrollView contentContainerStyle={st.playerScreen}><View style={st.playerArt}><Text style={st.playerOrnament}>۞</Text><Text style={st.playerArtText}>القرآن الكريم</Text><Text style={st.playerSurah}>سورة {surah.name}</Text><Text style={st.playerReciter}>{reciter.name}</Text></View><Pressable style={st.reciterButton} onPress={()=>setReciterOpen(!reciterOpen)}><Text style={st.reciterText}>القارئ: {reciter.name}  ⌄</Text></Pressable>{reciterOpen&&<View style={st.reciterList}>{RECITERS.map(r=><Pressable key={r.id} style={st.reciterItem} onPress={()=>{setReciter(r);setReciterOpen(false);AsyncStorage.setItem('sirag-quran-favorite-reciter',r.id).catch(()=>{});if(loadedKey)play(r)}}><Text style={st.reciterText}>{r.name}{r.id===reciter.id?'  ✓':''}</Text></Pressable>)}</View>}<Text style={st.verseLabel}>{status.duration>0?`${Math.floor(status.currentTime/60)}:${String(Math.floor(status.currentTime%60)).padStart(2,'0')} / ${Math.floor(status.duration/60)}:${String(Math.floor(status.duration%60)).padStart(2,'0')}`:'تلاوة كاملة متصلة'}</Text><View style={st.track}><View style={[st.trackFill,{width:`${status.duration>0?Math.min(100,100*status.currentTime/status.duration):0}%`}]}/></View><View style={st.controls}><Pressable accessibilityLabel="رجوع 15 ثانية" onPress={()=>player.seekTo(Math.max(0,status.currentTime-15))}><Text style={st.skip}>↶ 15</Text></Pressable><Pressable style={st.playButton} onPress={()=>{if(status.playing){player.pause();commit()}else if(loadedKey&&status.isLoaded&&!audioError){if(status.duration>0&&status.currentTime>=status.duration-0.5)player.seekTo(0);player.play()}else play()}}><Text style={st.playText}>{busy?'…':status.playing?'Ⅱ':'▶'}</Text></Pressable><Pressable accessibilityLabel="تقديم 15 ثانية" onPress={()=>player.seekTo(Math.min(status.duration||Infinity,status.currentTime+15))}><Text style={st.skip}>15 ↷</Text></Pressable></View><Pressable onPress={()=>setRepeat(!repeat)}><Text style={st.repeat}>{repeat?'↻ تكرار السورة: مفعّل':'↻ تكرار السورة: متوقف'}</Text></Pressable>{audioError?<Text style={st.error}>{audioError}</Text>:null}<Text style={st.disclaimer}>يُبث الصوت عبر الإنترنت. يُحتسب وقت تشغيل التلاوة الفعلي في الإحصائيات. تسجيل كامل لكل سورة عبر mp3quran.net. يمكن التحكم بالتلاوة من شاشة القفل عند دعم الجهاز.</Text></ScrollView>}
 </SafeAreaView>;
}
const st=StyleSheet.create({root:{flex:1,backgroundColor:'#103c33'},header:{padding:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},back:{color:'#e7c88e',fontSize:15,fontWeight:'700'},headerTitle:{color:'#fff5df',fontSize:18,fontWeight:'800'},symbol:{color:'#d8b77a',fontSize:23},hero:{marginHorizontal:13,marginBottom:10,borderRadius:20,backgroundColor:'#195747',alignItems:'center',paddingVertical:19,paddingHorizontal:14,borderWidth:1,borderColor:'#54765b'},ornament:{color:'#e5c68c',fontSize:22},heroTitle:{color:'#fff4db',fontSize:30,fontWeight:'800',marginTop:4},heroSub:{color:'#d6e4d5',fontSize:13,marginVertical:8},resume:{backgroundColor:'#e7c88e',paddingVertical:11,paddingHorizontal:20,borderRadius:12,marginTop:5},resumeText:{color:'#173f32',fontWeight:'800',fontSize:13},library:{flex:1,backgroundColor:'#faf5e9',borderTopLeftRadius:24,borderTopRightRadius:24,padding:16},sectionRow:{flexDirection:'row-reverse',justifyContent:'space-between',alignItems:'center'},sectionTitle:{color:'#164d3e',fontWeight:'800',fontSize:20},sectionMeta:{color:'#907b58',fontSize:12},search:{borderWidth:1,borderColor:'#ded4bf',backgroundColor:'#fffdf8',borderRadius:12,padding:12,marginVertical:13,color:'#183e33',fontSize:15},surahRow:{flexDirection:'row',alignItems:'center',paddingVertical:13,borderBottomWidth:1,borderColor:'#e6dcc8',gap:12},chevron:{color:'#ad8d52',fontSize:26},surahInfo:{flex:1,alignItems:'flex-end'},surahName:{color:'#174a3c',fontWeight:'800',fontSize:19},surahSub:{color:'#857c69',fontSize:12,marginTop:3},numberMedal:{width:43,height:43,borderRadius:13,borderWidth:1,borderColor:'#d4b776',alignItems:'center',justifyContent:'center',backgroundColor:'#f3e9d4'},numberText:{color:'#81632e',fontWeight:'800'},choice:{flexGrow:1,padding:22,alignItems:'center',justifyContent:'center'},choiceOrnament:{fontSize:50,color:'#ddc184'},choiceLabel:{fontSize:32,color:'#fff1d2',fontWeight:'800'},choiceSub:{fontSize:14,color:'#c8d9ce',marginTop:8},prompt:{color:'#e6c88c',fontSize:19,fontWeight:'700',marginVertical:29},choiceCard:{width:'100%',flexDirection:'row-reverse',alignItems:'center',gap:13,backgroundColor:'#fff7e7',padding:20,borderRadius:18,marginBottom:14},listenCard:{backgroundColor:'#e5c88e'},choiceIcon:{fontSize:25,color:'#145042'},choiceTitle:{fontSize:19,fontWeight:'800',color:'#154b3b',textAlign:'right'},choiceDescription:{fontSize:12,color:'#786b54',textAlign:'right',marginTop:5},choiceArrow:{fontSize:27,color:'#174c3b'},playerScreen:{padding:22,alignItems:'center',paddingBottom:50},playerArt:{width:'100%',minHeight:255,borderRadius:24,borderWidth:1,borderColor:'#947947',backgroundColor:'#195747',alignItems:'center',justifyContent:'center',padding:24},playerOrnament:{fontSize:52,color:'#dfc082'},playerArtText:{fontSize:16,color:'#d6c99e'},playerSurah:{fontSize:34,fontWeight:'800',color:'#fff6dc',marginVertical:10},playerReciter:{color:'#e3d6ae',fontSize:16},reciterButton:{padding:15,marginTop:19,borderRadius:12,borderColor:'#65836e',borderWidth:1,width:'100%'},reciterText:{color:'#f0d9a6',textAlign:'center',fontWeight:'700'},reciterList:{width:'100%',backgroundColor:'#205748',borderRadius:12,marginTop:6},reciterItem:{padding:13,borderBottomWidth:1,borderColor:'#487260'},verseLabel:{color:'#f3e2be',marginTop:29,fontSize:15},track:{height:7,width:'100%',borderRadius:8,backgroundColor:'#3e6c59',marginTop:15,overflow:'hidden'},trackFill:{height:7,backgroundColor:'#e3c484'},controls:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:43,marginTop:28},skip:{color:'#e7c88e',fontSize:24},playButton:{backgroundColor:'#e7c88e',width:75,height:75,borderRadius:40,alignItems:'center',justifyContent:'center'},playText:{fontSize:30,color:'#174537'},repeat:{color:'#d5d7c3',marginTop:26},error:{color:'#ffd3c3',textAlign:'center',marginTop:18},disclaimer:{color:'#adc9b8',fontSize:11,textAlign:'center',marginTop:28,lineHeight:18}});
