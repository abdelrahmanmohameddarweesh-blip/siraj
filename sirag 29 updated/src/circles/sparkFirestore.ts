import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
  runTransaction,
  onSnapshot,
} from "firebase/firestore";
import { getRandomBytes } from "expo-crypto";
import app from "../firebase/init";
import { buildSparkDetail as build } from "./sparkView";
import { CircleDetail, Companion, Membership, PrivateDay } from "./model";
import { Data, Store, SparkCircle, root, own } from "./sparkCore";
export const sparkDB = getFirestore(app);
export const store: Store = {
  now: () => Date.now(),
  newId: () => doc(collection(sparkDB, "sparkCircles")).id,
  newCode: () =>
    Array.from(getRandomBytes(6), (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase(),
  get: async (path) => {
    const s = await getDoc(doc(sparkDB, path));
    return s.exists() ? s.data() : null;
  },
  transaction: (work) =>
    runTransaction(sparkDB, (tx) =>
      work({
        get: async (path) => {
          const s = await tx.get(doc(sparkDB, path));
          return s.exists() ? s.data() : null;
        },
        set: (path, data) => tx.set(doc(sparkDB, path), data),
        delete: (path) => tx.delete(doc(sparkDB, path)),
      }),
    ),
};
type Rows = Record<string, Data[]>;
const cache = new Map<string, CircleDetail>();
export const invalidate = (id: string) => {
  for (const key of cache.keys()) if (key.endsWith(":" + id)) cache.delete(key);
};
export const cached = (id: string, uid: string) => cache.get(uid + ":" + id);
const kinds = (c: SparkCircle) => [
  "encouragement",
  ...(c.showNames ? ["names"] : []),
  ...(c.showGroupProgress ? ["contributions"] : []),
  ...(c.showCompletedMembers ? ["completed"] : []),
  ...(c.showPendingMembers ? ["pending"] : []),
  ...(c.showMemberProgress && c.showCompletedMembers
    ? ["completedProgress"]
    : []),
  ...(c.showMemberProgress && c.showPendingMembers ? ["pendingProgress"] : []),
];
export function rowsQuery(id: string, kind: string, uids: string[]) {
  return query(collection(sparkDB, root(id), kind), where("uid", "in", uids));
}
export async function fetchDetail(
  id: string,
  uid: string,
): Promise<CircleDetail> {
  const hit = cached(id, uid);
  if (hit) return hit;
  const c = (await store.get(root(id))) as SparkCircle | null;
  if (!c || !Object.prototype.hasOwnProperty.call(c.members, uid))
    throw new Error("لم تعد عضوًا في هذه الصحبة");
  const m = await store.get(own(id, uid));
  if (!m) throw new Error("عضوية غير موجودة");
  const uids = Object.keys(c.members);
  const entries = await Promise.all(
    kinds(c).map(
      async (kind) =>
        [
          kind,
          (await getDocs(rowsQuery(id, kind, uids))).docs.map((s) => s.data()),
        ] as const,
    ),
  );
  const detail = build(c, m, Object.fromEntries(entries));
  cache.set(uid + ":" + id, detail);
  return detail;
}
/** Snapshot changes rebuild the cache, so UI refreshes do not refetch every member. */
export function watchDetail(
  id: string,
  uid: string,
  changed: () => void,
  failed: (e: Error) => void,
) {
  let active = true,
    c: SparkCircle | null = null,
    m: Data | null = null,
    rows: Rows = {},
    ready = new Set<string>(),
    signature = "";
  let children: (() => void)[] = [];
  const emit = () => {
    if (active && c && m && kinds(c).every((k) => ready.has(k))) {
      cache.set(uid + ":" + id, build(c, m, rows));
      changed();
    }
  };
  const rootSub = onSnapshot(
    doc(sparkDB, root(id)),
    (snapshot) => {
      if (!active) return;
      if (
        !snapshot.exists() ||
        !Object.prototype.hasOwnProperty.call(snapshot.data().members, uid)
      ) {
        invalidate(id);
        failed(new Error("لم تعد عضوًا في هذه الصحبة"));
        return;
      }
      c = snapshot.data() as SparkCircle;
      invalidate(id);
      const next = JSON.stringify([Object.keys(c.members), kinds(c)]);
      if (next !== signature) {
        signature = next;
        children.forEach((stop) => stop());
        children = [];
        rows = {};
        ready = new Set();
        const generation = signature;
        for (const kind of kinds(c))
          children.push(
            onSnapshot(
              rowsQuery(id, kind, Object.keys(c.members)),
              (s) => {
                if (!active || generation !== signature) return;
                rows[kind] = s.docs.map((d) => d.data());
                ready.add(kind);
                emit();
              },
              (e) => {
                if (active && generation === signature) failed(e);
              },
            ),
          );
      }
      emit();
    },
    failed,
  );
  const memberSub = onSnapshot(
    doc(sparkDB, own(id, uid)),
    (s) => {
      if (s.exists()) {
        m = s.data();
        emit();
      }
    },
    failed,
  );
  return () => {
    active = false;
    rootSub();
    memberSub();
    children.forEach((stop) => stop());
    invalidate(id);
  };
}
