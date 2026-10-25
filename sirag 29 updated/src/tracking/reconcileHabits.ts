import { readJSON } from '../storage/jsonStore';
import { logKind } from '../habits/habitLog';
import { localDay } from '../habits/habitData';
import { ATHKAR_LOG_KEY, AthkarLog } from '../athkar/athkarEngine';
import { HifzState } from '../quran/hifz/hifzEngine';
import { prayerCount } from './activityModel';
export async function reconcileHabitProgress(day = localDay()) {
  const [prayers, athkar, quran, hifz, seconds] = await Promise.all([
    readJSON<Record<string,{status?:string}>>('batl-prayer-checkin-records-v1',{}),
    readJSON<AthkarLog>(ATHKAR_LOG_KEY,{}),
    readJSON<{readDays?:Record<string,number[]>}>('sirag-quran-reader-v2',{}),
    readJSON<HifzState|null>('sirag-hifz-v1',null),
    readJSON<number>('sirag-quran-listen-seconds-'+day,0),
  ]);
  await logKind(['prayers','prayer'],prayerCount(prayers,day),'set',day);
  await logKind(['fajr'],prayerCount(prayers,day,true),'set',day);
  await logKind(['adhkar_morning','morning_adhkar'],athkar[day]?.morning?.done ? 1 : 0,'set',day);
  await logKind(['adhkar_evening','evening_adhkar'],athkar[day]?.evening?.done ? 1 : 0,'set',day);
  await logKind(['quran_read','quran'],new Set(quran.readDays?.[day]||[]).size,'set',day);
  await logKind(['quran_listen'],Number(seconds)/60,'set',day);
  await logKind(['hifz','quran_memorize'],Object.values(hifz?.items||{}).filter(item=>item.learnedOn===day).length,'set',day);
  await logKind(['hifz_review','quran_review'],hifz?.reviewed?.[day]||0,'set',day);
}
