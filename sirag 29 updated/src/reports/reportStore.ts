import AsyncStorage from '@react-native-async-storage/async-storage';
import { ATHKAR_LOG_KEY } from '../athkar/athkarEngine';
import { LOG_KEY, PLANS_KEY } from '../habits/habitData';
import { ReportSources } from './reportModel';
export async function loadReportSources(dates: string[]): Promise<ReportSources> {
  const keys = ['batl-prayer-checkin-records-v1', 'batl-prayer-rest-days-v1', ATHKAR_LOG_KEY, 'sirag-quran-reader-v2', 'sirag-hifz-v1', PLANS_KEY, LOG_KEY, ...dates.map(day => 'sirag-quran-listen-seconds-' + day)];
  const data = Object.fromEntries(await AsyncStorage.multiGet(keys));
  const read = (key: string, fallback: any) => data[key] === null ? fallback : JSON.parse(data[key]!);
  return { checkins: read(keys[0], {}), restDays: read(keys[1], []), athkar: read(keys[2], {}), readDays: read(keys[3], {}).readDays || {},
    hifz: read(keys[4], null), plans: read(PLANS_KEY, []), logs: read(LOG_KEY, {}),
    listening: Object.fromEntries(dates.map(day => [day, Number(data['sirag-quran-listen-seconds-'+day]) || 0])) };
}
