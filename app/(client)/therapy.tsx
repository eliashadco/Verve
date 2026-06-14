import { RefreshControl, StyleSheet, Text, View, Pressable, Alert } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import type { Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/auth/AuthProvider';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TherapyPhaseTimeline } from '@/components/client/TherapyPhaseTimeline';
import { TherapyRoutineCard } from '@/components/client/TherapyRoutineCard';
import { TherapyWeekSchedule } from '@/components/client/TherapyWeekSchedule';
import { PersonaBanner, THERAPY_PERSONAS } from '@/components/client/PersonaBanner';
import { useConstraintEvents } from '@/hooks/useConstraintEvents';
import { useConstraints } from '@/hooks/useConstraints';
import { useExercises } from '@/hooks/useExercises';
import { usePrograms } from '@/hooks/usePrograms';
import { emitConstraintEvent } from '@/lib/constraintEvents';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';
import type { ConstraintEvent, ConstraintSeverity } from '@/types/database';

interface TherapyExercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  notes: string;
}

const HOME_ALTERNATIVES: Record<string, { name: string; sets: string; reps: string }> = {
  'Leg Press': { name: 'Wall Sits', sets: '4', reps: '45s' },
  'Cable Row': { name: 'Band Row (Door Anchor)', sets: '3', reps: '15' },
  'Barbell Squat': { name: 'Goblet Squat (Kettlebell)', sets: '3', reps: '12' },
};

const THERAPY_EXERCISES: TherapyExercise[] = [
  { id: 'leg-press', name: 'Leg Press', sets: '4', reps: '10', notes: 'Stop above painful knee angle.' },
  { id: 'cable-row', name: 'Cable Row', sets: '3', reps: '12', notes: 'Keep ribs stacked and tempo controlled.' },
  { id: 'barbell-squat', name: 'Barbell Squat', sets: '3', reps: '8', notes: 'Use box target while rebuilding confidence.' },
];

function getTherapyExerciseDisplay(exercise: TherapyExercise, homeMode: boolean): TherapyExercise {
  const alternative = HOME_ALTERNATIVES[exercise.name];
  if (!homeMode || !alternative) return exercise;
  return {
    ...exercise,
    name: `${alternative.name} (Home Alt)`,
    sets: alternative.sets,
    reps: alternative.reps,
  };
}

