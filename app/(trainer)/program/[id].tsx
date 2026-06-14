import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/auth/AuthProvider';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { VerveButton } from '@/components/VerveButton';
import { primaryViolation, validate, type Violation } from '@/features/constraints/validate';
import { WhyBlockedSheet } from '@/features/constraints/WhyBlockedSheet';
import { useExercises } from '@/hooks/useExercises';
import { useConstraints, type ConstraintListItem } from '@/hooks/useConstraints';
import { useLinkedClients } from '@/hooks/useLinkedClients';
import { archiveProgram, assignProgramToClient, duplicateProgram, usePrograms } from '@/hooks/usePrograms';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

export default function TrainerProgramDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const programs = usePrograms(profile?.id ?? null, 'trainer');
  const linkedClients = useLinkedClients(profile?.id ?? null);
  const [assigning, setAssigning] = useState(false);
  const [busyAction, setBusyAction] = useState<'duplicate' | 'archive' | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [whyBlocked, setWhyBlocked] = useState<{ violations: Violation[]; exerciseName: string } | null>(null);

  const program = useMemo(
    () => programs.programs.find((candidate) => candidate.id === id) ?? null,
    [programs.programs, id],
  );
  const exerciseIds = useMemo(() => {
    if (!program) return [];
    const ids = new Set<string>();
    program.days.forEach((day) => day.exercises.forEach((exercise) => ids.add(exercise.exerciseId)));
    return Array.from(ids);
  }, [program]);
  const { exercises } = useExercises(exerciseIds);
  const constraintsQuery = useConstraints(program?.assigned_to ?? null);

  const exFallback = t('common.exercise');

  const showExerciseViolations = (violations: Violation[], rows: ConstraintListItem[], exerciseName?: string) => {
    setWhyBlocked({ violations, exerciseName: exerciseName ?? exFallback });
  };

  const doAssign = async (clientId: string) => {
    if (!program) return;
    setAssigning(true);
    try {
      await assignProgramToClient(program.id, clientId);
      setShowAssignModal(false);
      await programs.refresh();
      Alert.alert(t('alerts.programTrainer.assigned'), t('alerts.programTrainer.assignedBody'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('alerts.programTrainer.assignFail');
      Alert.alert(t('alerts.programTrainer.assignFail'), message);
    } finally {
      setAssigning(false);
    }
  };

  const doDuplicate = async () => {
    if (!program || !profile?.id) return;
    setBusyAction('duplicate');
    try {
      const created = await duplicateProgram(program, profile.id);
      await programs.refresh();
      router.replace(`/(trainer)/program/${created.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('alerts.programTrainer.dupFail');
      Alert.alert(t('alerts.programTrainer.dupFail'), message);
    } finally {
      setBusyAction(null);
    }
  };

  const doArchive = async () => {
    if (!program) return;
    setBusyAction('archive');
    try {
      await archiveProgram(program.id);
      await programs.refresh();
      Alert.alert(t('alerts.programTrainer.archived'), t('alerts.programTrainer.archivedBody'));
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('alerts.programTrainer.archiveFail');
      Alert.alert(t('alerts.programTrainer.archiveFail'), message);
    } finally {
      setBusyAction(null);
    }
  };

  if (!program) {
    return (
      <ScreenContainer>
        <EmptyState
          icon="barbell-outline"
          title={t('trainerProgramDetail.notFoundTitle')}
          body={t('trainerProgramDetail.notFoundBody')}
        />
      </ScreenContainer>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel={t('common.back')}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>

        <GlassCard style={{ gap: 10 }}>
          <Text style={styles.title}>{program.name}</Text>
          <View style={styles.badgeRow}>
            <Badge label={program.status} tone={program.status === 'active' ? 'primary' : 'neutral'} />
            {program.focus ? <Badge label={program.focus} tone="clinical" /> : null}
            {program.phase ? <Badge label={program.phase} tone="neutral" /> : null}
          </View>
          {!program.assigned_to ? <Text style={styles.assignHint}>{t('trainerProgramDetail.assignHint')}</Text> : null}
          {constraintsQuery.error ? <Text style={styles.errorText}>{constraintsQuery.error}</Text> : null}
          <View style={styles.actionRow}>
            <VerveButton
              label={t('userTrial.programs.openBuilder')}
              onPress={() => router.push({ pathname: '/(trainer)/program/builder', params: { id: program.id } })}
            />
            <VerveButton label={t('trainerProgramDetail.assignToClient')} variant="ghost" onPress={() => setShowAssignModal(true)} />
            <VerveButton label={t('trainerProgramDetail.duplicate')} onPress={() => void doDuplicate()} loading={busyAction === 'duplicate'} />
            <VerveButton label={t('trainerProgramDetail.archive')} variant="danger" onPress={() => void doArchive()} loading={busyAction === 'archive'} />
          </View>
        </GlassCard>

        {program.days.map((day, dayIndex) => (
          <GlassCard key={`${day.label}-${dayIndex}`} style={{ gap: 8 }}>
            <Text style={styles.dayTitle}>
              {t('trainerProgramDetail.dayHeader', { n: dayIndex + 1, label: day.label })}
            </Text>
            {day.exercises.length === 0 ? (
              <Text style={styles.meta}>{t('trainerProgramDetail.noExercises')}</Text>
            ) : (
              day.exercises.map((exercise, index) => {
                const definition = exercises[exercise.exerciseId];
                const violations = definition ? validate(definition, constraintsQuery.data) : [];
                const primary = primaryViolation(violations);
                const rowKey = `${exercise.exerciseId}-${index}`;
                const rowBody = (
                  <View style={styles.exerciseRow}>
                    <View style={styles.dot} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.exerciseTitleRow}>
                        <Text style={styles.exerciseName}>{definition?.name ?? exFallback}</Text>
                        {primary ? (
                          <Badge
                            label={primary.badgeLabel}
                            tone={primary.level === 'hard' ? 'danger' : primary.level === 'soft' ? 'warning' : 'clinical'}
                          />
                        ) : null}
                        {violations.length > 1 ? (
                          <Text style={styles.moreViolations}>
                            {t('trainerProgramDetail.moreViolations', { count: violations.length - 1 })}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.meta}>
                        {exercise.sets} × {exercise.reps}
                        {exercise.rir != null ? ` · RIR ${exercise.rir}` : ''}
                        {exercise.restSeconds
                          ? t('liveSession.restSegment', { seconds: exercise.restSeconds })
                          : ''}
                      </Text>
                    </View>
                  </View>
                );
                if (violations.length > 0) {
                  return (
                    <Pressable
                      key={rowKey}
                      onPress={() => showExerciseViolations(violations, constraintsQuery.data, definition?.name ?? exFallback)}
                      accessibilityLabel={t('trainerProgramDetail.violationExerciseA11y')}
                    >
                      {rowBody}
                    </Pressable>
                  );
                }
                return <View key={rowKey}>{rowBody}</View>;
              })
            )}
          </GlassCard>
        ))}
      </ScreenContainer>

      <WhyBlockedSheet
        visible={whyBlocked !== null}
        onClose={() => setWhyBlocked(null)}
        exerciseName={whyBlocked?.exerciseName ?? ''}
        violations={whyBlocked?.violations ?? []}
        constraints={constraintsQuery.data}
      />

      <Modal visible={showAssignModal} transparent animationType="fade" onRequestClose={() => setShowAssignModal(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={{ gap: 8 }}>
            <Text style={styles.modalTitle}>{t('trainerProgramDetail.assignModalTitle')}</Text>
            {linkedClients.clients.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title={t('trainerProgramDetail.noLinkedClientsTitle')}
                body={t('trainerProgramDetail.noLinkedClientsBody')}
              />
            ) : (
              linkedClients.clients.map((client) => {
                const fullName = `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() || client.email;
                return (
                  <Pressable
                    key={client.id}
                    onPress={() => void doAssign(client.id)}
                    style={styles.clientOption}
                    disabled={assigning}
                  >
                    <Text style={styles.exerciseName}>{fullName}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
                  </Pressable>
                );
              })
            )}
            <VerveButton label={t('common.close')} variant="ghost" onPress={() => setShowAssignModal(false)} />
          </GlassCard>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.primary, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  title: { color: colors.textStrong, fontFamily: typography.family.heading, fontSize: typography.size.xl },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionRow: { gap: 8 },
  dayTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  exerciseRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 7 },
  exerciseName: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  meta: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 4, 8, 0.65)',
    paddingHorizontal: 14,
  },
  modalTitle: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  clientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingVertical: 8,
  },
  assignHint: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
  exerciseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  moreViolations: {
    color: colors.textFaint,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
});
