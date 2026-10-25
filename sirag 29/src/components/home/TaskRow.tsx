import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HomeColors, HomeRadii, HomeSpacing, HomeTypography } from '../../theme/tokens';
import { HomeTaskItem } from '../../hooks/useHomeData';
import { HomeIcon } from './HomeIcons';

interface TaskRowProps {
  task: HomeTaskItem;
  onPress: (task: HomeTaskItem) => void;
  language: 'ar' | 'en';
}

export function TaskRow({ task, onPress, language }: TaskRowProps) {
  const title = language === 'ar' ? task.titleAr : task.titleEn;
  const startBtnText = language === 'ar' ? 'ابدأ' : 'Start';
  const jamaaTagText = language === 'ar' ? 'جماعة' : 'Jamaa';

  const a11yLabel = `${title}، ${task.done ? (language === 'ar' ? 'مكتملة' : 'Completed') : (language === 'ar' ? 'مهمة قادمة' : 'Pending task')}، ${task.pointsText}`;

  return (
    <TouchableOpacity
      style={styles.rowContainer}
      onPress={() => onPress(task)}
      activeOpacity={task.done ? 0.7 : 0.85}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
    >
      {/* 22x22 Checkbox */}
      <View style={[styles.checkbox, task.done ? styles.checkboxDone : styles.checkboxEmpty]}>
        {task.done && (
          <HomeIcon name="check" size={13} color={HomeColors.textWhite} strokeWidth={2.8} />
        )}
      </View>

      {/* Title & Optional Jamaa Tag */}
      <View style={styles.textContainer}>
        <Text
          style={[styles.taskTitle, task.done ? styles.titleDone : styles.titlePending]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {task.isJamaa && (
          <View style={styles.jamaaTag}>
            <Text style={styles.jamaaTagText}>{jamaaTagText}</Text>
          </View>
        )}
      </View>

      {/* Trailing: Points text or "ابدأ" Button */}
      {task.done ? (
        <Text style={styles.pointsText}>{task.pointsText}</Text>
      ) : (
        <View style={styles.startBtn}>
          <Text style={styles.startBtnText}>{startBtnText}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: HomeSpacing.minTouchTarget,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: HomeRadii.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: HomeColors.primary,
  },
  checkboxEmpty: {
    backgroundColor: HomeColors.transparent,
    borderWidth: 1.5,
    borderColor: HomeColors.checkEmpty,
  },
  textContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: HomeTypography.fontSize.task,
    lineHeight: HomeTypography.lineHeight.task,
    flexShrink: 1,
  },
  titleDone: {
    color: HomeColors.textSecondary,
    fontFamily: HomeTypography.fontFamily.regular,
  },
  titlePending: {
    color: HomeColors.text,
    fontFamily: HomeTypography.fontFamily.medium,
  },
  jamaaTag: {
    backgroundColor: HomeColors.goldSoft,
    borderRadius: HomeRadii.tag,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginStart: 6,
  },
  jamaaTagText: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.goldText,
  },
  pointsText: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.textSecondary,
  },
  startBtn: {
    backgroundColor: HomeColors.primary,
    borderRadius: HomeRadii.button,
    paddingHorizontal: 14,
    minHeight: HomeSpacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnText: {
    color: HomeColors.textWhite,
    fontSize: 13,
    fontFamily: HomeTypography.fontFamily.semiBold,
  },
});
