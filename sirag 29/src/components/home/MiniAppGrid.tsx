import React from 'react';
import { View, StyleSheet, Alert, Platform, ToastAndroid } from 'react-native';
import { MINI_APPS_REGISTRY, MiniAppItem } from '../../apps/registry';
import { MiniAppTile } from './MiniAppTile';

interface MiniAppGridProps {
  onNavigate: (route: string) => void;
  language: 'ar' | 'en';
}

export function MiniAppGrid({ onNavigate, language }: MiniAppGridProps) {
  const handleTilePress = (item: MiniAppItem) => {
    if (item.enabled) {
      onNavigate(item.route);
    } else {
      const msg = language === 'ar'
        ? (item.comingSoonMessageAr || `ميزة ${item.titleAr} قادمة قريباً بإذن الله.`)
        : (item.comingSoonMessageEn || `${item.titleEn} is coming soon in sha Allah.`);

      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      } else {
        Alert.alert(
          language === 'ar' ? 'قريبًا ✨' : 'Coming Soon ✨',
          msg,
          [{ text: language === 'ar' ? 'حسناً' : 'OK' }]
        );
      }
    }
  };

  return (
    <View style={styles.gridContainer}>
      {MINI_APPS_REGISTRY.map((item) => (
        <MiniAppTile
          key={item.id}
          item={item}
          onPress={handleTilePress}
          language={language}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 14,
    justifyContent: 'flex-start',
    paddingVertical: 2,
  },
});
