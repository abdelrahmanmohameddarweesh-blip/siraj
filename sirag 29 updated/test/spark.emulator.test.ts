/** Real Spark transport/rules tests. Run only against the local demo emulators. */
import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInAnonymously } from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  runTransaction,
} from "firebase/firestore";
import { sparkCore, Store, root, own } from "../src/circles/sparkCore";
import { defaultCircleOptions } from "../src/circles/model";
const enabled = !!process.env.FIRESTORE_EMULATOR_HOST;
async function client() {
  const app = initializeApp(
    {
      projectId: "demo-siraj",
      apiKey: "demo-api-key",
      authDomain: "demo-siraj.firebaseapp.com",
    },
    "test-" + randomBytes(8).toString("hex"),
  );
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  const uid = (await signInAnonymously(auth)).user.uid;
  const store: Store = {
    now: () => Date.now(),
    newId: () => doc(collection(db, "sparkCircles")).id,
    newCode: () => randomBytes(6).toString("hex").toUpperCase(),
    get: async (p) => {
      const s = await getDoc(doc(db, p));
      return s.exists() ? s.data() : null;
    },
    transaction: (work) =>
      runTransaction(db, (tx) =>
        work({
          get: async (p) => {
            const s = await tx.get(doc(db, p));
            return s.exists() ? s.data() : null;
          },
          set: (p, d) => tx.set(doc(db, p), d),
          delete: (p) => tx.delete(doc(db, p)),
        }),
      ),
  };
  return { app, db, uid, store, core: sparkCore(store) };
}
test(
  "Spark real rules: anonymous create/join, current-day progress, privacy gates and revoked membership",
  { skip: !enabled, timeout: 120000 },
  async () => {
    const [a, b, outside] = await Promise.all([client(), client(), client()]);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { circleId, code } = await a.core.create(
        a.uid,
        "أحمد",
        {
          ...defaultCircleOptions,
          name: "صحبة مجانية",
          activity: "reading",
          goal: 2,
          startDay: today,
          endDay: today,
        },
        "UTC",
      );
      await b.core.join(b.uid, "مريم", code);
      const path = root(circleId),
        uids = [a.uid, b.uid];
      await assert.rejects(
        getDoc(doc(outside.db, path + "/contributions/" + a.uid)),
      );
      await assert.rejects(getDoc(doc(a.db, own(circleId, b.uid))));
      await a.core.checkin(a.uid, circleId, { day: today, pages: 2 });
      assert.equal(
        (await getDoc(doc(b.db, path + "/contributions/" + a.uid))).data()
          ?.days[today],
        true,
      );
      const names = await getDocs(
        query(collection(b.db, path, "names"), where("uid", "in", uids)),
      );
      assert.equal(names.size, 2);
      await assert.rejects(
        setDoc(doc(a.db, path + "/completed/" + b.uid), {
          uid: b.uid,
          days: { [today]: true },
        }),
      );
      await assert.rejects(
        setDoc(doc(a.db, path + "/pendingProgress/" + a.uid), {
          uid: a.uid,
          days: { [today]: 100 },
        }),
      );
      await a.core.update(a.uid, circleId, {
        ...defaultCircleOptions,
        name: "صحبة مجانية",
        showNames: false,
        showGroupProgress: false,
      });
      await assert.rejects(getDoc(doc(b.db, path + "/names/" + a.uid)));
      await assert.rejects(getDoc(doc(b.db, path + "/contributions/" + a.uid)));
      await b.core.preferences(b.uid, circleId, false, false);
      const member = (await getDoc(doc(b.db, own(circleId, b.uid)))).data();
      assert.equal(member?.visible, false);
      await a.core.leave(a.uid, circleId, b.uid);
      await assert.rejects(b.core.join(b.uid, "مريم", code));
      await assert.rejects(getDoc(doc(b.db, path + "/completed/" + a.uid)));
      await a.core.leave(a.uid, circleId);
      assert.equal((await getDoc(doc(a.db, path))).exists(), false);
    } finally {
      await Promise.all([a, b, outside].map((c) => deleteApp(c.app)));
    }
  },
);
