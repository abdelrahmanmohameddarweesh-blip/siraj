import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewMessageEvent } from './WebViewCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OASIS_HTML } from './oasisHtml';
import { oasisWaiting } from './oasisStatus';
import { launch } from '../notifications/launchState';

const ONBOARDED_KEY = 'sirag-onboarding-complete-v1';

/** Cinematic opening: the living oasis at dusk, lanterns lighting one by one, then the title. */
export default function OasisSplash({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [init, setInit] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const done = useRef(false);
  const ready = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(ONBOARDED_KEY).catch(() => null).then(v => {
      if (!alive) return;
      done.current = !!v;
      const payload = { mode: 'splash', auto: done.current, cta: 'ابدأ رحلتك', insets: { top: insets.top, bottom: insets.bottom } };
      setInit(`window.__SIRAG_INIT=${JSON.stringify(payload)};true;`);
    });
    const t = setTimeout(() => { if (!ready.current) setFallback(true); }, 5000);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const go = async () => {
    if (started.current) return;
    started.current = true;
    if (launch.fromNotification) return; // a tapped notification already opened its screen
    if (!done.current) { navigation.replace('HabitSetup', { first: true }); return; }
    // returning users open Home; the oasis opens first only when rewards are waiting to be collected
    let waiting = 0;
    try { waiting = (await oasisWaiting()).newRewards; } catch { waiting = 0; }
    navigation.replace(waiting > 0 ? 'Oasis' : 'Home');
  };

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: any; try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (msg.type === 'ready') { ready.current = true; setFallback(false); }
    if (msg.type === 'start') go();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {init && (
        <WebView
          style={styles.web}
          originWhitelist={['*']}
          source={{ html: OASIS_HTML, baseUrl: 'https://oasis.sirag.app/' }}
          injectedJavaScriptBeforeContentLoaded={init}
          onMessage={onMessage}
          javaScriptEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          textZoom={100}
          onError={() => setFallback(true)}
        />
      )}
      {fallback && (
        <View style={[styles.fallback, { paddingTop: insets.top + 90, paddingBottom: insets.bottom + 34 }]}>
          <Text style={styles.title}>سراج</Text>
          <Text style={styles.tag}>كل عمل طيب يترك أثرًا</Text>
          <View style={{ flex: 1 }} />
          <Pressable accessibilityRole="button" onPress={go} style={styles.cta}><Text style={styles.ctaText}>ابدأ رحلتك</Text></Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1d2357' },
  web: { flex: 1, backgroundColor: '#1d2357' },
  fallback: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', paddingHorizontal: 24 },
  title: { fontSize: 84, color: '#f6d48a', fontFamily: 'PlexBold' },
  tag: { fontSize: 18, color: '#ffeccb', fontFamily: 'PlexSemi', marginTop: 4 },
  cta: { alignSelf: 'stretch', marginHorizontal: 24, paddingVertical: 17, borderRadius: 999, backgroundColor: '#f1c76a', alignItems: 'center' },
  ctaText: { fontSize: 19, color: '#0d2b25', fontFamily: 'PlexBold' },
});
