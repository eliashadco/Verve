import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { useTranslation } from '@/lib/i18n';
import { colors, spacing, typography } from '@/lib/theme';

interface PerformanceAnalyticsProps {
  entries: any[];
  currentProgram: any;
}

export function PerformanceAnalytics({ entries, currentProgram }: PerformanceAnalyticsProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // 1. Filter entries from past 7 days
    const recentEntries = entries.filter((entry) => {
      const dateStr = entry.completed_at || entry.created_at;
      return dateStr && new Date(dateStr).getTime() >= oneWeekAgo;
    });

    const completedWorkouts = recentEntries.length;

    // 2. Compute planned frequency from current program
    const plannedWorkouts = currentProgram
      ? currentProgram.days.filter((day: any) => (day.exercises || []).length > 0).length
      : 0;

    // 3. Compute total completed sets and volume
    let totalCompletedSets = 0;
    let totalVolumeKg = 0;

    recentEntries.forEach((entry) => {
      (entry.exercises_logged || []).forEach((exLog: any) => {
        if (exLog.skipped) return;
        const setsCount = exLog.setsCompleted || (exLog.repsPerSet ? exLog.repsPerSet.length : 0);
        totalCompletedSets += setsCount;

        // Sum volume (reps * weight) for each set
        if (exLog.repsPerSet && exLog.weightKg) {
          const reps = exLog.repsPerSet;
          const weights = exLog.weightKg;
          const length = Math.min(reps.length, weights.length);
          for (let i = 0; i < length; i++) {
            totalVolumeKg += (reps[i] || 0) * (weights[i] || 0);
          }
        }
      });
    });

    // 4. Compute planned sets target in the current program
    let totalPlannedSets = 0;
    if (currentProgram) {
      currentProgram.days.forEach((day: any) => {
        (day.exercises || []).forEach((ex: any) => {
          totalPlannedSets += Number(ex.sets || 0);
        });
      });
    }

    const completionRate = plannedWorkouts > 0 ? (completedWorkouts / plannedWorkouts) * 100 : 0;
    const adherenceRate = totalPlannedSets > 0 ? (totalCompletedSets / totalPlannedSets) * 100 : 0;

    return {
      completedWorkouts,
      plannedWorkouts,
      completionRate: Math.round(completionRate),
      totalCompletedSets,
      totalPlannedSets,
      adherenceRate: Math.round(adherenceRate),
      totalVolumeKg: Math.round(totalVolumeKg),
    };
  }, [entries, currentProgram]);

  return (
    <GlassCard variant="stat" style={styles.card}>
      <Text style={styles.title}>{t('userTrial.programs.performanceAnalytics') || 'Performance Analytics'}</Text>
      
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Ionicons name="checkbox-outline" size={20} color={colors.primary} />
          <Text style={styles.statVal}>
            {stats.completedWorkouts} / {stats.plannedWorkouts}
          </Text>
          <Text style={styles.statLabel}>
            {t('userTrial.programs.completionRate') || 'Weekly Workouts'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Ionicons name="barbell-outline" size={20} color={colors.clinical} />
          <Text style={styles.statVal}>
            {stats.totalCompletedSets} / {stats.totalPlannedSets}
          </Text>
          <Text style={styles.statLabel}>
            {t('userTrial.programs.setAdherence') || 'Sets Adherence'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statBox}>
          <Ionicons name="speedometer-outline" size={20} color={colors.accentAmber} />
          <Text style={styles.statVal}>
            {stats.totalVolumeKg.toLocaleString()} kg
          </Text>
          <Text style={styles.statLabel}>
            {t('userTrial.programs.loadVolume') || 'Volume Moved'}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.md,
    marginTop: 2,
  },
  statLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.borderSubtle,
  },
});
