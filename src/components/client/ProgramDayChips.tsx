import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@/lib/i18n';
import type { ProgramDay } from '@/types/database';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface ProgramDayChipsProps {
  days: ProgramDay[];
  activeIndex: number;
  onPressDay: (index: number) => void;
}

export function ProgramDayChips({ days, activeIndex, onPressDay }: ProgramDayChipsProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      {days.map((day, index) => {
        const active = index === activeIndex;
        const count = day.exercises?.length ?? 0;
        return (
          <Pressable
            key={`${day.label}-${index}`}
            onPress={() => onPressDay(index)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{day.label}</Text>
            {count > 0 ? (
              <Text style={[styles.count, active && styles.countActive]}>{t('userTrial.programs.chipExerciseCount', { count })}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    gap: 2,
  },
  chipActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
  },
  text: { color: colors.textMuted, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },
  textActive: { color: colors.primary, fontFamily: typography.family.bodyBold },
  count: { color: colors.textFaint, fontFamily: typography.family.bodyBold, fontSize: 10 },
  countActive: { color: colors.primary },
});
