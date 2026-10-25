import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { updateJSON } from '../storage/jsonStore';
import { logKind } from '../habits/habitLog';
import { playbackCredit, splitPlayback } from './activityModel';

/** Count player advancement, never seeks, buffering, paused time or time merely on the screen. */
export function useListeningTracker(status: { currentTime: number; playing: boolean }, source: string) {
  const previous = useRef({ position: 0, at: Date.now(), playing: false, source: '' });
  const skip = useRef(false);
  const pending = useRef<Record<string, number>>({});
  const warned = useRef(false);
  const flush = useCallback(() => {
    const batch = pending.current; pending.current = {};
    for (const [day, seconds] of Object.entries(batch)) {
      void updateJSON<number>('sirag-quran-listen-seconds-' + day, 0, n => Math.max(0, Number(n) || 0) + seconds)
        .then(total => logKind(['quran_listen'], total / 60, 'max', day))
        .catch(() => { pending.current[day] = (pending.current[day] || 0) + seconds; if (!warned.current) { warned.current = true; Alert.alert('تعذّر حفظ الاستماع', 'قد لا يظهر الجزء الأخير في التقرير. تحقق من مساحة الجهاز.'); } });
    }
  }, []);
  useEffect(() => {
    const now = Date.now(), last = previous.current;
    const seconds = source && last.source === source ? playbackCredit(last, { position: status.currentTime, at: now }, skip.current) : 0;
    skip.current = false;
    for (const [day, amount] of Object.entries(splitPlayback(seconds, new Date(now)))) pending.current[day] = (pending.current[day] || 0) + amount;
    previous.current = { position: status.currentTime, at: now, playing: status.playing, source };
    if (!status.playing || Object.values(pending.current).reduce((a, b) => a + b, 0) >= 5) flush();
  }, [status.currentTime, status.playing, source, flush]);
  useEffect(() => () => flush(), [flush]);
  return { flush, beforeSeek: () => { flush(); skip.current = true; } };
}
