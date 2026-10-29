import AsyncStorage from "@react-native-async-storage/async-storage";
export const DELETE_MARKER = "siraj-account-deletion-pending-v1";
let paused = false;
export const pauseAccountSync = () => {
  paused = true;
};
export const resumeAccountSync = () => {
  paused = false;
};
export async function accountSyncBlocked() {
  return paused || !!(await AsyncStorage.getItem(DELETE_MARKER));
}
