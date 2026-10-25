import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../contexts/LanguageContext';
import { FIRST_BLOOM_HTML } from '../bloom/firstBloomHtml';

const BLOOM_KEY = 'batl-first-bloom-v1';
const GARDEN_KEY = 'batl-garden-v1';
const dayKey = (d:Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export default function FirstBloomScreen({ navigation }:any) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const ar = language === 'ar';
  const t = (a:string,e:string) => ar ? a : e;
  const web = useRef<WebView>(null);
  const [ready,setReady] = useState(false);
  const [loaded,setLoaded] = useState(false);
  const [bloomed,setBloomed] = useState(false);
  const [busy,setBusy] = useState(false);
  const [reduced,setReduced] = useState(false);
  const [error,setError] = useState('');
  const [animating,setAnimating] = useState(false);
  useEffect(()=>{
    let active = true;
    Promise.all([AsyncStorage.getItem(BLOOM_KEY),AccessibilityInfo.isReduceMotionEnabled()])
      .then(([v,m])=>{if(active){setBloomed(v==='bloomed');setReduced(m)}})
      .catch(()=>{if(active)setError(t('تعذر تحميل حالة الزهرة.','Could not load bloom state.'))})
      .finally(()=>{if(active)setLoaded(true)});
    return ()=>{active=false};
  },[]);
  const send = (payload:object) => web.current?.injectJavaScript(`window.BatlBloom && (function(){var d=${JSON.stringify(payload)};if(d.type==='restore')window.BatlBloom.restore(d.bloomed);if(d.type==='start')window.BatlBloom.start();if(d.type==='replay')window.BatlBloom.replay();if(d.type==='reducedMotion')window.BatlBloom.reducedMotion(d.value)})();true;`);
  useEffect(()=>{if(ready && loaded){send({type:'restore',bloomed});send({type:'reducedMotion',value:reduced})}},[ready,loaded]);
  const complete = async () => {
    if(busy || bloomed || !ready || !loaded)return;
    setBusy(true);setError('');
    try {
      // Persist the actual Quran reading check-in before unlocking the bloom.
      const raw=await AsyncStorage.getItem(GARDEN_KEY);
      const parsed=raw?JSON.parse(raw):{};
      const data=parsed && typeof parsed==='object' && !Array.isArray(parsed)?parsed:{};
      const key=dayKey(new Date());
      const current=Array.isArray(data[key])?data[key]:[];
      if(!current.includes('quran'))await AsyncStorage.setItem(GARDEN_KEY,JSON.stringify({...data,[key]:[...current,'quran']}));
      await AsyncStorage.setItem(BLOOM_KEY,'bloomed');
      setBloomed(true);setAnimating(true);
      send({type:'start'});
    } catch {
      setError(t('تعذر حفظ التقدم. حاول مرة أخرى.','Could not save progress. Please try again.'));
    } finally {setBusy(false)}
  };
  const replay=()=>{setAnimating(true);send({type:'replay'})};
  const onMessage=(event:any)=>{
    try{const message=JSON.parse(event.nativeEvent.data);
      if(message.type==='ready')setReady(true);
      if(message.type==='started')setAnimating(true);
      if(message.type==='finished')setAnimating(false);
    }catch{}
  };
  return <View style={[styles.root,{paddingTop:insets.top}]}>
    <View style={styles.header}>
      <TouchableOpacity onPress={()=>navigation.goBack()} accessibilityRole="button" style={styles.back}><Text style={styles.gold}>{t('‹ رجوع','‹ Back')}</Text></TouchableOpacity>
      <Text style={styles.headerTitle}>{t('أول زهرة','The First Bloom')}</Text>
      <Text style={styles.headerSymbol}>✧</Text>
    </View>
    <View style={styles.scene}>
      <WebView ref={web} source={{html:FIRST_BLOOM_HTML,baseUrl:'https://localhost/'}} originWhitelist={['*']} javaScriptEnabled domStorageEnabled
        onMessage={onMessage} onError={()=>setError(t('تعذر فتح المشهد ثلاثي الأبعاد.','3D scene could not load.'))}
        scrollEnabled={false} bounces={false} style={{backgroundColor:'#061d19',flex:1}} overScrollMode="never" />
      {(!ready || !loaded) && <View style={styles.loader}><ActivityIndicator color="#E6C477"/><Text style={styles.help}>{t('نجهّز عالمك الحي...','Preparing your living world...')}</Text></View>}
    </View>
    <View style={[styles.bottom,{paddingBottom:Math.max(insets.bottom,14)}]}>
      <Text style={styles.description}>{bloomed ? t('زهرتك تفتحت. يمكنك العودة إليها واستكشافها في أي وقت.','Your flower has bloomed. Come back and explore it anytime.') : t('خطوة صغيرة اليوم، وزهرة تبقى في حديقتك.','One small action today, one lasting flower in your garden.')}</Text>
      {!bloomed ? <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled:busy||!ready||!loaded}} disabled={busy||!ready||!loaded} style={[styles.button,(busy||!ready||!loaded)&&styles.disabled]} onPress={complete}>
        <Text style={styles.buttonText}>{busy?t('جارٍ الحفظ...','Saving...'):t('أكملت وقتي مع القرآن · ازرع الزهرة','I completed Quran time · Grow my flower')}</Text>
      </TouchableOpacity> : <TouchableOpacity accessibilityRole="button" disabled={!ready||animating} style={[styles.button,(!ready||animating)&&styles.disabled]} onPress={replay}>
        <Text style={styles.buttonText}>{animating?t('الزهرة تتفتح...','The flower is blooming...'):t('أعد مشاهدة لحظة التفتح','Replay the cinematic bloom')}</Text>
      </TouchableOpacity>}
      <Text style={styles.help}>{t('اسحب لتدوير المشهد. التقدم محفوظ على هذا الجهاز.','Drag to orbit the 3D scene. Progress stays on this device.')}</Text>
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.disclaimer}>{t('هذه الزهرة رمز لجهدك، وليست مقياسًا لإيمانك.','This flower represents effort, not a measure of faith.')}</Text>
    </View>
  </View>;
}
const styles=StyleSheet.create({
 root:{flex:1,backgroundColor:'#061d19'},header:{height:52,flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16},
 back:{minWidth:70,paddingVertical:10},gold:{color:'#E9C780',fontWeight:'700'},headerTitle:{color:'#FFF2D4',fontSize:17,fontWeight:'800'},headerSymbol:{minWidth:70,textAlign:'right',fontSize:24,color:'#E9C780'},
 scene:{flex:1,minHeight:270,backgroundColor:'#061d19'},loader:{...StyleSheet.absoluteFill,backgroundColor:'#061d19',alignItems:'center',justifyContent:'center',gap:16},
 bottom:{paddingHorizontal:18,paddingTop:14,gap:12,backgroundColor:'#0A2B25',borderTopColor:'#49664D',borderTopWidth:1},
 description:{color:'#F4E9D0',textAlign:'center',fontSize:15,lineHeight:24},button:{backgroundColor:'#E7C17C',borderRadius:14,paddingVertical:16,paddingHorizontal:12,alignItems:'center'},
 disabled:{opacity:0.55},buttonText:{color:'#15352B',fontSize:14,fontWeight:'900',textAlign:'center'},help:{color:'#B9CABB',fontSize:11,textAlign:'center'},
 disclaimer:{color:'#8AA99A',fontSize:10,textAlign:'center'},error:{color:'#FFB9A4',textAlign:'center',fontSize:12}
});
