import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { UserTrialProgressBar } from '@/components/client/UserTrialProgressBar';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface ProgramCurrentHeroProps {
  name: string;
  kicker: string;
  meta: string;
  status: string;
  days: number;
  exercises: number;
  sets: number;
  weekSessions: number;
  lastUsedLabel: string;
  currentStreak: number;
  bestStreak: number;
  level: number;
  totalXp: number;
  levelPct: number;
  xpToNext: number;
  milestoneToGo: number;
  nextMilestoneTarget: number;
  children?: ReactNode;
}

export function ProgramCurrentHero({
  name,
  kicker,
  meta,
  status,
  days,
  exercises,
  sets,
  weekSessions,
  lastUsedLabel,
  currentStreak,
  bestStreak,
  level,
  totalXp,
  levelPct,
  xpToNext,
  milestoneToGo,
  nextMilestoneTarget,
  children,
}: ProgramCurrentHeroProps) {
  const { t } = useTranslation();

  return (
    <GlassCard variant="hero" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        <View style={styles.lastUsed}>
          <Text style={styles.lastUsedLabel}>{t('userTrial.programs.lastUsed')}</Text>
          <Text style={styles.lastUsedValue}>{lastUsedLabel}</Text>
        </View>
      </View>
      <View style={styles.badges}>
        <Badge label={status} tone={status === 'active' ? 'primary' : 'neutral'} />
        <Badge label={t('userTrial.programs.heroLevelBadge', { level, xp: totalXp })} tone="primary" />
      </View>
      <View style={styles.stats}>
        <Stat label={t('userTrial.programs.statDays')} value={`${days}`} />
        <Stat label={t('userTrial.programs.statExercises')} value={`${exercises}`} />
        <Stat label={t('userTrial.programs.statSets')} value={`${sets}`} />
        <Stat label={t('userTrial.programs.statWeekSessions')} value={`${weekSessions}`} />
      </View>
      <View style={styles.gamifyBlock}>
        <Text style={styles.milestoneLine}>
          {t('userTrial.programs.heroMilestoneLine', {
            current: nextMilestoneTarget - milestoneToGo,
            target: nextMilestoneTarget,
            remaining: milestoneToGo,
          })}
        </Text>
        <UserTrialProgressBar
          label={t('userTrial.programs.heroXpProgressLabel', { level })}
          valueLabel={t('userTrial.programs.heroXpToNext', { xp: xpToNext, pct: levelPct })}
          progress={levelPct}
        />
      </View>
      <View style={styles.streakRow}>
        <Stat label={t('userTrial.programs.currentStreak')} value={`${currentStreak}`} />
        <Stat label={t('userTrial.programs.bestStreak')} value={`${bestStreak}`} />
      </View>
      {children}
    </GlassCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  headerRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between', alignItems: 'flex-start' },
  headerCopy: { flex: 1 },
  kicker: {
    color: colors.textFaint,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    letterSpacing: typography.letterSpacing.label,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xl,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  lastUsed: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'flex-end',
  },
  lastUsedLabel: { color: colors.textFaint, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs, textTransform: 'uppercase' },
  lastUsedValue: { color: colors.textSub, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs, marginTop: 2 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
  gamifyBlock: { gap: spacing.xs },
  milestoneLine: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
  streakRow: { flexDirection: 'row', gap: spacing.xs },
  statBox: {
    flexGrow: 1,
    minWidth: '22%',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    padding: spacing.sm,
  },
  statValue: { color: colors.primary, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  statLabel: { color: colors.textFaint, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs, marginTop: 2 },
});
