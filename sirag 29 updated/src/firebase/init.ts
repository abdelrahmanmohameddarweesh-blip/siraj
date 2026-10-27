import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { firebaseConfig } from "./config";
export const emulatorHost =
  process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST || "";
const app = !getApps().length
  ? initializeApp(
      emulatorHost
        ? {
            ...firebaseConfig,
            projectId: "demo-siraj",
            apiKey: "demo-api-key",
            authDomain: "demo-siraj.firebaseapp.com",
          }
        : firebaseConfig,
    )
  : getApp();
if (emulatorHost)
  connectFirestoreEmulator(getFirestore(app), emulatorHost, 8080);
export default app;
