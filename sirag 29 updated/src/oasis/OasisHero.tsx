import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from './WebViewCompat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { OASIS_HTML } from './oasisHtml';
import { OASIS_STATE_KEY } from './OasisScreen';

const LOCATIONS = [
  { name: 'واحة البداية', plots: 16 }, { name: 'وادي الزيتون', plots: 20 }, { name: 'بستان الرمان', plots: 24 },
  { name: 'ظلال السدر', plots: 28 }, { name: 'حديقة النور', plots: 32 },
];
export type OasisSummary = { name: string; grown: number; plots: number; seeds: number; drops: number; residents: number };

export function summarize(state: any): OasisSummary {
  const li = Math.min(Math.max(0, state?.locIdx ?? 0), LOCATIONS.length - 1);
  const oa = state?.oases?.[li];
  const grown = Array.isArray(oa?.plots) ? oa.plots.filter((p: any) => p && p.stage === 2).length : 0;
  return { name: LOCATIONS[li].name, grown, plots: LOCATIONS[li].plots, seeds: state?.seeds || 0, drops: state?.drops || 0, residents: Array.isArray(oa?.res) ? oa.res.length : 0 };
}

/** The user's own oasis, alive, as a read-only card. Tapping it opens the oasis. */
export default function OasisHero({ onOpen, onSummary }: { onOpen: () => void; onSummary?: (s: OasisSummary) => void }) {
  const [view, setView] = useState<{ key: number; init: string } | null>(null);
  const [lastRaw, setLastRaw] = useState<string | null | undefined>(undefined);

  useFocusEffect(useCallback(() => {
    let alive = true;
    AsyncStorage.getItem(OASIS_STATE_KEY).catch(() => null).then(raw => {
      if (!alive) return;
      let state: any = null; try { state = raw ? JSON.parse(raw) : null; } catch { state = null; }
      onSummary?.(summarize(state));
      if (raw === lastRaw && view) return;
      setLastRaw(raw);
      setView(v => ({ key: (v?.key || 0) + 1, init: `window.__SIRAG_INIT=${JSON.stringify({ mode: 'hero', state })};true;` }));
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastRaw]));

  const onMessage = (e: WebViewMessageEvent) => {
    let msg: any; try { msg = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (msg.type === 'navigate') onOpen();
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {view && (
        <WebView
          key={view.key}
          style={styles.web}
          originWhitelist={['*']}
          source={{ html: OASIS_HTML, baseUrl: 'https://oasis.sirag.app/' }}
          injectedJavaScriptBeforeContentLoaded={view.init}
          onMessage={onMessage}
          javaScriptEnabled
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          textZoom={100}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ web: { flex: 1, backgroundColor: '#d9b77e' } });
