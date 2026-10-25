import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, hasAdMob } from '../config/adsService';
import { AdMobConfig } from '../config/ads';

/**
 * AdBanner Component
 * 
 * Current State:
 * react-native-google-mobile-ads is not installed. Ads fail safe by rendering nothing (null)
 * with zero layout jump.
 * 
 * TODO: Re-enabling real Google AdMob before store release:
 * 1. Request client approval to install `react-native-google-mobile-ads`.
 * 2. Add plugin configuration to app.json with valid AdMob App IDs:
 *    [
 *      "react-native-google-mobile-ads",
 *      {
 *        "androidAppId": "ca-app-pub-6157287197742359~XXXXXXXXXX",
 *        "iosAppId": "ca-app-pub-6157287197742359~XXXXXXXXXX"
 *      }
 *    ]
 * 3. Generate native build using `npx expo run:android` / `npx expo run:ios` or EAS Build.
 * 4. Verify banner unit IDs in src/config/ads.ts.
 */
export default function AdBanner() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // When real ads or native module are unavailable or error occurs, fail safe (render nothing, 0 height)
  if (!hasAdMob || !BannerAd || !BannerAdSize || !AdMobConfig.bannerAdUnitID || hasError) {
    return null;
  }

  return (
    <View style={[styles.container, !isLoaded && styles.hiddenContainer]}>
      <BannerAd
        unitId={AdMobConfig.bannerAdUnitID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => {
          setIsLoaded(true);
        }}
        onAdFailedToLoad={(error: any) => {
          console.warn('[AdBanner] Ad failed to load:', error);
          setHasError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  hiddenContainer: {
    height: 0,
    marginVertical: 0,
    overflow: 'hidden',
  },
});
