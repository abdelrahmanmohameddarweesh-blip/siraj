import CinematicJourneyPanel from '../../components/CinematicJourneyPanel';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import Svg, { Circle, Path, Line, G } from 'react-native-svg';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Coordinates, Qibla } from 'adhan';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeColors, HomeRadii, HomeSpacing, HomeTypography } from '../../theme/tokens';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePrayer } from '../../prayer/PrayerContext';
import { HomeIcon } from '../../components/home/HomeIcons';

const KAABA_COORDS = {
  latitude: 21.422487,
  longitude: 39.826206,
};

function calculateDistanceToKaabaKm(lat: number, lon: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((KAABA_COORDS.latitude - lat) * Math.PI) / 180;
  const dLon = ((KAABA_COORDS.longitude - lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((KAABA_COORDS.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function QiblaScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { location: userCity } = usePrayer();

  const [heading, setHeading] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [sensorAvailable, setSensorAvailable] = useState<boolean>(true);
  const [showCalibrationHint, setShowCalibrationHint] = useState<boolean>(false);
  const [hasAlignedHaptic, setHasAlignedHaptic] = useState<boolean>(false);

  // Circular smoothing vector state
  const sinAvgRef = useRef<number>(0);
  const cosAvgRef = useRef<number>(1);
  const isInitializedRef = useRef<boolean>(false);

  // Compute Qibla Bearing from user coordinates
  const qiblaBearing = useMemo(() => {
    const lat = userCity.latitude;
    const lng = userCity.longitude;
    const coords = new Coordinates(lat, lng);
    return Math.round(Qibla(coords));
  }, [userCity]);

  // Compute distance to Kaaba
  const distanceKm = useMemo(() => {
    return calculateDistanceToKaabaKm(userCity.latitude, userCity.longitude);
  }, [userCity]);

  // Setup Location.watchHeadingAsync with circular smoothing (sin/cos)
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startCompass() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setSensorAvailable(false);
          return;
        }

        subscription = await Location.watchHeadingAsync((headingData) => {
          // Use True North heading if available, otherwise magnetic heading
          const rawHeading =
            headingData.trueHeading !== undefined && headingData.trueHeading >= 0
              ? headingData.trueHeading
              : headingData.magHeading;

          setAccuracy(headingData.accuracy);

          // If calibration accuracy is poor on device, prompt user
          if (headingData.accuracy !== undefined && headingData.accuracy > 25 && headingData.accuracy <= 40) {
            setShowCalibrationHint(true);
          }

          // Circular smoothing (sin / cos) to prevent 359° <-> 0° wraparound spinning
          const rad = (rawHeading * Math.PI) / 180;
          const currentSin = Math.sin(rad);
          const currentCos = Math.cos(rad);

          if (!isInitializedRef.current) {
            sinAvgRef.current = currentSin;
            cosAvgRef.current = currentCos;
            isInitializedRef.current = true;
          } else {
            // Exponential smoothing factor alpha (0.25 provides low latency and no jitter)
            const alpha = 0.25;
            sinAvgRef.current = alpha * currentSin + (1 - alpha) * sinAvgRef.current;
            cosAvgRef.current = alpha * currentCos + (1 - alpha) * cosAvgRef.current;
          }

          const smoothedRad = Math.atan2(sinAvgRef.current, cosAvgRef.current);
          const smoothedDeg = Math.round((smoothedRad * 180) / Math.PI + 360) % 360;

          setHeading(smoothedDeg);
          setSensorAvailable(true);
        });
      } catch (err) {
        console.warn('Compass sensor unavailable, falling back to static bearing:', err);
        setSensorAvailable(false);
      }
    }

    startCompass();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Needle angle relative to current phone heading
  const needleAngle = useMemo(() => {
    if (heading === null) return 0;
    return (qiblaBearing - heading + 360) % 360;
  }, [heading, qiblaBearing]);

  // Check if phone is directly aligned with Qibla (within ±4 degrees)
  const isAligned = useMemo(() => {
    if (heading === null || !sensorAvailable) return false;
    const diff = Math.abs(needleAngle > 180 ? needleAngle - 360 : needleAngle);
    return diff <= 4;
  }, [needleAngle, heading, sensorAvailable]);

  // Trigger tactile haptic pulse upon alignment
  useEffect(() => {
    if (isAligned && !hasAlignedHaptic) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      setHasAlignedHaptic(true);
    } else if (!isAligned && hasAlignedHaptic) {
      setHasAlignedHaptic(false);
    }
  }, [isAligned, hasAlignedHaptic]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'رجوع' : 'Back'}
        >
          <Text style={styles.backBtnText}>➔</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>{language === 'ar' ? 'بوصلة القبلة 🧭' : 'Qibla Compass 🧭'}</Text>
        <TouchableOpacity
          onPress={() => setShowCalibrationHint(true)}
          style={styles.helpBtn}
          accessibilityRole="button"
          accessibilityLabel="معايرة البوصلة"
        >
          <HomeIcon name="compass" size={22} color={HomeColors.textSecondary} />
        </TouchableOpacity>
      </View>

      <CinematicJourneyPanel titleAr="إلى بيت الله الحرام" titleEn="Towards the Sacred House" subtitleAr="اتبع اتجاه القبلة مع البوصلة الحية، وتأكد من معايرة جهازك" subtitleEn="Find the Qibla with your live compass; calibrate your device for accuracy" icon="✧" compact />
      {/* City & Distance Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>{language === 'ar' ? 'موقعك الحالي' : 'Current City'}</Text>
          <Text style={styles.infoValue}>
            {language === 'ar' ? userCity.cityNameAr : userCity.cityNameEn}
          </Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>{language === 'ar' ? 'زاوية القبلة' : 'Qibla Angle'}</Text>
          <Text style={[styles.infoValue, { color: HomeColors.primary }]}>{qiblaBearing}°</Text>
        </View>
        <View style={styles.infoDivider} />
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>{language === 'ar' ? 'المسافة للكعبة' : 'To Kaaba'}</Text>
          <Text style={styles.infoValue}>{distanceKm.toLocaleString()} كم</Text>
        </View>
      </View>

      {/* Alignment Status Banner */}
      <View style={[styles.statusBanner, isAligned && styles.statusBannerAligned]}>
        <Text style={[styles.statusText, isAligned && styles.statusTextAligned]}>
          {sensorAvailable
            ? isAligned
              ? '✨ أنت الآن تواجه اتجاه القبلة الشريفة مباشرة'
              : `حرّك هاتفك حتى يتطابق السهم الذهبي للأعلى (${needleAngle > 180 ? 360 - needleAngle : needleAngle}° للقبلة)`
            : '📍 بوصلة ثابتة: اتجه بزاوية القبلة الموضحة بالنسبة للشمال'}
        </Text>
      </View>

      {/* Main Compass Graphic Dial */}
      <View style={styles.compassWrapper}>
        <Svg width="290" height="290" viewBox="0 0 290 290">
          {/* Compass outer dial ring */}
          <Circle
            cx="145"
            cy="145"
            r="138"
            stroke={HomeColors.border}
            strokeWidth="3"
            fill={HomeColors.surface}
          />
          <Circle
            cx="145"
            cy="145"
            r="126"
            stroke={HomeColors.trackSoft}
            strokeWidth="1.5"
            fill="none"
          />

          {/* Compass Cardinal Marks rotated with heading */}
          <G rotation={sensorAvailable && heading !== null ? -heading : 0} origin="145, 145">
            {/* North Tick & Label */}
            <Line x1="145" y1="12" x2="145" y2="28" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
            {/* South Tick */}
            <Line x1="145" y1="262" x2="145" y2="278" stroke={HomeColors.textSecondary} strokeWidth="2" strokeLinecap="round" />
            {/* East Tick */}
            <Line x1="262" y1="145" x2="278" y2="145" stroke={HomeColors.textSecondary} strokeWidth="2" strokeLinecap="round" />
            {/* West Tick */}
            <Line x1="12" y1="145" x2="28" y2="145" stroke={HomeColors.textSecondary} strokeWidth="2" strokeLinecap="round" />
          </G>

          {/* Rotating Qibla Needle (points to Kaaba) */}
          <G
            rotation={sensorAvailable && heading !== null ? needleAngle : qiblaBearing}
            origin="145, 145"
          >
            {/* Kaaba Golden Arrow Head */}
            <Path
              d="M145 28 L157 78 L145 68 L133 78 Z"
              fill={isAligned ? HomeColors.goldDeep : HomeColors.gold}
              stroke={HomeColors.goldText}
              strokeWidth="1.5"
            />
            {/* Needle Shaft */}
            <Line
              x1="145"
              y1="68"
              x2="145"
              y2="225"
              stroke={isAligned ? HomeColors.goldDeep : HomeColors.primary}
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Opposite Tail */}
            <Path
              d="M145 235 L153 215 L137 215 Z"
              fill={HomeColors.textSecondary}
              opacity={0.6}
            />
            {/* Kaaba icon marker at top of needle */}
            <Circle cx="145" cy="28" r="7" fill={HomeColors.primary} />
          </G>

          {/* Center Pin */}
          <Circle cx="145" cy="145" r="10" fill={HomeColors.surface} stroke={HomeColors.primary} strokeWidth="3" />
          <Circle cx="145" cy="145" r="4" fill={HomeColors.gold} />
        </Svg>
      </View>

      {/* Degrees & Direction Readout */}
      <View style={styles.degreesBox}>
        <Text style={styles.degreesText}>
          {sensorAvailable && heading !== null ? `${heading}°` : `${qiblaBearing}°`}
        </Text>
        <Text style={styles.degreesSubtext}>
          {sensorAvailable && heading !== null
            ? language === 'ar' ? 'الاتجاه الحالي لهاتفك' : 'Current Phone Heading'
            : language === 'ar' ? 'زاوية القبلة الثابتة من الشمال' : 'Static Qibla Bearing'}
        </Text>
      </View>

      {/* Calibration Modal */}
      <Modal
        visible={showCalibrationHint}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalibrationHint(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>معايرة البوصلة 🧭</Text>
            <Text style={styles.modalBody}>
              للحصول على أعلى دقة، أمسك الهاتف في وضع أفقي وحركه في الهواء بحركة ترسم الرقم (8) بالإنجليزية عدة مرات.
            </Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setShowCalibrationHint(false)}
              accessibilityRole="button"
              accessibilityLabel="تم، فهمت ذلك"
            >
              <Text style={styles.modalBtnText}>تم، فهمت ذلك</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: HomeColors.pageBg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: HomeSpacing.screenHorizontal,
    paddingVertical: 12,
  },
  backBtn: {
    minWidth: HomeSpacing.minTouchTarget,
    minHeight: HomeSpacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 22,
    color: HomeColors.primary,
  },
  screenTitle: {
    fontSize: HomeTypography.fontSize.greeting,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.text,
  },
  helpBtn: {
    minWidth: HomeSpacing.minTouchTarget,
    minHeight: HomeSpacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: HomeSpacing.screenHorizontal,
    backgroundColor: HomeColors.surface,
    borderRadius: HomeRadii.card,
    borderWidth: 1,
    borderColor: HomeColors.border,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  infoDivider: {
    width: 1,
    height: 32,
    backgroundColor: HomeColors.border,
  },
  infoLabel: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
  },
  infoValue: {
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.bold,
    color: HomeColors.text,
  },
  statusBanner: {
    marginHorizontal: HomeSpacing.screenHorizontal,
    backgroundColor: HomeColors.surface,
    borderRadius: HomeRadii.button,
    borderWidth: 1,
    borderColor: HomeColors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBannerAligned: {
    backgroundColor: HomeColors.primarySoft,
    borderColor: HomeColors.primary,
  },
  statusText: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.textSecondary,
    textAlign: 'center',
  },
  statusTextAligned: {
    color: HomeColors.primary,
    fontFamily: HomeTypography.fontFamily.semiBold,
  },
  compassWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  degreesBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 4,
  },
  degreesText: {
    fontSize: 34,
    fontFamily: HomeTypography.fontFamily.bold,
    color: HomeColors.primary,
    letterSpacing: 1,
  },
  degreesSubtext: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: HomeColors.surface,
    borderRadius: HomeRadii.card,
    padding: 24,
    gap: 16,
    alignItems: 'center',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: HomeTypography.fontSize.sectionTitle,
    fontFamily: HomeTypography.fontFamily.bold,
    color: HomeColors.text,
  },
  modalBody: {
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalBtn: {
    backgroundColor: HomeColors.primary,
    borderRadius: HomeRadii.button,
    paddingVertical: 12,
    paddingHorizontal: 28,
    minHeight: HomeSpacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#FFFFFF',
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.semiBold,
  },
});
