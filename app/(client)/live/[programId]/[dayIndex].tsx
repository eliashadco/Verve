import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
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
import { LiveConstraintBanner } from '@/features/live/LiveConstraintBanner';
import { LiveMuscleLoadPanel } from '@/features/live/LiveMuscleLoadPanel';
import { LiveSessionHeader } from '@/features/live/LiveSessionHeader';
import { SubjectiveFeedbackCard } from '@/features/live/SubjectiveFeedbackCard';
import { useExercises } from '@/hooks/useExercises';
import { usePrograms } from '@/hooks/usePrograms';
import { useConstraints } from '@/hooks/useConstraints';
import { useActiveDraftStore } from '@/hooks/useActiveDraftStore';
import { emitPainMarker } from '@/lib/painMarkers';
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
  const [paused, setPaused] = useState(false);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const [logs, setLogs] = useState<Record<number, SetLog[]>>({});
  const [restTimers, setRestTimers] = useState<Record<number, RestTimerState>>({});
  const restIntervalsRef = useRef<Record<number, ReturnType<typeof setInterval> | null>>({});
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);

  const activeDraft = useActiveDraftStore((s) => s.activeDraft);
  const clearActiveSession = useActiveDraftStore((s) => s.endSession);

  // Constraints
  const { data: constraints } = useConstraints(profile?.id ?? null);

  // Initialize painScore based on pre-session soreness
  const initialPainScore = useMemo(() => {
    if (preSoreness === 'mild') return 2;
    if (preSoreness === 'moderate') return 5;
    if (preSoreness === 'severe') return 8;
    return 0;
  }, [preSoreness]);

  const [painScore, setPainScore] = useState(initialPainScore);
  const [subjectiveNotes, setSubjectiveNotes] = useState(
    preEnergy ? `Pre-session energy level: ${preEnergy}/10. Soreness: ${preSoreness ?? 'none'}.` : ''
  );
  /** Guards against re-sending the pain marker for the same exercise within one session. */
  const [painMarkerSent, setPainMarkerSent] = useState(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const program = useMemo<Program | null>(() => {
    if (activeDraft && activeDraft.id === programId) return activeDraft;
    return programsQuery.programs.find((candidate) => candidate.id === programId) ?? null;
  }, [programsQuery.programs, programId, activeDraft]);

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

  // Elapsed timer (respects pause)
  useEffect(() => {
    if (paused) return;
    const tick = setInterval(() => {
      const startedAt = startedAtRef.current;
      const next = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
      setElapsedSeconds(next);
    }, 1000);
    return () => clearInterval(tick);
  }, [paused]);

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

  // ── Computed values for load panel ──
  const totalVolumeKg = useMemo(() => {
    let vol = 0;
    Object.entries(logs).forEach(([, sets]) => {
      sets.forEach((s) => {
        if (s.done) {
          const r = parseInt(s.reps, 10);
          const w = parseFloat(s.weight);
          if (!Number.isNaN(r) && !Number.isNaN(w)) vol += r * w;
        }
      });
    });
    return Math.round(vol);
  }, [logs]);

  const muscleLoadRows = useMemo(() => {
    if (!day) return [];
    const targets: Record<string, number> = {};
    const completed: Record<string, number> = {};

    day.exercises.forEach((ex, idx) => {
      const def = exercises[ex.exerciseId];
      const totalSets = ex.sets ?? 3;
      const doneSets = (logs[idx] ?? []).filter((s) => s.done).length;
      (def?.primary_muscles ?? []).forEach((m) => {
        const contrib = m.contribution ?? 1;
        targets[m.muscle] = (targets[m.muscle] ?? 0) + totalSets * contrib;
        completed[m.muscle] = (completed[m.muscle] ?? 0) + doneSets * contrib;
      });
    });

    return Object.entries(targets)
      .map(([muscle, target]) => ({
        muscle,
        percent: target > 0 ? Math.round(((completed[muscle] ?? 0) / target) * 100) : 0,
      }))
      .slice(0, 6);
  }, [day, exercises, logs]);

  // Readiness percentage from pain score
  const readinessPercent = useMemo(() => {
    return Math.max(0, Math.min(100, Math.round(100 - (painScore * 10))));
  }, [painScore]);

  // Pain label from constraints
  const painLabel = useMemo(() => {
    if (constraints && constraints.length > 0) {
      const bodyRegion = constraints[0].body_region;
      if (bodyRegion) return `${bodyRegion.toUpperCase()} PAIN (DURING SET)`;
    }
    return 'BODY PAIN (DURING SET)';
  }, [constraints]);

  // Highlighted muscles for anatomy
  const highlightedMuscles = useMemo(() => {
    if (!day) return [];
    const ex = day.exercises[activeExerciseIndex];
    if (!ex) return [];
    const def = exercises[ex.exerciseId];
    return (def?.primary_muscles ?? []).map((m) => m.muscle);
  }, [day, activeExerciseIndex, exercises]);

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

  // ── Mutations ──
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
      [exIdx]: { remainingSeconds: restSeconds, nextSetIndex },
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
        return { ...prev, [exIdx]: { ...current, remainingSeconds: nextRemaining } };
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
      const durationSeconds = Math.max(0, Math.round((Date.now() - startMs) / 1000));

      if (program.id.startsWith('draft_')) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        clearActiveSession();
        Alert.alert('Draft Test Complete', 'Great job! Since this was a draft test-drive, adherence was not logged.', [
          { text: t('common.done'), onPress: () => router.replace('/(client)/home') },
        ]);
      } else {
        const { finishWorkout } = await import('@/hooks/useAdherence');
        await finishWorkout({
          clientId: profile.id,
          programId: program.id,
          dayIndex,
          startedAt,
          exercises: exercisesLogged,
          durationSeconds,
          wearableSource: null,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        clearActiveSession();
        Alert.alert(t('alerts.live.saved'), t('alerts.live.savedBody'), [
          { text: t('common.done'), onPress: () => router.replace('/(client)/home') },
        ]);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : t('alerts.live.saveErrorFallback');
      Alert.alert(t('alerts.live.saveFail'), message);
    } finally {
      setBusy(false);
    }
  };

  // ── Active exercise data ──
  const activeEx = day.exercises[activeExerciseIndex];
  const activeDef = activeEx ? exercises[activeEx.exerciseId] : null;
  const activeSets = logs[activeExerciseIndex] ?? [];
  const activeRest = restTimers[activeExerciseIndex];
  const isDraft = program.status === 'draft' || program.id.startsWith('draft_');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        {/* ── Header ── */}
        <LiveSessionHeader
          programName={program.name}
          focusLabel={program.focus}
          dayLabel={day.label}
          isDraft={isDraft}
          readinessPercent={readinessPercent}
          heartRate={null}
          elapsedLabel={`${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, '0')}`}
          isPaused={paused}
          paceEnabled={false}
          onBack={() => router.back()}
          onTogglePause={() => setPaused(!paused)}
          onTogglePace={() => Alert.alert('Pace toggle', 'Metronome/pace control is coming soon.')}
        />

        {/* ── Exercise navigation stepper ── */}
        <View style={styles.stepper}>
          <Text style={styles.stepperLabel}>
            Exercise {activeExerciseIndex + 1} of {day.exercises.length}
          </Text>
          <View style={styles.stepperDots}>
            {day.exercises.map((_, i) => {
              const allDone = (logs[i] ?? []).every((s) => s.done) && (logs[i] ?? []).length > 0;
              return (
                <Pressable
                  key={i}
                  onPress={() => setActiveExerciseIndex(i)}
                  style={[
                    styles.stepperDot,
                    i === activeExerciseIndex && styles.stepperDotActive,
                    allDone && styles.stepperDotDone,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* ── Clinical Constraint Banner ── */}
        {constraints && constraints.length > 0 && (
          <LiveConstraintBanner
            constraints={constraints}
            onSwapExercise={() => Alert.alert('Swap Exercise', 'Exercise swap from clinical constraints is coming soon.')}
          />
        )}

        {/* ── Single Active Exercise Card ── */}
        {activeEx && (
          <LiveExerciseCard
            indexLabel={`${activeEx.supersetGroup ?? 'A'}${activeExerciseIndex + 1}`}
            name={activeDef?.name ?? exFallback}
            prescription={`${activeEx.sets} × ${activeEx.reps} reps`}
            tempo={activeEx.tempo}
            restSeconds={activeEx.restSeconds}
            notes={activeEx.notes}
            muscleTags={(activeDef?.primary_muscles ?? []).map((m) => m.muscle)}
            sets={activeSets}
            totalSets={activeEx.sets ?? 3}
            prescribedReps={activeEx.reps}
            restLabel={activeRest ? t('liveSession.rest', { seconds: activeRest.remainingSeconds }) : null}
            onChangeSet={(setIdx, field, value) => {
              updateSet(activeExerciseIndex, setIdx, field, value);
            }}
            onToggleSetDone={(setIdx) => {
              toggleDone(activeExerciseIndex, setIdx);
            }}
            onAddSet={() => addSet(activeExerciseIndex)}
            onCopyPreviousSet={() => {
              const exSets = logs[activeExerciseIndex] ?? [];
              const previous = exSets[exSets.length - 2];
              if (!previous) return;
              updateSet(activeExerciseIndex, exSets.length - 1, 'reps', previous.reps);
              updateSet(activeExerciseIndex, exSets.length - 1, 'weight', previous.weight);
              updateSet(activeExerciseIndex, exSets.length - 1, 'rir', previous.rir);
            }}
            onCopySetValues={(setIdx) => {
              if (setIdx === 0) return;
              const prev = activeSets[setIdx - 1];
              if (!prev) return;
              updateSet(activeExerciseIndex, setIdx, 'reps', prev.reps);
              updateSet(activeExerciseIndex, setIdx, 'weight', prev.weight);
              updateSet(activeExerciseIndex, setIdx, 'rir', prev.rir);
            }}
            onNextExercise={() => {
              setActiveExerciseIndex((current) => Math.min(day.exercises.length - 1, current + 1));
            }}
            onStartRest={() => {
              const restSec = activeEx.restSeconds ?? 90;
              const currentSetIdx = activeSets.findIndex((s) => !s.done);
              startRestTimer(activeExerciseIndex, currentSetIdx >= 0 ? currentSetIdx : activeSets.length, restSec);
            }}
          />
        )}

        {/* ── Session Load Distribution ── */}
        <LiveMuscleLoadPanel
          rows={muscleLoadRows}
          totalVolumeKg={totalVolumeKg}
        />

        {/* ── Subjective Feedback ── */}
        <SubjectiveFeedbackCard
          painScore={painScore}
          notes={subjectiveNotes}
          painLabel={painLabel}
          highlightedMuscles={highlightedMuscles}
          onChangePain={(score) => {
            setPainScore(score);
            // Reset the per-exercise sent guard if user adjusts score after switching exercise
            if (score < 4) setPainMarkerSent(false);
          }}
          onChangeNotes={setSubjectiveNotes}
          onReportPain={profile ? async () => {
            if (!profile || painMarkerSent) return;
            setPainMarkerSent(true);
            const activeConstraint = constraints?.[0] ?? null;
            await emitPainMarker({
              clientId: profile.id,
              painScore,
              bodyRegion: activeConstraint?.body_region ?? null,
              context: 'live_session',
              exerciseId: activeEx?.exerciseId ?? null,
              programId: program.id,
              notes: subjectiveNotes || null,
              constraintId: activeConstraint?.id ?? null,
              actorId: profile.id,
            });
          } : undefined}
          painReported={painMarkerSent}
        />

        {/* ── Finish Session Button (danger styled) ── */}
        <Pressable
          onPress={onFinish}
          disabled={busy}
          style={[styles.finishBtn, busy && styles.finishBtnDisabled]}
        >
          <Ionicons name="stop-circle" size={18} color={colors.danger} />
          <Text style={styles.finishBtnText}>
            {busy ? t('common.saving') || 'Saving...' : 'Finish Session'}
          </Text>
        </Pressable>

        <ExerciseDetailSheet
          visible={Boolean(selectedExercise)}
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  /* ── Stepper ── */
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepperLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
  stepperDots: {
    flexDirection: 'row',
    gap: 5,
  },
  stepperDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderSubtle,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  stepperDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepperDotDone: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primaryBorder,
  },

  /* ── Finish button ── */
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    marginTop: 8,
  },
  finishBtnDisabled: { opacity: 0.5 },
  finishBtnText: {
    color: colors.danger,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
});
