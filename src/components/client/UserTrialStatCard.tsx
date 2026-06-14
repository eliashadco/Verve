import { StyleSheet, Text } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { colors, spacing, typography } from '@/lib/theme';

interface UserTrialStatCardProps {
  label: string;
  value: string;
  meta?: string;
  tone?: 'primary' | 'neutral' | 'warning' | 'danger';
}

export function UserTrialStatCard({
  label,
  value,
  meta,
  tone = 'neutral',
}: UserTrialStatCardProps) {
  const accent =
    tone === 'primary'
      ? colors.primary
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.danger
          : colors.textStrong;

  return (
    <GlassCard style={styles.card} padding={spacing.md}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.label,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: typography.family.heading,
    fontSize: typography.size.xxl,
    color: colors.textStrong,
  },
  meta: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
});
