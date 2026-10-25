import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>🕌</Text>
            </View>

            <Text style={styles.titleAr}>حدث خطأ غير متوقع</Text>
            <Text style={styles.titleEn}>Something went wrong</Text>

            <Text style={styles.descAr}>
              نعتذر عن هذا الخطأ. حدث ارتباك مؤقت في التطبيق، يمكنك المحاولة مرة أخرى بالضغط على الزر أدناه.
            </Text>
            <Text style={styles.descEn}>
              We apologize for this unexpected error. Tap the button below to restart and try again.
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleReset}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="إعادة المحاولة / Try Again"
            >
              <Text style={styles.retryButtonText}>إعادة المحاولة / Try Again 🔄</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#A4F4CF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  iconText: {
    fontSize: 42,
  },
  titleAr: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'IBMPlexSansArabic-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  titleEn: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  descAr: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'IBMPlexSansArabic-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  descEn: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#047857',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    minHeight: 48,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'IBMPlexSansArabic-Bold',
  },
});
