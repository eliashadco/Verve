import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuth } from '@/auth/AuthProvider';
import { ScreenContainer } from '@/components/ScreenContainer';
import { GlassCard } from '@/components/GlassCard';
import { VerveButton } from '@/components/VerveButton';
import { Badge } from '@/components/Badge';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ExerciseDetailSheet } from '@/features/exercise/ExerciseDetailSheet';
import { LiveExerciseCard } from '@/features/live/LiveExerciseCard';
import { LiveMuscleLoadPanel } from '@/features/live/LiveMuscleLoadPanel';
import { LiveSessionHeader } from '@/features/live/LiveSessionHeader';
import { SubjectiveFeedbackCard } from '@/features/live/SubjectiveFeedbackCard';
import { useExercises } from '@/hooks/useExercises';
import { finishWorkout } from '@/hooks/useAdherence';
import { usePrograms } from '@/hooks/usePrograms';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, typography } from '@/lib/theme';
import type { Program, AdherenceLogExercise, Exercise } from '@/types/database';

interface SetLog {
  reps: string;
  weight: string;
  rir: string;
  done: boolean;
}

interface RestTimerState {
  remainingSeconds: number;
  nextSetIndex: number;
}

export default function LiveSession() {
  const { t } = useTranslation();
  const { programId, dayIndex: dayIndexParam, preEnergy, preSoreness } = useLocalSearchParams<{
    programId: string;
    dayIndex: string;
    preEnergy?: string;
    preSoreness?: string;
  }>();
  const router = useRouter();
  const { profile } = useAuth();
  const dayIndex = Number(dayIndexParam ?? 0);
  const programsQuery = usePrograms(profile?.id ?? null, 'client');

  const [busy, setBusy] = useState(false);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const [logs, setLogs] = useState<Record<number, SetLog[]>>({});
  const [restTimers, setRestTimers] = useState<Record<number, RestTimerState>>({});
  const restIntervalsRef = useRef<Record<number, ReturnType<typeof setInterval> | null>>({});
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  // Initialize painScore based on pre-session soreness
  const initialPainScore = useMemo(() => {
    if (preSoreness === 'mild') return 2;
    if (preSoreness === 'moderate') return 5;
    if (preSoreness === 'severe') return 8;
    return 0;
  }, [preSoreness]);

  const [painScore, setPainScore] = useState(initialPainScore);

  // Initialize notes with energy feedback if present
  const [subjectiveNotes, setSubjectiveNotes] = useState(
    preEnergy ? `Pre-session energy level: ${preEnergy}/10. Soreness: ${preSoreness ?? 'none'}.` : ''
  );

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const program = useMemo<Program | null>(
    () => programsQuery.programs.find((candidate) => candidate.id === programId) ?? null,
    [programsQuery.programs, programId],
  );

  const day = program?.days?.[dayIndex];

  useEffect(() => {
    if (!day) {
      setLogs({});
      return;
    }
    const initial: Record<number, SetLog[]> = {};
    day.exercises.forEach((ex, idx) => {
      initial[idx] = Array.from({ length: ex.sets ?? 3 }, () => ({
        reps: '',
        weight: '',
        rir: '',
        done: false,
      }));
    });
    setLogs(initial);
  }, [day]);

  useEffect(() => {
    const tick = setInterval(() => {
      const startedAt = startedAtRef.current;
      const next = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
      setElapsedSeconds(next);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(restIntervalsRef.current).forEach((interval) => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);

  const exerciseIds = useMemo(() => day?.exercises.map((e) => e.exerciseId) ?? [], [day]);
  const { exercises } = useExercises(exerciseIds);

  const exFallback = t('common.exercise');

  if (programsQuery.loading) return <LoadingScreen label={t('loading.session')} />;
  if (programsQuery.error) {
    return (
      <ScreenContainer>
        <GlassCard>
          <Text style={{ color: colors.danger }}>{t('errors.loadFailed')}</Text>
          <View style={{ height: 12 }} />
          <VerveButton label={t('errors.retry')} variant="ghost" onPress={() => void programsQuery.refresh()} />
        </GlassCard>
      </ScreenContainer>
    );
  }
  if (!program || !day) {
    return (
      <ScreenContainer>
        <Text style={{ color: colors.textMuted }}>{t('liveSession.dayNotFound')}</Text>
      </ScreenContainer>
    );
  }

  const updateSet = (exIdx: number, setIdx: number, field: keyof SetLog, value: string) => {
    setLogs((prev) => {
      const next = { ...prev };
      const sets = [...(next[exIdx] ?? [])];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      next[exIdx] = sets;
      return next;
    });

    if (field === 'reps' || field === 'weight') {
      const ex = day.exercises[exIdx];
      const restSeconds = ex?.restSeconds ?? 0;
      if (restSeconds > 0) {
        const nextSets = logs[exIdx] ?? [];
        const candidate = { ...(nextSets[setIdx] ?? { reps: '', weight: '', rir: '', done: false }), [field]: value };
        const reps = parseInt(candidate.reps, 10);
        const weight = parseFloat(candidate.weight);
        if (!Number.isNaN(reps) && reps > 0 && !Number.isNaN(weight) && weight >= 0) {
          startRestTimer(exIdx, setIdx + 1, restSeconds);
        }
      }
    }
  };

  const addSet = (exIdx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLogs((prev) => {
      const next = { ...prev };
      next[exIdx] = [...(next[exIdx] ?? []), { reps: '', weight: '', rir: '', done: false }];
      return next;
    });
  };

  const startRestTimer = (exIdx: number, nextSetIndex: number, restSeconds: number) => {
    const existing = restIntervalsRef.current[exIdx];
    if (existing) clearInterval(existing);

    setRestTimers((prev) => ({
      ...prev,
      [exIdx]: {
        remainingSeconds: restSeconds,
        nextSetIndex,
      },
    }));

    const interval = setInterval(() => {
      setRestTimers((prev) => {
        const current = prev[exIdx];
        if (!current) return prev;
        const nextRemaining = current.remainingSeconds - 1;
        if (nextRemaining <= 0) {
          if (restIntervalsRef.current[exIdx]) {
            clearInterval(restIntervalsRef.current[exIdx] as ReturnType<typeof setInterval>);
            restIntervalsRef.current[exIdx] = null;
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          const next = { ...prev };
          delete next[exIdx];
          return next;
        }
        return {
          ...prev,
          [exIdx]: { ...current, remainingSeconds: nextRemaining },
        };
      });
    }, 1000);

    restIntervalsRef.current[exIdx] = interval;
  };

  const toggleDone = (exIdx: number, setIdx: number) => {
    setLogs((prev) => {
      const next = { ...prev };
      const sets = [...(next[exIdx] ?? [])];
      const row = sets[setIdx];
      if (!row) return prev;
      sets[setIdx] = { ...row, done: !row.done };
      next[exIdx] = sets;
      return next;
    });
  };

  const openVideo = async (videoUrl: string | null | undefined) => {
    if (!videoUrl) {
      Alert.alert(t('alerts.live.noVideo'), t('alerts.live.noVideoBody'));
      return;
    }
    try {
      const supported = await Linking.canOpenURL(videoUrl);
      if (!supported) {
        Alert.alert(t('alerts.live.cannotOpen'), t('alerts.live.cannotOpenBody'));
        return;
      }
      await Linking.openURL(videoUrl);
    } catch {
      Alert.alert(t('alerts.live.cannotOpen'), t('alerts.live.cannotOpenGeneric'));
    }
  };

  const onFinish = async () => {
    if (!profile) return;
    const exercisesLogged: AdherenceLogExercise[] = day.exercises.map((ex, exIdx) => {
      const sets = logs[exIdx] ?? [];
      const repsPerSet: number[] = [];
      const weightKg: number[] = [];
      const rirReported: number[] = [];
      let setsCompleted = 0;
      sets.forEach((s) => {
        const r = parseInt(s.reps, 10);
        const w = parseFloat(s.weight);
        const rir = parseInt(s.rir, 10);
        if (!Number.isNaN(r) && r > 0) {
          setsCompleted += 1;
          repsPerSet.push(r);
          weightKg.push(Number.isNaN(w) ? 0 : w);
          if (!Number.isNaN(rir)) rirReported.push(rir);
        }
      });
      return {
        exerciseId: ex.exerciseId,
        setsCompleted,
        repsPerSet,
        weightKg,
        rirReported: rirReported.length ? rirReported : undefined,
        painReported: painScore > 0,
        skipped: setsCompleted === 0,
        skipReason: setsCompleted === 0 ? subjectiveNotes || 'No sets logged' : null,
      };
    });

    setBusy(true);
    try {
      const startedAt = startedAtRef.current;
      const startMs = new Date(startedAt).getTime();
      await finishWorkout({
        clientId: profile.id,
        programId: program.id,
        dayIndex,
        startedAt,
        exercises: exercisesLogged,
        durationSeconds: Math.max(0, Math.round((Date.now() - startMs) / 1000)),
        wearableSource: null,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(t('alerts.live.saved'), t('alerts.live.savedBody'), [
        { text: t('common.done'), onPress: () => router.replace('/(client)/home') },
      ]);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('alerts.live.saveErrorFallback');
      Alert.alert(t('alerts.live.saveFail'), message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        <LiveSessionHeader
          programName={program.name}
          focusLabel={program.focus}
          dayLabel={day.label}
          readinessLabel={`Readiness ${painScore > 6 ? 'Low' : 'Ready'}`}
          heartRateLabel="HR 122 bpm"
          elapsedLabel={`${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`}
          onBack={() => router.back()}
          onTogglePace={() => Alert.alert('Pace toggle', 'Metronome/pace control is coming soon.')}
        />

        {day.exercises.map((ex, exIdx) => {
          const def = exercises[ex.exerciseId];
          const sets = logs[exIdx] ?? [];
          const nameForA11y = def?.name ?? exFallback;
          const rest = restTimers[exIdx];
          return (
            <View key={`${ex.exerciseId}-${exIdx}`}>
              <LiveExerciseCard
                indexLabel={`${ex.supersetGroup ?? 'A'}${exIdx + 1}`}
                name={def?.name ?? exFallback}
                meta={`${ex.sets} × ${ex.reps}${ex.tempo ? ` · Tempo ${ex.tempo}` : ''}`}
                notes={ex.notes}
                sets={sets}
                restLabel={rest ? t('liveSession.rest', { seconds: rest.remainingSeconds }) : null}
                onChangeSet={(setIdx, field, value) => {
                  setActiveExerciseIndex(exIdx);
                  updateSet(exIdx, setIdx, field, value);
                }}
                onToggleSetDone={(setIdx) => {
                  setActiveExerciseIndex(exIdx);
                  toggleDone(exIdx, setIdx);
                }}
                onAddSet={() => addSet(exIdx)}
                onCopyPreviousSet={() => {
                  const exSets = logs[exIdx] ?? [];
                  const previous = exSets[exSets.length - 2];
                  if (!previous) return;
                  updateSet(exIdx, exSets.length - 1, 'reps', previous.reps);
                  updateSet(exIdx, exSets.length - 1, 'weight', previous.weight);
                  updateSet(exIdx, exSets.length - 1, 'rir', previous.rir);
                }}
                onNextExercise={() => setActiveExerciseIndex((current) => Math.min(day.exercises.length - 1, current + 1))}
              />
              <Pressable
                style={styles.videoBtn}
                onPress={() => openVideo(def?.video_url)}
                accessibilityLabel={t('liveSession.openVideoA11y')}
              >
                <Text style={styles.videoBtnText}>Open video</Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedExercise(def ?? null)}
                disabled={!def}
                accessibilityLabel={t('screens.programDetailClient.openExerciseA11y', { name: nameForA11y })}
              >
                <Text style={[styles.exName, def && styles.exNameTap]}>{t('common.details')}</Text>
              </Pressable>
            </View>
          );
        })}

        <LiveMuscleLoadPanel
          rows={Object.entries(
            day.exercises.reduce<Record<string, number>>((acc, ex, idx) => {
              const def = exercises[ex.exerciseId];
              const setsDone = (logs[idx] ?? []).filter((s) => s.done).length;
              (def?.primary_muscles ?? []).forEach((m) => {
                acc[m.muscle] = (acc[m.muscle] ?? 0) + Math.round((m.contribution ?? 0) * Math.max(1, setsDone));
              });
              return acc;
            }, {}),
          )
            .slice(0, 5)
            .map(([muscle, load]) => ({ muscle, load }))}
        />
        <SubjectiveFeedbackCard
          painScore={painScore}
          notes={subjectiveNotes}
          onChangePain={setPainScore}
          onChangeNotes={setSubjectiveNotes}
        />

        <VerveButton label={t('liveSession.finishWorkout')} onPress={onFinish} loading={busy} />
        <ExerciseDetailSheet
          visible={Boolean(selectedExercise)}
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      </ScreenContainer>
    </>
  );
}

function NumericCell({
  value,
  onChange,
  editable,
}: {
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
}) {
  const { t } = useTranslation();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      keyboardType="numeric"
      editable={editable}
      placeholder={t('liveSession.numericPlaceholder')}
      placeholderTextColor={colors.textFaint}
      style={[cellStyles.input, !editable && cellStyles.inputDisabled]}
    />
  );
}

const cellStyles = StyleSheet.create({
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: colors.textStrong,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.base,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  inputDisabled: {
    opacity: 0.5,
  },
});

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.primary, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xxl,
    marginTop: 8,
  },
  sub: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
  exName: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  exMeta: { color: colors.textMuted, fontSize: typography.size.sm },
  exNameTap: { textDecorationLine: 'underline', textDecorationColor: colors.primary },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  videoBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderAccent,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBtnText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    marginLeft: 1,
  },
  tableHead: { flexDirection: 'row', alignItems: 'center', paddingTop: 4, paddingBottom: 6 },
  tableCell: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  doneHeader: {
    width: 32,
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginHorizontal: 4,
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, position: 'relative' },
  tableRowDone: { opacity: 0.55 },
  doneToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  doneToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  restTimerPill: {
    position: 'absolute',
    top: -12,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
  },
  restTimerText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  addSet: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 4 },
  addSetText: { color: colors.primary, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
});
