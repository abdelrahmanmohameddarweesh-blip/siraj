import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { type Reader } from '../../data/readers';
import { type Ayah } from '../../data/ayahs';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface VoiceActiveCardProps {
  step: 'ready' | 'recording' | 'recorded' | 'analyzing';
  selectedReader: Reader;
  currentAyah: Ayah;
  recitationStyle: 'murattal' | 'mujawwad';
  seconds: number;
  recordingDuration: number;
  liveVolume: number;
  pulseAnim: Animated.Value;
  styles: any;
  onSetRecitationStyle: (style: 'murattal' | 'mujawwad') => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAnalyzeRecitation: () => void;
  onReset: () => void;
}

export function VoiceActiveCard({
  step,
  selectedReader,
  currentAyah,
  recitationStyle,
  seconds,
  recordingDuration,
  liveVolume,
  pulseAnim,
  styles,
  onSetRecitationStyle,
  onStartRecording,
  onStopRecording,
  onAnalyzeRecitation,
  onReset,
}: VoiceActiveCardProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  if (step === 'ready') {
    return (
      <View style={styles.card}>
        <View style={styles.qariHeader}>
          <Text style={styles.qariName}>المحاكاة المطلوبة: {selectedReader.name}</Text>
          <Text style={styles.qariAdvice}>💡 نصيحة النبرة: {selectedReader.tuneAdvice}</Text>
        </View>

        {/* Recitation Style Selection Toggle */}
        <View style={styles.styleSelectorContainer}>
          <Text style={styles.styleSelectorTitle}>اختر طريقة التلاوة للتحدي:</Text>
          <View style={styles.styleSelectorRow}>
            <TouchableOpacity
              style={[styles.styleSelectorBtn, recitationStyle === 'mujawwad' && styles.styleSelectorBtnActive]}
              onPress={() => onSetRecitationStyle('mujawwad')}
              activeOpacity={0.8}
            >
              <Text style={[styles.styleSelectorText, recitationStyle === 'mujawwad' && styles.styleSelectorTextActive]}>
                🎨 مجوّد (بطيء ونغمي)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.styleSelectorBtn, recitationStyle === 'murattal' && styles.styleSelectorBtnActive]}
              onPress={() => onSetRecitationStyle('murattal')}
              activeOpacity={0.8}
            >
              <Text style={[styles.styleSelectorText, recitationStyle === 'murattal' && styles.styleSelectorTextActive]}>
                📖 مرتل (سريع ومنظم)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.verseBox}>
          <Text style={styles.verseLabel}>{currentAyah.surah} - الآية {currentAyah.number}</Text>
          <Text style={styles.verseText}>{currentAyah.text}</Text>
        </View>

        <View style={[styles.disclaimerBox, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
          <Text style={[styles.disclaimerText, { color: colors.accent }]}>
            ⚠️ {language === 'ar'
              ? 'يقيس التحدي دقة مطابقة مخارج الضغط، مخارج الحروف، والمدود الصوتية مع القارئ. يرجى تلاوة الآيات المكتوبة بدقة لضمان دقة التقييم.'
              : 'This challenge measures dynamic emphasis, intonation, and vowel extensions matching the Qari. Please recite the written verses accurately to get a valid score.'}
          </Text>
        </View>

        <Text style={styles.statusHint}>استعد واضغط على الزر للبدء بالتسجيل</Text>
        <TouchableOpacity
          style={styles.micButton}
          onPress={onStartRecording}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'بدء تسجيل تلاوتك بالميكروفون' : 'Start voice recording with microphone'}
          accessibilityHint={language === 'ar' ? 'اضغط للبدء في تلاوة الآية المحددة' : 'Tap to start reciting the selected verse'}
        >
          <Text style={styles.micIcon}>🎙️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.backButton, { minHeight: 44, justifyContent: 'center' }]}
          onPress={onReset}
          accessibilityRole="button"
          accessibilityLabel={language === 'ar' ? 'تغيير القارئ المختار' : 'Change selected Qari'}
        >
          <Text style={styles.backButtonText}>تغيير القارئ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (step === 'recording') {
    return (
      <View style={styles.card}>
        <Text style={styles.recordingTitle}>جاري تسجيل صوتك الآن ({recitationStyle === 'mujawwad' ? 'مجوّد' : 'مرتل'})...</Text>
        <Text style={styles.timerText}>الوقت: 00:{seconds < 10 ? `0${seconds}` : seconds}</Text>

        <View style={styles.verseBox}>
          <Text style={styles.verseLabel}>{currentAyah.surah}</Text>
          <Text style={styles.verseText}>{currentAyah.text}</Text>
        </View>

        {/* REAL-TIME Sound Wave Visualizer matching microphone amplitude */}
        <View style={styles.waveContainer}>
          <View style={[styles.waveBar, { height: 10 + liveVolume * 40 }]} />
          <View style={[styles.waveBar, { height: 15 + liveVolume * 65 }]} />
          <View style={[styles.waveBar, { height: 12 + liveVolume * 50 }]} />
          <View style={[styles.waveBar, { height: 20 + liveVolume * 80 }]} />
          <View style={[styles.waveBar, { height: 14 + liveVolume * 60 }]} />
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.micButton, styles.micButtonRecording]}
            onPress={onStopRecording}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={language === 'ar' ? 'إيقاف التسجيل الصوتي' : 'Stop voice recording'}
            accessibilityState={{ busy: true }}
          >
            <Text style={styles.micIcon}>⏹️</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  if (step === 'recorded') {
    return (
      <View style={styles.card}>
        <Text style={styles.statusSuccess}>تم تسجيل تلاوتك بنجاز! 🎉</Text>
        <Text style={styles.subtitle}>
          الأسلوب: {recitationStyle === 'mujawwad' ? 'مجوّد' : 'مرتل'} | المدة: {(recordingDuration / 1000).toFixed(1)} ثانية.
        </Text>

        <View style={styles.verseBox}>
          <Text style={styles.verseText}>{currentAyah.text}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryButton, { minHeight: 48 }]}
            onPress={onAnalyzeRecitation}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={language === 'ar' ? 'تحليل دقة المحاكاة الصوتية' : 'Analyze recitation audio accuracy'}
          >
            <Text style={styles.primaryButtonText}>تحليل دقة المحاكاة الصوتية 🔍</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { minHeight: 48 }]}
            onPress={onStartRecording}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={language === 'ar' ? 'إعادة تسجيل التلاوة' : 'Re-record recitation'}
          >
            <Text style={styles.secondaryButtonText}>إعادة تسجيل التلاوة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'analyzing') {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        <Text style={styles.analyzingText}>جاري استخراج الخصائص الصوتية ومطابقتها مع تلاوة الشيخ...</Text>
        <Text style={styles.analyzingSub}>تحليل النبرة والطبقة، إيقاع القراءة، ومخارج المقاطع التجويدية</Text>
      </View>
    );
  }

  return null;
}
