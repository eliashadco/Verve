import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

import { useAuth } from '@/auth/AuthProvider';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { BuilderAiStatsPanel } from '@/components/client/BuilderAiStatsPanel';
import { DraftActiveBanner } from '@/components/client/DraftActiveBanner';
import { MuscleHeatmapLite } from '@/components/client/MuscleHeatmapLite';
import { ProgramCurrentHero } from '@/components/client/ProgramCurrentHero';
import { ProgramForecast } from '@/components/client/ProgramForecast';
import { ProgramHeroActionStrip } from '@/components/client/ProgramHeroActionStrip';
import { ClinicalSafetyNotice } from '@/components/client/ClinicalSafetyNotice';
import { WorkoutDayCarousel } from '@/components/client/WorkoutDayCarousel';
import { PerformanceAnalytics } from '@/components/client/PerformanceAnalytics';
import { ProgramBuilderShell } from '@/components/programBuilder';
import { usePrograms } from '@/hooks/usePrograms';
import { useProgramBuilder } from '@/hooks/useProgramBuilder';
import { useProgressStats } from '@/hooks/useProgressStats';
import { useAdherence } from '@/hooks/useAdherence';
import { useActiveDraftStore } from '@/hooks/useActiveDraftStore';
import { computeHeroForecast, computeHeroGamification, computeLowAdherenceDayIndex } from '@/lib/programHeroModel';
import {
  loadSavedProgramLibrary,
  saveSavedProgramLibrary,
  setActiveProgramId,
} from '@/lib/programBuilder/peripheralBuilderStorage';
import { draftToProgram } from '@/lib/programBuilder/draftToProgram';
import type { BuilderProgram } from '@/lib/programBuilder/types';
import { createId } from '@/lib/programBuilder/utils';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

export interface BuilderDraft {
  id: string;
  /** Full builder snapshot (`normalizeProgramForBuilder` shape). */
  program: BuilderProgram;
}

function seedFallbackLoose(t: (key: string, opts?: Record<string, string | number>) => string): Record<string, unknown> {
  return {
    name: t('userTrial.programs.builderDraftDefault'),
    focus: 'Hypertrophy',
    days: [
      {
        label: `${t('userTrial.programs.dayLabel', { n: 1 })} — Workout`,
        exercises: [
          {
            name: t('userTrial.programs.draftGobletSquat'),
            exerciseId: '',
            muscle: t('userTrial.programs.targetQuads'),
          },
        ],
      },
      {
        label: `${t('userTrial.programs.dayLabel', { n: 2 })} — Workout`,
        exercises: [
          {
            name: t('userTrial.programs.draftCableRow'),
            exerciseId: '',
            muscle: t('userTrial.programs.targetBack'),
          },
        ],
      },
      {
        label: `${t('userTrial.programs.dayLabel', { n: 3 })} — Workout`,
        exercises: [],
      },
    ],
  };
}

/**
 * Full Fitness / Programs tab with a 3-tab layout:
 * - Current Plan: Current active program, AI stats, muscle heatmap, past workout history.
 * - Templates: Staged drafts and local templates.
 * - Builder: Inline fully functional program builder.
 */
