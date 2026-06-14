import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/theme';

interface HomeWeekStripProps {
  labels: string[];
  activeIndex: number;
}

export function HomeWeekStrip({ labels, activeIndex }: HomeWeekStripProps) {
  return (
    <View style={styles.row}>
      {labels.map((label, index) => {
        const active = index === activeIndex;
        return (
          <View key={`${label}-${index}`} style={[styles.day, active && styles.dayActive]}>
            <Text style={[styles.dayText, active && styles.dayTextActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
    paddingVertical: spacing.xs,
  },
  dayActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
  },
  dayText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  dayTextActive: {
    color: colors.primary,
  },
});
