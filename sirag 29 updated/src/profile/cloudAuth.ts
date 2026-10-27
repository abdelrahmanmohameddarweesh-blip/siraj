import { connectAuthEmulator, getAuth } from "firebase/auth";
import app, { emulatorHost } from "../firebase/init";
export const profileAuth = getAuth(app);

if (emulatorHost)
  connectAuthEmulator(profileAuth, `http://${emulatorHost}:9099`, {
    disableWarnings: true,
  });