export function ClientProgramsTabContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ focusDay?: string | string[]; builderTab?: string | string[] }>();
  const { profile } = useAuth();
  const { programs, myPrograms, assignedPrograms, loading, error, refresh } = usePrograms(profile?.id ?? null, 'client');
  const progress = useProgressStats(profile?.id ?? null);
  const { entries, completedVolume, loading: adherenceLoading, refresh: refreshAdherence } = useAdherence(profile?.id ?? null, 200, programs);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [stagedDraftId, setStagedDraftId] = useState<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<BuilderDraft[]>([]);
  const [savedLibraryReady, setSavedLibraryReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'saved' | 'builder'>('current');
  const [hasAutoRouted, setHasAutoRouted] = useState(false);

  // Active draft store: a staged draft that replaces the Current tab display.
  const activeDraft = useActiveDraftStore((s) => s.activeDraft);
  const draftSourceId = useActiveDraftStore((s) => s.sourceDraftId);
  const setActiveDraftInStore = useActiveDraftStore((s) => s.setActiveDraft);
  const clearActiveDraft = useActiveDraftStore((s) => s.clearActiveDraft);

  /** Load a saved draft as the active program on the Current tab. */
  const promoteDraftToCurrent = useCallback(
    (draft: BuilderDraft) => {
      const converted = draftToProgram(draft.program, profile?.id ?? 'local');
      setActiveDraftInStore(converted, draft.id);
      setActiveTab('current');
      setActiveDayIndex(0);
    },
    [profile?.id, setActiveDraftInStore],
  );

  const builderFallbackLoose = useMemo(() => seedFallbackLoose(t), [t]);
  const builderDraft = useProgramBuilder({ fallbackLoose: builderFallbackLoose });

  useEffect(() => {
    loadSavedProgramLibrary().then((cards) => {
      setSavedDrafts(
        cards.map((c) => ({
          id: c.id,
          program: c.program,
        })),
      );
      setSavedLibraryReady(true);
    });
  }, []);

  useEffect(() => {
    if (!savedLibraryReady) return;
    saveSavedProgramLibrary(
      savedDrafts.map((d) => ({
        id: d.id,
        program: d.program,
      })),
    ).catch(() => {});
  }, [savedDrafts, savedLibraryReady]);

  // If a draft is staged, it becomes the "current" program for UI purposes.
  const assignedProgram = useMemo(() => {
    return programs.find((program) => ['active', 'paused'].includes(program.status)) ?? null;
  }, [programs]);
  const currentProgram = activeDraft ?? assignedProgram;

  const pastPrograms = useMemo(() => {
    return programs.filter((program) => ['completed', 'archived'].includes(program.status));
  }, [programs]);

  // Handle empty state auto-routing logic once on load
  useEffect(() => {
    if (loading || !savedLibraryReady || hasAutoRouted) return;

    const hasCurrentOrAssigned = !!currentProgram || assignedPrograms.length > 0;
    
    if (hasCurrentOrAssigned) {
      setActiveTab('current');
    } else if (savedDrafts.length > 0) {
      setActiveTab('saved');
    } else {
      setActiveTab('builder');
    }
    
    setHasAutoRouted(true);
  }, [loading, savedLibraryReady, hasAutoRouted, currentProgram, assignedPrograms.length, savedDrafts.length]);

  useEffect(() => {
    if (!currentProgram?.id) return;
    setActiveProgramId(currentProgram.id).catch(() => {});
  }, [currentProgram?.id]);

  useEffect(() => {
    const rawFocus = params.focusDay;
    const focusStr = Array.isArray(rawFocus) ? rawFocus[0] : rawFocus;
    if (focusStr === undefined || !currentProgram?.days?.length) return;
    const n = Number(focusStr);
    if (Number.isFinite(n) && n >= 0 && n < currentProgram.days.length) {
      setActiveDayIndex(n);
    }
  }, [params.focusDay, currentProgram?.id, currentProgram?.days]);

  const summary = useMemo(() => {
    if (!currentProgram) return null;
    const exercises = currentProgram.days.flatMap((day) => day.exercises ?? []);
    const sets = exercises.reduce((sum, ex) => sum + (Number(ex.sets) || 0), 0);
    return {
      days: currentProgram.days.length,
      exercises: exercises.length,
      sets,
      weekSessions: currentProgram.days.filter((day) => day.exercises.length > 0).length,
    };
  }, [currentProgram]);

  const currentHistory = useMemo(
    () => (currentProgram ? progress.data.history.filter((item) => item.programName === currentProgram.name) : []),
    [currentProgram, progress.data.history],
  );
  const heroForecast = useMemo(
    () => (currentProgram ? computeHeroForecast(currentProgram, currentHistory) : null),
    [currentProgram, currentHistory],
  );
  const gamify = useMemo(() => computeHeroGamification(currentHistory), [currentHistory]);
  const lowAdherenceDay = useMemo(() => computeLowAdherenceDayIndex(currentHistory), [currentHistory]);
  const lastUsedLabel = currentHistory[0]
    ? format(parseISO(currentHistory[0].createdAt), 'd MMM')
    : t('userTrial.programs.lastUsedNone');
  const currentStreak = getProgramStreak(currentHistory);
  const bestStreak = Math.max(currentStreak, currentHistory.length);

  const handleSavePlanFromBuilder = useCallback(
    (program: BuilderProgram) => {
      const name = (program.name || '').trim();
      setSavedDrafts((prev) => {
        const idx = prev.findIndex((d) => d.program.name.trim().toLowerCase() === name.toLowerCase());
        const card: BuilderDraft = { id: idx >= 0 ? prev[idx].id : program.id || createId('tpl'), program };
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = card;
          return next;
        }
        return [card, ...prev];
      });
      setActiveTab('saved');
      Alert.alert(
        t('alerts.success'),
        t('userTrial.programs.planSavedToTemplates', { name: name || t('userTrial.programs.builderDraftDefault') }) ||
          'Plan saved to your templates.',
      );
    },
    [t],
  );

  const onRemoveSavedDraft = (cardId: string) => {
    Alert.alert(t('userTrial.programs.confirmRemoveSavedProgramTitle'), t('userTrial.programs.confirmRemoveSavedProgramBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('userTrial.programs.removeSavedProgram'),
        style: 'destructive',
        onPress: () => setSavedDrafts((prev) => prev.filter((d) => d.id !== cardId)),
      },
    ]);
  };

  return (
    <ScreenContainer
      scroll={activeTab !== 'builder'}
      contentStyle={
        activeTab === 'builder'
          ? { flex: 1, paddingHorizontal: 0, paddingBottom: 0 }
          : undefined
      }
      refreshControl={
        activeTab !== 'builder' ? (
          <RefreshControl
            refreshing={loading || progress.loading || adherenceLoading}
            onRefresh={() => {
              refresh();
              progress.refresh();
              refreshAdherence();
            }}
            tintColor={colors.primary}
          />
        ) : undefined
      }
    >
      <Header title={t('programsClientList.title')} />

      {/* Segmented control for tabs */}
      <View style={styles.segmentedRow}>
        <Pressable
          onPress={() => setActiveTab('current')}
          style={[styles.segment, activeTab === 'current' && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, activeTab === 'current' && styles.segmentTextActive]}>
            {t('userTrial.programs.tabCurrent') || 'Current'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('saved')}
          style={[styles.segment, activeTab === 'saved' && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, activeTab === 'saved' && styles.segmentTextActive]}>
            {t('userTrial.programs.tabSaved') || 'Saved'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('builder')}
          style={[styles.segment, activeTab === 'builder' && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, activeTab === 'builder' && styles.segmentTextActive]}>
            {t('userTrial.programs.tabBuild') || 'Builder'}
          </Text>
        </Pressable>
      </View>

      {error ? (
        <GlassCard>
          <Text style={styles.errorText}>{error}</Text>
        </GlassCard>
      ) : null}

      {/* Current Tab content */}
      {activeTab === 'current' && (
        <>
          {/* Draft Active Banner — shown when a local draft is staged */}
          {activeDraft && (
            <DraftActiveBanner
              draftName={activeDraft.name}
              daysCount={activeDraft.days.length}
              exercisesCount={activeDraft.days.reduce((sum, d) => sum + d.exercises.length, 0)}
              onEditInBuilder={() => {
                // Find the matching saved draft and load it into the builder
                const matchingDraft = savedDrafts.find((d) => d.id === draftSourceId);
                if (matchingDraft) {
                  builderDraft.replaceProgram(matchingDraft.program);
                }
                setActiveTab('builder');
              }}
              onDismiss={() => {
                clearActiveDraft();
              }}
            />
          )}

          <ClinicalSafetyNotice clientId={profile?.id ?? null} />

          {currentProgram && summary ? (
            <>
              <ProgramCurrentHero
                kicker={activeDraft ? (t('userTrial.programs.draftPreviewKicker') || 'Draft Preview') : t('userTrial.programs.currentFitnessPlan')}
                name={currentProgram.name}
                meta={t('userTrial.programs.phaseMeta', {
                  focus: currentProgram.focus ?? t('userTrial.programs.generalFallback'),
                  phase: currentProgram.phase ?? t('userTrial.programs.buildFallback'),
                })}
                status={currentProgram.status}
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
              >
                <WorkoutDayCarousel
                  days={currentProgram.days}
                  activeIndex={activeDayIndex}
                  targetMap={currentProgram.targets ?? undefined}
                  onPressDay={setActiveDayIndex}
                  onStartSession={(index) => {
                    router.push({
                      pathname: '/(client)/live/[programId]/[dayIndex]',
                      params: { programId: currentProgram.id, dayIndex: index },
                    });
                  }}
                />
                {heroForecast ? (
                  <ProgramHeroActionStrip
                    programId={currentProgram.id}
                    startDayIndex={heroForecast.todayPlannedDayIndex ?? activeDayIndex}
                    activeDayIndex={activeDayIndex}
                    onFocusDay={setActiveDayIndex}
                    lowAdherenceDayIndex={lowAdherenceDay && lowAdherenceDay.avg < 80 ? lowAdherenceDay.dayIndex : null}
                    onOpenBuilder={() => setActiveTab('builder')}
                    onAutoBalance={() => Alert.alert(t('userTrial.programs.autoBalance'), t('userTrial.programs.balancePreviewBody'))}
                    onSuggestProgression={() => Alert.alert(t('userTrial.programs.suggestProgression'), t('userTrial.programs.progressionPreviewBody'))}
                    onUseDraft={() => {
                      if (savedDrafts.length === 0) {
                        Alert.alert(
                          t('userTrial.programs.noLocalDrafts') || 'No Saved Templates',
                          t('userTrial.programs.createDraftHint') || 'Use the builder to create templates first.'
                        );
                        return;
                      }
                      // Load the first saved draft as the current program
                      promoteDraftToCurrent(savedDrafts[0]);
                    }}
                  />
                ) : null}
              </ProgramCurrentHero>

              {heroForecast ? (
                <ProgramForecast
                  days={heroForecast.days}
                  summaryKey={heroForecast.summaryKey}
                  nextDate={heroForecast.nextDate}
                  onSelectPlannedDay={setActiveDayIndex}
                />
              ) : null}

              <BuilderAiStatsPanel
                durationWeeks={currentProgram.duration_weeks ?? 4}
                frequencyDays={currentProgram.days.length}
                sessionsThisWeek={summary.weekSessions}
                onDeferredAction={(label) => Alert.alert(label, t('userTrial.programs.generateDisabledBody'))}
              />

              <MuscleHeatmapLite
                currentProgram={currentProgram}
                completedVolume={completedVolume}
                entries={entries}
              />

              <PerformanceAnalytics
                entries={entries}
                currentProgram={currentProgram}
              />
            </>
          ) : null}

          {/* Assigned Section */}
          {assignedPrograms.length > 0 && (
            <View style={{ marginTop: currentProgram ? 24 : 0, gap: 16 }}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('userTrial.programs.assignedByTeam') || 'Assigned by your team'}</Text>
              </View>
              {assignedPrograms.map((p) => (
                <Link key={p.id} href={`/(client)/program/${p.id}`} asChild>
                  <GlassCard style={styles.historyCard}>
                    <View style={styles.row}>
                      <Badge label={p.status} tone="neutral" />
                      {p.focus ? <Badge label={p.focus} tone="clinical" /> : null}
                      {p.phase ? <Badge label={p.phase} tone="neutral" /> : null}
                    </View>
                    <Text style={styles.programName}>{p.name}</Text>
                    <Text style={styles.programMeta}>
                      {t('programsClientList.metaDaysWeeks', {
                        days: String(p.days.length),
                        weeks: String(p.duration_weeks ?? '—'),
                      })}
                    </Text>
                    <View style={styles.cta}>
                      <Text style={styles.ctaText}>{t('programsClientList.viewProgram')}</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </View>
                  </GlassCard>
                </Link>
              ))}
            </View>
          )}

          {!currentProgram && assignedPrograms.length === 0 ? (
            <GlassCard style={{ gap: spacing.sm, padding: spacing.md, alignItems: 'center' }}>
              <Ionicons name="barbell-outline" size={36} color={colors.primary} />
              <Text style={[styles.builderTitle, { textAlign: 'center', marginTop: 4 }]}>
                {t('userTrial.programs.noActiveProgram') || 'No Active Program'}
              </Text>
              <Text style={[styles.programMeta, { textAlign: 'center', marginBottom: 8 }]}>
                {t('userTrial.programs.noActiveProgramBody') || 'Start by editing a workout draft below or creating a new one in the builder.'}
              </Text>
              <Pressable
                style={styles.actionBtn}
                onPress={() => setActiveTab('saved')}
              >
                <Text style={styles.actionText}>{t('userTrial.programs.browseSaved') || 'Browse Saved'}</Text>
              </Pressable>
            </GlassCard>
          ) : null}

          {/* Workout History Section */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>{t('programsClientList.past') || 'Workout History'}</Text>
          </View>

          {pastPrograms.length === 0 ? (
            <GlassCard>
              <EmptyState
                icon="barbell-outline"
                title={t('programsClientList.emptyPastTitle')}
                body={t('programsClientList.emptyPastBody')}
              />
            </GlassCard>
          ) : (
            pastPrograms.map((p) => (
              <Link key={p.id} href={`/(client)/program/${p.id}`} asChild>
                <GlassCard style={styles.historyCard}>
                  <View style={styles.row}>
                    <Badge label={p.status} tone="neutral" />
                    {p.focus ? <Badge label={p.focus} tone="clinical" /> : null}
                    {p.phase ? <Badge label={p.phase} tone="neutral" /> : null}
                  </View>
                  <Text style={styles.programName}>{p.name}</Text>
                  <Text style={styles.programMeta}>
                    {t('programsClientList.metaDaysWeeks', {
                      days: String(p.days.length),
                      weeks: String(p.duration_weeks ?? '—'),
                    })}
                  </Text>
                  <View style={styles.cta}>
                    <Text style={styles.ctaText}>{t('programsClientList.viewProgram')}</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </View>
                </GlassCard>
              </Link>
            ))
          )}
        </>
      )}

      {/* Saved Tab content */}
      {activeTab === 'saved' && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('userTrial.programs.tabSaved') || 'Saved Templates'}</Text>
            <View style={styles.sectionHeaderActions}>
              <Pressable
                style={styles.sectionActionBtn}
                onPress={() => {
                  builderDraft.replaceProgram(builderFallbackLoose as any);
                  setActiveTab('builder');
                }}
              >
                <Ionicons name="add" size={14} color={colors.primary} />
                <Text style={styles.sectionActionText}>{t('userTrial.programs.newTemplate') || 'New Template'}</Text>
              </Pressable>
              {currentProgram ? (
                <Pressable
                  style={styles.sectionActionBtn}
                  onPress={() => {
                    builderDraft.importFromSupabaseProgram(currentProgram);
                    setActiveTab('builder');
                    Alert.alert(
                      t('alerts.success'),
                      t('userTrial.programs.draftLoadedBody') || 'Active program loaded into builder.'
                    );
                  }}
                >
                  <Ionicons name="download-outline" size={14} color={colors.primary} />
                  <Text style={styles.sectionActionText}>{t('userTrial.programs.importCurrentPlan') || 'Import Active'}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {savedDrafts.length === 0 ? (
            <GlassCard style={{ gap: spacing.sm, padding: spacing.md, alignItems: 'center' }}>
              <Ionicons name="folder-open-outline" size={36} color={colors.textMuted} />
              <Text style={[styles.builderTitle, { textAlign: 'center', marginTop: 4 }]}>
                {t('userTrial.programs.noLocalDrafts') || 'No Saved Templates'}
              </Text>
              <Text style={[styles.programMeta, { textAlign: 'center', marginBottom: 8 }]}>
                {t('userTrial.programs.createDraftHint') || 'Use the builder to design custom workouts and save them as templates.'}
              </Text>
              <Pressable
                style={styles.actionBtn}
                onPress={() => setActiveTab('builder')}
              >
                <Text style={styles.actionText}>{t('userTrial.programs.openWorkoutBuilder') || 'Open Builder'}</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <View style={styles.verticalDraftList}>
              {savedDrafts.map((draft) => (
                <GlassCard key={draft.id} variant="glass" style={styles.verticalDraftCard}>
                  <View style={styles.draftCardHeader}>
                    <View style={{ flex: 1, gap: spacing.xs }}>
                      <Text style={styles.verticalDraftCardTitle} numberOfLines={1}>
                        {draft.program.name}
                      </Text>
                      <Text style={styles.draftCardMeta}>
                        {t('userTrial.programs.localOnlyMeta', {
                          days: draft.program.days.length,
                          count: draft.program.days.reduce((sum, plan) => sum + plan.exercises.length, 0),
                        })}
                      </Text>
                    </View>
                    {stagedDraftId === draft.id ? (
                      <Badge label={t('userTrial.programs.sortUsing') || 'Staged'} tone="primary" />
                    ) : null}
                  </View>
                  <View style={styles.verticalDraftCardActions}>
                    <Pressable
                      style={styles.draftCardBtn}
                      onPress={() => {
                        promoteDraftToCurrent(draft);
                      }}
                    >
                      <Ionicons name="play-outline" size={14} color={colors.primary} />
                      <Text style={styles.draftCardBtnText}>{t('userTrial.programs.useDraft') || 'Use Draft'}</Text>
                    </Pressable>
                    <Pressable
                      style={styles.draftCardBtn}
                      onPress={() => {
                        builderDraft.replaceProgram(draft.program);
                        setActiveTab('builder');
                      }}
                    >
                      <Ionicons name="create-outline" size={14} color={colors.primary} />
                      <Text style={styles.draftCardBtnText}>{t('userTrial.programs.editTemplate') || 'Edit'}</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.draftCardBtn, styles.draftCardBtnDanger]}
                      onPress={() => onRemoveSavedDraft(draft.id)}
                    >
                      <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    </Pressable>
                  </View>
                </GlassCard>
              ))}
              
              <GlassCard style={{ gap: 8, padding: 16, alignItems: 'center', marginTop: 16 }}>
                <Ionicons name="build-outline" size={32} color={colors.primary} />
                <Text style={[styles.builderTitle, { textAlign: 'center', marginTop: 4 }]}>
                  {t('userTrial.programs.openWorkoutBuilder') || 'Open Builder'}
                </Text>
                <Text style={[styles.programMeta, { textAlign: 'center', marginBottom: 8 }]}>
                  Create a new program from scratch with full tools
                </Text>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => {
                    builderDraft.replaceProgram(builderFallbackLoose as any);
                    setActiveTab('builder');
                  }}
                >
                  <Text style={styles.actionText}>{t('userTrial.programs.openWorkoutBuilder') || 'Open Builder'}</Text>
                </Pressable>
              </GlassCard>
            </View>
          )}
        </>
      )}

      {/* Builder Tab content */}
      {activeTab === 'builder' && (
        <View style={styles.builderTabWrapper}>
          <ProgramBuilderShell embedded role="client" onSavePlan={handleSavePlanFromBuilder} />
        </View>
      )}
    </ScreenContainer>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  sectionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  sectionActionText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  draftCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  draftCardMeta: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
  },
  draftCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  draftCardBtnDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerDim,
  },
  draftCardBtnText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  historyCard: {
    gap: 8,
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  programName: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.lg,
    marginTop: 4,
  },
  programMeta: { color: colors.textMuted, fontSize: typography.size.sm },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ctaText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  errorText: { color: colors.danger, fontSize: typography.size.sm },
  builderTitle: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  dayDrawer: { gap: 8 },
  prescriptionRow: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    backgroundColor: colors.surface2,
    padding: spacing.sm,
  },
  prescriptionName: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radii.md,
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  actionText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  
  // Custom tabs styles
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 4,
    gap: 4,
    marginBottom: spacing.sm,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primaryBorder,
  },
  segmentText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  segmentTextActive: {
    color: colors.primary,
  },

  // Vertical drafts list styles
  verticalDraftList: {
    gap: 12,
    marginTop: 4,
  },
  verticalDraftCard: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radii.md,
  },
  verticalDraftCardTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
  },
  verticalDraftCardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },

  // Builder tab wrapper
  builderTabWrapper: {
    flex: 1,
  },
});
