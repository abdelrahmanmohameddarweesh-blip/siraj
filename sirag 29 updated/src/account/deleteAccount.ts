import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, DeviceEventEmitter } from "react-native";
import * as Notifications from "expo-notifications";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { profileAuth } from "../profile/cloudAuth";
import { waitForAuth } from "../profile/cloudIdentity";
import { waitForProfileSync } from "../profile/profileStore";
import { sparkDB, store, clearCircleCache } from "../circles/sparkFirestore";
import { sparkCore, root } from "../circles/sparkCore";
import {
  DELETE_MARKER,
  pauseAccountSync,
  resumeAccountSync,
} from "./maintenance";
import { DeleteStage, runDeletion } from "./deletionFlow";
import { clearHeroMemoryCache } from "../hero/storage/AsyncStorageHeroRepository";
export type PendingDelete = {
  uid: string;
  email: string | null;
  anonymous: boolean;
  stage: DeleteStage;
  circleIds?: string[];
};
export async function pendingDeletion(): Promise<PendingDelete | null> {
  const raw = await AsyncStorage.getItem(DELETE_MARKER);
  return raw ? JSON.parse(raw) : null;
}
export async function deleteSirajAccount(password: string) {
  await waitForAuth();
  let marker = await pendingDeletion(),
    user = profileAuth.currentUser;
  if (marker?.stage !== "device") {
    if (!user && marker?.email && password)
      user = (
        await signInWithEmailAndPassword(profileAuth, marker.email, password)
      ).user;
    if (!user)
      throw new Error(
        "لا يمكن تأكيد حذف الحساب السحابي الآن. تواصل مع الدعم واذكر رقم الحساب المحفوظ أدناه.",
      );
    if (marker && marker.uid !== user.uid)
      throw new Error("سجّل الدخول بالحساب الذي بدأت حذفه.");
    if (!user.isAnonymous) {
      if (!user.email || !password)
        throw new Error("أدخل كلمة مرور حسابك لتأكيد الحذف.");
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, password),
      );
    }
  }
  if (!marker) {
    if (!user) throw new Error("تعذّر تحديد الحساب");
    marker = {
      uid: user.uid,
      email: user.email,
      anonymous: user.isAnonymous,
      stage: "cloud",
    };
  }
  const target = marker;
  pauseAccountSync();
  await AsyncStorage.setItem(DELETE_MARKER, JSON.stringify(target));
  await waitForProfileSync();
  const checkpoint = async (stage: DeleteStage) => {
    target.stage = stage;
    await AsyncStorage.setItem(DELETE_MARKER, JSON.stringify(target));
  };
  await runDeletion(
    {
      checkpoint,
      cloud: async () => {
        const entries = await getDocs(
          collection(sparkDB, "sparkAccounts", target.uid, "circles"),
        );
        const core = sparkCore(store);
        target.circleIds = [
          ...new Set([
            ...(target.circleIds || []),
            ...entries.docs.map((e) => e.id),
          ]),
        ];
        await AsyncStorage.setItem(DELETE_MARKER, JSON.stringify(target));
        for (const id of target.circleIds) {
          const c = await store.get(root(id));
          if (c?.members?.[target.uid]) await core.leave(target.uid, id);
          await core.redactRemoval(target.uid, id);
          await deleteDoc(
            doc(sparkDB, "sparkAccounts", target.uid, "circles", id),
          );
        }
        const reports = await getDocs(
          query(
            collection(sparkDB, "sparkReports"),
            where("uid", "==", target.uid),
          ),
        );
        for (const report of reports.docs) await deleteDoc(report.ref);
        await deleteDoc(doc(sparkDB, "privateProfiles", target.uid));
        await deleteDoc(doc(sparkDB, "users", target.uid));
      },
      identity: async () => {
        const current = profileAuth.currentUser;
        if (!current || current.uid !== target.uid)
          throw new Error(
            "تعذّر تأكيد حذف هوية الحساب. سجّل الدخول بنفس الحساب أو تواصل مع الدعم.",
          );
        await deleteUser(current);
      },
      device: async () => {
        if (Platform.OS !== "web") {
          await Notifications.cancelAllScheduledNotificationsAsync();
          await Notifications.clearLastNotificationResponseAsync().catch(
            () => {},
          );
        }
        await AsyncStorage.clear();
        clearCircleCache();
        clearHeroMemoryCache();
        resumeAccountSync();
        DeviceEventEmitter.emit("siraj-account-deleted");
      },
    },
    target.stage,
  );
}
