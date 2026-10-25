import CinematicQuestBanner from '../components/CinematicQuestBanner';
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Alert, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingStories from '../components/OnboardingStories';

const countriesList = [
  { code: 'EG', nameAr: 'مصر 🇪🇬', nameEn: 'Egypt', ext: '+20', maxLen: 10 },
  { code: 'SA', nameAr: 'السعودية 🇸🇦', nameEn: 'Saudi Arabia', ext: '+966', maxLen: 9 },
  { code: 'JO', nameAr: 'الأردن 🇯🇴', nameEn: 'Jordan', ext: '+962', maxLen: 9 },
  { code: 'PS', nameAr: 'فلسطين 🇵🇸', nameEn: 'Palestine', ext: '+970', maxLen: 9 },
  { code: 'AE', nameAr: 'الإمارات 🇦🇪', nameEn: 'UAE', ext: '+971', maxLen: 9 },
  { code: 'MA', nameAr: 'المغرب 🇲🇦', nameEn: 'Morocco', ext: '+212', maxLen: 9 },
  { code: 'OTH', nameAr: 'أخرى 🌍', nameEn: 'Other', ext: '+', maxLen: 15 },
];

const validatePhoneNumberDetails = (phone: string, countryCode: string): { isValid: boolean; errorMsg: string } => {
  const cleanPhone = phone.replace(/\s+/g, '');
  if (!cleanPhone) return { isValid: true, errorMsg: '' }; // Optional field if empty

  switch (countryCode) {
    case 'EG': {
      if (cleanPhone.length > 10) {
        return { isValid: false, errorMsg: 'رقم الهاتف في مصر يجب ألا يزيد عن 10 أرقام (بدون 0 في البداية)' };
      }
      if (cleanPhone.length >= 2 && !/^(10|11|12|15)/.test(cleanPhone)) {
        return { isValid: false, errorMsg: 'رقم الهاتف المصري يجب أن يبدأ بـ 10 أو 11 أو 12 أو 15' };
      }
      if (cleanPhone.length === 1 && cleanPhone !== '1') {
        return { isValid: false, errorMsg: 'رقم الهاتف المصري يجب أن يبدأ بـ 10 أو 11 أو 12 أو 15' };
      }
      if (cleanPhone.length === 10 && /^1[0125][0-9]{8}$/.test(cleanPhone)) {
        return { isValid: true, errorMsg: '' };
      }
      if (cleanPhone.length < 10) {
        return { isValid: false, errorMsg: 'رقم الهاتف في مصر يجب أن يتكون من 10 أرقام (مثال: 1012345678)' };
      }
      return { isValid: false, errorMsg: 'صيغة رقم الهاتف غير صحيحة' };
    }

    case 'SA': {
      if (cleanPhone.length > 9) {
        return { isValid: false, errorMsg: 'رقم الهاتف في السعودية يجب ألا يزيد عن 9 أرقام (يبدأ بـ 5)' };
      }
      if (cleanPhone.length >= 1 && !/^5/.test(cleanPhone)) {
        return { isValid: false, errorMsg: 'رقم الهاتف السعودي يجب أن يبدأ بـ 5' };
      }
      if (cleanPhone.length === 9 && /^5[0-9]{8}$/.test(cleanPhone)) {
        return { isValid: true, errorMsg: '' };
      }
      if (cleanPhone.length < 9) {
        return { isValid: false, errorMsg: 'رقم الهاتف السعودي يجب أن يتكون من 9 أرقام' };
      }
      return { isValid: false, errorMsg: 'صيغة رقم الهاتف غير صحيحة' };
    }

    case 'JO': {
      if (cleanPhone.length > 9) {
        return { isValid: false, errorMsg: 'رقم الهاتف في الأردن يجب ألا يزيد عن 9 أرقام' };
      }
      if (cleanPhone.length >= 1 && !/^7/.test(cleanPhone)) {
        return { isValid: false, errorMsg: 'رقم الهاتف الأردني يجب أن يبدأ بـ 7' };
      }
      if (cleanPhone.length === 9 && /^7[789][0-9]{7}$/.test(cleanPhone)) {
        return { isValid: true, errorMsg: '' };
      }
      if (cleanPhone.length < 9) {
        return { isValid: false, errorMsg: 'رقم الهاتف الأردني يجب أن يتكون من 9 أرقام' };
      }
      return { isValid: false, errorMsg: 'صيغة رقم الهاتف غير صحيحة' };
    }

    case 'AE': {
      if (cleanPhone.length > 9) {
        return { isValid: false, errorMsg: 'رقم الهاتف في الإمارات يجب ألا يزيد عن 9 أرقام' };
      }
      if (cleanPhone.length >= 1 && !/^5/.test(cleanPhone)) {
        return { isValid: false, errorMsg: 'رقم الهاتف الإماراتي يجب أن يبدأ بـ 5' };
      }
      if (cleanPhone.length === 9 && /^5[024568][0-9]{7}$/.test(cleanPhone)) {
        return { isValid: true, errorMsg: '' };
      }
      if (cleanPhone.length < 9) {
        return { isValid: false, errorMsg: 'رقم الهاتف الإماراتي يجب أن يتكون من 9 أرقام' };
      }
      return { isValid: false, errorMsg: 'صيغة رقم الهاتف غير صحيحة' };
    }

    case 'MA': {
      if (cleanPhone.length > 9) {
        return { isValid: false, errorMsg: 'رقم الهاتف في المغرب يجب ألا يزيد عن 9 أرقام' };
      }
      if (cleanPhone.length >= 1 && !/^[567]/.test(cleanPhone)) {
        return { isValid: false, errorMsg: 'رقم الهاتف المغربي يجب أن يبدأ بـ 5 أو 6 أو 7' };
      }
      if (cleanPhone.length === 9 && /^[567][0-9]{8}$/.test(cleanPhone)) {
        return { isValid: true, errorMsg: '' };
      }
      if (cleanPhone.length < 9) {
        return { isValid: false, errorMsg: 'رقم الهاتف المغربي يجب أن يتكون من 9 أرقام' };
      }
      return { isValid: false, errorMsg: 'صيغة رقم الهاتف غير صحيحة' };
    }

    case 'PS': {
      if (cleanPhone.length > 9) {
        return { isValid: false, errorMsg: 'رقم الهاتف في فلسطين يجب ألا يزيد عن 9 أرقام' };
      }
      if (cleanPhone.length === 9 && /^[5-9][0-9]{8}$/.test(cleanPhone)) {
        return { isValid: true, errorMsg: '' };
      }
      if (cleanPhone.length < 9) {
        return { isValid: false, errorMsg: 'رقم الهاتف الفلسطيني يجب أن يتكون من 9 أرقام' };
      }
      return { isValid: false, errorMsg: 'صيغة رقم الهاتف غير صحيحة' };
    }

    default: {
      if (cleanPhone.length > 15) {
        return { isValid: false, errorMsg: 'رقم الهاتف يجب ألا يزيد عن 15 رقم' };
      }
      if (/^[0-9]{5,15}$/.test(cleanPhone)) {
        return { isValid: true, errorMsg: '' };
      }
      return { isValid: false, errorMsg: 'الرجاء إدخال رقم هاتف صحيح' };
    }
  }
};

