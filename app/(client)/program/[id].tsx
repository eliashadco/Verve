import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

import { useAuth } from '@/auth/AuthProvider';
import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ScreenContainer } from '@/components/ScreenContainer';
import { MuscleHeatmapLite } from '@/components/client/MuscleHeatmapLite';
import { ProgramCurrentHero } from '@/components/client/ProgramCurrentHero';
import { ProgramDayChips } from '@/components/client/ProgramDayChips';
import { ExerciseDetailSheet } from '@/features/exercise/ExerciseDetailSheet';
import { useExercises } from '@/hooks/useExercises';
import { usePrograms } from '@/hooks/usePrograms';
import { useProgressStats } from '@/hooks/useProgressStats';
import { useAdherence } from '@/hooks/useAdherence';
import { computeHeroGamification } from '@/lib/programHeroModel';
import { useTranslation } from '@/lib/i18n';
import { colors, layout, radii, shadows, typography } from '@/lib/theme';
import type { Exercise, Program } from '@/types/database';

export default function ProgramDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const { programs, loading, error, refresh } = usePrograms(profile?.id ?? null, 'client');
  const progress = useProgressStats(profile?.id ?? null);
  const { entries, completedVolume } = useAdherence(profile?.id ?? null, 200, programs);
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [activeDayChip, setActiveDayChip] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const program = useMemo<Program | null>(
    () => programs.find((candidate) => candidate.id === id) ?? null,
    [programs, id],
  );

  const programHistory = useMemo(
    () => (program ? progress.data.history.filter((item) => item.programName === program.name) : []),
    [program, progress.data.history],
  );
  const gamify = useMemo(() => computeHeroGamification(programHistory), [programHistory]);
  const lastUsedLabel = programHistory[0]
    ? format(parseISO(programHistory[0].createdAt), 'd MMM')
    : t('userTrial.programs.lastUsedNone');
  const currentStreak = getProgramStreak(programHistory);
  const bestStreak = Math.max(currentStreak, programHistory.length);

  const exerciseIds = useMemo(() => {
    if (!program) return [];
    const ids = new Set<string>();
    program.days.forEach((day) => day.exercises.forEach((exercise) => ids.add(exercise.exerciseId)));
    return Array.from(ids);
  }, [program]);

  const { exercises } = useExercises(exerciseIds);

  const toggleDay = (dayIndex: number) => {
    // Roadmap P-1.2 explicitly requires LayoutAnimation for this interaction.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDays((prev) => ({ ...prev, [dayIndex]: !prev[dayIndex] }));
  };

  const summary = useMemo(() => {
    if (!program) return { days: 0, exercises: 0, sets: 0, weekSessions: 0 };
    const rows = program.days.flatMap((day) => day.exercises ?? []);
    const sets = rows.reduce((sum, ex) => sum + (Number(ex.sets) || 0), 0);
    return {
      days: program.days.length,
      exercises: rows.length,
      sets,
      weekSessions: program.days.filter((day) => day.exercises.length > 0).length,
    };
  }, [program]);

  const topTargets = useMemo(() => {
    if (!program) return [];
    const counts = new Map<string, number>();
    program.days.forEach((day) =>
      day.exercises.forEach((exercise) => {
        const def = exercises[exercise.exerciseId];
        (def?.primary_muscles ?? []).forEach((muscle) => {
          counts.set(muscle.muscle, (counts.get(muscle.muscle) ?? 0) + 1);
        });
      }),
    );
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([muscle]) => muscle);
  }, [program, exercises]);

  const handleOpenAiMenu = () => {
    Alert.alert(
      t('userTrial.programs.aiTools') || 'AI Optimization Tools',
      undefined,
      [
        {
          text: t('userTrial.programs.generateWithAi') || 'Generate with AI',
          onPress: () => Alert.alert(t('userTrial.programs.generateWithAi'), t('userTrial.programs.generateDisabledBody')),
        },
        {
          text: t('userTrial.programs.autoBalance') || 'Auto Balance Volume',
          onPress: () => Alert.alert(t('userTrial.programs.autoBalance'), t('userTrial.programs.balancePreviewBody')),
        },
        {
          text: t('userTrial.programs.suggestProgression') || 'Suggest Progression',
          onPress: () => Alert.alert(t('userTrial.programs.suggestProgression'), t('userTrial.programs.progressionPreviewBody')),
        },
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  if (loading) return <LoadingScreen label={t('loading.program')} />;
  if (error) {
    return (
      <ScreenContainer>
        <Header title={t('screens.programDetailClient.headerFallback')} />
        <GlassCard>
          <Text style={styles.errorText}>{t('errors.loadFailed')}</Text>
          <View style={{ height: 12 }} />
          <Pressable onPress={() => void refresh()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('errors.retry')}</Text>
          </Pressable>
        </GlassCard>
      </ScreenContainer>
    );
  }
  if (!program) {
    return (
      <ScreenContainer>
        <Header title={t('screens.programDetailClient.headerFallback')} />
        <Text style={styles.notFoundText}>{t('screens.programDetailClient.notFound')}</Text>
      </ScreenContainer>
    );
  }

  const exFallback = t('common.exercise');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        {/* Sleek Header Bar with Back Button & Ellipsis Menu */}
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel={t('common.back')}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>
          
          <Pressable
            onPress={handleOpenAiMenu}
            style={styles.ellipsisBtn}
            accessibilityLabel="AI Optimization Options"
          >
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <ProgramCurrentHero
          kicker={t('userTrial.programs.currentFitnessPlan')}
          name={program.name}
          meta={t('userTrial.programs.phaseMeta', {
            focus: program.focus ?? t('userTrial.programs.generalFallback'),
            phase: program.phase ?? t('userTrial.programs.buildFallback'),
          })}
          status={program.status}
          days={summary.days}
          exercises={summary.exercises}
          sets={summary.sets}
          weekSessions={summary.weekSessions}
          lastUsedLabel={lastUsedLabel}
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          level={gamify.level}
          totalXp={gamify.totalXp}
          levelPct={gamify.levelPct}
          xpToNext={gamify.xpToNext}
          milestoneToGo={gamify.milestoneToGo}
          nextMilestoneTarget={gamify.nextMilestoneTarget}
        />

        {/* Prominent Edit Program in Builder Button */}
        <Pressable
          style={styles.editProgramBtn}
          onPress={() => router.push({ pathname: '/(client)/program/builder', params: { id: program.id } })}
          accessibilityLabel="Open Program Builder"
        >
          <Ionicons name="create-outline" size={18} color={colors.bgApp} />
          <Text style={styles.editProgramBtnText}>Edit Program in Builder</Text>
        </Pressable>

        <ProgramDayChips days={program.days} activeIndex={activeDayChip} onPressDay={setActiveDayChip} />

        {program.days.length === 0 ? (
          <GlassCard>
            <Text style={styles.notFoundText}>{t('screens.programDetailClient.noDays')}</Text>
          </GlassCard>
        ) : (
          program.days.map((day, dayIndex) => (
            <GlassCard key={dayIndex} style={styles.dayCard}>
              <Pressable
                onPress={() => toggleDay(dayIndex)}
                style={styles.dayHeader}
                accessibilityLabel={t('screens.programDetailClient.toggleDayA11y', { n: String(dayIndex + 1) })}
              >
                <View style={styles.dayHeaderLeft}>
                  <Text style={styles.dayLabel}>{t('livePicker.day', { n: dayIndex + 1 })}</Text>
                  <Text style={styles.dayTitle}>{day.label}</Text>
                </View>
                <Ionicons
                  name={expandedDays[dayIndex] ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>

              {expandedDays[dayIndex] ? (
                day.exercises.map((exercise, index) => {
                  const definition = exercises[exercise.exerciseId];
                  const nameForA11y = definition?.name ?? exFallback;
                  return (
                    <View key={`${exercise.exerciseId}-${index}`} style={styles.exerciseRow}>
                      <View style={styles.exerciseBody}>
                        <Pressable
                          onPress={() => setSelectedExercise(definition ?? null)}
                          disabled={!definition}
                          accessibilityLabel={t('screens.programDetailClient.openExerciseA11y', { name: nameForA11y })}
                        >
                          <Text style={[styles.exerciseName, definition && styles.exerciseNameTap]}>
                            {definition?.name ?? exFallback}
                          </Text>
                        </Pressable>
                        <Text style={styles.exerciseMeta}>
                          {exercise.sets} × {exercise.reps}
                          {exercise.rir != null ? ` · RIR ${exercise.rir}` : ''}
                          {exercise.restSeconds
                            ? ` · ${t('liveSession.restSegment', { seconds: exercise.restSeconds })}`
                            : ''}
                        </Text>
                      </View>
                      <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
                    </View>
                  );
                })
              ) : (
                <Text style={styles.collapsedHint}>
                  {t('screens.programDetailClient.exercisesCount', { count: day.exercises.length })}
                </Text>
              )}

              {/* Integrated card footer CTA button */}
              <View style={styles.cardSeparator} />
              <Link href={`/(client)/live/${program.id}/${dayIndex}`} asChild>
                <Pressable
                  style={styles.cardFooterBtn}
                  accessibilityLabel={t('screens.programDetailClient.startDayA11y', { n: String(dayIndex + 1) })}
                >
                  <Text style={styles.cardFooterBtnText}>{t('screens.programDetailClient.startDay')}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </Pressable>
              </Link>
            </GlassCard>
          ))
        )}
        <MuscleHeatmapLite currentProgram={program} completedVolume={completedVolume} entries={entries} />
        <ExerciseDetailSheet
          visible={Boolean(selectedExercise)}
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      </ScreenContainer>
    </>
  );
}

function getProgramStreak(history: { createdAt: string }[]) {
  const days = new Set(history.map((item) => format(parseISO(item.createdAt), 'yyyy-MM-dd')));
  let streak = 0;
  const cursor = new Date();
  while (days.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ellipsisBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface2,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.primary, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xxl,
    marginTop: 4,
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  dayCard: { gap: 12 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  dayHeaderLeft: { flex: 1, flexDirection: 'column', alignItems: 'flex-start', gap: 2 },
  dayLabel: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  dayTitle: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.base, flex: 1 },
  collapsedHint: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    paddingVertical: 2,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    borderColor: colors.borderSubtle,
    borderWidth: 1,
    marginBottom: 6,
  },
  exerciseBody: { flex: 1, marginRight: 8 },
  exerciseName: { color: colors.textStrong, fontFamily: typography.family.bodyMedium, fontSize: typography.size.base },
  exerciseNameTap: { textDecorationLine: 'underline', textDecorationColor: colors.primary },
  exerciseMeta: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
  editProgramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderColor: colors.primaryBorderStrong,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    marginVertical: 8,
    ...shadows.xs,
  },
  editProgramBtnText: {
    color: colors.bgApp,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    letterSpacing: 0.2,
  },
  cardSeparator: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: -layout.cardPad,
    marginTop: 6,
  },
  cardFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: layout.cardPad,
    marginHorizontal: -layout.cardPad,
    marginBottom: -layout.cardPad,
    borderBottomLeftRadius: radii.md,
    borderBottomRightRadius: radii.md,
    backgroundColor: colors.surfaceHover,
  },
  cardFooterBtnText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  notFoundText: { color: colors.textMuted },
  errorText: { color: colors.danger, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 999,
    backgroundColor: colors.primaryDim,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  builderTitle: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
});
