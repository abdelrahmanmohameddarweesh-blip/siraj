import type { Planned } from './schedulePlan';
/** Keep unchanged OS requests in place, especially when an adhan is only seconds away. */
export function reconcileSchedule(previous: unknown[], planned: Planned[], existingOwnedIds: string[]) {
  const previousById = new Map(previous.filter((n: any) => n && typeof n.id === 'string').map((n: any) => [n.id, JSON.stringify(n)]));
  const nextById = new Map(planned.map(n => [n.id, JSON.stringify(n)]));
  const existing = new Set(existingOwnedIds);
  const changed = (id: string) => previousById.get(id) !== nextById.get(id);
  return {
    cancel: existingOwnedIds.filter(id => !nextById.has(id) || changed(id)),
    schedule: planned.filter(n => !existing.has(n.id) || changed(n.id)),
  };
}
