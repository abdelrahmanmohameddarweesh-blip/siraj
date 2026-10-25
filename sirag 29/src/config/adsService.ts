import { useState, useEffect } from 'react';

let BannerAd: any = null;
let BannerAdSize: any = null;
let useInterstitialAd: any = null;
let useRewardedAd: any = null;
let TestIds: any = { BANNER: 'test_banner', INTERSTITIAL: 'test_interstitial', REWARDED: 'test_rewarded' };
let hasAdMob = false;

try {
  // Try to load the native module
  const Ads = require('react-native-google-mobile-ads');
  BannerAd = Ads.BannerAd;
  BannerAdSize = Ads.BannerAdSize;
  useInterstitialAd = Ads.useInterstitialAd;
  useRewardedAd = Ads.useRewardedAd;
  TestIds = Ads.TestIds;
  hasAdMob = true;
} catch {
  // react-native-google-mobile-ads native module not found; safe mock fallbacks are used.
  hasAdMob = false;
}

// Custom mock hook for useInterstitialAd when running inside Expo Go
const useMockInterstitialAd = (unitId: string, options?: any) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const load = () => {
    setIsClosed(false);
    setIsLoaded(false);
    setTimeout(() => {
      setIsLoaded(true);
    }, 1000);
  };

  const show = () => {
    console.log('[AdMob Mock] Showing Interstitial Ad...');
    setIsClosed(true);
  };

  return {
    isLoaded,
    isClosed,
    load,
    show,
  };
};

// Custom mock hook for useRewardedAd when running inside Expo Go
const useMockRewardedAd = (unitId: string, options?: any) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isEarnedReward, setIsEarnedReward] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const load = () => {
    setIsClosed(false);
    setIsLoaded(false);
    setIsEarnedReward(false);
    setTimeout(() => {
      setIsLoaded(true);
    }, 1000);
  };

  const show = () => {
    console.log('[AdMob Mock] Showing Rewarded Ad...');
    setIsEarnedReward(true);
    setIsClosed(true);
  };

  return {
    isLoaded,
    isClosed,
    load,
    show,
    isEarnedReward,
  };
};

const safeUseInterstitialAd = hasAdMob && useInterstitialAd ? useInterstitialAd : useMockInterstitialAd;
const safeUseRewardedAd = hasAdMob && useRewardedAd ? useRewardedAd : useMockRewardedAd;

export {
  BannerAd,
  BannerAdSize,
  safeUseInterstitialAd as useInterstitialAd,
  safeUseRewardedAd as useRewardedAd,
  TestIds,
  hasAdMob,
};
