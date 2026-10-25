import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message }: LoadingStateProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();
  const defaultMsg = language === 'ar' ? 'جارٍ التحميل...' : 'Loading...';

  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primaryDeep} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
        {message || defaultMsg}
      </Text>
    </View>
  );
}

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = '🌱', title, description, actionLabel, onAction }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.centerContainer}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryTint, borderColor: colors.primaryTintBorder }]}>
        <Text style={styles.iconEmoji}>{icon}</Text>
      </View>
      <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.stateDesc, { color: colors.textSecondary }]}>{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primaryDeep }]}
          onPress={onAction}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { colors } = useTheme();
  const { language } = useLanguage();

  const defaultMsg =
    language === 'ar'
      ? 'تعذر تحميل البيانات. يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً.'
      : 'Could not load data. Please check your internet connection and try again.';

  return (
    <View style={styles.centerContainer}>
      <View style={[styles.iconCircle, { backgroundColor: colors.cardErrorTint, borderColor: colors.dangerTintBorder }]}>
        <Text style={styles.iconEmoji}>⚠️</Text>
      </View>
      <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
        {language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection Error'}
      </Text>
      <Text style={[styles.stateDesc, { color: colors.textSecondary }]}>
        {message || defaultMsg}
      </Text>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primaryDeep }]}
        onPress={onRetry}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={language === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
      >
        <Text style={styles.actionButtonText}>
          {language === 'ar' ? 'إعادة المحاولة 🔄' : 'Try Again 🔄'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontFamily: 'IBMPlexSansArabic-Medium',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 34,
  },
  stateTitle: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  stateDesc: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'IBMPlexSansArabic-Regular',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 320,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});
