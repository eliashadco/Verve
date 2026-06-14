import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { colors, spacing, typography } from '@/lib/theme';

interface UserTrialActionTileProps {
  title: string;
  description: string;
  ctaLabel: string;
  onPress: () => void;
  icon?: ReactNode;
  badge?: string;
}

export function UserTrialActionTile({
  title,
  description,
  ctaLabel,
  onPress,
  icon,
  badge,
}: UserTrialActionTileProps) {
  return (
    <Pressable onPress={onPress}>
      <GlassCard padding={spacing.md} style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconSlot}>{icon}</View>
          {badge ? <Badge label={badge} tone="neutral" /> : null}
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <Text style={styles.cta}>{ctaLabel}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconSlot: {
    minWidth: 28,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { gap: spacing.xs },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
  },
  description: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
  cta: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
});
