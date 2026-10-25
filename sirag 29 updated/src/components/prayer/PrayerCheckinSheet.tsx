import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { localDay } from '../../habits/habitData';
import { usePrayer } from '../../prayer/PrayerContext';
import { syncNotificationsSoon } from '../../notifications/scheduler';
import { CheckinMode, CheckinPlace, CheckinStatus, PrayerCheckinRecord } from '../../prayer/types';

type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
const NAMES: Record<PrayerId, string> = { fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' };

/** Plain description of a recorded prayer, e.g. «في وقتها · جماعة في المسجد». No points. */
export function describeCheckin(r: Pick<PrayerCheckinRecord, 'status' | 'mode' | 'place'>): string {
  const when = r.status === 'qada' ? 'قضاء' : r.status === 'late' ? 'متأخرة' : 'في وقتها';
  const how = r.mode === 'jamaa' ? (r.place === 'masjid' ? 'جماعة في المسجد 🕌' : r.place === 'home' ? 'جماعة في البيت 🏠' : 'جماعة') : 'منفردًا';
  return `${when} · ${how}`;
}

type Step = 'prayed' | 'time' | 'mode' | 'place' | 'done';

export function PrayerCheckinSheet({ visible, prayer, onClose, onSaved, date }: {
  visible: boolean;
  date?: string;
  prayer: PrayerId;
  onClose: () => void;
  /** called after the check-in is saved */
  onSaved?: () => void;
}) {
  const { submitPrayerCheckin, toggleRestDay, isRestDayToday } = usePrayer();
  const [step, setStep] = useState<Step>('prayed');
  const [status, setStatus] = useState<CheckinStatus>('on_time');
  const [mode, setMode] = useState<CheckinMode>('alone');
  const [place, setPlace] = useState<CheckinPlace | undefined>();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const name = NAMES[prayer] || '';

  useEffect(() => { if (visible) { setStep('prayed'); setPlace(undefined); setFailed(false); } }, [visible, prayer]);

  const save = async (m: CheckinMode, pl?: CheckinPlace) => {
    setMode(m); setPlace(pl); setSaving(true); setFailed(false);
    try { await submitPrayerCheckin(prayer, status, m, date, pl); setStep('done'); onSaved?.(); syncNotificationsSoon(); }
    catch { setFailed(true); }
    finally { setSaving(false); }
  };
  const back = () => setStep(step === 'place' ? 'mode' : step === 'mode' ? 'time' : 'prayed');

  const Option = ({ label, sub, onPress, primary }: { label: string; sub?: string; onPress: () => void; primary?: boolean }) => (
    <Pressable accessibilityRole="button" disabled={saving} onPress={onPress} style={({ pressed }) => [s.opt, primary && s.optPrimary, pressed && { opacity: .85 }]}>
      <Text style={[s.optText, primary && s.optTextPrimary]}>{label}</Text>
      {sub ? <Text style={[s.optSub, primary && { color: '#d8e6dd' }]}>{sub}</Text> : null}
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} accessibilityLabel="إغلاق" />
      <View style={s.sheet}>
        <View style={s.grip} />
        <View style={s.head}>
          {step !== 'prayed' && step !== 'done' ? <Pressable onPress={back} hitSlop={10}><Text style={s.backText}>رجوع</Text></Pressable> : <View />}
          <Text style={s.badge}>🕌 صلاة {name}{date ? ` · ${date}` : ''}</Text>
        </View>

        {step === 'prayed' && <>
          <Text style={s.title}>هل صليت {name}؟</Text>
          <Option primary label="نعم، الحمد لله" onPress={() => setStep('time')} />
          <Option label="ليس بعد" onPress={onClose} />
          {(!date || date === localDay()) && <Pressable onPress={async () => { await toggleRestDay(); onSaved?.(); onClose(); }} style={s.rest}>
            <Text style={s.restText}>{isRestDayToday ? 'إلغاء يوم الراحة' : 'يوم راحة: إيقاف متابعة الصلوات اليوم دون حرج'}</Text>
          </Pressable>}
        </>}

        {step === 'time' && <>
          <Text style={s.title}>هل صليتها في وقتها؟</Text>
          <Option primary label="نعم، في وقتها" onPress={() => { setStatus('on_time'); setStep('mode'); }} />
          <Option label="لا، بعد خروج وقتها" sub="تُسجَّل قضاءً" onPress={() => { setStatus('qada'); setStep('mode'); }} />
        </>}

        {step === 'mode' && <>
          <Text style={s.title}>صليتها جماعة أم منفردًا؟</Text>
          <Option primary label="جماعة" onPress={() => setStep('place')} />
          <Option label="منفردًا" onPress={() => save('alone')} />
        </>}

        {step === 'place' && <>
          <Text style={s.title}>أين صليت الجماعة؟</Text>
          <Option primary label="في المسجد 🕌" onPress={() => save('jamaa', 'masjid')} />
          <Option label="في البيت 🏠" onPress={() => save('jamaa', 'home')} />
        </>}

        {step === 'done' && <>
          <Text style={s.title}>تقبّل الله منك</Text>
          <Text style={s.summary}>{describeCheckin({ status, mode, place })}</Text>
          <Option primary label="تم" onPress={onClose} />
        </>}

        {failed && <Text style={s.error}>تعذّر حفظ الصلاة. حاول مرة أخرى.</Text>}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(6,16,14,.5)' },
  sheet: { backgroundColor: '#fffaf0', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 34, gap: 10 },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 4, backgroundColor: '#e2d4b5', marginBottom: 6 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backText: { fontFamily: 'PlexSemi', fontSize: 14, color: '#a5701c' },
  badge: { fontFamily: 'PlexSemi', fontSize: 13, color: '#1d5c49', backgroundColor: '#e7f0ea', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, overflow: 'hidden' },
  title: { fontFamily: 'PlexBold', fontSize: 22, color: '#0f3a33', textAlign: 'right', marginTop: 6, marginBottom: 4 },
  opt: { borderWidth: 1, borderColor: '#e2d4b5', backgroundColor: '#f6eedc', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16 },
  optPrimary: { backgroundColor: '#1d5c49', borderColor: '#1d5c49' },
  optText: { fontFamily: 'PlexSemi', fontSize: 16, color: '#0f3a33', textAlign: 'right' },
  optTextPrimary: { color: '#fff' },
  optSub: { fontFamily: 'Plex', fontSize: 12, color: '#7d7766', textAlign: 'right', marginTop: 2 },
  rest: { paddingVertical: 10 },
  restText: { fontFamily: 'Plex', fontSize: 12, color: '#7d7766', textAlign: 'center' },
  summary: { fontFamily: 'PlexSemi', fontSize: 16, color: '#1d5c49', textAlign: 'right', marginBottom: 8 },
  error: { fontFamily: 'PlexMedium', fontSize: 13, color: '#b3261e', textAlign: 'center' },
});
