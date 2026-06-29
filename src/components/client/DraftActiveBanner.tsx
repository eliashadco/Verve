import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface DraftActiveBannerProps {
  draftName: string;
  daysCount: number;
  exercisesCount: number;
  onEditInBuilder: () => void;
  onDismiss: () => void;
}

/**
 * Shown at the top of the Current tab when a saved draft has been promoted
 * via "Use Draft".  Gives the user context that they're viewing a local draft
 * (not their assigned Supabase plan) and provides quick actions.
 */
export function DraftActiveBanner({
  draftName,
  daysCount,
  exercisesCount,
  onEditInBuilder,
  onDismiss,
}: DraftActiveBannerProps) {
  const { t } = useTranslation();

  return (
    <GlassCard style={styles.banner}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="document-text-outline" size={18} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>{draftName}</Text>
              <Badge label={t('userTrial.programs.draftBadge') || 'DRAFT'} tone="warning" />
            </View>
            <Text style={styles.meta}>
              {daysCount} {t('userTrial.programs.daysLabel') || 'days'} · {exercisesCount} {t('common.exercises') || 'exercises'}
            </Text>
          </View>
        </View>
        <Pressable onPress={onDismiss} style={styles.closeBtn} accessibilityLabel="Dismiss draft">
          <Ionicons name="close" size={16} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        <Pressable style={styles.editBtn} onPress={onEditInBuilder}>
          <Ionicons name="create-outline" size={14} color={colors.primary} />
          <Text style={styles.editBtnText}>{t('userTrial.programs.editInBuilder') || 'Edit in Builder'}</Text>
        </Pressable>
        <Pressable style={styles.dismissLink} onPress={onDismiss}>
          <Ionicons name="swap-horizontal" size={14} color={colors.textMuted} />
          <Text style={styles.dismissLinkText}>
            {t('userTrial.programs.switchBackToAssigned') || 'Switch back'}
          </Text>
        </Pressable>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  banner: {
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    backgroundColor: 'rgba(245, 158, 11, 0.04)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.base,
    flexShrink: 1,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 8,
    backgroundColor: colors.primaryDim,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editBtnText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  dismissLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  dismissLinkText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
});
