import { heroRepository } from '../hero/storage/AsyncStorageHeroRepository';
import { evaluateMilestoneTitles } from '../hero/engine';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppUser = {
  uid: string;
  displayName: string;
  score: number;
  lastPlayedAt?: string;
  country?: string;
  countryCode?: string;
  phone?: string;
  age?: number;
  gender?: 'male' | 'female' | '';
  photoUri?: string;
  championshipScore?: number;
  championshipTime?: number;
  sirajBalance?: number;
  unlockedItems?: string[];
  mutashabihatCorrectCount?: number;
  quranCorrectCount?: number;
  triviaCorrectCount?: number;
  unlockedTitles?: string[];
  activeTitle?: string;
};

export const auth = null;

const PLAYERS_KEY = 'batl-muslim-players-v1';
const CURRENT_USER_KEY = 'batl-muslim-current-user-v1';
export const STABLE_GUEST_ID_KEY = 'batl-muslim-stable-guest-id-v1';

export async function getOrCreateStableGuestId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(STABLE_GUEST_ID_KEY);
    if (existing) return existing;
    const newId = `guest-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    await AsyncStorage.setItem(STABLE_GUEST_ID_KEY, newId);
    return newId;
  } catch (e) {
    console.warn('[auth] Error accessing stable guest id:', e);
    return 'guest-device-stable';
  }
}

function normalizeDisplayName(displayName: string) {
  const trimmed = (displayName || '').trim();
  return trimmed || 'ضيف';
}

function createPlayerId(displayName: string) {
  const safeName = normalizeDisplayName(displayName).replace(/\s+/g, '-').toLowerCase();
  return `guest-${safeName}-${Date.now().toString(36)}`;
}

async function readPlayers(): Promise<Record<string, AppUser>> {
  try {
    const raw = await AsyncStorage.getItem(PLAYERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('[auth] Failed to read players from storage:', e);
    return {};
  }
}

async function writePlayers(players: Record<string, AppUser>) {
  try {
    await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  } catch (e) {
    console.error('[auth] Failed to write players to storage:', e);
  }
}

async function readCurrentUser(): Promise<AppUser | null> {
  try {
    const raw = await AsyncStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('[auth] Failed to read current user from storage:', e);
    return null;
  }
}

async function writeCurrentUser(user: AppUser | null) {
  try {
    if (!user) {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } else {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('[auth] Failed to write current user to storage:', e);
  }
}

export async function getCurrentUser(): Promise<AppUser | null> {
  return readCurrentUser();
}

export async function signInAnonymous(displayName: string, phone: string, country: string, age?: number, photoUri?: string, gender?: 'male' | 'female' | ''): Promise<AppUser> {
  const name = normalizeDisplayName(displayName);
  const existingUser = await readCurrentUser();
  const players = await readPlayers();
  let uid = existingUser?.displayName === name ? existingUser.uid : '';
  if (!uid) {
    if (name === 'ضيف' || !displayName.trim()) {
      uid = await getOrCreateStableGuestId();
    } else {
      uid = createPlayerId(name);
    }
  }

  const user: AppUser = {
    uid,
    displayName: name,
    score: players[uid]?.score ?? existingUser?.score ?? 0,
    lastPlayedAt: players[uid]?.lastPlayedAt ?? existingUser?.lastPlayedAt,
    phone: phone.trim() || undefined,
    country: country.trim() || undefined,
    age: age || undefined,
    gender: gender || undefined,
    photoUri: photoUri || undefined,
    sirajBalance: players[uid]?.sirajBalance ?? existingUser?.sirajBalance ?? 50,
    unlockedItems: players[uid]?.unlockedItems ?? existingUser?.unlockedItems ?? [],
    mutashabihatCorrectCount: players[uid]?.mutashabihatCorrectCount ?? existingUser?.mutashabihatCorrectCount ?? 0,
    quranCorrectCount: players[uid]?.quranCorrectCount ?? existingUser?.quranCorrectCount ?? 0,
    triviaCorrectCount: players[uid]?.triviaCorrectCount ?? existingUser?.triviaCorrectCount ?? 0,
    unlockedTitles: players[uid]?.unlockedTitles ?? existingUser?.unlockedTitles ?? [],
    activeTitle: players[uid]?.activeTitle ?? existingUser?.activeTitle ?? '',
  };

  players[uid] = user;
  await writePlayers(players);
  await writeCurrentUser(user);
  return user;
}

export function onAuthStateChangedListener(callback: (user: AppUser | null) => void) {
  callback(null);
  return () => {};
}

export async function signOutUser() {
  await writeCurrentUser(null);
}

export async function saveUserScore(uid: string, score: number) {
  if (!uid) {
    return;
  }

  const players = await readPlayers();
  const existing = players[uid];
  const nextUser: AppUser = {
    ...existing,
    uid,
    displayName: existing?.displayName || 'ضيف',
    score,
    lastPlayedAt: new Date().toISOString(),
  };

  players[uid] = nextUser;
  await writePlayers(players);
  const currentUser = await readCurrentUser();
  if (currentUser?.uid === uid) {
    await writeCurrentUser(nextUser);
  }
}

export async function getTopPlayers() {
  const players = Object.values(await readPlayers());
  return players.sort((a, b) => b.score - a.score).slice(0, 10);
}

export async function getAllPlayers() {
  const players = Object.values(await readPlayers());
  return players.sort((a, b) => b.score - a.score);
}

export async function getCurrentUserProfile(uid: string) {
  const players = await readPlayers();
  return players[uid] ?? null;
}

export async function updateUserCountry(uid: string, country: string, countryCode: string) {
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) return;
  const updatedUser: AppUser = {
    ...existing,
    country,
    countryCode,
  };
  players[uid] = updatedUser;
  await writePlayers(players);
  
  const currentUser = await readCurrentUser();
  if (currentUser && currentUser.uid === uid) {
    await writeCurrentUser(updatedUser);
  }
}

export async function saveUserChampionshipResult(uid: string, score: number, seconds: number) {
  if (!uid) return;
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) return;
  
  const updatedUser: AppUser = {
    ...existing,
    championshipScore: score,
    championshipTime: seconds,
    score: existing.score + score,
    lastPlayedAt: new Date().toISOString(),
  };

  players[uid] = updatedUser;
  await writePlayers(players);
  const currentUser = await readCurrentUser();
  if (currentUser && currentUser.uid === uid) {
    await writeCurrentUser(updatedUser);
  }
}

export async function updateUserPhoto(uid: string, photoUri: string) {
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) return;
  const updatedUser: AppUser = {
    ...existing,
    photoUri,
  };
  players[uid] = updatedUser;
  await writePlayers(players);
  
  const currentUser = await readCurrentUser();
  if (currentUser && currentUser.uid === uid) {
    await writeCurrentUser(updatedUser);
  }
}

export async function updateUserAge(uid: string, age: number) {
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) return;
  const updatedUser: AppUser = {
    ...existing,
    age,
  };
  players[uid] = updatedUser;
  await writePlayers(players);
  
  const currentUser = await readCurrentUser();
  if (currentUser && currentUser.uid === uid) {
    await writeCurrentUser(updatedUser);
  }
}

export async function addSirajPoints(uid: string, amount: number): Promise<AppUser> {
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) {
    throw new Error('User not found');
  }

  await heroRepository.recordEvent({
    id: `evt-siraj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    uid,
    type: 'bonus_siraj',
    source: 'bonus',
    value: amount,
    at: new Date().toISOString(),
  });

  const updatedUser: AppUser = {
    ...existing,
    sirajBalance: (existing.sirajBalance ?? 50) + amount,
  };

  players[uid] = updatedUser;
  await writePlayers(players);
  const currentUser = await readCurrentUser();
  if (currentUser && currentUser.uid === uid) {
    await writeCurrentUser(updatedUser);
  }
  return updatedUser;
}

