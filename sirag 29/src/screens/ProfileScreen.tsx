import CinematicSectionHeader from '../components/CinematicSectionHeader';
import CinematicPortal from '../components/CinematicPortal';
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import GuestPersonalizationCard from '../components/profile/GuestPersonalizationCard';
import { LoadingState, ErrorState } from '../components/StateView';
import { useProfile } from '../hooks/useProfile';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { CategoryGrid } from '../components/profile/CategoryGrid';
import { AchievementsTab } from '../components/profile/AchievementsTab';
import { SavedRecordsTab } from '../components/profile/SavedRecordsTab';
import { SettingsTab } from '../components/profile/SettingsTab';
import { ArtifactVideoModal } from '../components/profile/ArtifactVideoModal';
import { getProfileStyles } from '../components/profile/ProfileStyles';

export default function ProfileScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = useMemo(() => getProfileStyles(colors), [colors]);

  const [selectedCategoryPage, setSelectedCategoryPage] = useState<
    'achievements' | 'saved_records' | 'settings' | null
  >(null);

  const {
    user,
    profile,
    loading,
    error,
    unlockedBadgeIds,
    savedRecitations,
    prayers,
    deeds,
    pledged,
    weeklyHistory,
    weeklyAnalytics,
    selectedArtifact,
    setSelectedArtifact,
    currentScore,
    levelName,
    formattedDate,
    loadProfile,
    handleTogglePrayer,
    handleToggleDeed,
    handleTogglePledge,
    handleDeleteSaved,
    handleEquipTitle,
    handlePickAvatar,
    handleSelectCountry,
    handleLogout,
  } = useProfile(navigation);

  const handleSelectCategory = (id: string) => {
    if (id === 'logout') {
      handleLogout();
      return;
    }
    setSelectedCategoryPage(id as any);
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{ marginHorizontal: 16, marginTop: 12 }}><CinematicPortal scene="night" compact title={language === 'ar' ? 'ملف البطل' : 'Your Hero Profile'} subtitle={language === 'ar' ? 'هنا تتجمع إنجازاتك ورحلاتك' : 'Your learning journeys and achievements in one place'} eyebrow={language === 'ar' ? 'بطل مسلم' : 'BATL MUSLIM'} /></View>
        {loading ? (
          <LoadingState message={language === 'ar' ? 'جارٍ تحميل الملف الشخصي...' : 'Loading profile...'} />
        ) : error ? (
          <ErrorState message={error} onRetry={loadProfile} />
        ) : (
          <View style={styles.contentWrapper}>
            {/* User Profile Banner Header */}
            <ProfileHeader
              user={user}
              profile={profile}
              levelName={levelName}
              styles={styles}
              onPickAvatar={handlePickAvatar}
            />

            <GuestPersonalizationCard />

            {/* 4 Category Cards Grid */}
            <CategoryGrid styles={styles} onSelectCategory={handleSelectCategory} />
          </View>
        )}


      </ScrollView>

      {/* DEDICATED FULL-PAGE MODAL FOR CATEGORIES */}
      {selectedCategoryPage && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={!!selectedCategoryPage}
          onRequestClose={() => setSelectedCategoryPage(null)}
        >
          <View style={[styles.outerContainer, { backgroundColor: colors.background, paddingTop: 40 }]}>
            {/* Sub-page Header with Icon-only Back Arrow ➔ */}
            <View style={[styles.subPageHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={styles.backIconBtn}
                onPress={() => setSelectedCategoryPage(null)}
                accessibilityRole="button"
                accessibilityLabel={language === 'ar' ? 'رجوع' : 'Back'}
                accessibilityHint={language === 'ar' ? 'العودة إلى الصفحة الشخصية الرئيسية' : 'Return to main profile view'}
              >
                <Text style={[styles.backIconText, { color: colors.primaryDeep }]}>➔</Text>
              </TouchableOpacity>
              <Text style={[styles.subPageHeaderTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
                {selectedCategoryPage === 'achievements' && (language === 'ar' ? '🏆 الإنجازات والألقاب' : '🏆 Achievements & Titles')}
                {selectedCategoryPage === 'saved_records' && (language === 'ar' ? '💾 المحفوظات والسجل' : '💾 Saved Records & Journal')}
                {selectedCategoryPage === 'settings' && (language === 'ar' ? '⚙️ إعدادات الحساب' : '⚙️ Account Settings')}
              </Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {selectedCategoryPage === 'achievements' && (
                <AchievementsTab
                  currentScore={currentScore}
                  unlockedBadgeIds={unlockedBadgeIds}
                  profile={profile}
                  styles={styles}
                  onEquipTitle={handleEquipTitle}
                  onSelectArtifact={setSelectedArtifact}
                />
              )}

              {selectedCategoryPage === 'saved_records' && (
                <SavedRecordsTab
                  savedRecitations={savedRecitations}
                  prayers={prayers}
                  deeds={deeds}
                  pledged={pledged}
                  weeklyHistory={weeklyHistory}
                  weeklyAnalytics={weeklyAnalytics}
                  styles={styles}
                  onDeleteSaved={handleDeleteSaved}
                  onTogglePrayer={handleTogglePrayer}
                  onToggleDeed={handleToggleDeed}
                  onTogglePledge={handleTogglePledge}
                />
              )}

              {selectedCategoryPage === 'settings' && (
                <SettingsTab
                  user={user}
                  profile={profile}
                  levelName={levelName}
                  currentScore={currentScore}
                  formattedDate={formattedDate}
                  styles={styles}
                  onSelectCountry={handleSelectCountry}
                  onLogout={handleLogout}
                />
              )}
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* INTERACTIVE MULTIMEDIA CARD OVERLAY MODAL */}
      <ArtifactVideoModal
        artifact={selectedArtifact}
        styles={styles}
        onClose={() => setSelectedArtifact(null)}
      />
    </View>
  );
}
