import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { profileAuth } from "./cloudAuth";
import { identitySession } from "./identitySession";
import { accountSyncBlocked } from "../account/maintenance";
let ready: Promise<void> | null = null;
export function waitForAuth() {
  if (!ready)
    ready = new Promise<void>((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        profileAuth,
        () => {
          unsubscribe();
          resolve();
        },
        (error) => {
          ready = null;
          reject(error);
        },
      );
    });
  return ready;
}
const resolveIdentity = identitySession(
  waitForAuth,
  () => profileAuth.currentUser,
  async () => (await signInAnonymously(profileAuth)).user,
);

export async function ensureAuthenticatedUser() {
  if (await accountSyncBlocked())
    throw new Error("حذف الحساب قيد الإكمال. افتح إعدادات الحساب لإكماله.");
  return resolveIdentity();
}
