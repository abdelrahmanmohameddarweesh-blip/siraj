import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Gender, profileError } from './profileModel';
import { loadProfile, saveProfile, syncProfile } from './profileStore';
import { C, F } from '../ui/theme';

export default function ProfileSetupScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { loadProfile().then(p => { if (p) { setName(p.name); setGender(p.gender); } }).catch(() => setError('تعذّر تحميل الملف. حاول مرة أخرى.')); }, []);
  async function save() {
    if (saving) return;
    const invalid = profileError(name, gender);
    if (invalid) { setError(invalid); return; }
    setSaving(true); setError('');
    try {
      await saveProfile(name, gender as Gender);
      // Local save is durable before leaving. Cloud retries on foreground and from the profile page.
      void syncProfile().catch(() => {});
      if (route?.params?.edit) navigation.goBack();
      else if (route?.params?.nextRoute === 'PrayerTracker') navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'PrayerTracker', params: route.params.nextParams }] });
      else navigation.replace(route?.params?.nextRoute || 'Home', route?.params?.nextParams);
    } catch { setError('تعذّر حفظ بياناتك على الجهاز. حاول مرة أخرى.'); }
    finally { setSaving(false); }
  }
  return <LinearGradient colors={['#082B2A', '#1B4C40']} style={s.root}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.page, { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 28 }]}>
        <Text style={s.wordmark}>سراج</Text>
        <View style={s.card}>
          <Text style={s.kicker}>بدايةٌ تشبهك</Text>
          <Text accessibilityRole="header" style={s.title}>لنتعرّف عليك</Text>
          <Text style={s.copy}>خطوة صغيرة لنرافقك باسمك في رحلتك.</Text>
          <Text style={s.label}>بماذا نناديك؟</Text>
          <TextInput accessibilityLabel="الاسم" value={name} onChangeText={setName} maxLength={50} autoComplete="given-name" textContentType="givenName" style={s.input} placeholder="اسمك" placeholderTextColor={C.muted} textAlign="right" returnKeyType="done" />
          <Text style={s.label}>الجنس</Text>
          <View style={s.choices}>{([{ id: 'male', label: 'ذكر' }, { id: 'female', label: 'أنثى' }] as const).map(option => <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{ checked: gender === option.id }} onPress={() => setGender(option.id)} style={[s.choice, gender === option.id && s.selected]}><Text style={[s.choiceText, gender === option.id && { color: '#fff' }]}>{option.label}</Text></Pressable>)}</View>
          <Text style={s.privacy}>يُحفظ اسمك وجنسك على جهازك، ويُزامنان مع قاعدة بيانات سراج الخاصة بحسابك عند الاتصال. لا يظهران في لوحة عامة.</Text>
          {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
          <Pressable accessibilityRole="button" disabled={saving} onPress={save} style={[s.button, saving && { opacity: .6 }]}>{saving ? <ActivityIndicator color={C.ink} /> : <Text style={s.buttonText}>{route?.params?.edit ? 'حفظ التعديلات' : 'لنبدأ الرحلة  ←'}</Text>}</Pressable>
          {route?.params?.edit && <Pressable onPress={() => navigation.goBack()}><Text style={s.cancel}>إلغاء</Text></Pressable>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </LinearGradient>;
}
const s = StyleSheet.create({
  root: { flex: 1 }, page: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  wordmark: { fontFamily: 'Ruqaa', fontSize: 66, color: '#F1D39B', lineHeight: 110, marginBottom: 24 },
  card: { width: '100%', maxWidth: 430, backgroundColor: C.card, borderRadius: 28, padding: 25, gap: 10 },
  kicker: { fontFamily: F.m, color: C.gold, textAlign: 'right', fontSize: 12 }, title: { fontFamily: F.b, color: C.ink, textAlign: 'right', fontSize: 29 },
  copy: { fontFamily: F.r, color: C.ink2, textAlign: 'right', lineHeight: 25 }, label: { fontFamily: F.s, color: C.ink, textAlign: 'right', marginTop: 12 },
  input: { fontFamily: F.r, color: C.ink, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 14, backgroundColor: '#fff', fontSize: 18 },
  choices: { flexDirection: 'row-reverse', gap: 10 }, choice: { flex: 1, padding: 14, borderWidth: 1, borderColor: C.line, borderRadius: 14, alignItems: 'center' }, selected: { backgroundColor: C.green, borderColor: C.green }, choiceText: { fontFamily: F.s, color: C.ink },
  privacy: { fontFamily: F.r, color: C.muted, fontSize: 11, lineHeight: 22, textAlign: 'right', marginTop: 10 }, error: { color: C.bad, fontFamily: F.r, textAlign: 'right' },
  button: { borderRadius: 14, padding: 16, backgroundColor: C.goldSoft, alignItems: 'center', marginTop: 8 }, buttonText: { fontFamily: F.b, color: C.ink, fontSize: 17 }, cancel: { fontFamily: F.m, color: C.muted, textAlign: 'center', padding: 10 },
});
