import { Platform } from 'react-native';
import { TestIds } from './adsService';

/**
 * AdMob Configuration
 * 
 * TODO: Before Production Release:
 * 1. Confirm whether real AdMob ads should be enabled.
 * 2. If yes, install `react-native-google-mobile-ads` and configure app.json with App IDs.
 * 3. Replace/verify these Ad Unit IDs with official Google AdMob IDs registered for Batl Muslim.
 */

const REAL_BANNER_ID = Platform.select({
  android: 'ca-app-pub-6157287197742359/6118582133',
  ios: 'ca-app-pub-6157287197742359/9595808042',
  default: TestIds.BANNER,
});

const REAL_INTERSTITIAL_ID = Platform.select({
  android: 'ca-app-pub-6157287197742359/4823893320',
  ios: 'ca-app-pub-6157287197742359/6681834700',
  default: TestIds.INTERSTITIAL,
});

export const AdMobConfig = {
  // Uses Test Ads during local development (__DEV__ is true)
  // Uses your Real Ads when compiled in production/preview builds
  bannerAdUnitID: __DEV__ ? TestIds.BANNER : REAL_BANNER_ID,
  interstitialAdUnitID: __DEV__ ? TestIds.INTERSTITIAL : REAL_INTERSTITIAL_ID,
  rewardedAdUnitID: TestIds.REWARDED,
};

export const isTestDevice = __DEV__;
