import React, { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

import { GUEST_PREFERENCES_KEY, GuestPreferences, DEFAULT_GUEST_PREFERENCES } from '../../hooks/useGuestPreferences';

export default function GuestPersonalizationCard() {
  const { language } = useLanguage();
  const { colors } = useTheme();
  const ar = language === 'ar';
  const [prefs, setPrefs] = useState<GuestPreferences>(DEFAULT_GUEST_PREFERENCES);
  const [saving, setSaving] = useState(false);
  useEffect(() => { AsyncStorage.getItem(GUEST_PREFERENCES_KEY).then(raw => {
    if (raw) setPrefs({ ...DEFAULT_GUEST_PREFERENCES, ...JSON.parse(raw) });
  }).catch(() => {}); }, []);
  const change = <K extends keyof GuestPreferences>(key: K, value: GuestPreferences[K]) => setPrefs(p => ({ ...p, [key]: value }));
  const save = async () => {
    setSaving(true);
    try {
      let notificationId = prefs.notificationId;
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        notificationId = undefined;
      }
      if (prefs.reminder !== 'off') {
        const permission = await Notifications.requestPermissionsAsync();
        if (permission.status === 'granted') {
          const hour = prefs.reminder === 'morning' ? 8 : 20;
          notificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: ar ? 'موعد رحلتك مع بطل مسلم 🌟' : 'Your Batl Muslim habit 🌟',
              body: ar ? 'خطوة صغيرة اليوم تقرّبك من هدفك.' : 'A small step today brings you closer to your goal.',
              data: { screen: 'HomeTabs', type: 'habit_reminder' },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0 },
          });
        } else {
          Alert.alert(ar ? 'الإشعارات غير مفعلة' : 'Notifications disabled', ar ? 'تم حفظ تفضيلاتك بدون تفعيل التذكير.' : 'Your preferences were saved without a reminder.');
        }
      }
      const saved = { ...prefs, notificationId, reminder: prefs.reminder !== 'off' && !notificationId ? 'off' as const : prefs.reminder };
      await AsyncStorage.setItem(GUEST_PREFERENCES_KEY, JSON.stringify(saved));
      setPrefs(saved);
      Alert.alert(ar ? 'تم الحفظ' : 'Saved', ar ? 'يمكنك تعديل اختياراتك في أي وقت.' : 'You can change these choices anytime.');
    } catch (e) {
      Alert.alert(ar ? 'تعذر الحفظ' : 'Could not save', String(e));
    } finally { setSaving(false); }
  };
  const choice = (title: string, items: { value: string; label: string }[], value: string, onSelect: (value: any) => void) => (
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: colors.textPrimary, fontWeight: '700', marginBottom: 8, textAlign: ar ? 'right' : 'left' }}>{title}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: ar ? 'flex-end' : 'flex-start' }}>
        {items.map(item => <TouchableOpacity key={item.value} accessibilityRole="button" accessibilityState={{ selected: value === item.value }} onPress={() => onSelect(item.value)} style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: value === item.value ? colors.primary : colors.border, backgroundColor: value === item.value ? colors.surface : colors.background }}>
          <Text style={{ color: colors.textPrimary }}>{item.label}</Text>
        </TouchableOpacity>)}
      </View>
    </View>
  );
  return <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 18 }}>
    <Text style={{ color: colors.textPrimary, fontSize: 19, fontWeight: '700', textAlign: ar ? 'right' : 'left' }}>{ar ? '⭐ خصّص رحلة بطلك' : '⭐ Personalize your Hero journey'}</Text>
    <Text style={{ color: colors.textSecondary, marginTop: 5, textAlign: ar ? 'right' : 'left' }}>{ar ? 'اختياري تمامًا — بدون حساب أو رقم هاتف. البيانات محفوظة على جهازك.' : 'Completely optional — no account or phone number. Stored on your device.'}</Text>
    <TextInput value={prefs.nickname} onChangeText={v => change('nickname', v.slice(0, 24))} placeholder={ar ? 'اسم مستعار (اختياري) — بطل مسلم' : 'Nickname (optional) — Batl Muslim'} placeholderTextColor={colors.textTertiary} style={{ marginTop: 14, padding: 12, borderRadius: 12, borderColor: colors.border, borderWidth: 1, color: colors.textPrimary, textAlign: ar ? 'right' : 'left' }} />
    {choice(ar ? 'رمز البطل' : 'Hero icon', [{value:'star',label:'⭐'},{value:'book',label:'📖'},{value:'moon',label:'🌙'},{value:'shield',label:'🛡️'}], prefs.avatar, v => change('avatar', v))}
    {choice(ar ? 'الفئة العمرية (اختياري)' : 'Age group (optional)', [{value:'unspecified',label:ar?'لا أرغب بالإجابة':'Skip'},{value:'under18',label:ar?'أقل من 18':'Under 18'},{value:'adult',label:'18+'}], prefs.ageGroup, v => change('ageGroup', v))}
    {choice(ar ? 'هدفي الأساسي' : 'My learning focus', [{value:'quran',label:ar?'القرآن':'Quran'},{value:'knowledge',label:ar?'السيرة':'Sirah'},{value:'habits',label:ar?'العادات':'Habits'},{value:'all',label:ar?'الكل':'All'}], prefs.focus, v => change('focus', v))}
    {choice(ar ? 'العادة التي أريد بناءها' : 'Habit to build', [{value:'revision',label:ar?'مراجعة الحفظ':'Revision'},{value:'reading',label:ar?'القراءة':'Reading'},{value:'athkar',label:ar?'الأذكار':'Athkar'}], prefs.habit, v => change('habit', v))}
    {choice(ar ? 'تذكير يومي على الجهاز' : 'Daily on-device reminder', [{value:'off',label:ar?'بدون تذكير':'Off'},{value:'morning',label:ar?'8 صباحًا':'8 AM'},{value:'evening',label:ar?'8 مساءً':'8 PM'}], prefs.reminder, v => change('reminder', v))}
    <TouchableOpacity onPress={save} disabled={saving} style={{ backgroundColor: colors.primary, padding: 14, marginTop: 18, borderRadius: 14, alignItems: 'center' }}><Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{saving ? '...' : ar ? 'حفظ اختياراتي' : 'Save preferences'}</Text></TouchableOpacity>
    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10, textAlign: 'center' }}>{ar ? 'تذكيرات واتساب غير متاحة حاليًا ولن نطلب رقم هاتفك.' : 'WhatsApp reminders are not available yet; no phone number is collected.'}</Text>
  </View>;
}