export default function LoginScreen({ navigation }: any) {
  const { user, loading, login } = useAuth();
  const { colors } = useTheme();
  const { language } = useLanguage();
  const styles = getStyles(colors);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(countriesList[0].nameAr);
  const [selectedCountryObj, setSelectedCountryObj] = useState(countriesList[0]);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'phone' | 'country' | 'age' | null>(null);
  const [showCountryModal, setShowCountryModal] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await AsyncStorage.getItem('user-has-seen-onboarding');
        if (seen !== 'true') {
          setShowOnboarding(true);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkOnboarding();

    if (user) {
      navigation.replace('HomeTabs');
    }
  }, [user, navigation]);

  // Handle phone input with instant character count & prefix validation
  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhone(cleaned);

    if (cleaned) {
      const check = validatePhoneNumberDetails(cleaned, selectedCountryObj.code);
      setPhoneError(check.errorMsg);
    } else {
      setPhoneError('');
    }
  };

  // Handle country selection and auto-update extension
  const handleCountrySelect = (c: typeof countriesList[0]) => {
    setSelectedCountryObj(c);
    setCountry(c.nameAr);
    setShowCountryModal(false);

    // Instant re-validate phone for new country
    if (phone) {
      const check = validatePhoneNumberDetails(phone, c.code);
      setPhoneError(check.errorMsg);
    } else {
      setPhoneError('');
    }
  };

  const handleContinue = async () => {
    if (!name.trim()) {
      setError('الرجاء كتابة اسمك للبدء في رحلة التحدي!');
      return;
    }

    if (phone.trim()) {
      const check = validatePhoneNumberDetails(phone.trim(), selectedCountryObj.code);
      if (!check.isValid) {
        setPhoneError(check.errorMsg);
        return;
      }
    }

    setError('');
    setPhoneError('');
    setSaving(true);
    try {
      const parsedAge = age.trim() ? parseInt(age.trim(), 10) : undefined;
      const fullPhone = phone.trim() ? `${selectedCountryObj.ext}${phone.trim()}` : '';
      await login(name.trim(), fullPhone, country.trim(), parsedAge, undefined, gender);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <CinematicQuestBanner chapter={15} icon="★" titleAr="ابدأ رحلة البطولة" titleEn="Begin Your Hero Journey" descriptionAr="استكشف عالم بطل مسلم وتقدم بخطوات صغيرة كل يوم" descriptionEn="Explore Batl Muslim and grow with small steps each day" compact />
        <View style={styles.innerContainer}>
          <View style={styles.topSection}>
            {/* Rosette Islamic Logo with Bolt */}
            <View style={styles.logoShadowWrapper}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoContainer}
              >
                <View style={styles.rosetteSquare1} />
                <View style={styles.rosetteSquare2} />
                
                {/* SVG Bolt Glyph */}
                <Svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={colors.white} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={styles.boltIcon}>
                  <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </Svg>
              </LinearGradient>
            </View>

            {/* Wordmark */}
            <Text style={[styles.wordmark, { color: colors.textPrimary }]}>بطل مسلم</Text>
            
            {/* Subtitle */}
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              ابدأ رحلتك الإسلامية الممتعة ونافس اللاعبين حول العالم
            </Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={async () => { setSaving(true); try { await login('', '', ''); } finally { setSaving(false); } }}
            disabled={saving || loading}
            style={{ backgroundColor: colors.primary, borderRadius: 16, padding: 17, alignItems: 'center', marginBottom: 18 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 17 }}>
              {language === 'ar' ? 'ابدأ بدون تسجيل ⭐' : 'Continue as guest ⭐'}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: colors.textSecondary, textAlign: 'center', marginBottom: 12 }}>
            {language === 'ar' ? 'لا تحتاج إلى اسم أو هاتف. يمكنك تخصيص بطلك لاحقًا.' : 'No name or phone needed. Customize your Hero later.'}
          </Text>
          <View style={styles.middleSection}>

            {/* Input Label - Name */}
            <Text style={[styles.inputLabel, { color: colors.textBody }]}>اسمك في الميدان</Text>
            
            {/* Input Row - Name */}
            <View style={[
              styles.inputRow,
              { borderColor: error ? colors.danger : focusedField === 'name' ? colors.primary : colors.border },
              focusedField === 'name' && !error && styles.inputRowFocused
            ]}>
              {/* Trailing Character Counter */}
              <Text style={[styles.charCounter, { color: colors.textTertiary }]}>
                {name.length}/18
              </Text>

              {/* Text Input */}
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="اكتب اسمك هنا للبدء..."
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (error) setError('');
                }}
                maxLength={18}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                accessibilityLabel={language === 'ar' ? 'اسم اللاعب في الميدان' : 'Player name in arena'}
                accessibilityHint={language === 'ar' ? 'اكتب اسمك للبدء في اللعب' : 'Enter your name to start playing'}
              />

              {/* Leading User SVG Icon */}
              <Svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={colors.primaryDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.userIcon}>
                <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <Circle cx="12" cy="7" r="4" />
              </Svg>
            </View>

            {/* Red error text for Name if invalid */}
            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {/* Input Label - Country */}
            <Text style={[styles.inputLabel, { color: colors.textBody, marginTop: 14 }]}>الدولة (اختياري)</Text>
            
            {/* Input Row - Country Dropdown */}
            <TouchableOpacity 
              style={[
                styles.inputRow,
                { borderColor: focusedField === 'country' ? colors.primary : colors.border },
                { justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row-reverse', paddingHorizontal: 12, minHeight: 48 }
              ]}
              onPress={() => {
                Keyboard.dismiss();
                setShowCountryModal(true);
              }}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={language === 'ar' ? `الدولة: ${selectedCountryObj?.nameAr || 'غير محددة'}` : `Country: ${selectedCountryObj?.nameEn || 'Unselected'}`}
              accessibilityHint={language === 'ar' ? 'اضغط لفتح قائمة اختيار الدول' : 'Tap to open country picker modal'}
            >
              <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>
                {selectedCountryObj?.nameAr || 'اختر دولتك...'}
              </Text>
              
              <Svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.primaryDeep} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M6 9l6 6 6-6" />
              </Svg>
            </TouchableOpacity>

            {/* Input Label - Phone */}
            <Text style={[styles.inputLabel, { color: colors.textBody, marginTop: 14 }]}>رقم الهاتف (اختياري)</Text>
            
            {/* Input Row - Phone */}
            <View style={[
              styles.inputRow,
              { borderColor: phoneError ? colors.danger : focusedField === 'phone' ? colors.primary : colors.border },
              focusedField === 'phone' && !phoneError && styles.inputRowFocused
            ]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary, paddingLeft: 8 }]}
                placeholder={selectedCountryObj.code === 'EG' ? 'مثال: 1012345678' : 'أدخل رقم الهاتف...'}
                placeholderTextColor={colors.textSecondary}
                value={phone}
                onChangeText={handlePhoneChange}
                maxLength={selectedCountryObj.maxLen}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                accessibilityLabel={language === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone number (optional)'}
              />

              {/* Automated Country Extension Prefix */}
              <View style={{ paddingHorizontal: 12, borderRightWidth: 1, borderRightColor: colors.border, justifyContent: 'center' }}>
                <Text style={{ color: colors.primaryDeep, fontWeight: '700', fontSize: 14 }}>
                  {selectedCountryObj?.ext || '+'}
                </Text>
              </View>
            </View>

            {/* Instant Red Validation Error for Phone */}
            {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

            {/* Input Label - Age */}
            <Text style={[styles.inputLabel, { color: colors.textBody, marginTop: 14 }]}>العمر (اختياري)</Text>
            
            {/* Input Row - Age */}
            <View style={[
              styles.inputRow,
              { borderColor: focusedField === 'age' ? colors.primary : colors.border },
              focusedField === 'age' && styles.inputRowFocused
            ]}>
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                placeholder="مثال: 12..."
                placeholderTextColor={colors.textTertiary}
                value={age}
                onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                maxLength={3}
                keyboardType="number-pad"
                onFocus={() => setFocusedField('age')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="done"
                accessibilityLabel={language === 'ar' ? 'العمر (اختياري)' : 'Age (optional)'}
              />

              <Svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={colors.primaryDeep} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.userIcon}>
                <Circle cx="12" cy="12" r="10" />
                <Path d="M12 6v6l4 2" />
              </Svg>
            </View>

            {/* Input Label - Gender */}
            <Text style={[styles.inputLabel, { color: colors.textBody, marginTop: 14 }]}>الجنس (اختياري)</Text>

            {/* Gender Selection Cards */}
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderCard,
                  {
                    backgroundColor: gender === 'male' ? colors.primaryTint : colors.surface,
                    borderColor: gender === 'male' ? colors.primary : colors.border,
                    minHeight: 48,
                  }
                ]}
                onPress={() => setGender(gender === 'male' ? '' : 'male')}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: gender === 'male' }}
                accessibilityLabel={language === 'ar' ? 'الجنس: ذكر' : 'Gender: Male'}
              >
                <Text style={styles.genderEmoji}>👨</Text>
                <Text style={[styles.genderLabelText, { color: gender === 'male' ? colors.primary : colors.textPrimary }]}>
                  ذكر
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderCard,
                  {
                    backgroundColor: gender === 'female' ? colors.primaryTint : colors.surface,
                    borderColor: gender === 'female' ? colors.primary : colors.border,
                    minHeight: 48,
                  }
                ]}
                onPress={() => setGender(gender === 'female' ? '' : 'female')}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: gender === 'female' }}
                accessibilityLabel={language === 'ar' ? 'الجنس: أنثى' : 'Gender: Female'}
              >
                <Text style={styles.genderEmoji}>👩</Text>
                <Text style={[styles.genderLabelText, { color: gender === 'female' ? colors.primary : colors.textPrimary }]}>
                  أنثى
                </Text>
              </TouchableOpacity>
            </View>

          </View>

          <View style={styles.bottomSection}>
            {/* Action Button */}
            {loading || saving ? (
              <ActivityIndicator size="large" color={colors.primaryDeep} style={styles.loader} />
            ) : (
              <TouchableOpacity
                style={[styles.ctaButton, { minHeight: 48 }]}
                onPress={handleContinue}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={language === 'ar' ? 'ابدأ اللعب الآن' : 'Start playing now'}
              >
                <Text style={styles.ctaButtonText}>ابدأ اللعب الآن</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Custom Country Picker Dropdown Modal */}
      <Modal
        visible={showCountryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryModal(false)}
        >
          <View style={[styles.dropdownModalContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.dropdownModalTitle, { color: colors.textPrimary }]}>اختر الدولة</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {countriesList.map((c) => (
                <TouchableOpacity
                  key={c.code}
                  style={[
                    styles.dropdownModalItem,
                    selectedCountryObj.code === c.code && { backgroundColor: colors.primaryTint },
                    { minHeight: 48 }
                  ]}
                  onPress={() => handleCountrySelect(c)}
                  accessibilityRole="button"
                  accessibilityLabel={`${language === 'ar' ? c.nameAr : c.nameEn} (${c.ext})`}
                  accessibilityState={{ selected: selectedCountryObj.code === c.code }}
                >
                  <Text style={{ fontSize: 16, color: colors.textPrimary, fontWeight: '700' }}>
                    {language === 'ar' ? c.nameAr : c.nameEn}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>{c.ext}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
      <OnboardingStories visible={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    minHeight: 680,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    paddingTop: 30,
    paddingBottom: 28,
  },
  topSection: {
    alignItems: "center",
    marginTop: 20,
  },
  logoShadowWrapper: {
    shadowColor: colors.primary || "#10B981",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 8,
    marginBottom: 24,
  },
  logoContainer: {
    width: 104,
    height: 104,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  rosetteSquare1: {
    position: "absolute",
    width: 68,
    height: 68,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 2,
  },
  rosetteSquare2: {
    position: "absolute",
    width: 68,
    height: 68,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 2,
    transform: [{ rotate: "45deg" }],
  },
  boltIcon: {
    zIndex: 2,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.68,
    marginBottom: 8,
    fontFamily: "IBMPlexSansArabic-Bold",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 27,
    maxWidth: 290,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  middleSection: {
    width: "100%",
    marginVertical: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
    marginBottom: 6,
    fontFamily: "IBMPlexSansArabic-Medium",
  },
  inputRow: {
    flexDirection: "row-reverse",
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    backgroundColor: colors.surface || "#FFFFFF",
  },
  inputRowFocused: {
    shadowColor: colors.primaryTint || "rgba(16, 185, 129, 0.12)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  userIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "right",
    padding: 0,
    fontFamily: "IBMPlexSansArabic-SemiBold",
  },
  charCounter: {
    fontSize: 11,
    fontWeight: "600",
    marginRight: 8,
    writingDirection: "ltr",
  },
  errorText: {
    color: colors.error || "#E7000B",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 6,
    marginBottom: 4,
    fontFamily: "IBMPlexSansArabic-Bold",
  },
  genderContainer: {
    flexDirection: "row-reverse",
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  genderCard: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 8,
  },
  genderEmoji: {
    fontSize: 20,
  },
  genderLabelText: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "IBMPlexSansArabic-Bold",
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  ctaButton: {
    backgroundColor: colors.primaryDeep || "#059669",
    paddingVertical: 17,
    borderRadius: 16,
    width: "100%",
    alignItems: "center",
    shadowColor: colors.primaryDeep || "#059669",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 16,
  },
  ctaButtonText: {
    color: colors.white || "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "IBMPlexSansArabic-Bold",
  },
  loader: {
    marginVertical: 18,
  },
  footnote: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "IBMPlexSansArabic-Regular",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownModalContainer: {
    width: "90%",
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.black || "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    fontFamily: "IBMPlexSansArabic-Bold",
  },
  dropdownModalItem: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border || "#E5E7EB",
    alignItems: "center",
  },
});
