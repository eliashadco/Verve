import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface PrimaryGoalCardProps {
  title: string;
  targetLabel: string;
  milestoneLabel: string;
  milestoneValue: string;
  progressPct: number;
}

/**
 * Matches User trial.html GOAL TRACKER block (overview): green-tint panel, flag badge, 8px progress bar.
 */
export function PrimaryGoalCard({
  title,
  targetLabel,
  milestoneLabel,
  milestoneValue,
  progressPct,
}: PrimaryGoalCardProps) {
  const { t } = useTranslation();
  const pct = Math.max(0, Math.min(100, progressPct));
  return (
    <View style={styles.shell}>
      <View style={styles.leftCluster}>
        <View style={styles.flagCircle}>
          <Ionicons name="flag" size={22} color="#020617" />
        </View>
        <View style={styles.leftCopy}>
          <Text style={styles.kicker}>{t('home.client.primaryGoalKicker')}</Text>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.target}>{targetLabel}</Text>
        </View>
      </View>
      <View style={styles.progressBlock}>
        <View style={styles.progressHeader}>
          <Text style={styles.milestoneLabel}>{milestoneLabel}</Text>
          <Text style={styles.milestoneValue}>{milestoneValue}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  leftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 0,
  },
  flagCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftCopy: {
    gap: 2,
    maxWidth: 220,
  },
  kicker: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
  },
  target: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    marginTop: 2,
  },
  progressBlock: {
    flex: 1,
    minWidth: 200,
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  milestoneLabel: {
    flex: 1,
    color: colors.textStrong,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
  milestoneValue: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
