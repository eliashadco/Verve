import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { VerveButton } from '@/components/VerveButton';
import { colors, spacing, typography } from '@/lib/theme';

interface UserTrialEmptyBlockProps {
  title: string;
  description: string;
  ctaLabel?: string;
  onPressCta?: () => void;
  icon?: ReactNode;
}

export function UserTrialEmptyBlock({
  title,
  description,
  ctaLabel,
  onPressCta,
  icon,
}: UserTrialEmptyBlockProps) {
  return (
    <View style={styles.root}>
      {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {ctaLabel && onPressCta ? (
        <VerveButton label={ctaLabel} onPress={onPressCta} variant="ghost" size="sm" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surface2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
    textAlign: 'center',
  },
  description: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
});
