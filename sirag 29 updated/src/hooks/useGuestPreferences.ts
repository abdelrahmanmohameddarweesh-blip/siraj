import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const GUEST_PREFERENCES_KEY = 'batl-personalization-v1';
export type GuestPreferences = {
  nickname: string;
  avatar: 'star' | 'book' | 'moon' | 'shield';
  ageGroup: 'unspecified' | 'under18' | 'adult';
  focus: 'quran' | 'knowledge' | 'habits' | 'all';
  habit: 'revision' | 'reading' | 'athkar';
  reminder: 'off' | 'morning' | 'evening';
  notificationId?: string;
};
export const DEFAULT_GUEST_PREFERENCES: GuestPreferences = {
  nickname: '', avatar: 'star', ageGroup: 'unspecified', focus: 'quran', habit: 'revision', reminder: 'off',
};
export function useGuestPreferences(): GuestPreferences {
  const [preferences, setPreferences] = useState<GuestPreferences>(DEFAULT_GUEST_PREFERENCES);
  const focused = useIsFocused();
  useEffect(() => {
    if (!focused) return;
    let active = true;
    AsyncStorage.getItem(GUEST_PREFERENCES_KEY)
      .then(raw => {
        if (!active) return;
        if (!raw) { setPreferences(DEFAULT_GUEST_PREFERENCES); return; }
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          setPreferences({ ...DEFAULT_GUEST_PREFERENCES, ...parsed });
        }
      })
      .catch(() => { if (active) setPreferences(DEFAULT_GUEST_PREFERENCES); });
    return () => { active = false; };
  }, [focused]);
  return preferences;
}
