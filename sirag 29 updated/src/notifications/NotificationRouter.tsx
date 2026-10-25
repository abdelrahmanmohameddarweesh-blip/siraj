/** Opens the right screen when a notification is tapped, plays the full adhan in the app, and keeps the schedule fresh. */
import { useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { routeFor } from './schedulePlan';
import { loadPrayerSettings, syncNotifications, ensureChannels } from './scheduler';
import { launch } from './launchState';

export function useNotificationRouter(nav: NavigationContainerRefWithCurrent<any>) {
  const athan = useRef<ReturnType<typeof createAudioPlayer> | null>(null);
  useEffect(() => {
    const go = (data: any, cold: boolean) => {
      const r = routeFor(data);
      const doNav = () => {
        if (!nav.isReady()) { setTimeout(doNav, 150); return; }
        if (cold) nav.reset({ index: r.screen === 'Home' ? 0 : 1, routes: r.screen === 'Home' ? [{ name: 'Home' }] : [{ name: 'Home' }, { name: r.screen, params: r.params }] });
        else (nav as any).navigate(r.screen, r.params);
      };
      doNav();
    };
    Notifications.getLastNotificationResponseAsync().then(resp => {
      if (resp && !launch.handled.has(resp.notification.request.identifier)) {
        launch.handled.add(resp.notification.request.identifier); launch.fromNotification = true;
        go(resp.notification.request.content.data, true);
      }
    }).catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(resp => {
      if (launch.handled.has(resp.notification.request.identifier)) return;
      launch.handled.add(resp.notification.request.identifier);
      go(resp.notification.request.content.data, false);
    });
    // app open at prayer time: play the whole adhan (the notification itself stays silent in the foreground)
    const recv = Notifications.addNotificationReceivedListener(async n => {
      const d: any = n.request.content.data;
      if (d?.type !== 'prayer_athan') return;
      const settings = await loadPrayerSettings();
      if (!settings.perPrayer[d.prayer as 'fajr']?.sound) return;
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        athan.current?.remove();
        athan.current = createAudioPlayer(require('../../assets/sounds/athan_full.mp3'));
        athan.current.play();
        Alert.alert(n.request.content.title || 'الأذان', 'حيّ على الصلاة', [{ text: 'إيقاف الأذان', onPress: () => athan.current?.pause() }, { text: 'حسنًا' }]);
      } catch { /* sound is optional */ }
    });
    ensureChannels().catch(() => {});
    syncNotifications();
    const app = AppState.addEventListener('change', s => { if (s === 'active') syncNotifications(); });
    return () => { sub.remove(); recv.remove(); app.remove(); athan.current?.remove(); };
  }, [nav]);
}
