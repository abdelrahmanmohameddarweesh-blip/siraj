import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Shared device-aware boundary for custom-header screens.
 * Uses actual safe-area measurements, never a guessed status-bar height.
 * Apply only to screens without a native stack header or their own safe-area wrapper.
 */
export default function SafeScreenFrame({ children, includeBottom = true }: { children: React.ReactNode; includeBottom?: boolean }) {
  return (
    <SafeAreaView edges={includeBottom ? ['top', 'bottom'] : ['top']} style={styles.frame}>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: '#061D1A' },
  content: { flex: 1, minWidth: 0 },
});
