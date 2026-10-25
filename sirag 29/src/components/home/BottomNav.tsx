import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeColors, HomeRadii, HomeTypography } from '../../theme/tokens';
import { HomeIcon } from './HomeIcons';
import { useLanguage } from '../../contexts/LanguageContext';

export type TabKey = 'Home' | 'Learning' | 'ArenaHub' | 'CommunityFeed' | 'Profile';

export interface BottomNavProps {
  activeTab?: TabKey;
  onTabPress?: (tab: TabKey) => void;
  state?: any;
  descriptors?: any;
  navigation?: any;
}

interface NavItemDef {
  key: TabKey;
  titleAr: string;
  titleEn: string;
  iconName: 'home' | 'book-open' | 'trophy' | 'users' | 'user';
  isCenter?: boolean;
}

const NAV_ITEMS: NavItemDef[] = [
  { key: 'Home', titleAr: 'الرئيسية', titleEn: 'Home', iconName: 'home' },
  { key: 'Learning', titleAr: 'التعلم', titleEn: 'Learn', iconName: 'book-open' },
  { key: 'ArenaHub', titleAr: 'الميدان', titleEn: 'Arena', iconName: 'trophy', isCenter: true },
  { key: 'CommunityFeed', titleAr: 'المجتمع', titleEn: 'Community', iconName: 'users' },
  { key: 'Profile', titleAr: 'حسابي', titleEn: 'Profile', iconName: 'user' },
];

export function BottomNav({
  activeTab = 'Home',
  onTabPress,
  state,
  navigation,
}: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const currentRouteName = state ? state.routes[state.index]?.name : activeTab;

  const handlePress = (key: TabKey) => {
    if (navigation) {
      const isFocused = currentRouteName === key;
      const route = state?.routes?.find((r: any) => r.name === key);
      const event = navigation.emit
        ? navigation.emit({
            type: 'tabPress',
            target: route?.key || key,
            canPreventDefault: true,
          })
        : { defaultPrevented: false };

      if (!isFocused && !event?.defaultPrevented) {
        navigation.navigate(key);
      }
    } else if (onTabPress) {
      onTabPress(key);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          height: 76 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
      accessibilityRole="tablist"
    >
      <View style={styles.row}>
        {NAV_ITEMS.map((item) => {
          const isActive = currentRouteName === item.key;
          const activeColor = '#F5CE7A';
          const inactiveColor = '#9FC3B4';
          const color = isActive ? activeColor : inactiveColor;

          if (item.isCenter) {
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.centerItemContainer}
                activeOpacity={0.85}
                onPress={() => handlePress(item.key)}
                accessibilityRole="button"
                accessibilityLabel={language === 'ar' ? item.titleAr : item.titleEn}
                accessibilityState={{ selected: isActive }}
              >
                <View style={styles.centerCircle}>
                  <HomeIcon name="trophy" size={26} color={HomeColors.gold} strokeWidth={1.8} />
                </View>
                <Text
                  style={[
                    styles.centerLabel,
                    {
                      color: isActive ? '#F5CE7A' : '#9FC3B4',
                      fontWeight: isActive ? '600' : '400',
                    },
                  ]}
                >
                  {language === 'ar' ? item.titleAr : item.titleEn}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tabItem}
              activeOpacity={0.7}
              onPress={() => handlePress(item.key)}
              accessibilityRole="button"
              accessibilityLabel={language === 'ar' ? item.titleAr : item.titleEn}
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.iconBox}>
                <HomeIcon name={item.iconName} size={24} color={color} strokeWidth={1.8} />
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {language === 'ar' ? item.titleAr : item.titleEn}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#062B26',
    borderTopWidth: 1,
    borderTopColor: '#2A5B4B',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabItem: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  iconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.regular,
  },
  centerItemContainer: {
    minWidth: 56,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -30,
  },
  centerCircle: {
    width: 58,
    height: 58,
    borderRadius: HomeRadii.full,
    backgroundColor: '#0E493E',
    borderWidth: 4,
    borderColor: '#062B26',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.regular,
    marginTop: 2,
  },
});
