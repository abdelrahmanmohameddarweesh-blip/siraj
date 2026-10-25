export interface KeyValueStorage { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> }
/** All mutations to a key share one queue; failed writes remain visible to callers. */
export function createJsonStore(storage: KeyValueStorage) {
 const queues = new Map<string,Promise<unknown>>();
 async function readJSON<T>(key: string, fallback: T): Promise<T> { const raw = await storage.getItem(key); return raw === null ? fallback : JSON.parse(raw) as T; }
 function updateJSON<T>(key: string, fallback: T, change: (previous: T) => T): Promise<T> {
  const task = (queues.get(key) || Promise.resolve()).catch(() => {}).then(async () => { const next = change(await readJSON(key, fallback)); await storage.setItem(key,JSON.stringify(next)); return next; });
  queues.set(key,task);
  void task.finally(() => { if (queues.get(key) === task) queues.delete(key); }).catch(() => {});
  return task;
 }
 return { readJSON, updateJSON };
}
