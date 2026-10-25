import AsyncStorage from '@react-native-async-storage/async-storage';
import { HabitPlan, LOG_KEY, PLANS_KEY, localDay } from './habitData';
import { syncNotificationsSoon } from '../notifications/scheduler';
import { readJSON, updateJSON } from '../storage/jsonStore';

export const readPlans = () => readJSON<HabitPlan[]>(PLANS_KEY, []);
export async function savePlan(plan: HabitPlan) {
  await updateJSON<HabitPlan[]>(PLANS_KEY, [], plans => [...plans.filter(p => p.id !== plan.id), plan]);
  syncNotificationsSoon();
}
/** Canonical screen totals reconcile habits even when a plan is added later. */
export async function logKind(kinds: string[], value: number, mode: 'max' | 'add' | 'set' = 'max', day = localDay()) {
  if (!Number.isFinite(value) || value < 0) throw new Error('Invalid progress');
  const plans = (await readPlans()).filter(p => kinds.includes(p.kind || '') || kinds.includes(p.id));
  if (!plans.length) return;
  await updateJSON<Record<string, Record<string, number>>>(LOG_KEY, {}, logs => {
    const today = { ...(logs[day] || {}) };
    for (const p of plans) today[p.id] = mode === 'add' ? (today[p.id] || 0) + value : mode === 'set' ? value : Math.max(today[p.id] || 0, value);
    return { ...logs, [day]: today };
  });
  syncNotificationsSoon();
}