export default function ClientTherapy() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { data, loading, error, refresh } = useConstraints(profile?.id ?? null);
  const { events: constraintEvents, refresh: refreshEvents } = useConstraintEvents(profile?.id ?? null);
  const programs = usePrograms(profile?.id ?? null, 'client');
  const [homeMode, setHomeMode] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [activePersona, setActivePersona] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('verve_therapy_persona_v1')
      .then((val) => setActivePersona(val))
      .catch(() => {});
  }, []);

  const handleSelectPersona = async (key: string | null) => {
    setActivePersona(key);
    if (key === null) {
      await AsyncStorage.removeItem('verve_therapy_persona_v1');
    } else {
      await AsyncStorage.setItem('verve_therapy_persona_v1', key);
    }
  };

  const protocolMetaText = useMemo(() => {
    if (!activePersona) {
      return 'No protocol assigned · Set your persona below';
    }
    const meta = THERAPY_PERSONAS[activePersona];
    return `${meta.condition} · Phase 2: Strength`;
  }, [activePersona]);

  const activeSafety = useMemo(() => data[0]?.notes ?? t('userTrial.therapy.defaultSafety'), [data, t]);

  const activeProgram = useMemo(
    () =>
      programs.programs.find(
        (program) => program.status === 'active' && (program.days?.length ?? 0) > 0,
      ) ?? null,
    [programs.programs],
  );
  const activeProgramExerciseIds = useMemo(() => {
    if (!activeProgram) return [] as string[];
    const firstDay = activeProgram.days.find((day) => (day.exercises?.length ?? 0) > 0);
    return firstDay ? firstDay.exercises.map((exercise) => exercise.exerciseId) : [];
  }, [activeProgram]);
  const { exercises: activeProgramExerciseDefs } = useExercises(activeProgramExerciseIds);

  const usingDemoProtocol = !activeProgram || activeProgramExerciseIds.length === 0;

  const routineExercises = useMemo(() => {
    if (usingDemoProtocol) {
      return THERAPY_EXERCISES.map((exercise) => getTherapyExerciseDisplay(exercise, homeMode));
    }
    const firstDay = activeProgram!.days.find((day) => (day.exercises?.length ?? 0) > 0)!;
    return firstDay.exercises.map((exercise, index): TherapyExercise => {
      const def = activeProgramExerciseDefs[exercise.exerciseId];
      const name = def?.name ?? t('common.exercise');
      const base: TherapyExercise = {
        id: `${exercise.exerciseId}-${index}`,
        name,
        sets: String(exercise.sets),
        reps: exercise.reps,
        notes: exercise.notes ?? '',
      };
      return getTherapyExerciseDisplay(base, homeMode);
    });
  }, [usingDemoProtocol, activeProgram, activeProgramExerciseDefs, homeMode, t]);
  const liveMapping = useMemo<{ href: Href; fallback: boolean }>(() => {
    const activeProgram = programs.programs.find((program) => program.status === 'active') ?? programs.programs[0];
    if (!activeProgram) return { href: '/(client)/live', fallback: true };

    const todayDayOfWeek = new Date().getDay();
    const todayIndex = activeProgram.days.findIndex(
      (day) => day.dayOfWeek === todayDayOfWeek && (day.exercises?.length ?? 0) > 0,
    );
    const firstPlayableIndex = activeProgram.days.findIndex((day) => (day.exercises?.length ?? 0) > 0);
    const mappedIndex = todayIndex >= 0 ? todayIndex : firstPlayableIndex;
    if (mappedIndex < 0) return { href: '/(client)/live', fallback: true };
    return { href: `/(client)/live/${activeProgram.id}/${mappedIndex}` as Href, fallback: false };
  }, [programs.programs]);

  return (
    <ScreenContainer
      refreshControl={
        <RefreshControl
          refreshing={loading || programs.loading}
          onRefresh={() => {
            refresh();
            programs.refresh();
          }}
          tintColor={colors.primary}
        />
      }
    >
      <Header title={t('userTrial.therapy.title')} />

      {/* Persona Context Banner */}
      <PersonaBanner
        activePersona={activePersona}
        onSelectPersona={handleSelectPersona}
        week={1}
        phase={2}
        phaseLabel="Strength"
      />

      <View style={styles.metaRowTop}>
        <Text style={styles.protocolMeta}>{protocolMetaText}</Text>
        <View style={styles.toggleRow}>
          <Pressable onPress={() => setHomeMode((v) => !v)} style={styles.modeBtn}>
            <Text style={styles.modeBtnText}>
              {homeMode ? t('userTrial.therapy.homeModeOn') : t('userTrial.therapy.homeModeOff')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => Alert.alert(t('profile.comingSoon'), t('userTrial.therapy.printSoon'))}
            style={styles.modeBtn}
          >
            <Text style={styles.modeBtnText}>{t('userTrial.therapy.print')}</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.lead}>{t('therapyDetail.lead')}</Text>
      <TherapyPhaseTimeline
        phases={[
          { label: t('userTrial.therapy.phase1'), state: 'done' },
          { label: t('userTrial.therapy.phase2'), state: 'active' },
          { label: t('userTrial.therapy.phase3'), state: 'upcoming' },
          { label: t('userTrial.therapy.goal'), state: 'upcoming' },
        ]}
      />
      <TherapyWeekSchedule
        completionLabel="3/4"
        statusLabel={t('userTrial.therapy.onTrack')}
        items={[
          t('userTrial.therapy.weekItemTempo'),
          t('userTrial.therapy.weekItemMobility'),
          t('userTrial.therapy.weekItemPosterior'),
        ]}
      />
      {usingDemoProtocol ? (
        <Text style={styles.protocolMeta}>{t('userTrial.therapy.demoProtocolLabel')}</Text>
      ) : null}
      <TherapyRoutineCard
        title={homeMode ? t('userTrial.therapy.homeRoutine') : t('userTrial.therapy.gymRoutine')}
        duration={t('userTrial.therapy.duration')}
        equipment={homeMode ? t('userTrial.therapy.homeEquipment') : t('userTrial.therapy.gymEquipment')}
        safety={activeSafety}
        liveHref={liveMapping.href}
        ctaLabel={t('userTrial.therapy.startLive')}
        liveFallbackNote={liveMapping.fallback ? t('userTrial.therapy.liveFallbackNote') : null}
        exercises={routineExercises}
        completedIds={completedExercises}
        onToggleExercise={(id) =>
          setCompletedExercises((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
          )
        }
        onDemoVideo={(name) => Alert.alert(t('profile.comingSoon'), t('userTrial.therapy.demoVideoSoon', { name }))}
      />

      {error ? (
        <GlassCard>
          <Text style={styles.errorText}>{error}</Text>
        </GlassCard>
      ) : null}

      {data.length === 0 && !loading ? (
        <GlassCard>
          <EmptyState
            icon="shield-checkmark-outline"
            title={t('therapyDetail.emptyTitle')}
            body={t('therapyDetail.emptyBody')}
          />
        </GlassCard>
      ) : (
        data.map((constraint) => {
          const ackEvent = constraintEvents.find(
            (e) =>
              e.event_type === 'acknowledged' &&
              e.constraint_id === constraint.id &&
              e.actor_id === profile?.id,
          );
          const timelineEvents = constraintEvents
            .filter((e) => e.constraint_id === constraint.id)
            .slice()
            .reverse();

          return (
            <GlassCard key={constraint.id} style={styles.constraintCard}>
              <View style={styles.constraintHeader}>
                <Badge label={constraint.constraint_type.replace('_', ' ')} tone="neutral" />
                <Badge label={constraint.severity} tone={severityTone(constraint.severity)} />
              </View>

              <Text style={styles.target}>{constraint.target}</Text>
              {constraint.value ? (
                <Text style={styles.value}>{t('therapyDetail.limit', { value: String(constraint.value) })}</Text>
              ) : null}
              {constraint.notes ? <Text style={styles.notes}>{constraint.notes}</Text> : null}

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>{t('therapyDetail.physio')}</Text>
                <Text style={styles.metaValue}>{constraint.physio_name ?? t('common.physio')}</Text>
              </View>

              {ackEvent ? (
                <Text style={styles.acknowledgedLabel}>
                  {'✓ ' + t('constraints.acknowledgedLabel', { when: relativeTime(ackEvent.created_at) })}
                </Text>
              ) : (
                <Pressable
                  style={styles.ackBtn}
                  onPress={async () => {
                    if (!profile?.id) return;
                    await emitConstraintEvent({
                      constraintId: constraint.id,
                      patientId: profile.id,
                      eventType: 'acknowledged',
                      actorId: profile.id,
                      metadata: {},
                    });
                    await refreshEvents();
                  }}
                >
                  <Text style={styles.ackBtnText}>{t('constraints.acknowledgeCta')}</Text>
                </Pressable>
              )}

              {timelineEvents.length > 0 ? (
                <View style={styles.timeline}>
                  {timelineEvents.map((event) => (
                    <View key={event.id} style={styles.timelineRow}>
                      <View style={styles.timelineDot} />
                      <Text style={styles.timelineLabel} numberOfLines={1}>
                        {constraintEventLabel(event, t)}
                      </Text>
                      <Text style={styles.timelineTime}>{relativeTime(event.created_at)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </GlassCard>
          );
        })
      )}
    </ScreenContainer>
  );
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function constraintEventLabel(event: ConstraintEvent, t: (key: string) => string): string {
  const base = t(`constraints.event.${event.event_type}`);
  if (event.event_type === 'enforced' && typeof event.metadata?.exercise === 'string') {
    return `${base} (${event.metadata.exercise})`;
  }
  return base;
}

function severityTone(severity: ConstraintSeverity): 'danger' | 'warning' | 'clinical' {
  if (severity === 'hard') return 'danger';
  if (severity === 'soft') return 'warning';
  return 'clinical';
}

const styles = StyleSheet.create({
  metaRowTop: { gap: 8 },
  protocolMeta: { color: colors.textSub, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  toggleRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface2,
  },
  modeBtnText: { color: colors.textMuted, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },
  lead: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  constraintCard: { gap: 8 },
  constraintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  target: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  value: { color: colors.warning, fontSize: typography.size.sm },
  notes: { color: colors.textMuted, fontSize: typography.size.sm },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  metaLabel: { color: colors.textFaint, fontSize: typography.size.xs, textTransform: 'uppercase' },
  metaValue: { color: colors.textSub, fontSize: typography.size.sm, fontFamily: typography.family.bodyMedium },
  errorText: { color: colors.danger, fontSize: typography.size.sm },
  ackBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.primaryDim,
    marginTop: 4,
  },
  ackBtnText: {
    color: colors.primary,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
  acknowledgedLabel: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    marginTop: 4,
  },
  timeline: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 8,
    gap: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textFaint,
  },
  timelineLabel: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
  timelineTime: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
});