export async function unlockShopItem(uid: string, itemId: string, cost: number): Promise<AppUser> {
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) {
    throw new Error('User not found');
  }

  const currentBalance = existing.sirajBalance ?? 50;
  if (currentBalance < cost) {
    throw new Error('Insufficient Siraj balance');
  }

  const unlocked = existing.unlockedItems ?? [];
  await heroRepository.recordEvent({
    id: `evt-shop-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    uid,
    type: 'shop_purchase',
    source: 'shop',
    value: cost,
    meta: { itemId },
    at: new Date().toISOString(),
  });

  const updatedUser: AppUser = {
    ...existing,
    sirajBalance: currentBalance - cost,
    unlockedItems: [...unlocked, itemId],
  };

  players[uid] = updatedUser;
  await writePlayers(players);
  const currentUser = await readCurrentUser();
  if (currentUser && currentUser.uid === uid) {
    await writeCurrentUser(updatedUser);
  }
  return updatedUser;
}

export async function incrementCorrectAnswers(uid: string, testType: 'mutashabihat' | 'quran' | 'trivia', amount: number): Promise<AppUser> {
  if (!uid) {
    throw new Error('User UID is required');
  }
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) {
    throw new Error('User not found');
  }

  const field = testType === 'mutashabihat' 
    ? 'mutashabihatCorrectCount' 
    : testType === 'quran' 
      ? 'quranCorrectCount' 
      : 'triviaCorrectCount';

  const currentCount = (existing[field] ?? 0) + amount;
  const unlockedTitles = [...(existing.unlockedTitles ?? [])];

  // Title Unlocks:
  // 1. فارس المتشابهات: 30 correct answers in mutashabihat
  if (testType === 'mutashabihat' && currentCount >= 30 && !unlockedTitles.includes('title_knight')) {
    unlockedTitles.push('title_knight');
  }
  // 2. الحافظ المتقن: 50 correct answers in quran
  if (testType === 'quran' && currentCount >= 50 && !unlockedTitles.includes('title_hafidh')) {
    unlockedTitles.push('title_hafidh');
  }
  // 3. سراج المنبر: 40 correct answers in trivia
  if (testType === 'trivia' && currentCount >= 40 && !unlockedTitles.includes('title_pulpit')) {
    unlockedTitles.push('title_pulpit');
  }
  // 4. قارئ الجنان: 100 total correct answers across any test
  const totalCorrect = (testType === 'mutashabihat' ? currentCount : (existing.mutashabihatCorrectCount ?? 0))
    + (testType === 'quran' ? currentCount : (existing.quranCorrectCount ?? 0))
    + (testType === 'trivia' ? currentCount : (existing.triviaCorrectCount ?? 0));

  if (totalCorrect >= 100 && !unlockedTitles.includes('title_heavens')) {
    unlockedTitles.push('title_heavens');
  }

  // Record event in Hero Engine (append-only, idempotent)
  await heroRepository.recordEvent({
    id: `evt-quiz-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    uid,
    type: 'quiz_correct',
    source: testType,
    value: amount,
    meta: { testType },
    at: new Date().toISOString(),
  });

  const updatedUser: AppUser = {
    ...existing,
    [field]: currentCount,
    unlockedTitles,
  };

  players[uid] = updatedUser;
  await writePlayers(players);
  const currentUser = await readCurrentUser();
  if (currentUser && currentUser.uid === uid) {
    await writeCurrentUser(updatedUser);
  }
  return updatedUser;
}

export async function equipUserTitle(uid: string, titleId: string): Promise<AppUser> {
  const players = await readPlayers();
  const existing = players[uid];
  if (!existing) {
    throw new Error('User not found');
  }

  const updatedUser: AppUser = {
    ...existing,
    activeTitle: titleId,
  };

  players[uid] = updatedUser;
  await writePlayers(players);
  const currentUser = await readCurrentUser();
  if (currentUser && currentUser.uid === uid) {
    await writeCurrentUser(updatedUser);
  }
  return updatedUser;
}


