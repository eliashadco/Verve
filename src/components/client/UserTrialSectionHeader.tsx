import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { colors, spacing, typography } from '@/lib/theme';

interface UserTrialSectionHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}

export function UserTrialSectionHeader({ title, subtitle, rightSlot }: UserTrialSectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightSlot ? <View>{rightSlot}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
});
