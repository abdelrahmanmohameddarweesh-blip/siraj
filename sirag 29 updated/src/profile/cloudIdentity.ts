import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { profileAuth } from "./cloudAuth";
import { identitySession } from "./identitySession";
let ready: Promise<void> | null = null;
function waitForAuth() {
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
export const ensureAuthenticatedUser = identitySession(
  waitForAuth,
  () => profileAuth.currentUser,
  async () => (await signInAnonymously(profileAuth)).user,
);
