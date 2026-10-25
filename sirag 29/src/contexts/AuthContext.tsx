import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInAnonymous,
  signOutUser,
  getCurrentUser,
  getOrCreateStableGuestId,
  type AppUser,
} from '../firebase/auth';

export type AuthUser = AppUser;

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isRestoringSession: boolean;
  login: (displayName: string, phone: string, country: string, age?: number, photoUri?: string, gender?: 'male' | 'female' | '') => Promise<void>;
  logout: () => Promise<void>;
  updateUserFields: (fields: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  isRestoringSession: true,
  login: async () => {},
  logout: async () => {},
  updateUserFields: () => {},
});

const CURRENT_USER_KEY = 'batl-muslim-current-user-v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  // Restore saved session across app restarts
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      try {
        const savedUser = await getCurrentUser();
        if (savedUser && isMounted) {
          setUser(savedUser);
        }
      } catch (err) {
        console.warn('[AuthContext] Error restoring session on launch:', err);
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }
    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (displayName: string, phone: string, country: string, age?: number, photoUri?: string, gender?: 'male' | 'female' | '') => {
    setLoading(true);
    try {
      const authUser = await signInAnonymous(displayName, phone, country, age, photoUri, gender);
      setUser(authUser);
    } catch (error) {
      console.warn('[AuthContext] Online login failed, applying stable guest fallback:', error);
      let guestUid = 'guest-local-stable';
      try {
        guestUid = await getOrCreateStableGuestId();
      } catch (e) {
        console.warn('[AuthContext] Failed to get stable guest id:', e);
      }

      const fallbackUser: AuthUser = {
        uid: guestUid,
        displayName: (displayName || '').trim() || 'ضيف',
        score: 0,
        phone: phone?.trim() || undefined,
        country: country?.trim() || undefined,
        age: age || undefined,
        gender: gender || undefined,
        photoUri: photoUri || undefined,
        sirajBalance: 50,
        unlockedItems: [],
        mutashabihatCorrectCount: 0,
        quranCorrectCount: 0,
        triviaCorrectCount: 0,
        unlockedTitles: [],
        activeTitle: '',
      };
      setUser(fallbackUser);

      try {
        await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(fallbackUser));
      } catch (storageErr) {
        console.error('[AuthContext] Failed to persist fallback guest user:', storageErr);
      }

      Alert.alert('تنبيه', 'تم تسجيل الدخول محلياً، وقد تكون هناك مشكلة مؤقتة في التخزين.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserFields = (fields: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated: AuthUser = {
        ...prev,
        ...fields,
      };
      // Persist to storage safely so fields are retained on restart
      AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updated)).catch((err) => {
        console.warn('[AuthContext] Failed to persist updated user fields:', err);
      });
      return updated;
    });
  };

  const logout = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('[AuthContext] Error during sign out:', e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isRestoringSession, login, logout, updateUserFields }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
