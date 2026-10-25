import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { countriesList, QURANIC_TITLES } from './profileConstants';

interface SettingsTabProps {
  user: any;
  profile: any;
  levelName: string;
  currentScore: number;
  formattedDate: string;
  styles: any;
  onSelectCountry: (code: string) => void;
  onLogout: () => void;
}

export function SettingsTab({
  user,
  profile,
  levelName,
  currentScore,
  formattedDate,
  styles,
  onSelectCountry,
  onLogout,
}: SettingsTabProps) {
  const { colors, toggleTheme, isLightMode } = useTheme();
  const { language, setLanguage } = useLanguage();

  const activeTitleObj = profile?.activeTitle
    ? QURANIC_TITLES.find(t => t.id === profile.activeTitle)
    : null;

  return (
    <View>
      {/* Account & System Status */}
      <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
          {language === 'ar' ? '👤 تفاصيل الحساب والنظام' : '👤 Account & System Details'}
        </Text>

        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'حالة الاتصال بالسيرفر' : 'Server Connection'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
            <Text style={[styles.detailValue, { color: colors.textPrimary, fontWeight: '700' }]}>
              {language === 'ar' ? 'متصل وخالي من الأخطاء' : 'Online & Syncing'}
            </Text>
          </View>
        </View>

        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'آخر نشاط مسجّل' : 'Last Logged Activity'}
          </Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formattedDate}</Text>
        </View>

        <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'لغة التطبيق' : 'App Language'}
          </Text>
          <View style={styles.langSwitchContainer}>
            <TouchableOpacity
              style={[styles.langBtn, language === 'ar' && { backgroundColor: colors.primary }]}
              onPress={() => setLanguage('ar')}
              accessibilityRole="button"
              accessibilityLabel="العربية"
            >
              <Text style={[styles.langBtnText, { color: language === 'ar' ? colors.white : colors.textSecondary }]}>
                عربي
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, language === 'en' && { backgroundColor: colors.primary }]}
              onPress={() => setLanguage('en')}
              accessibilityRole="button"
              accessibilityLabel="English"
            >
              <Text style={[styles.langBtnText, { color: language === 'en' ? colors.white : colors.textSecondary }]}>
                English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Country Selector */}
        <View style={styles.detailRowCol}>
          <Text style={[styles.detailLabelCol, { color: colors.textSecondary }]}>
            {language === 'ar' ? 'الدولة / المنطقة الجغرافية' : 'Country / Region'}
          </Text>
          <View style={styles.countryListContainer}>
            {countriesList.map(c => {
              const isSelected = profile?.country === c.code;
              return (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.countryBadge,
                    {
                      backgroundColor: isSelected ? colors.primaryTint : colors.neutralTint,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => onSelectCountry(c.code)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={language === 'ar' ? c.nameAr : c.nameEn}
                >
                  <Text style={[styles.countryBadgeText, { color: isSelected ? colors.primaryDeep : colors.textPrimary }]}>
                    {language === 'ar' ? c.nameAr : c.nameEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Theme Selector */}
      <View style={[styles.themeToggleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.themeHeader}>
          <Text style={[styles.themeTitle, { color: colors.textPrimary }]}>
            {language === 'ar' ? 'مظهر التطبيق (الوضع الليلي)' : 'App Theme Mode'}
          </Text>
          <Text style={[styles.themeSub, { color: colors.textSecondary }]}>
            {language === 'ar'
              ? isLightMode ? 'الوضع النهاري مفعّل حالياً' : 'الوضع الليلي مفعّل حالياً'
              : isLightMode ? 'Light Mode active' : 'Dark Mode active'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.themeToggleBtn, { backgroundColor: colors.neutralTint, borderColor: colors.border }]}
          onPress={toggleTheme}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'تبديل المظهر' : 'Toggle Theme'}
        >
          <Text style={[styles.themeToggleBtnText, { color: colors.textPrimary }]}>
            {isLightMode ? (language === 'ar' ? '🌙 تفعيل الداكن' : '🌙 Dark') : language === 'ar' ? '☀️ تفعيل الفاتح' : '☀️ Light'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Motivational Quote Note Card */}
      <View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
          {language === 'ar'
            ? '💡 ملحوظة: يمكنك تغيير لغة التطبيق أو الدولة أو المظهر الداكن في أي وقت. يتم حفظ كافة التفضيلات تلقائياً في حسابك.'
            : '💡 Note: You can switch language, country, or dark mode anytime. All preferences are automatically synced.'}
        </Text>
      </View>

      {/* Prominent Red Logout Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={onLogout}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={language === 'ar' ? 'تسجيل الخروج من الحساب' : 'Logout from Account'}
      >
        <Text style={styles.logoutButtonText}>
          {language === 'ar' ? '🚪 تسجيل الخروج من الحساب' : '🚪 Logout from Account'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
