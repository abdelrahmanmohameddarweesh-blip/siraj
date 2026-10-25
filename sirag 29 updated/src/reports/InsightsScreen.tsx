import React, { useCallback, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, RefreshControl, ScrollView, Share, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { buildReport, datesFor, DayReport, reportTotals, ReportSources } from './reportModel';
import { loadReportSources } from './reportStore';
import { effectiveTarget } from '../habits/library';
import { localDay } from '../habits/habitData';
import { usePrayer } from '../prayer/PrayerContext';
import { PRAYER_AR, PRAYER_IDS } from '../notifications/schedulePlan';
import { PersonalProfile } from '../profile/profileModel';
import { loadProfile, syncProfile } from '../profile/profileStore';
import { C, F, ar } from '../ui/theme';

const formatMinutes = (seconds: number) => seconds > 0 && seconds < 60 ? 'أقل من دقيقة' : ar(Math.floor(seconds / 60)) + ' دقيقة';
const dayLabel = (day: string) => new Date(day + 'T12:00:00').toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });
const statusNames: Record<string,string> = { on_time: 'في وقتها', late: 'متأخرة', qada: 'قضاء', rest: 'راحة', none: 'غير مسجّلة' };

export default function InsightsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { todayTimes } = usePrayer();
  const [range, setRange] = useState(7);
  const [sources, setSources] = useState<ReportSources | null>(null);
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [selected, setSelected] = useState(localDay());
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const refresh = useCallback(async () => {
    setBusy(true);
    try { const [data, p] = await Promise.all([loadReportSources(datesFor(localDay(), 60)), loadProfile()]); setSources(data); setProfile(p); setUpdatedAt(new Date().toLocaleTimeString('ar-EG',{ hour: '2-digit', minute: '2-digit' })); setError(''); }
    catch { setError('تعذّر تحميل السجل. اسحب لأسفل لإعادة المحاولة.'); }
    finally { setBusy(false); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); const sub = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); }); const timer = setInterval(() => void refresh(), 60000); return () => { sub.remove(); clearInterval(timer); }; }, [refresh]));
  const days = sources ? buildReport(sources, datesFor(localDay(), range), new Date(), todayTimes as unknown as Record<string,Date>) : [];
  const totals = reportTotals(days);
  const selectedDay = days.find(d => d.day === selected) || days[days.length - 1];
  const rate = totals.due ? Math.round(100 * totals.eligiblePrayers / totals.due) : 0;
  const circumference = 2 * Math.PI * 48;
  const cloudSynced = !!profile?.syncedAt && profile.syncedAt >= profile.updatedAt;
  const metric = (label: string, value: string, detail: string, accent = C.green) => <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={[s.metricValue, { color: accent }]}>{value}</Text><Text style={s.metricDetail}>{detail}</Text></View>;
  const progressRow = (label: string, value: number, total: number) => <View style={{ gap: 8 }}><View style={s.between}><Text style={s.label}>{label}</Text><Text style={s.meta}>{ar(value)} / {ar(total)}</Text></View><View style={s.track}><View style={[s.fill, { width: `${total ? Math.min(100,100*value/total) : 0}%` }]} /></View></View>;
  async function sync() {
    setSyncing(true); setSyncMessage('');
    try { const result = await Promise.race([syncProfile(), new Promise<false>(resolve => setTimeout(() => resolve(false), 10000))]); setSyncMessage(result ? 'تمت مزامنة ملفك الشخصي.' : 'ملفك محفوظ على الجهاز؛ مزامنة السحابة ما زالت معلّقة.'); await refresh(); }
    catch { setSyncMessage('تعذّرت مزامنة الملف. تحقق من الاتصال وتفعيل قاعدة البيانات. بيانات جهازك محفوظة.'); }
    finally { setSyncing(false); }
  }
  async function share() {
    await Share.share({ message: `رحلتي مع سراج · آخر ${range} أيام\nصلوات مسجلة: ${totals.prayers}\nأذكار الصباح: ${totals.morning} · المساء: ${totals.evening}\nصفحات قرأتها: ${totals.pages}\nوقت الاستماع: ${formatMinutes(totals.listenSeconds)}\nآيات جديدة: ${totals.learned} · مراجعات: ${totals.reviewed}\nهذه أرقام التسجيل في التطبيق، وليست تقييمًا للعبادة.` }).catch(() => setError('تعذّرت مشاركة التقرير.'));
  }
  return <View style={[s.root, { paddingTop: insets.top }]}>
    <StatusBar barStyle="dark-content" />
    <View style={s.header}><Pressable onPress={() => navigation.goBack()}><Text style={s.back}>رجوع</Text></Pressable><Text accessibilityRole="header" style={s.heading}>أثر رحلتك</Text><Pressable accessibilityRole="button" onPress={share}><Text style={s.back}>مشاركة</Text></Pressable></View>
    <ScrollView refreshControl={<RefreshControl refreshing={busy} onRefresh={refresh} tintColor={C.green} />} contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: insets.bottom + 35 }}>
      <View style={s.between}><Text style={s.subheading}>{profile ? `${profile.gender === 'female' ? 'رحلتكِ' : 'رحلتك'} يا ${profile.name}` : 'خطواتك الصغيرة، أثرها باقٍ'}</Text><View style={s.segment}>{[7,30].map(n => <Pressable key={n} accessibilityRole="radio" accessibilityState={{ checked: range === n }} onPress={() => setRange(n)} style={[s.range, range === n && s.rangeOn]}><Text style={[s.rangeText, range === n && { color: '#fff' }]}>{ar(n)} أيام</Text></Pressable>)}</View></View>
      {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
      {!sources && busy ? <ActivityIndicator color={C.green} /> : <>
      <LinearGradient colors={['#0B3933','#215D49']} style={s.hero}>
        <View style={{ flex: 1, gap: 8 }}><Text style={s.heroKicker}>الاستمرارية تصنع الأثر</Text><Text style={s.heroNumber}>{ar(totals.activeDays)} <Text style={s.heroUnit}>أيام نشاط</Text></Text><Text style={s.heroCopy}>من آخر {ar(range)} أيام · {ar(totals.restDays)} أيام راحة</Text><Text style={s.heroCopy}>{totals.activeDays ? 'كل خطوة مسجّلة هنا بداية لخطوة جديدة.' : 'ابدأ بتسجيل صلاة أو ورد؛ سيظهر أثره هنا.'}</Text></View>
        <View style={s.ring}><Svg width={116} height={116}><Circle cx={58} cy={58} r={48} fill="none" stroke="#3B6D58" strokeWidth={7}/><Circle cx={58} cy={58} r={48} fill="none" stroke="#E9C888" strokeWidth={7} strokeLinecap="round" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference*(1-rate/100)} rotation={-90} origin="58,58" /></Svg><View style={s.ringLabel}><Text style={s.ringNumber}>{totals.due ? ar(rate)+'٪' : '—'}</Text><Text style={s.ringCaption}>تسجيل الصلوات</Text></View></View>
      </LinearGradient>
      <View style={s.metrics}>{metric('صلوات مسجّلة',ar(totals.prayers),`من ${ar(totals.due)} دخل وقتها`)}{metric('صفحات القرآن',ar(totals.pages),'صفحات أكّدت قراءتها')}{metric('وقت الاستماع',formatMinutes(totals.listenSeconds),'تشغيل فعلي دون وقت التقديم')}{metric('آيات حفظ جديدة',ar(totals.learned),'اجتازت اختبار الحفظ',C.gold)}</View>
      <View style={s.card}><Text style={s.cardTitle}>نبض الأيام</Text><Text style={s.copy}>ارتفاع العمود يوضح عدد الصلوات المسجّلة. اضغط يومًا لعرض تفاصيله.</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chart}>{days.map(d => <Pressable accessibilityRole="button" accessibilityLabel={`${dayLabel(d.day)}، ${d.prayers} صلوات مسجلة`} key={d.day} onPress={() => setSelected(d.day)} style={[s.dayColumn, selectedDay?.day === d.day && s.daySelected]}><Text style={s.barValue}>{ar(d.prayers)}</Text><View style={s.barTrack}><View style={[s.bar,{ height: `${d.prayers/5*100}%`, backgroundColor: d.rest ? '#ACA994' : C.green }]} /></View><View style={[s.activityDot,{ backgroundColor: d.active ? C.gold : 'transparent' }]} /><Text style={s.dayName}>{new Date(d.day+'T12:00:00').toLocaleDateString('ar-EG',{weekday:'narrow'})}</Text><Text style={s.dayNumber}>{ar(new Date(d.day+'T12:00:00').getDate())}</Text></Pressable>)}</ScrollView><Text style={s.meta}>النقطة الذهبية: نشاط مسجّل · أيام الراحة مستثناة من المطلوب.</Text></View>
      <View style={s.card}><Text style={s.cardTitle}>صلاتك بالتفصيل</Text>{progressRow('في وقتها',totals.onTime,totals.due)}{progressRow('متأخرة',totals.late,totals.due)}{progressRow('قضاء',totals.qada,totals.due)}<View style={s.separator}/><View style={s.between}><Text style={s.label}>صلاة جماعة</Text><Text style={s.detailNumber}>{ar(totals.congregation)}</Text></View><Text style={s.copy}>{ar(Math.max(0,totals.due-totals.eligiblePrayers))} صلاة لم تُسجَّل. عدم التسجيل لا يعني أنك لم تصلّ.</Text></View>
      <View style={s.card}><Text style={s.cardTitle}>وردك وأذكارك</Text>{progressRow('جلسات أذكار الصباح المكتملة',totals.morning,range)}{progressRow('جلسات أذكار المساء المكتملة',totals.evening,range)}<View style={s.between}><Text style={s.label}>وقت شاشة الأذكار النشطة</Text><Text style={s.meta}>{formatMinutes(totals.dhikrSeconds)}</Text></View><View style={s.separator}/><View style={s.between}><Text style={s.label}>مراجعات آيات الحفظ</Text><Text style={s.detailNumber}>{ar(totals.reviewed)}</Text></View>{progressRow('أهداف العادات المكتملة',totals.habitsDone,totals.habitsTotal)}<Text style={s.copy}>القراءة تُسجّل بتأكيدك. الحفظ يجمع اختبار التعرف وتقييمك الذاتي للتسميع، ولا يتحقق آليًا من صوتك.</Text></View>
      {selectedDay && sources && <View style={s.card}><Text style={s.cardTitle}>{dayLabel(selectedDay.day)}</Text>{selectedDay.rest && <Text style={s.rest}>يوم راحة — لا يدخل في هدف الصلوات</Text>}{PRAYER_IDS.map(p => { const record = sources.checkins[`${p}_${selectedDay.day}`]; return <Pressable accessibilityRole="button" accessibilityLabel={`تفاصيل صلاة ${PRAYER_AR[p]} يوم ${selectedDay.day}`} onPress={() => navigation.navigate('PrayerTracker', { checkin: p, date: selectedDay.day })} key={p} style={s.between}><Text style={s.label}>{PRAYER_AR[p]}</Text><Text style={[s.meta, record && { color: C.green }]}>{statusNames[record?.status || 'none']}{record?.mode === 'jamaa' ? ' · جماعة' : ''}  ←</Text></Pressable>; })}<View style={s.separator}/><Text style={s.copy}>أذكار الصباح: {selectedDay.morning ? 'مكتملة' : 'غير مكتملة'} · المساء: {selectedDay.evening ? 'مكتملة' : 'غير مكتملة'}</Text><Text style={s.copy}>{ar(selectedDay.pages)} صفحات · {formatMinutes(selectedDay.listenSeconds)} استماع</Text><Text style={s.copy}>{ar(selectedDay.learned)} آيات جديدة · {ar(selectedDay.reviewed)} مراجعات</Text>
        {selectedDay.pages > 0 && <Text style={s.meta}>الصفحات: {[...new Set(sources.readDays[selectedDay.day] || [])].sort((a,b)=>a-b).slice(0,20).map(ar).join('، ')}{selectedDay.pages > 20 ? '…' : ''}</Text>}
        {sources.plans.filter(p => localDay(new Date(p.createdAt)) <= selectedDay.day && p.kind !== 'prayers' && !['prayer','fajr'].includes(p.id) && (p.frequency === 'daily' || new Date(selectedDay.day+'T12:00:00').getDay() === 5)).map(p => <View key={p.id} style={s.between}><Text style={s.label}>{p.title}</Text><Text style={s.meta}>{ar(Math.round((sources.logs[selectedDay.day]?.[p.id] || 0)*100)/100)} / {ar(effectiveTarget(p,selectedDay.day))} {p.unit}</Text></View>)}
      </View>}
      </>}
      <View style={s.card}><View style={s.between}><Text style={s.cardTitle}>ملفك الشخصي</Text><Pressable onPress={() => navigation.navigate('ProfileSetup',{ edit: true })}><Text style={s.back}>تعديل</Text></Pressable></View><Text style={s.copy}>{profile ? `${profile.name} · ${profile.gender === 'female' ? 'أنثى' : 'ذكر'}` : 'لم يُحفظ ملف شخصي بعد'}</Text><Text style={s.meta}>{cloudSynced ? 'الاسم والجنس محفوظان في السحابة ✓' : 'الملف محفوظ محليًا، ومزامنة السحابة معلّقة'}</Text><Pressable disabled={syncing || !profile} onPress={sync} style={s.outline}><Text style={s.back}>{syncing ? 'جارٍ المزامنة…' : 'مزامنة الملف الآن'}</Text></Pressable>{!!syncMessage && <Text accessibilityLiveRegion="polite" style={s.copy}>{syncMessage}</Text>}<Text style={s.meta}>سجل العبادة محفوظ على هذا الجهاز. مزامنة الملف لا تنقل سجل العبادة إلى السحابة.</Text></View>
      <Text style={s.note}>آخر تحديث {updatedAt || '—'} · هذه أرقام ما سجّلته في التطبيق، وليست تقييمًا لقيمة العبادة. يمكنك سحب الشاشة لأسفل لتحديث البيانات.</Text>
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
 root:{flex:1,backgroundColor:C.paper}, header:{paddingHorizontal:18,paddingVertical:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},heading:{fontFamily:F.b,fontSize:25,color:C.ink},back:{fontFamily:F.s,color:C.gold,fontSize:13,paddingVertical:6},subheading:{fontFamily:F.m,color:C.ink2,fontSize:13,flex:1,textAlign:'right'},between:{flexDirection:'row-reverse',alignItems:'center',justifyContent:'space-between',gap:10},segment:{flexDirection:'row-reverse',padding:4,borderRadius:13,backgroundColor:'#E8DDC8'},range:{paddingVertical:8,paddingHorizontal:12,borderRadius:10},rangeOn:{backgroundColor:C.green},rangeText:{fontFamily:F.s,fontSize:12,color:C.ink},hero:{borderRadius:26,padding:22,flexDirection:'row-reverse',alignItems:'center',gap:12},heroKicker:{fontFamily:F.m,fontSize:12,color:'#E4CB98',textAlign:'right'},heroNumber:{fontFamily:F.b,fontSize:42,color:'#FFF3D9',textAlign:'right'},heroUnit:{fontSize:17},heroCopy:{fontFamily:F.r,fontSize:12,lineHeight:22,color:'#C6D9CA',textAlign:'right'},ring:{width:116,height:116},ringLabel:{position:'absolute',top:0,bottom:0,left:0,right:0,alignItems:'center',justifyContent:'center'},ringNumber:{fontFamily:F.b,fontSize:26,color:'#F0D399'},ringCaption:{fontFamily:F.r,fontSize:9,color:'#DDE6D6'},metrics:{flexDirection:'row-reverse',flexWrap:'wrap',gap:12},metric:{flexGrow:1,flexBasis:'45%',backgroundColor:C.card,borderRadius:21,padding:18,gap:8,borderWidth:1,borderColor:C.line},metricLabel:{fontFamily:F.m,fontSize:13,color:C.ink2,textAlign:'right'},metricValue:{fontFamily:F.b,fontSize:27,textAlign:'right'},metricDetail:{fontFamily:F.r,fontSize:10,color:C.muted,textAlign:'right'},card:{backgroundColor:C.card,borderRadius:23,padding:20,borderWidth:1,borderColor:C.line,gap:15},cardTitle:{fontFamily:F.b,fontSize:19,color:C.ink,textAlign:'right'},copy:{fontFamily:F.r,color:C.ink2,fontSize:12,lineHeight:23,textAlign:'right'},meta:{fontFamily:F.r,color:C.muted,fontSize:11,textAlign:'right',flexShrink:1,lineHeight:21},label:{fontFamily:F.m,color:C.ink,fontSize:13,textAlign:'right',flexShrink:1},track:{height:7,borderRadius:5,overflow:'hidden',backgroundColor:'#E8E1CF'},fill:{height:7,borderRadius:5,backgroundColor:C.green,alignSelf:'flex-end'},separator:{height:1,backgroundColor:C.line},detailNumber:{fontFamily:F.b,color:C.gold,fontSize:22},chart:{gap:8,paddingVertical:8},dayColumn:{width:34,alignItems:'center',paddingVertical:8,borderRadius:10},daySelected:{backgroundColor:'#F0E6D1'},barValue:{fontFamily:F.s,color:C.green,fontSize:11,marginBottom:8},barTrack:{height:90,width:13,borderRadius:8,backgroundColor:'#EFE9DB',justifyContent:'flex-end',overflow:'hidden'},bar:{borderRadius:8,width:13},activityDot:{width:4,height:4,borderRadius:2,marginTop:7},dayName:{fontFamily:F.r,fontSize:10,color:C.muted,marginTop:8},dayNumber:{fontFamily:F.m,color:C.ink,fontSize:10},rest:{fontFamily:F.m,color:C.gold,textAlign:'right',fontSize:12},outline:{borderWidth:1,borderColor:C.line,borderRadius:12,alignItems:'center',padding:6},note:{fontFamily:F.r,color:C.muted,fontSize:10,lineHeight:22,textAlign:'center'},error:{fontFamily:F.r,color:C.bad,textAlign:'right'},
});
