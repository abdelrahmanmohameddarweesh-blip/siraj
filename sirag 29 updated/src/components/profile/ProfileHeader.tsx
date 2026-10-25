import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { QURANIC_TITLES } from './profileConstants';

interface ProfileHeaderProps {
  user: any;
  profile: any;
  levelName: string;
  styles: any;
  onPickAvatar: () => void;
}

export function ProfileHeader({ user, profile, levelName, styles, onPickAvatar }: ProfileHeaderProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  const activeTitleObj = profile?.activeTitle
    ? QURANIC_TITLES.find(t => t.id === profile.activeTitle)
    : null;

  return (
    <View style={[styles.profileHeaderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.avatarContainer, { backgroundColor: colors.primaryTint, borderColor: colors.primary, overflow: 'hidden' }]}
        onPress={onPickAvatar}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={language === 'ar' ? 'تعديل الصورة الشخصية' : 'Change profile photo'}
        accessibilityHint={language === 'ar' ? 'افتح معرض الصور لاختيار صورة شخصية جديدة' : 'Opens gallery to choose a new profile photo'}
      >
        {user?.photoUri ? (
          <Image source={{ uri: user.photoUri }} style={{ width: 80, height: 80, borderRadius: 40 }} />
        ) : (
          <Text style={[styles.avatarText, { color: colors.primaryDeep }]}>
            {user?.displayName ? user.displayName[0].toUpperCase() : '👤'}
          </Text>
        )}
        <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 2, alignItems: 'center' }}>
          <Text style={{ color: colors.white, fontSize: 9, fontWeight: '700' }}>{language === 'ar' ? 'تعديل' : 'Edit'}</Text>
        </View>
      </TouchableOpacity>
      <Text style={[styles.profileName, { color: colors.textPrimary }]}>
        {user?.displayName || (language === 'ar' ? 'ضيف' : 'Guest')}
      </Text>
      {activeTitleObj ? (
        <Text style={[styles.activeTitleTextSub, { color: colors.primary, fontFamily: 'IBMPlexSansArabic-Bold', marginBottom: 6 }]}>
          ⚔️ {language === 'ar' ? activeTitleObj.titleAr : activeTitleObj.titleEn}
        </Text>
      ) : null}
      <View style={[styles.levelBadge, { backgroundColor: colors.accentTint, borderColor: colors.accentTintBorder }]}>
        <Text style={[styles.levelBadgeText, { color: colors.accentOnTint }]}>🏆 {levelName}</Text>
      </View>
    </View>
  );
}
