/** What is waiting in the user's oasis, used to pick the landing screen and the home badge. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HabitPlan, LOG_KEY, PLANS_KEY, localDay } from '../habits/habitData';
import { computeGrants, normalizeLedger, todaysHabits } from './oasisRewards';

const CHECKINS = 'batl-prayer-checkin-records-v1';
const REST_DAYS = 'batl-prayer-rest-days-v1';
const STATE = 'sirag-oasis-state-v1';
const LEDGER = 'sirag-oasis-ledger-v1';

export type OasisWaiting = { newRewards: number; seeds: number; drops: number; canPlant: boolean; canWater: boolean };

async function read<T>(key: string, fallback: T): Promise<T> {
  try { const raw = await AsyncStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; }
}

export async function oasisWaiting(): Promise<OasisWaiting> {
  const day = localDay();
  const [plans, logs, checkins, restDays, ledgerRaw, state] = await Promise.all([
    read<HabitPlan[]>(PLANS_KEY, []), read<Record<string, Record<string, number>>>(LOG_KEY, {}),
    read<Record<string, { status?: string }>>(CHECKINS, {}), read<string[]>(REST_DAYS, []),
    read<unknown>(LEDGER, null), read<any>(STATE, null),
  ]);
  const habits = todaysHabits({ day, plans, logs, checkins, restDay: Array.isArray(restDays) && restDays.includes(day) });
  const ledger = normalizeLedger(ledgerRaw);
  const newRewards = computeGrants(ledger, day, habits).grants.length + ledger.pending.length;
  const plots: any[] = state?.oases?.[state?.locIdx ?? 0]?.plots || [];
  const seeds = state?.seeds || 0, drops = state?.drops || 0;
  return { newRewards, seeds, drops, canPlant: seeds > 0 && (plots.length === 0 || plots.some(p => !p)), canWater: drops > 0 && plots.some(p => p && p.stage < 2) };
}

export function nudgeLabel(w: OasisWaiting | null): string | null {
  if (!w) return null;
  if (w.newRewards > 0) return 'مكافآت جديدة بانتظارك ✨';
  if (w.canPlant) return w.seeds === 1 ? 'لديك بذرة جديدة 🌱' : w.seeds === 2 ? 'لديك بذرتان 🌱' : `لديك ${w.seeds.toLocaleString('ar-EG')} بذور 🌱`;
  if (w.canWater) return 'لديك ماء لنبتاتك 💧';
  return null;
}
