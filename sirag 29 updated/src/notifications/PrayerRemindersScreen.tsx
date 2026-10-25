import React, { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePrayer } from '../prayer/PrayerContext';
import { PRAYER_AR, PRAYER_IDS, DEFAULT_FOLLOW_UP } from './schedulePlan';
import { C, F, ar } from '../ui/theme';

export default function PrayerRemindersScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { notificationConfig: config, updateNotifications, requestNotifications, location, method } = usePrayer();
  const [busy, setBusy] = useState(false);
  const update = async (patch: Parameters<typeof updateNotifications>[0]) => {
    if (busy) return; setBusy(true);
    try { await updateNotifications(patch); } catch { Alert.alert('تعذّر الحفظ', 'حاول مرة أخرى.'); } finally { setBusy(false); }
  };
  const permission = async () => {
    if (busy) return; setBusy(true);
    try { if (!(await requestNotifications())) Alert.alert('التنبيهات غير مفعّلة', 'اسمح لسراج بإرسال التنبيهات من إعدادات الجهاز.', [{ text: 'لاحقًا' }, { text: 'الإعدادات', onPress: () => { void Linking.openSettings(); } }]); }
    catch { Alert.alert('تعذّر تفعيل التنبيهات', 'لم نتمكن من حفظ إعدادات التنبيهات. حاول مرة أخرى.'); }
    finally { setBusy(false); }
  };
  const chips = (values: number[], current: number, onPress: (n: number) => void, off = true) => <View style={s.chips}>{values.map(n => <Pressable accessibilityRole="radio" accessibilityState={{ checked: n === current, disabled: busy }} disabled={busy} key={n} onPress={() => onPress(n)} style={[s.chip, n === current && s.chipOn]}><Text style={[s.chipText, n === current && { color: '#fff' }]}>{!n && off ? 'بدون' : ar(n) + ' د'}</Text></Pressable>)}</View>;
  return <View style={[s.root, { paddingTop: insets.top }]}>
    <View style={s.head}><Pressable onPress={() => route?.params?.nextRoute ? navigation.replace(route.params.nextRoute) : navigation.goBack()}><Text style={s.back}>{route?.params?.nextRoute ? 'تم' : 'رجوع'}</Text></Pressable><Text style={s.title}>رفيق صلاتك</Text></View>
    <ScrollView contentContainerStyle={{ padding: 18, gap: 16, paddingBottom: insets.bottom + 30 }}>
      <View style={s.hero}><Text style={s.heroTitle}>قبل الأذان، وفي وقته، وبعد الصلاة</Text><Text style={s.heroCopy}>اختر ما يناسب يومك. يتوقف سؤال المتابعة عندما تسجّل صلاتك.</Text><Text style={s.heroCopy}>المواقيت حسب {location.cityNameAr} · {method}</Text></View>
      <View style={s.row}><Text style={s.label}>تفعيل تنبيهات الصلاة</Text><Switch disabled={busy} value={config.notificationsEnabled} onValueChange={value => value ? void permission() : void update({ notificationsEnabled: false })} /></View>
      {PRAYER_IDS.map(p => {
        const cfg = config[p]; const before = config.preAlertByPrayer?.[p] ?? config.preAlertMin ?? 0;
        const after = config.checkinFollowUpEnabled ? config.followUpMin?.[p] ?? DEFAULT_FOLLOW_UP[p] : 0;
        return <View style={s.card} key={p}>
          <View style={s.row}><Text style={s.prayer}>{PRAYER_AR[p]}</Text><Switch disabled={busy} value={cfg.enabled} onValueChange={enabled => void update({ [p]: { ...cfg, enabled } })} /></View>
          {cfg.enabled && <>
            <Text style={s.label}>استعداد قبل الأذان</Text>{chips([0,5,10,15,20,30,60], before, n => void update({ preAlertByPrayer: { ...config.preAlertByPrayer, [p]: n } }))}
            <View style={s.row}><Text style={s.label}>تنبيه عند دخول الوقت</Text><Switch disabled={busy} value={cfg.athanEnabled !== false} onValueChange={athanEnabled => void update({ [p]: { ...cfg, athanEnabled } })} /></View>
            {cfg.athanEnabled !== false && <View style={s.row}><Text style={s.small}>صوت الأذان</Text><Switch disabled={busy} value={cfg.sound} onValueChange={sound => void update({ [p]: { ...cfg, sound } })} /></View>}
            <Text style={s.label}>اسألني «هل صليت؟» بعد الأذان بـ</Text>{chips([0,15,20,30,35,45,60,90], after, n => void update({ followUpMin: { ...config.followUpMin, [p]: n }, checkinFollowUpEnabled: true }))}
          </>}
        </View>;
      })}
      <Pressable accessibilityRole="button" disabled={busy} onPress={permission} style={s.button}><Text style={s.buttonText}>السماح بالتنبيهات وتحديث الجدول</Text></Pressable>
      <Text style={s.note}>{Platform.OS === 'web' ? 'تنبيهات الصلاة تعمل على الهاتف؛ متصفح الويب لا يرسل هذه التنبيهات.' : 'يُجدَّد الجدول عند فتح التطبيق وتغيير المدينة أو تسجيل الصلاة. افتح سراج يوميًا لاستمرار التذكيرات؛ عدد التنبيهات المعلّقة محدود على iPhone.'}</Text>
      <Text style={s.note}>صوت الأذان المخصص في الخلفية يحتاج نسخة مثبتة من سراج، ولا يمكن اختباره بالكامل في Expo Go. صوت التنبيه على iPhone مقطع أقصر من ٣٠ ثانية؛ الأذان الكامل داخل التطبيق. وضع الصامت والتركيز وإعدادات النظام قد تمنع الصوت أو تؤخر التنبيه.</Text>
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({ root: { flex: 1, backgroundColor: C.paper }, head: { padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { color: C.gold, fontFamily: F.s }, title: { fontFamily: F.b, color: C.ink, fontSize: 24 }, hero: { backgroundColor: C.green, padding: 22, borderRadius: 22, gap: 10 }, heroTitle: { fontFamily: F.b, color: '#FFF5DB', fontSize: 23, textAlign: 'right' }, heroCopy: { fontFamily: F.r, color: '#DAE6D8', lineHeight: 24, textAlign: 'right', fontSize: 13 }, card: { backgroundColor: C.card, padding: 18, borderRadius: 22, gap: 14, borderWidth: 1, borderColor: C.line }, row: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, prayer: { fontFamily: F.b, color: C.ink, fontSize: 22 }, label: { fontFamily: F.s, color: C.ink, textAlign: 'right', fontSize: 14, flexShrink: 1 }, small: { fontFamily: F.r, color: C.ink2 }, chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 }, chip: { borderRadius: 12, backgroundColor: C.chip, padding: 11, minWidth: 49, alignItems: 'center' }, chipOn: { backgroundColor: C.green }, chipText: { fontFamily: F.m, color: C.ink, fontSize: 12 }, button: { backgroundColor: C.green, borderRadius: 16, padding: 17, alignItems: 'center' }, buttonText: { fontFamily: F.b, color: '#fff', textAlign: 'center' }, note: { fontFamily: F.r, color: C.muted, lineHeight: 23, fontSize: 12, textAlign: 'right' } });
