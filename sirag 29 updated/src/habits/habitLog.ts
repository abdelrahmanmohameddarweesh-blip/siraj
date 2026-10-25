import AsyncStorage from '@react-native-async-storage/async-storage';
import { HabitPlan, LOG_KEY, PLANS_KEY, localDay } from './habitData';
import { syncNotificationsSoon } from '../notifications/scheduler';

export async function readPlans(): Promise<HabitPlan[]> { try { const r = await AsyncStorage.getItem(PLANS_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
export async function savePlan(plan: HabitPlan) {
  const plans = await readPlans();
  await AsyncStorage.setItem(PLANS_KEY, JSON.stringify([...plans.filter(p => p.id !== plan.id), plan]));
  syncNotificationsSoon();
}
/** Raises today's logged value for every plan of a kind (never lowers it). */
export async function logKind(kinds: string[], value: number, mode: 'max' | 'add' = 'max') {
  const plans = (await readPlans()).filter(p => kinds.includes(p.kind || '') || kinds.includes(p.id));
  if (!plans.length) return;
  const day = localDay();
  let logs: Record<string, Record<string, number>> = {};
  try { const r = await AsyncStorage.getItem(LOG_KEY); logs = r ? JSON.parse(r) : {}; } catch { logs = {}; }
  const today = { ...(logs[day] || {}) };
  for (const p of plans) today[p.id] = mode === 'add' ? (today[p.id] || 0) + value : Math.max(today[p.id] || 0, value);
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify({ ...logs, [day]: today }));
  syncNotificationsSoon();
}
