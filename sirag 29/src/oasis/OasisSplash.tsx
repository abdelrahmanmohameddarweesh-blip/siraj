import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, ScrollView, StatusBar, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as SvgGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { oasisWaiting } from './oasisStatus';
import { launch } from '../notifications/launchState';

const GOLD = '#E8C581';
const ONBOARDED_KEY = 'sirag-onboarding-complete-v1';

/** Original vector artwork: a lantern illuminating a quiet oasis beneath a pointed arch. */
function LanternOasis() {
  return <Svg width="100%" height="100%" viewBox="0 0 360 420" accessible={false}>
    <Defs>
      <SvgGradient id="arch" x1="0" y1="0" x2="0" y2="1"><Stop stopColor="#143E3C" /><Stop offset="1" stopColor="#092B2B" /></SvgGradient>
      <SvgGradient id="metal" x1="0" y1="0" x2="1" y2="1"><Stop stopColor="#FFF0BA" /><Stop offset=".5" stopColor="#D9AD60" /><Stop offset="1" stopColor="#8E6934" /></SvgGradient>
      <SvgGradient id="glass" x1="0" y1="0" x2="0" y2="1"><Stop stopColor="#EBC16F" stopOpacity=".08" /><Stop offset="1" stopColor="#FFD78C" stopOpacity=".48" /></SvgGradient>
      <RadialGradient id="light"><Stop stopColor="#FFD88D" stopOpacity=".45" /><Stop offset=".5" stopColor="#EDBB63" stopOpacity=".1" /><Stop offset="1" stopColor="#EDBB63" stopOpacity="0" /></RadialGradient>
    </Defs>
    <Path d="M53 368V166Q53 83 180 24Q307 83 307 166V368" fill="url(#arch)" stroke={GOLD} strokeOpacity=".3" />
    <Path d="M64 366V167Q64 91 180 38Q296 91 296 167V366" fill="none" stroke={GOLD} strokeOpacity=".12" />
    <Circle cx="251" cy="116" r="16" fill="#E9D5A7" />
    <Circle cx="257" cy="110" r="16" fill="#123A38" />
    {[ [103,126], [224,77], [270,177], [87,215], [138,81], [240,220] ].map(([x,y], i) => <Circle key={i} cx={x} cy={y} r={i % 2 ? 1 : 1.5} fill={GOLD} opacity=".55" />)}
    <Path d="M54 323Q115 280 178 315T306 300V369H54Z" fill="#28504A" />
    <Path d="M54 341Q134 300 207 339T306 325V369H54Z" fill="#396052" />
    <Path d="M54 357Q155 324 230 354T306 347V369H54Z" fill="#143C36" />
    <Ellipse cx="180" cy="366" rx="112" ry="14" fill="#6C947C" opacity=".13" />
    <Path d="M105 343Q119 309 112 272M112 276Q87 255 76 278Q94 269 112 281M112 276Q128 254 143 271Q125 266 112 281M112 275Q101 250 110 244Q120 260 112 275" fill="#0A2B29" stroke="#0A2B29" strokeWidth="3" strokeLinecap="round" />
    <Ellipse cx="180" cy="265" rx="110" ry="124" fill="url(#light)" />
    <Path d="M180 71V151" stroke="url(#metal)" strokeWidth="1.5" />
    <Circle cx="180" cy="159" r="8" fill="none" stroke="url(#metal)" strokeWidth="2" />
    <Path d="M164 182L180 167L196 182L207 197H153Z" fill="url(#metal)" />
    <Path d="M155 202H205L210 272L198 290H162L150 272Z" fill="url(#glass)" stroke="url(#metal)" strokeWidth="2" />
    <Path d="M155 202L168 218V276L162 290M205 202L192 218V276L198 290M168 218H192" fill="none" stroke="url(#metal)" strokeWidth="1.5" />
    <Ellipse cx="180" cy="269" rx="15" ry="9" fill="#FFDB8D" opacity=".25" />
    <Rect x="175" y="250" width="10" height="24" rx="2" fill="#F5DBA7" />
    <Path d="M180 251C167 242 181 230 181 230C180 240 191 243 180 251Z" fill="#FFF1BF" />
    <Path d="M151 293H209L202 301H158Z" fill="url(#metal)" />
    <Path d="M178 303V309M182 303V309" stroke={GOLD} strokeWidth="1.5" />
    <G stroke={GOLD} strokeOpacity=".4" fill="none"><Path d="M31 180v28M17 194h28M322 278v20M312 288h20" /><Path d="M177 395l3-4 3 4-3 4Z" /></G>
  </Svg>;
}

