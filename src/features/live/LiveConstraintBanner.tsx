import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { colors, radii, spacing, typography } from '@/lib/theme';
import type { ClinicalConstraint } from '@/types/database';

interface LiveConstraintBannerProps {
  constraints: (ClinicalConstraint & { physio_name?: string | null })[];
  onSwapExercise: () => void;
}

/**
 * Compact red-bordered card shown during live sessions when the client has
 * active clinical constraints. Matches the concept's "RESTRICTED" card.
 */
export function LiveConstraintBanner({ constraints, onSwapExercise }: LiveConstraintBannerProps) {
  if (!constraints || constraints.length === 0) return null;

  // Show the most relevant (first) constraint prominently
  const primary = constraints[0];
  const tags = [primary.value, primary.notes]
    .filter(Boolean)
    .flatMap((v) => v!.split(',').map((t) => t.trim()))
    .filter((t) => t.length > 0 && t.length < 30)
    .slice(0, 3);

  const physioName = primary.physio_name || 'Physiotherapist';
  const dateStr = primary.created_at
    ? new Date(primary.created_at).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
    : '';

  return (
    <GlassCard style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Ionicons name="shield-half" size={16} color={colors.danger} />
          <Badge label="RESTRICTED" tone="danger" />
          <Text style={styles.title} numberOfLines={1}>
            {primary.body_region ?? primary.target} — {primary.constraint_type}
          </Text>
        </View>
        <Pressable onPress={onSwapExercise} style={styles.swapBtn}>
          <Ionicons name="swap-horizontal" size={12} color={colors.primary} />
          <Text style={styles.swapText}>Swap Ex</Text>
        </Pressable>
      </View>

      {/* Tag pills */}
      {tags.length > 0 && (
        <View style={styles.tagRow}>
          {tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Ionicons name="alert-circle" size={10} color={colors.accentAmber} />
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Attribution */}
      <View style={styles.footer}>
        <Ionicons name="person-outline" size={10} color={colors.textFaint} />
        <Text style={styles.attribution}>
          {physioName}{dateStr ? ` · Updated ${dateStr}` : ''}
        </Text>
        <Badge label="Physio" tone="clinical" />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    flex: 1,
  },
  swapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
  },
  swapText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
  },
  tagText: {
    color: colors.textSub,
    fontFamily: typography.family.bodySemi,
    fontSize: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 6,
  },
  attribution: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: 10,
    flex: 1,
  },
});
