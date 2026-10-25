import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import app from '../firebase/init';
import { profileAuth } from './cloudAuth';
import { PersonalProfile, Gender, profileError } from './profileModel';
import { readJSON, updateJSON } from '../storage/jsonStore';

export const PROFILE_KEY = 'sirag-personal-profile-v1';
export const loadProfile = () => readJSON<PersonalProfile | null>(PROFILE_KEY, null);
export async function saveProfile(name: string, gender: Gender) {
  const error = profileError(name, gender);
  if (error) throw new Error(error);
  const now = new Date().toISOString();
  const profile = await updateJSON<PersonalProfile | null>(PROFILE_KEY, null, previous => ({
    name: name.trim(), gender, createdAt: previous?.createdAt || now, updatedAt: now,
    ...(previous?.cloudUid ? { cloudUid: previous.cloudUid } : {}),
  }));
  return profile!;
}
let syncing: Promise<boolean> | null = null;
let authReady: Promise<void> | null = null;
export function syncProfile(): Promise<boolean> {
  if (syncing) return syncing;
  syncing = (async () => {
    const profile = await loadProfile();
    if (!profile) return false;
    if (profile.syncedAt && profile.syncedAt >= profile.updatedAt) return true;
    // Wait for persisted Firebase identity before considering a new anonymous account.
    if (!authReady) authReady = new Promise<void>((resolve, reject) => {
      const unsub = onAuthStateChanged(profileAuth, () => { unsub(); resolve(); }, reject);
    });
    await authReady;
    const user = profileAuth.currentUser || (await signInAnonymously(profileAuth)).user;
    if (profile.cloudUid && profile.cloudUid !== user.uid) throw new Error('profile/identity-mismatch');
    await setDoc(doc(getFirestore(app), 'privateProfiles', user.uid), {
      displayName: profile.name, gender: profile.gender, createdAt: profile.createdAt,
      profileUpdatedAt: profile.updatedAt, updatedAt: serverTimestamp(),
    }, { merge: true });
    await updateJSON<PersonalProfile | null>(PROFILE_KEY, null, current => !current || current.updatedAt !== profile.updatedAt ? current : ({ ...current, cloudUid: user.uid, syncedAt: new Date().toISOString() }));
    return true;
  })().finally(() => { syncing = null; });
  return syncing;
}
