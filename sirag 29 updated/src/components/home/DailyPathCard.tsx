import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HomeColors, HomeRadii, HomeSpacing, HomeTypography } from '../../theme/tokens';
import { HomeTaskItem } from '../../hooks/useHomeData';
import { TaskRow } from './TaskRow';
import { HomeIcon } from './HomeIcons';

interface DailyPathCardProps {
  title: string;
  doneCount: number;
  totalCount: number;
  progressPercent: number;
  isAllDone: boolean;
  tasks: HomeTaskItem[];
  isTomorrowFasting?: boolean;
  fastingReminderSet?: boolean;
  onToggleFastingReminder?: () => void;
  onPressHeader?: () => void;
  onPressTask: (task: HomeTaskItem) => void;
  language: 'ar' | 'en';
}

export function DailyPathCard({
  title,
  doneCount,
  totalCount,
  progressPercent,
  isAllDone,
  tasks,
  isTomorrowFasting = false,
  fastingReminderSet = false,
  onToggleFastingReminder,
  onPressHeader,
  onPressTask,
  language,
}: DailyPathCardProps) {
  const countLabel = language === 'ar'
    ? `${doneCount} من ${totalCount} مهام`
    : `${doneCount} of ${totalCount} tasks`;

  const clampedProgress = Math.max(0, Math.min(100, progressPercent));

  const allDoneNote = language === 'ar'
    ? 'أحسنت يا بطل! أتممت جميع مهام اليوم مباركًا.'
    : 'Well done! All daily tasks are completed.';

  const fastingPromptText = language === 'ar' ? 'غدًا يوم صيام؟' : 'Fasting tomorrow?';
  const remindMeText = fastingReminderSet
    ? (language === 'ar' ? 'تم التذكير ✓' : 'Reminded ✓')
    : (language === 'ar' ? 'ذكّرني' : 'Remind me');

  return (
    <View style={styles.cardContainer}>
      {/* Header Row */}
      <TouchableOpacity
        style={styles.headerRow}
        onPress={onPressHeader}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${title}، ${countLabel}`}
      >
        <View style={styles.titleWithCheck}>
          <Text style={styles.cardTitle}>{title}</Text>
          {isAllDone && (
            <View style={styles.allDoneCheckIcon}>
              <HomeIcon name="check" size={14} color={HomeColors.primary} strokeWidth={2.8} />
            </View>
          )}
        </View>

        <Text style={styles.countText}>{countLabel}</Text>
      </TouchableOpacity>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${clampedProgress}%` }]} />
      </View>

      {/* All Tasks Completed Note */}
      {isAllDone && (
        <Text style={styles.allDoneText}>{allDoneNote}</Text>
      )}

      {/* Task Rows (show 3: last 2 completed + next 1 pending) */}
      <View style={styles.tasksList}>
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onPress={onPressTask}
            language={language}
          />
        ))}
      </View>

      {/* Tomorrow Fasting Hint Row (Section 10 Edge Case) */}
      {isTomorrowFasting && (
        <View style={styles.fastingRow}>
          <View style={styles.fastingTextCol}>
            <Text style={styles.fastingTitle}>{fastingPromptText}</Text>
            <Text style={styles.fastingSubtext}>
              {language === 'ar'
                ? 'سنة مؤكدة لصيام الإثنين والخميس أو الأيام البيض'
                : 'Sunnah fasting for Monday/Thursday or White Days'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.remindBtn, fastingReminderSet && styles.remindBtnActive]}
            onPress={onToggleFastingReminder}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${fastingPromptText} ${remindMeText}`}
          >
            <Text style={[styles.remindBtnText, fastingReminderSet && styles.remindBtnTextActive]}>
              {remindMeText}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: HomeColors.surface,
    borderWidth: 1,
    borderColor: HomeColors.border,
    borderRadius: HomeRadii.card,
    padding: 16,
    flexDirection: 'column',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 28,
  },
  titleWithCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: HomeTypography.fontSize.sectionTitle,
    lineHeight: HomeTypography.lineHeight.sectionTitle,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.text,
  },
  allDoneCheckIcon: {
    width: 18,
    height: 18,
    borderRadius: HomeRadii.full,
    backgroundColor: HomeColors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: HomeTypography.fontSize.small,
    lineHeight: HomeTypography.lineHeight.small,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
  },
  progressTrack: {
    height: 8,
    borderRadius: HomeRadii.progressBar,
    backgroundColor: HomeColors.trackSoft,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: HomeRadii.progressBar,
    backgroundColor: HomeColors.primary,
  },
  allDoneText: {
    fontSize: HomeTypography.fontSize.small,
    lineHeight: HomeTypography.lineHeight.small,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.primary,
  },
  tasksList: {
    flexDirection: 'column',
    gap: 6,
  },
  fastingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: HomeColors.border,
  },
  fastingTextCol: {
    flex: 1,
    marginEnd: 10,
  },
  fastingTitle: {
    fontSize: HomeTypography.fontSize.task,
    fontFamily: HomeTypography.fontFamily.medium,
    color: HomeColors.text,
  },
  fastingSubtext: {
    fontSize: HomeTypography.fontSize.tiny,
    fontFamily: HomeTypography.fontFamily.regular,
    color: HomeColors.textSecondary,
    marginTop: 1,
  },
  remindBtn: {
    backgroundColor: HomeColors.primarySoft,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: HomeRadii.button,
    minHeight: HomeSpacing.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remindBtnActive: {
    backgroundColor: HomeColors.primary,
  },
  remindBtnText: {
    fontSize: HomeTypography.fontSize.small,
    fontFamily: HomeTypography.fontFamily.semiBold,
    color: HomeColors.primary,
  },
  remindBtnTextActive: {
    color: HomeColors.textWhite,
  },
});
