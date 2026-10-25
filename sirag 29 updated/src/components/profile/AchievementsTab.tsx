import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { badgesCatalog } from '../../data/badges';
import { QURANIC_TITLES, HISTORICAL_ARTIFACTS, HistoricalArtifact } from './profileConstants';

interface AchievementsTabProps {
  currentScore: number;
  unlockedBadgeIds: string[];
  profile: any;
  styles: any;
  onEquipTitle: (titleId: string) => void;
  onSelectArtifact: (artifact: HistoricalArtifact) => void;
}

export function AchievementsTab({
  currentScore,
  unlockedBadgeIds,
  profile,
  styles,
  onEquipTitle,
  onSelectArtifact,
}: AchievementsTabProps) {
  const { colors } = useTheme();
  const { language, t } = useLanguage();

  return (
    <View>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statVal, { color: colors.primaryDeep }]}>{currentScore}</Text>
          <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{language === 'ar' ? 'مجموع النقاط' : 'Total Score'}</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.statVal, { color: colors.primaryDeep }]}>
            {unlockedBadgeIds.length} / {badgesCatalog.length}
          </Text>
          <Text style={[styles.statLbl, { color: colors.textSecondary }]}>{language === 'ar' ? 'الأوسمة المفتوحة' : 'Unlocked Badges'}</Text>
        </View>
      </View>

      {/* Quranic Titles Section */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {language === 'ar' ? '👑 الألقاب القرآنية المكتسبة' : '👑 Earned Quranic Titles'}
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        {language === 'ar'
          ? 'حقق مستهدفات الاختبارات لفتح الألقاب الشريفة وتجهيزها في حسابك'
          : 'Complete quiz milestones to unlock and equip noble titles'}
      </Text>

      <View style={styles.titlesContainer}>
        {QURANIC_TITLES.map(title => {
          const isUnlocked = profile?.unlockedTitles?.includes(title.id);
          const isActive = profile?.activeTitle === title.id;

          const currentValue =
            title.targetTest === 'mutashabihat'
              ? (profile?.mutashabihatCorrectCount ?? 0)
              : title.targetTest === 'quran'
              ? (profile?.quranCorrectCount ?? 0)
              : title.targetTest === 'trivia'
              ? (profile?.triviaCorrectCount ?? 0)
              : (profile?.mutashabihatCorrectCount ?? 0) +
                (profile?.quranCorrectCount ?? 0) +
                (profile?.triviaCorrectCount ?? 0);

          const progress = Math.min(1, currentValue / title.targetValue);

          return (
            <View
              key={title.id}
              style={[
                styles.titleCard,
                { backgroundColor: colors.surface, borderColor: isActive ? colors.primary : colors.border },
              ]}
            >
              <View style={styles.titleCardHeader}>
                <View style={[styles.titleEmojiBg, { backgroundColor: colors.border }]}>
                  <Text style={{ fontSize: 24 }}>{title.emoji}</Text>
                </View>

                <View style={styles.titleMeta}>
                  <Text style={[styles.titleName, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                    {language === 'ar' ? title.titleAr : title.titleEn}
                  </Text>
                  <Text style={[styles.titleDesc, { color: colors.textSecondary }]}>
                    {language === 'ar' ? title.descAr : title.descEn}
                  </Text>
                </View>
              </View>

              {!isUnlocked ? (
                <View style={styles.titleProgressContainer}>
                  <View style={styles.titleProgressLabels}>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                      {language === 'ar' ? `المستهدف: ${title.targetValue} إجابة` : `Target: ${title.targetValue} answers`}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.textPrimary, fontWeight: '700' }}>
                      {currentValue} / {title.targetValue}
                    </Text>
                  </View>
                  <View style={[styles.titleProgressBarBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.titleProgressBarFill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} />
                  </View>
                </View>
              ) : (
                <View style={styles.titleActionRow}>
                  {isActive ? (
                    <View style={[styles.activeTitleBadge, { backgroundColor: colors.primaryLight }]}>
                      <Text style={[styles.activeTitleText, { color: colors.primary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                        {language === 'ar' ? '✓ مجهز حالياً' : '✓ Active'}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.equipBtn, { backgroundColor: colors.primary }]}
                      onPress={() => onEquipTitle(title.id)}
                    >
                      <Text style={styles.equipBtnText}>{language === 'ar' ? 'تجهيز اللقب' : 'Equip Title'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Cabinet of Badges */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 12 }]}>{t('badgesTitle')}</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t('badgesDesc')}</Text>

      <View style={styles.badgesCabinet}>
        {badgesCatalog.map(badge => {
          const isUnlocked = unlockedBadgeIds.includes(badge.id);
          return (
            <View
              key={badge.id}
              style={[
                styles.badgeCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isUnlocked && { borderColor: badge.color, backgroundColor: `${badge.color}15` },
              ]}
            >
              <View style={[styles.badgeEmojiWrapper, !isUnlocked && styles.badgeEmojiWrapperLocked]}>
                <Text style={[styles.badgeEmoji, !isUnlocked && styles.badgeEmojiLocked]}>{badge.emoji}</Text>
              </View>
              <Text style={[styles.badgeTitle, { color: colors.textPrimary }, !isUnlocked && styles.badgeTitleLocked]}>
                {language === 'ar' ? badge.titleAr : badge.titleEn}
              </Text>
              <Text style={[styles.badgeDesc, { color: colors.textSecondary }, !isUnlocked && styles.badgeDescLocked]}>
                {language === 'ar' ? badge.descAr : badge.descEn}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Historical Collection Vault */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 12 }]}>
        {language === 'ar' ? '🏛️ محراب المقتنيات التاريخية' : '🏛️ Historical Artifacts Vault'}
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        {language === 'ar'
          ? 'استكشف المقتنيات الإسلامية التي قمت بفتحها من متجر السراج وشاهد قصصها'
          : 'Explore and watch the stories of Islamic artifacts you unlocked from the shop'}
      </Text>

      <View style={styles.vaultGrid}>
        {HISTORICAL_ARTIFACTS.map(art => {
          const isUnlocked = profile?.unlockedItems?.includes(art.id);
          return (
            <TouchableOpacity
              key={art.id}
              style={[
                styles.vaultCard,
                { backgroundColor: colors.surface, borderColor: isUnlocked ? colors.medalGold : colors.border },
              ]}
              onPress={() => isUnlocked && onSelectArtifact(art)}
              disabled={!isUnlocked}
              activeOpacity={0.8}
            >
              <View style={[styles.vaultIconWrapper, !isUnlocked && { opacity: 0.25 }]}>
                <Text style={{ fontSize: 28 }}>{art.badge}</Text>
              </View>
              <Text style={[styles.vaultTextName, { color: isUnlocked ? colors.textPrimary : colors.textSecondary }]}>
                {language === 'ar' ? art.titleAr.replace(' الشريف', '').replace(' الشريفة', '') : art.titleEn}
              </Text>
              {!isUnlocked && (
                <View style={styles.lockedOverlay}>
                  <Text style={{ fontSize: 11, color: colors.textSecondary }}>🔒 مغلق</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
