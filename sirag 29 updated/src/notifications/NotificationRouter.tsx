/** Routes notification taps and plays the full adhan only while the app is active. */
import { useEffect, useRef } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { routeFor } from './schedulePlan';
import { loadPrayerSettings, syncNotifications, ensureChannels } from './scheduler';
import { loadProfile, syncProfile } from '../profile/profileStore';
import { launch } from './launchState';

export function useNotificationRouter(nav: NavigationContainerRefWithCurrent<any>) {
  const athan = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void syncProfile().catch(() => {});
    const go = async (data: any, cold: boolean) => {
      const destination = data?.screen === 'Sohba' && typeof data.circleId === 'string' && /^[A-Za-z0-9]{1,40}$/.test(data.circleId) ? { screen: 'Sohba', params: { circleId: data.circleId } } : routeFor(data);
      let hasProfile = false;
      try { hasProfile = destination.screen === 'Sohba' || !!(await loadProfile()); } catch { /* collect profile before navigating */ }
      const r = hasProfile ? destination : { screen: 'ProfileSetup', params: { nextRoute: destination.screen, nextParams: destination.params } };
      const doNav = () => {
        if (!alive) return;
        if (!nav.isReady()) { timer = setTimeout(doNav, 150); return; }
        if (cold) {
          const routes = hasProfile && r.screen !== 'Home' ? [{ name: 'Home' }, { name: r.screen, params: r.params }] : [{ name: r.screen, params: r.params }];
          nav.reset({ index: routes.length - 1, routes });
        }
        else (nav as any).navigate(r.screen, r.params);
      };
      doNav();
    };
    if (Platform.OS !== 'web') Notifications.getLastNotificationResponseAsync().then(resp => {
      if (resp && !launch.handled.has(resp.notification.request.identifier)) {
        launch.handled.add(resp.notification.request.identifier); launch.fromNotification = true;
        void go(resp.notification.request.content.data, true);
        void Notifications.clearLastNotificationResponseAsync().catch(() => {});
      }
    }).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(resp => {
      if (launch.handled.has(resp.notification.request.identifier)) return;
      launch.handled.add(resp.notification.request.identifier);
      void go(resp.notification.request.content.data, false);
      void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    });
    const recv = Notifications.addNotificationReceivedListener(async n => {
      const d: any = n.request.content.data;
      if (d?.type !== 'prayer_athan' || AppState.currentState !== 'active') return;
      const settings = await loadPrayerSettings();
      const prayer = settings.perPrayer[d.prayer as 'fajr'];
      if (!alive || !settings.enabled || !prayer?.enabled || prayer.athanEnabled === false || !prayer.sound) return;
      try {
        await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'doNotMix' });
        if (!alive) return;
        athan.current?.remove();
        athan.current = createAudioPlayer(require('../../assets/sounds/athan_full.mp3'));
        athan.current.play();
        Alert.alert(n.request.content.title || 'الأذان', 'حيّ على الصلاة', [{ text: 'إيقاف الأذان', onPress: () => athan.current?.pause() }, { text: 'حسنًا' }]);
      } catch { /* Device sound settings may prevent playback. */ }
    });
    void ensureChannels().catch(() => {});
    void syncNotifications();
    const app = AppState.addEventListener('change', s => { if (s === 'active') { void syncNotifications(); void syncProfile().catch(() => {}); } });
    return () => { alive = false; if (timer) clearTimeout(timer); sub.remove(); recv.remove(); app.remove(); athan.current?.remove(); };
  }, [nav]);
}
