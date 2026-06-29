import { useState, useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { useTranslation } from '@/lib/i18n';
import { colors, spacing, typography, radii } from '@/lib/theme';
import { toMuscleKey, getMuscleLabel } from '@/lib/programBuilder/muscles';
import { computeVolumeMap } from '@/lib/programBuilder/volume';

interface MuscleHeatmapLiteProps {
  currentProgram: any;
  completedVolume: Record<string, number>;
  entries: any[];
}

export function MuscleHeatmapLite({
  currentProgram,
  completedVolume,
  entries,
}: MuscleHeatmapLiteProps) {
  const { t } = useTranslation();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  // 1. Compute planned sets per muscle
  const plannedVolume = useMemo(() => {
    if (!currentProgram?.days) return {};
    return computeVolumeMap(currentProgram.days);
  }, [currentProgram]);

  // 2. Get target sets per muscle (from program targets)
  const targetMap = useMemo(() => {
    return currentProgram?.targets || {};
  }, [currentProgram]);

  // 3. Collect all unique muscle keys that have planned, completed, or target volume
  const activeMuscles = useMemo(() => {
    const keys = new Set([
      ...Object.keys(plannedVolume),
      ...Object.keys(completedVolume),
      ...Object.keys(targetMap),
    ]);
    return Array.from(keys).filter(Boolean);
  }, [plannedVolume, completedVolume, targetMap]);

  // Get status color for each muscle card
  const getMuscleStatus = (muscleKey: string) => {
    const completed = completedVolume[muscleKey] || 0;
    const planned = plannedVolume[muscleKey] || 0;
    const target = targetMap[muscleKey] || planned || 0;

    if (completed === 0 && planned > 0) {
      return {
        color: colors.primaryDim, // Semi-transparent green (planned only)
        label: t('userTrial.programs.statusPlanned') || 'Planned Only',
        status: 'planned',
      };
    }
    if (completed > 0) {
      if (target > 0 && completed > target) {
        return {
          color: colors.warning, // Amber (overload warning)
          label: t('userTrial.programs.statusOverload') || 'Over Target',
          status: 'overload',
        };
      }
      return {
        color: colors.primary, // Solid green (completed matching target)
        label: t('userTrial.programs.statusCompleted') || 'Completed',
        status: 'completed',
      };
    }
    return {
      color: colors.surfaceHover,
      label: t('userTrial.programs.statusNone') || 'No Activity',
      status: 'none',
    };
  };

  // Detailed info for selected muscle modal
  const muscleDetails = useMemo(() => {
    if (!selectedMuscle) return null;

    // Filter exercises in program contributing to this muscle
    const contributingExercises: any[] = [];
    if (currentProgram?.days) {
      currentProgram.days.forEach((day: any, dayIdx: number) => {
        (day.exercises || []).forEach((ex: any) => {
          const isDirect = toMuscleKey(ex.muscle) === selectedMuscle;
          const contributionFactor = ex._muscleContributions?.[selectedMuscle] || (isDirect ? 1 : 0);

          if (contributionFactor > 0) {
            contributingExercises.push({
              name: ex.name,
              dayLabel: day.label || `Day ${dayIdx + 1}`,
              plannedSets: ex.sets || 0,
              contribution: contributionFactor,
              exerciseId: ex.exerciseId,
            });
          }
        });
      });
    }

    // Filter logs in past 7 days contributing to this muscle
    const completedWorkoutsList: any[] = [];
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    entries.forEach((entry) => {
      const dateStr = entry.completed_at || entry.created_at;
      if (!dateStr || new Date(dateStr).getTime() < oneWeekAgo) return;

      (entry.exercises_logged || []).forEach((exLog: any) => {
        if (exLog.skipped) return;
        
        // Find if this logged exercise contributes to the selected muscle
        const match = contributingExercises.find((ex) => ex.exerciseId === exLog.exerciseId);
        const doneSets = exLog.setsCompleted || (exLog.repsPerSet ? exLog.repsPerSet.length : 0);
        
        if (match && doneSets > 0) {
          completedWorkoutsList.push({
            name: match.name,
            setsCompleted: doneSets,
            date: new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            contribution: match.contribution,
          });
        }
      });
    });

    const planned = plannedVolume[selectedMuscle] || 0;
    const completed = completedVolume[selectedMuscle] || 0;
    const target = targetMap[selectedMuscle] || planned || 0;

    return {
      name: getMuscleLabel(selectedMuscle),
      planned,
      completed,
      target,
      contributingExercises,
      completedWorkoutsList,
    };
  }, [selectedMuscle, currentProgram, entries, plannedVolume, completedVolume, targetMap]);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('userTrial.programs.adherenceHeatmap') || 'Completed vs Planned Target'}</Text>
        <Ionicons name="analytics" size={16} color={colors.primary} />
      </View>

      {/* Grid of Muscle Cards */}
      {activeMuscles.length === 0 ? (
        <Text style={styles.emptyText}>
          {t('userTrial.programs.noActiveMuscles') || 'No planned muscles in this program.'}
        </Text>
      ) : (
        <View style={styles.grid}>
          {activeMuscles.map((muscleKey) => {
            const status = getMuscleStatus(muscleKey);
            const completed = completedVolume[muscleKey] || 0;
            const planned = plannedVolume[muscleKey] || 0;
            const target = targetMap[muscleKey] || planned || 0;

            return (
              <Pressable
                key={muscleKey}
                style={[
                  styles.muscleCard,
                  { borderLeftColor: status.color, borderLeftWidth: 3 },
                ]}
                onPress={() => setSelectedMuscle(muscleKey)}
              >
                <View style={styles.muscleInfo}>
                  <Text style={styles.muscleName}>{getMuscleLabel(muscleKey)}</Text>
                  <Text style={styles.muscleSets}>
                    {completed} / {target} sets
                  </Text>
                </View>
                <View
                  style={[styles.statusDot, { backgroundColor: status.color }]}
                />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Legend indicator strip */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primaryDim }]} />
          <Text style={styles.legendLabel}>{t('userTrial.programs.legendPlanned') || 'Planned (0 done)'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendLabel}>{t('userTrial.programs.legendCompleted') || 'Completed'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendLabel}>{t('userTrial.programs.legendOverload') || 'Over Target'}</Text>
        </View>
      </View>

      {/* Detail Modal */}
      <Modal
        visible={selectedMuscle !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMuscle(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {muscleDetails?.name} {t('userTrial.programs.detailsTitle') || 'Volume Detail'}
              </Text>
              <Pressable
                onPress={() => setSelectedMuscle(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={20} color={colors.textStrong} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Summary stat comparison */}
              <View style={styles.compareRow}>
                <View style={styles.compareBox}>
                  <Text style={styles.compareLabel}>{t('userTrial.programs.completedSets') || 'Completed sets'}</Text>
                  <Text style={[styles.compareVal, { color: colors.primary }]}>
                    {muscleDetails?.completed}
                  </Text>
                </View>
                <View style={styles.compareBox}>
                  <Text style={styles.compareLabel}>{t('userTrial.programs.targetSets') || 'Target sets'}</Text>
                  <Text style={[styles.compareVal, { color: colors.textStrong }]}>
                    {muscleDetails?.target}
                  </Text>
                </View>
              </View>

              {/* Planned Exercises Section */}
              <Text style={styles.sectionHeading}>
                {t('userTrial.programs.plannedWorkouts') || 'Planned Exercises'}
              </Text>
              {muscleDetails?.contributingExercises.length === 0 ? (
                <Text style={styles.emptyTextSub}>
                  {t('userTrial.programs.noPlannedContrib') || 'No planned exercises for this muscle group.'}
                </Text>
              ) : (
                muscleDetails?.contributingExercises.map((ex, idx) => (
                  <View key={idx} style={styles.detailItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailItemName}>{ex.name}</Text>
                      <Text style={styles.detailItemDay}>{ex.dayLabel}</Text>
                    </View>
                    <Text style={styles.detailItemSets}>
                      {ex.plannedSets} sets {ex.contribution < 1 ? `(${Math.round(ex.contribution * 100)}%)` : ''}
                    </Text>
                  </View>
                ))
              )}

              {/* Completed Logs Section */}
              <Text style={[styles.sectionHeading, { marginTop: spacing.md }]}>
                {t('userTrial.programs.recentCompleted') || 'Completed (Past 7 Days)'}
              </Text>
              {muscleDetails?.completedWorkoutsList.length === 0 ? (
                <Text style={styles.emptyTextSub}>
                  {t('userTrial.programs.noRecentCompleted') || 'No workouts logged in the last 7 days.'}
                </Text>
              ) : (
                muscleDetails?.completedWorkoutsList.map((log, idx) => (
                  <View key={idx} style={styles.detailItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailItemName}>{log.name}</Text>
                      <Text style={styles.detailItemDay}>{log.date}</Text>
                    </View>
                    <Text style={[styles.detailItemSets, { color: colors.primary }]}>
                      +{log.setsCompleted} sets
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  muscleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '48%', // Approx 2 columns
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  muscleInfo: {
    flex: 1,
    gap: 2,
  },
  muscleName: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  muscleSets: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: radii.pill,
    marginLeft: 6,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: radii.pill,
  },
  legendLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: 9,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.bgOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
  },
  compareRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  compareBox: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
  },
  compareLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
  compareVal: {
    fontFamily: typography.family.heading,
    fontSize: typography.size.xl,
  },
  sectionHeading: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    marginBottom: spacing.xs,
  },
  emptyTextSub: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    paddingVertical: spacing.xs,
  },
  detailItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface3,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  detailItemName: {
    color: colors.textStrong,
    fontFamily: typography.family.bodySemi,
    fontSize: typography.size.xs,
  },
  detailItemDay: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: 10,
    marginTop: 1,
  },
  detailItemSets: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
});
