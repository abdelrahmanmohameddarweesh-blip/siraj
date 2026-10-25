import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { prayersCatalog, deedsCatalog } from './profileConstants';

interface SavedRecordsTabProps {
  savedRecitations: any[];
  prayers: { [key: string]: 'congregation' | 'individual' | 'missed' | null };
  deeds: { [key: string]: boolean };
  pledged: boolean;
  weeklyHistory: any[];
  weeklyAnalytics: any;
  styles: any;
  onDeleteSaved: (id: string) => void;
  onTogglePrayer: (prayerKey: string, status: 'congregation' | 'individual' | 'missed') => void;
  onToggleDeed: (deedKey: string) => void;
  onTogglePledge: () => void;
}

export function SavedRecordsTab({
  savedRecitations,
  prayers,
  deeds,
  pledged,
  weeklyHistory,
  weeklyAnalytics,
  styles,
  onDeleteSaved,
  onTogglePrayer,
  onToggleDeed,
  onTogglePledge,
}: SavedRecordsTabProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  return (
    <View>
      {/* Saved Recitations Portfolio */}
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {language === 'ar' ? '💾 تلاواتي المحفوظة' : '💾 My Saved Recitations'}
      </Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
        {language === 'ar'
          ? `سعة تخزين التلاوات: ${savedRecitations.length} / ٣ مساحات مجانية مستخدمة`
          : `Storage limit: ${savedRecitations.length} / 3 free slots used`}
      </Text>

      <View style={styles.portfolioContainer}>
        {savedRecitations.length === 0 ? (
          <View style={[styles.portfolioEmptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.portfolioEmptyText, { color: colors.textSecondary }]}>
              {language === 'ar'
                ? 'لا توجد تلاوات محفوظة حتى الآن. سجل تلاوتك لحفظها هنا!'
                : 'No saved recitations found. Record recitations to save them here!'}
            </Text>
          </View>
        ) : (
          <View style={styles.portfolioGrid}>
            {savedRecitations.map((item: any) => (
              <View key={item.id} style={[styles.portfolioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.portfolioHeader}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => onDeleteSaved(item.id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={language === 'ar' ? 'حذف التلاوة' : 'Delete Recitation'}
                  >
                    <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth="2.2">
                      <Path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </Svg>
                  </TouchableOpacity>
                  <Text style={[styles.portfolioCardTitle, { color: colors.textPrimary }]}>{item.surahName}</Text>
                </View>
                <Text style={[styles.portfolioCardMeta, { color: colors.textSecondary }]}>
                  {language === 'ar' ? `آية: ${item.ayahNumber}` : `Ayah: ${item.ayahNumber}`} |{' '}
                  {item.style === 'mujawwad' ? (language === 'ar' ? 'مجوّد' : 'Mujawwad') : language === 'ar' ? 'مرتل' : 'Murattal'}
                </Text>
                <Text style={[styles.portfolioCardQari, { color: colors.textSecondary }]}>👤 {item.readerName}</Text>
                <View style={[styles.portfolioScoreBadge, { backgroundColor: colors.neutralTint }]}>
                  <Text style={[styles.portfolioScoreText, { color: colors.primaryDeep }]}>🎯 {item.matchPercentage}% match</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Daily Accountability Journal */}
      <View style={styles.logHeader}>
        <Text style={[styles.logTitle, { color: colors.textPrimary }]}>
          {language === 'ar' ? 'سجل المحاسبة اليومية' : 'Daily Accountability Journal'}
        </Text>
        <Text style={[styles.logSubtitle, { color: colors.textSecondary }]}>
          {language === 'ar'
            ? 'حاسبوا أنفسكم قبل أن تُحاسبوا، وزِنوا أعمالكم قبل أن تُوزن عليكم.'
            : 'Hold yourself accountable daily for continuous personal growth.'}
        </Text>
      </View>

      {/* PRAYERS LOG CARD */}
      <View style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.logCardTitle, { color: colors.textPrimary }]}>
          {language === 'ar' ? '🕌 سجل الصلوات المفروضة' : '🕌 Daily Prayers Log'}
        </Text>
        <Text style={[styles.logCardSubtitle, { color: colors.textSecondary }]}>
          {language === 'ar' ? 'أدّيت الصلوات بأي صفة اليوم؟' : 'How did you offer your prayers today?'}
        </Text>

        <View style={styles.prayersList}>
          {prayersCatalog.map(p => {
            const currentStatus = prayers[p.key];
            return (
              <View key={p.key} style={[styles.prayerRow, { borderBottomColor: colors.neutralTint }]}>
                <Text style={[styles.prayerNameText, { color: colors.textPrimary }]}>
                  {language === 'ar' ? p.labelAr : p.labelEn}
                </Text>

                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={[
                      styles.optionBtn,
                      { backgroundColor: colors.neutralTint, borderColor: colors.border },
                      currentStatus === 'congregation' && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => onTogglePrayer(p.key, 'congregation')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionBtnText,
                        currentStatus === 'congregation' ? { color: colors.white } : { color: colors.textPrimary },
                      ]}
                    >
                      {language === 'ar' ? 'جماعة' : 'Congr.'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionBtn,
                      { backgroundColor: colors.neutralTint, borderColor: colors.border },
                      currentStatus === 'individual' && { backgroundColor: colors.medalGold, borderColor: colors.medalGold },
                    ]}
                    onPress={() => onTogglePrayer(p.key, 'individual')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionBtnText,
                        currentStatus === 'individual' ? { color: colors.white } : { color: colors.textPrimary },
                      ]}
                    >
                      {language === 'ar' ? 'منفرداً' : 'Indiv.'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionBtn,
                      { backgroundColor: colors.neutralTint, borderColor: colors.border },
                      currentStatus === 'missed' && { backgroundColor: colors.error, borderColor: colors.error },
                    ]}
                    onPress={() => onTogglePrayer(p.key, 'missed')}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.optionBtnText,
                        currentStatus === 'missed' ? { color: colors.white } : { color: colors.textPrimary },
                      ]}
                    >
                      {language === 'ar' ? 'فاتتني' : 'Missed'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* DEEDS LOG CARD */}
      <View style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.logCardTitle, { color: colors.textPrimary }]}>
          {language === 'ar' ? '📖 سجل محاسبة الطاعات' : '📖 Accountability of Deeds'}
        </Text>
        <Text style={[styles.logCardSubtitle, { color: colors.textSecondary }]}>
          {language === 'ar' ? 'طاعات وسنن يومية تعهد نفسك عليها:' : 'Daily spiritual habits to maintain:'}
        </Text>

        <View style={styles.deedsList}>
          {deedsCatalog.map(d => {
            const isChecked = !!deeds[d.key];
            return (
              <TouchableOpacity
                key={d.key}
                style={[
                  styles.deedRow,
                  { borderColor: colors.border },
                  isChecked && { borderColor: colors.primaryTintBorder, backgroundColor: colors.primaryTint },
                ]}
                onPress={() => onToggleDeed(d.key)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.deedCheckbox,
                    {
                      borderColor: isChecked ? colors.primary : colors.borderStrong,
                      backgroundColor: isChecked ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  {isChecked && (
                    <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <Path d="M20 6 9 17l-5-5" />
                    </Svg>
                  )}
                </View>
                <Text style={[styles.deedText, { color: colors.textPrimary }, isChecked && { fontWeight: '700' }]}>
                  {language === 'ar' ? d.labelAr : d.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* PLEDGE CARD */}
      <View style={[styles.pledgeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity style={styles.pledgeCheckboxRow} onPress={onTogglePledge} activeOpacity={0.85}>
          <View
            style={[
              styles.pledgeCheckbox,
              {
                borderColor: pledged ? colors.accentDeep : colors.borderStrong,
                backgroundColor: pledged ? colors.accentDeep : 'transparent',
              },
            ]}
          >
            {pledged && (
              <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 6 9 17l-5-5" />
              </Svg>
            )}
          </View>
          <View style={styles.pledgeTextCol}>
            <Text style={[styles.pledgeTitle, { color: colors.textPrimary }]}>
              {language === 'ar' ? 'ميثاق الصدق والأمانة 🤝' : 'Pledge of Honesty 🤝'}
            </Text>
            <Text style={[styles.pledgeDescText, { color: colors.textSecondary }]}>
              {language === 'ar'
                ? 'أؤكد بموجب هذا أن جميع البيانات المسجلة صحيحة وصادقة تماماً.'
                : 'I pledge before Allah that my logs are completely honest and true.'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* WEEKLY CHART & DETAILED REPORT */}
      <View style={[styles.logCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.logCardTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
          {language === 'ar' ? '📈 التقرير الأسبوعي المفصل' : '📈 Detailed Weekly Performance'}
        </Text>
        <Text style={[styles.logCardSubtitle, { color: colors.textSecondary }]}>
          {language === 'ar' ? 'إحصائيات الصلوات والعبادات خلال الـ ٧ أيام الماضية:' : 'Prayer & habit insights for the past 7 days:'}
        </Text>

        {/* Dynamic Assessment Notification Box */}
        <View style={[styles.weeklyAssessmentBox, { backgroundColor: weeklyAnalytics.alertColor }]}>
          <Text style={[styles.weeklyAssessmentText, { color: weeklyAnalytics.textThemeColor, fontFamily: 'IBMPlexSansArabic-Medium' }]}>
            {language === 'ar' ? weeklyAnalytics.assessmentAr : weeklyAnalytics.assessmentEn}
          </Text>
        </View>

        {/* Segmented Ratio Bar for Prayers */}
        <View style={styles.ratioCard}>
          <Text style={[styles.ratioTitle, { color: colors.textPrimary, fontFamily: 'IBMPlexSansArabic-Bold' }]}>
            {language === 'ar' ? '📊 توزيع أداء الصلوات' : '📊 Prayer Distribution Ratio'}
          </Text>

          {weeklyAnalytics.totalPrayersLogged > 0 ? (
            <View style={styles.segmentedBar}>
              {weeklyAnalytics.congregationCount > 0 && (
                <View style={[styles.segmentedSegment, { flex: weeklyAnalytics.congregationPct, backgroundColor: colors.primary }]} />
              )}
              {weeklyAnalytics.individualCount > 0 && (
                <View style={[styles.segmentedSegment, { flex: weeklyAnalytics.individualPct, backgroundColor: colors.medalGold }]} />
              )}
              {weeklyAnalytics.missedCount > 0 && (
                <View style={[styles.segmentedSegment, { flex: weeklyAnalytics.missedPct, backgroundColor: colors.error }]} />
              )}
            </View>
          ) : (
            <View style={[styles.segmentedBar, { backgroundColor: colors.border }]} />
          )}

          <View style={styles.ratioLabelsRow}>
            <View style={styles.ratioLabelItem}>
              <View style={[styles.ratioColorDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.ratioLabelText, { color: colors.textSecondary }]}>
                {language === 'ar' ? `جماعة: ${weeklyAnalytics.congregationCount}` : `Congr: ${weeklyAnalytics.congregationCount}`}
              </Text>
            </View>
            <View style={styles.ratioLabelItem}>
              <View style={[styles.ratioColorDot, { backgroundColor: colors.medalGold }]} />
              <Text style={[styles.ratioLabelText, { color: colors.textSecondary }]}>
                {language === 'ar' ? `منفرداً: ${weeklyAnalytics.individualCount}` : `Indiv: ${weeklyAnalytics.individualCount}`}
              </Text>
            </View>
            <View style={styles.ratioLabelItem}>
              <View style={[styles.ratioColorDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.ratioLabelText, { color: colors.textSecondary }]}>
                {language === 'ar' ? `فاتتني: ${weeklyAnalytics.missedCount}` : `Missed: ${weeklyAnalytics.missedCount}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Challenge Milestones Status */}
        <View style={styles.challengeSummaryCard}>
          <View style={[styles.challengeStatItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.challengeStatVal, { color: colors.primaryDeep }]}>
              {weeklyAnalytics.fajrOnTimeCount} / {weeklyAnalytics.totalDaysWithLogs} {language === 'ar' ? 'أيام' : 'days'}
            </Text>
            <Text style={[styles.challengeStatLabel, { color: colors.textPrimary }]}>
              🌅 {language === 'ar' ? 'تحدي الفجر (في الجماعة)' : 'Fajr Challenge (in Congregation)'}
            </Text>
          </View>

          <View style={[styles.challengeStatItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.challengeStatVal, { color: colors.primaryDeep }]}>
              {weeklyAnalytics.morningAzkarCount} / {weeklyAnalytics.totalDaysWithLogs} {language === 'ar' ? 'أيام' : 'days'}
            </Text>
            <Text style={[styles.challengeStatLabel, { color: colors.textPrimary }]}>
              📿 {language === 'ar' ? 'أذكار الصباح المسجلة' : 'Morning Azkar Recorded'}
            </Text>
          </View>

          <View style={styles.challengeStatItem}>
            <Text style={[styles.challengeStatVal, { color: colors.primaryDeep }]}>
              {weeklyAnalytics.eveningAzkarCount} / {weeklyAnalytics.totalDaysWithLogs} {language === 'ar' ? 'أيام' : 'days'}
            </Text>
            <Text style={[styles.challengeStatLabel, { color: colors.textPrimary }]}>
              🌇 {language === 'ar' ? 'أذكار المساء المسجلة' : 'Evening Azkar Recorded'}
            </Text>
          </View>
        </View>

        {/* Vertical Chart Visualization */}
        <View style={styles.weeklyChartSection}>
          <Text style={[styles.chartSectionTitle, { color: colors.textPrimary }]}>
            {language === 'ar' ? '📊 رسم بياني لإنجاز الطاعات اليومية' : '📊 Daily Completion History'}
          </Text>
          <View style={styles.chartContainer}>
            {weeklyHistory.map(day => {
              const maxHabits = 11;
              const barHeight = Math.max(8, (day.completedCount / maxHabits) * 90);
              const todayStrLocal = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
              const isCurrent = day.dateStr === todayStrLocal;

              return (
                <View key={day.dateStr} style={styles.chartColumn}>
                  <Text style={[styles.chartBarValue, { color: colors.textSecondary }, isCurrent && { color: colors.accentDeep, fontWeight: '700' }]}>
                    {day.completedCount}
                  </Text>
                  <View style={[styles.chartBarBg, { backgroundColor: colors.neutralTint }]}>
                    <View
                      style={[
                        styles.chartBarFill,
                        {
                          height: barHeight,
                          backgroundColor: isCurrent ? colors.accentDeep : colors.primaryDeep,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartDayText, { color: colors.textSecondary }, isCurrent && { color: colors.accentDeep, fontWeight: '700' }]}>
                    {new Date(day.dateStr).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'narrow' })}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
