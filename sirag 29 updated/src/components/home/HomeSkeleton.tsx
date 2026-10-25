import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { HomeColors, HomeRadii, HomeSpacing } from '../../theme/tokens';

function SkeletonItem({
  width,
  height,
  borderRadius,
  style,
}: {
  width: number | `${number}%` | 'auto';
  height: number;
  borderRadius?: number;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: borderRadius ?? HomeRadii.tag,
          backgroundColor: HomeColors.skeletonBg,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function HomeSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.headerRow}>
        <SkeletonItem width={46} height={46} borderRadius={HomeRadii.full} />
        <View style={styles.headerMiddle}>
          <SkeletonItem width={120} height={18} borderRadius={HomeRadii.tag} />
          <View style={styles.headerSubRow}>
            <SkeletonItem width={80} height={12} borderRadius={HomeRadii.tag} />
            <SkeletonItem width={56} height={5} borderRadius={HomeRadii.xpBar} />
          </View>
        </View>
        <SkeletonItem width={58} height={30} borderRadius={HomeRadii.chip} />
        <SkeletonItem width={64} height={30} borderRadius={HomeRadii.chip} />
      </View>

      {/* Next prayer card skeleton */}
      <View style={styles.prayerCard}>
        <View style={styles.prayerTopRow}>
          <View style={styles.prayerRightCol}>
            <SkeletonItem width={70} height={12} borderRadius={HomeRadii.tag} style={styles.prayerItemBg} />
            <SkeletonItem width={90} height={32} borderRadius={HomeRadii.tag} style={styles.prayerItemBg} />
          </View>
          <View style={styles.prayerLeftCol}>
            <SkeletonItem width={110} height={30} borderRadius={HomeRadii.tag} style={styles.prayerItemBg} />
            <SkeletonItem width={130} height={12} borderRadius={HomeRadii.tag} style={styles.prayerItemBg} />
          </View>
        </View>
        <View style={styles.prayerDivider} />
        <View style={styles.prayersRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.prayerDotCol}>
              <SkeletonItem width={34} height={34} borderRadius={HomeRadii.full} style={styles.prayerItemBg} />
              <SkeletonItem width={28} height={10} borderRadius={HomeRadii.tag} style={styles.prayerItemBg} />
              <SkeletonItem width={26} height={10} borderRadius={HomeRadii.tag} style={styles.prayerItemBg} />
            </View>
          ))}
        </View>
      </View>

      {/* Daily path card skeleton */}
      <View style={styles.dailyPathCard}>
        <View style={styles.rowSpaceBetween}>
          <SkeletonItem width={80} height={16} borderRadius={HomeRadii.tag} />
          <SkeletonItem width={64} height={12} borderRadius={HomeRadii.tag} />
        </View>
        <SkeletonItem width="100%" height={8} borderRadius={HomeRadii.progressBar} />
        <View style={styles.taskList}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.taskRow}>
              <SkeletonItem width={22} height={22} borderRadius={HomeRadii.full} />
              <SkeletonItem width="60%" height={14} borderRadius={HomeRadii.tag} />
              <SkeletonItem width={36} height={14} borderRadius={HomeRadii.tag} style={{ marginStart: 'auto' }} />
            </View>
          ))}
        </View>
      </View>

      {/* Habit card skeleton */}
      <View style={styles.habitCard}>
        <SkeletonItem width={46} height={46} borderRadius={HomeRadii.habitIcon} />
        <View style={styles.habitTextCol}>
          <SkeletonItem width={140} height={14} borderRadius={HomeRadii.tag} />
          <SkeletonItem width={85} height={12} borderRadius={HomeRadii.tag} style={{ marginTop: 4 }} />
          <SkeletonItem width="100%" height={6} borderRadius={HomeRadii.xpBar} style={{ marginTop: 8 }} />
        </View>
      </View>

      {/* Mini-apps section skeleton */}
      <View style={styles.miniAppsSection}>
        <View style={styles.rowSpaceBetween}>
          <SkeletonItem width={72} height={16} borderRadius={HomeRadii.tag} />
          <SkeletonItem width={50} height={12} borderRadius={HomeRadii.tag} />
        </View>
        <View style={styles.grid}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={styles.tileCol}>
              <SkeletonItem width={54} height={54} borderRadius={HomeRadii.tile} />
              <SkeletonItem width={36} height={10} borderRadius={HomeRadii.tag} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: HomeSpacing.sectionGap,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerMiddle: {
    flex: 1,
    gap: 4,
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prayerCard: {
    backgroundColor: HomeColors.primary,
    borderRadius: HomeRadii.prayerCard,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 16,
  },
  prayerItemBg: {
    backgroundColor: HomeColors.onPrimaryMuted,
  },
  prayerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  prayerRightCol: {
    gap: 6,
  },
  prayerLeftCol: {
    alignItems: 'flex-start',
    gap: 6,
  },
  prayerDivider: {
    height: 1,
    backgroundColor: HomeColors.track,
    opacity: 0.2,
  },
  prayersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerDotCol: {
    alignItems: 'center',
    gap: 4,
  },
  dailyPathCard: {
    backgroundColor: HomeColors.surface,
    borderWidth: 1,
    borderColor: HomeColors.border,
    borderRadius: HomeRadii.card,
    padding: 16,
    gap: 12,
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskList: {
    gap: 12,
    marginTop: 4,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: HomeColors.habitBg,
    borderWidth: 1,
    borderColor: HomeColors.habitBorder,
    borderRadius: HomeRadii.card,
    padding: 16,
  },
  habitTextCol: {
    flex: 1,
  },
  miniAppsSection: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  tileCol: {
    width: '22%',
    alignItems: 'center',
  },
});