export default function OasisSplash({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [returning, setReturning] = useState<boolean | null>(null);
  const [leaving, setLeaving] = useState(false);
  const entrance = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const started = useRef(false);
  const compact = height < 740;

  useEffect(() => {
    let alive = true;
    let animation: Animated.CompositeAnimation | undefined;
    const show = (reduceMotion: boolean) => {
      if (!alive) return;
      if (reduceMotion) { entrance.setValue(1); glow.setValue(0); return; }
      Animated.timing(entrance, { toValue: 1, duration: 1000, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      animation = Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
      animation.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(show).catch(() => show(true));
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      animation?.stop(); entrance.stopAnimation(); show(value);
    });
    AsyncStorage.getItem(ONBOARDED_KEY).then(value => { if (alive) setReturning(!!value); }).catch(() => { if (alive) setReturning(false); });
    return () => { alive = false; listener.remove(); animation?.stop(); entrance.stopAnimation(); };
  }, [entrance, glow]);

  useEffect(() => {
    if (!returning) return;
    const timer = setTimeout(() => { void go(); }, 2800);
    return () => clearTimeout(timer);
  }, [returning]);

  async function go() {
    if (started.current || returning === null || launch.fromNotification) return;
    started.current = true;
    setLeaving(true);
    if (!returning) { navigation.replace('HabitSetup', { first: true }); return; }
    let waiting = 0;
    try { waiting = (await oasisWaiting()).newRewards; } catch { /* Home remains available offline. */ }
    if (!launch.fromNotification) navigation.replace(waiting > 0 ? 'Oasis' : 'Home');
  }

  return <View style={styles.root}>
    <StatusBar barStyle="light-content" backgroundColor="#082B2A" />
    <LinearGradient colors={['#082B2A', '#103C36', '#071F20']} style={StyleSheet.absoluteFill} />
    <Animated.View pointerEvents="none" style={[styles.aura, { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [.18, .35] }) }]} />
    <ScrollView bounces={false} contentContainerStyle={[styles.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20, minHeight: height }]}>
      <Animated.View style={[styles.content, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }]}>
        <View style={styles.signature}><View style={styles.rule} /><Text style={styles.eyebrow}>نُورٌ يَنْمُو مَعَك</Text><View style={styles.rule} /></View>
        <View style={[styles.art, compact && styles.artCompact]}><LanternOasis /></View>
        <View style={styles.brand}>
          <Text accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>سراج</Text>
          <Text style={styles.english}>S I R A G</Text>
          <View style={styles.divider}><View style={styles.rule} /><Text style={styles.diamond}>✦</Text><View style={styles.rule} /></View>
          <Text style={styles.tagline}>كل عمل طيب يترك أثرًا</Text>
          <Text style={styles.description}>صلاتك، وردك، وعاداتك الطيبة؛{'\n'}خطوات صغيرة تُزهر بها واحتك.</Text>
        </View>
      </Animated.View>
      <View style={styles.footer}>
        <Pressable accessibilityRole="button" accessibilityLabel={returning ? 'متابعة رحلتك' : 'ابدأ رحلتك'} accessibilityState={{ disabled: returning === null || leaving, busy: leaving }} disabled={returning === null || leaving} onPress={() => void go()} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, (returning === null || leaving) && styles.buttonDisabled]}>
          <Text style={styles.arrow}>←</Text><Text style={styles.buttonText}>{returning === null ? 'لحظة من السكينة…' : returning ? 'متابعة رحلتك' : 'ابدأ رحلتك'}</Text><View style={styles.buttonBalance} />
        </Pressable>
        <Text style={styles.footnote}>{returning ? 'أهلًا بعودتك إلى واحتك' : 'ازرع خيرًا، وأنر يومك'}</Text>
      </View>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#082B2A' },
  aura: { position: 'absolute', width: 360, height: 360, borderRadius: 180, backgroundColor: '#407D65', top: '15%', alignSelf: 'center' },
  page: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 28 },
  content: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', maxWidth: 420 },
  signature: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  rule: { width: 28, height: 1, backgroundColor: GOLD, opacity: .35 },
  eyebrow: { fontFamily: 'PlexMedium', fontSize: 11, color: '#D2C4A4', textAlign: 'center', letterSpacing: 1 },
  art: { width: '100%', maxWidth: 340, height: 350 },
  artCompact: { height: 240, maxWidth: 250 },
  brand: { alignItems: 'center', marginTop: -8 },
  title: { fontFamily: 'PlexBold', fontSize: 76, lineHeight: 108, color: '#F4D99F', textAlign: 'center', paddingHorizontal: 12 },
  titleCompact: { fontSize: 62, lineHeight: 88 },
  english: { fontSize: 11, color: '#D7BE8C', fontWeight: '500', marginTop: -8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 17 },
  diamond: { color: GOLD, fontSize: 12 },
  tagline: { fontFamily: 'PlexSemi', color: '#F7EDDA', fontSize: 20, textAlign: 'center', lineHeight: 34 },
  description: { fontFamily: 'Plex', color: '#B8CBC0', fontSize: 13, lineHeight: 24, textAlign: 'center', marginTop: 8 },
  footer: { width: '100%', maxWidth: 350, marginTop: 30 },
  button: { minHeight: 58, paddingHorizontal: 22, paddingVertical: 13, backgroundColor: '#E8C581', borderRadius: 18, borderColor: '#F6DCA5', borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  buttonPressed: { opacity: .86, transform: [{ scale: .98 }] },
  buttonDisabled: { opacity: .65 },
  buttonText: { fontFamily: 'PlexBold', color: '#143D34', fontSize: 17, textAlign: 'center', flexShrink: 1 },
  arrow: { color: '#143D34', fontSize: 23, width: 25 },
  buttonBalance: { width: 25 },
  footnote: { fontFamily: 'Plex', fontSize: 11, lineHeight: 20, color: '#A9BBAE', textAlign: 'center', marginTop: 14 },
});
