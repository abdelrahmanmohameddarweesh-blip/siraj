import {
  connectAuthEmulator,
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import app, { emulatorHost } from "../firebase/init";
function initialize() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if ((error as { code?: string }).code === "auth/already-initialized")
      return getAuth(app);
    throw error;
  }
}
export const profileAuth = initialize();

if (emulatorHost)
  connectAuthEmulator(profileAuth, `http://${emulatorHost}:9099`, {
    disableWarnings: true,
  });
