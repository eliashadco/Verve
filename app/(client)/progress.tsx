import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { differenceInDays, format, parseISO } from 'date-fns';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

import { useAuth } from '@/auth/AuthProvider';
import { Badge } from '@/components/Badge';
import { lazy, Suspense } from 'react';
import { ActivityIndicator } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { BioMapNotesDrawer, type BioMapNote } from '@/components/client/BioMapNotesDrawer';
import type { BodyRegion } from '@/components/client/BodyMapPreview';
const BodyStatusAnatomyModel = lazy(() =>
  import('@/components/client/BodyStatusAnatomyModel').then((m) => ({ default: m.BodyStatusAnatomyModel }))
);
import { ProgressTimelineCalendar, type ProgressDayStatus } from '@/components/client/ProgressTimelineCalendar';
import {
  ProgressEnergyLevelCard,
  ProgressMilestonesPanel,
  ProgressRecoveryByMuscleCard,
  ProgressWeeklyVolumeCard,
} from '@/components/client/ProgressLiteralStatCards';
import { RecoveryWarriorBadges } from '@/components/client/RecoveryWarriorBadges';
import { TrainingLogSummary } from '@/components/client/TrainingLogSummary';
import { UserTrialProgressBar } from '@/components/client/UserTrialProgressBar';
import { WearableReadinessCard } from '@/components/client/WearableReadinessCard';
import { useAdherence } from '@/hooks/useAdherence';
import { useConstraints, type ConstraintListItem } from '@/hooks/useConstraints';
import { usePrograms } from '@/hooks/usePrograms';
import { useProgressStats } from '@/hooks/useProgressStats';
import type { ProgressHistoryItem } from '@/hooks/useProgressStats';
import { useWearableSummary } from '@/hooks/useWearableSummary';
import { USER_TRIAL_DEMO_FLAGS } from '@/lib/demo/userTrialFixtures';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

const WEEKS_BADGE_COUNT = 8;

const BODY_REGION_DEFS = [
  { id: 'head', labelKey: 'regionHead', matchers: ['head', 'neck', 'cervical'] },
  { id: 'shoulders', labelKey: 'regionShoulders', matchers: ['shoulder', 'delt', 'press'] },
  { id: 'chest', labelKey: 'regionChest', matchers: ['chest', 'bench', 'pec'] },
  { id: 'upperBack', labelKey: 'regionUpperBack', matchers: ['back', 'row', 'lat', 'pull'] },
  { id: 'core', labelKey: 'regionCore', matchers: ['core', 'trunk', 'ab'] },
  { id: 'hips', labelKey: 'regionHips', matchers: ['hip', 'glute'] },
  { id: 'quads', labelKey: 'regionQuads', matchers: ['quad', 'squat', 'leg press', 'lunge'] },
  { id: 'ham', labelKey: 'regionHamstrings', matchers: ['ham', 'hinge', 'deadlift', 'rdl'] },
  { id: 'knee', labelKey: 'regionKnees', matchers: ['knee', 'patella'] },
  { id: 'calves', labelKey: 'regionCalves', matchers: ['calf', 'calves'] },
] as const;

const DEMO_BODY_REGION_OVERRIDES: Record<string, { tone: BodyRegion['tone']; noteKey: string; lastExerciseKey: string }> = {
  shoulders: { tone: 'sore', noteKey: 'demoShouldersNote', lastExerciseKey: 'demoOverheadPress' },
  chest: { tone: 'resolved', noteKey: 'demoChestNote', lastExerciseKey: 'demoBenchPress' },
  hips: { tone: 'sore', noteKey: 'demoHipsNote', lastExerciseKey: 'demoHipAirplane' },
  quads: { tone: 'sore', noteKey: 'demoQuadsNote', lastExerciseKey: 'demoSplitSquat' },
  knee: { tone: 'restricted', noteKey: 'demoKneeNote', lastExerciseKey: 'demoLegPress' },
};

export default function ClientProgress() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const adherence = useAdherence(profile?.id ?? null, 200);
  const progress = useProgressStats(profile?.id ?? null);
  const programsState = usePrograms(profile?.id ?? null, 'client');
  const activeProgram = useMemo(
    () =>
      programsState.programs.find((program) => program.status === 'active') ?? programsState.programs[0] ?? null,
    [programsState.programs],
  );
  const constraints = useConstraints(profile?.id ?? null);
  const wearable = useWearableSummary();

  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [mode, setMode] = useState<'body-map' | 'training-log'>('body-map');
  const [bodyMapView, setBodyMapView] = useState<'list' | 'map'>('map');
  const [anatomySide, setAnatomySide] = useState<'anterior' | 'posterior'>('anterior');
  const [range, setRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [selectedRegion, setSelectedRegion] = useState<BodyRegion | null>(null);
  const [notesDrawerOpen, setNotesDrawerOpen] = useState(false);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [bodyNotes, setBodyNotes] = useState<BioMapNote[]>([]);

  const filteredHistory = useMemo(() => {
    if (range === 'all') return progress.data.history;
    const maxDays = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    return progress.data.history.filter((item) => differenceInDays(new Date(), parseISO(item.createdAt)) <= maxDays);
  }, [progress.data.history, range]);

  const selectedHistory = useMemo(
    () => filteredHistory.find((item) => item.id === selectedHistoryId) ?? null,
    [filteredHistory, selectedHistoryId],
  );

  const bodyRegions = useMemo(
    () => buildBodyRegions({
      t,
      constraints: constraints.data,
      history: progress.data.history,
      demoEnabled: USER_TRIAL_DEMO_FLAGS.enabled,
    }),
    [constraints.data, progress.data.history, t],
  );

  const timelineStatuses = useMemo(
    () => buildTimelineStatuses(progress.data.history),
    [progress.data.history],
  );

  const painLoadLabel = useMemo(() => {
    const painCount = progress.data.history.reduce(
      (sum, item) => sum + item.exercises.filter((exercise) => exercise.painReported).length,
      0,
    );
    return painCount > 0 ? `${painCount}` : t('userTrial.progress.noPainLogged');
  }, [progress.data.history, t]);

  const currentStreak = useMemo(() => getCurrentStreakDays(progress.data.history), [progress.data.history]);

  const refreshing =
    adherence.loading || progress.loading || constraints.loading || programsState.loading;
  const onRefresh = () => {
    adherence.refresh();
    progress.refresh();
    constraints.refresh();
    programsState.refresh();
  };

  const onSaveBodyNote = () => {
    const trimmed = noteDraft.trim();
    if (!trimmed || !selectedRegion) return;
    setBodyNotes((prev) => [
      { id: `${selectedRegion.id}-${Date.now()}`, region: selectedRegion.label, note: trimmed, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setNoteDraft('');
    setNoteEditorOpen(false);
  };

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Header title={t('screens.progressClient.title')} />
      <View style={styles.modeRow}>
        <Text style={styles.subTitle}>{t('userTrial.progress.subtitle')}</Text>
        <Pressable onPress={() => Alert.alert(t('userTrial.progress.shareSoonTitle'), t('userTrial.progress.shareSoonBody'))} style={styles.shareBtn}>
          <Text style={styles.shareText}>{t('userTrial.progress.shareReport')}</Text>
        </Pressable>
      </View>
      <View style={styles.segmentedRow}>
        <Pressable onPress={() => setMode('body-map')} style={[styles.segment, mode === 'body-map' && styles.segmentActive]}>
          <Text style={[styles.segmentText, mode === 'body-map' && styles.segmentTextActive]}>{t('userTrial.progress.bodyMap')}</Text>
        </Pressable>
        <Pressable onPress={() => setMode('training-log')} style={[styles.segment, mode === 'training-log' && styles.segmentActive]}>
          <Text style={[styles.segmentText, mode === 'training-log' && styles.segmentTextActive]}>{t('userTrial.progress.trainingLog')}</Text>
        </Pressable>
      </View>

      {mode === 'body-map' ? (
        <>
          <GlassCard style={styles.chartCard}>
            <Text style={styles.chartTitle}>{t('userTrial.progress.bodyMap')}</Text>
            <View style={styles.filterRow}>
              {[
                { value: 'list', label: t('userTrial.progress.listView') },
                { value: 'map', label: t('userTrial.progress.bodyMap') },
              ].map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => setBodyMapView(item.value as typeof bodyMapView)}
                  style={[styles.filterChip, bodyMapView === item.value && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, bodyMapView === item.value && styles.filterTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
            {bodyMapView === 'map' ? (
              <Suspense fallback={<ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />}>
                <BodyStatusAnatomyModel
                  regions={bodyRegions}
                  selectedRegion={selectedRegion}
                  view={anatomySide}
                  onChangeView={setAnatomySide}
                  onSelectRegion={setSelectedRegion}
                  onOpenNotes={() => setNotesDrawerOpen(true)}
                  onAddNote={() => {
                    setSelectedRegion((current) => current ?? bodyRegions[0]);
                    setNoteEditorOpen(true);
                  }}
                />
              </Suspense>
            ) : (
              <View style={styles.regionList}>
                {bodyRegions.map((region) => (
                  <Pressable key={region.id} onPress={() => setSelectedRegion(region)} style={styles.regionRow}>
                    <View style={[styles.regionToneDot, styles[`tone_${region.tone}`]]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.regionTitle}>{region.label}</Text>
                      <Text style={styles.regionMeta}>{region.note} · {region.lastExercise}</Text>
                    </View>
                    <Badge label={region.tone} tone={region.tone === 'restricted' ? 'clinical' : 'neutral'} />
                  </Pressable>
                ))}
              </View>
            )}
            <Pressable
              onPress={() => {
                setSelectedRegion((current) => current ?? bodyRegions[0]);
                setNoteEditorOpen(true);
              }}
              style={styles.shareBtn}
            >
              <Text style={styles.shareText}>{t('userTrial.progress.addNote')}</Text>
            </Pressable>
            {bodyNotes.length > 0 ? (
              <View style={styles.noteList}>
                {bodyNotes.slice(0, 3).map((note) => (
                  <View key={note.id} style={styles.noteRow}>
                    <Text style={styles.noteTitle}>{note.region}</Text>
                    <Text style={styles.noteBody}>{note.note}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </GlassCard>
          <GlassCard style={styles.chartCard}>
            <Text style={styles.chartTitle}>{t('userTrial.progress.digitalTwinPreview')}</Text>
            <Text style={styles.subTitle}>{t('userTrial.progress.digitalTwinBody')}</Text>
          </GlassCard>
          {wearable.summary ? (
            <WearableReadinessCard
              readiness={wearable.summary.readinessScore}
              hrv={wearable.summary.hrvMs}
              rhr={wearable.summary.restingHeartRate}
              sleepHours={wearable.summary.sleepHours}
            />
          ) : (
            <GlassCard>
              <Text style={styles.subTitle}>{t('wearables.notConnected')}</Text>
            </GlassCard>
          )}
          <View style={styles.literalStatStack}>
            <ProgressRecoveryByMuscleCard program={activeProgram} history={progress.data.history} />
            <ProgressWeeklyVolumeCard program={activeProgram} history={progress.data.history} />
            <ProgressEnergyLevelCard />
          </View>
          <View style={styles.kpiGrid}>
            <MiniKpiCard
              label={t('userTrial.progress.weeklyVolume')}
              value={`${Math.round(progress.data.totals.volumeKg)} kg`}
            />
            <MiniKpiCard label={t('userTrial.progress.oneRmDelta')} value={t('common.emDash')} />
            <MiniKpiCard label={t('userTrial.progress.painLoad')} value={painLoadLabel} />
            <MiniKpiCard label={t('userTrial.progress.streak')} value={t('userTrial.progress.daysLogged', { count: currentStreak })} />
            <MiniKpiCard label={t('userTrial.progress.levelXpMini')} value={t('userTrial.programs.levelXp')} />
          </View>
          <ProgressTimelineCalendar
            statuses={timelineStatuses}
            loggedSessions={progress.data.totals.sessions}
          />
          <RecoveryWarriorBadges
            sessions={progress.data.totals.sessions}
            adherencePct={progress.data.totals.avgAdherencePct}
          />
          <ProgressMilestonesPanel />
        </>
      ) : (
        <>
          <TrainingLogSummary
            sessions={progress.data.totals.sessions}
            totalSets={progress.data.totals.totalSets}
            volumeKg={progress.data.totals.volumeKg}
            avgAdherencePct={progress.data.totals.avgAdherencePct}
          />
          <View style={styles.filterRow}>
            {[
              { value: 'all', label: t('userTrial.progress.rangeAll') },
              { value: '7d', label: t('userTrial.progress.range7d') },
              { value: '30d', label: t('userTrial.progress.range30d') },
              { value: '90d', label: t('userTrial.progress.range90d') },
            ].map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setRange(item.value as typeof range)}
                style={[styles.filterChip, range === item.value && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, range === item.value && styles.filterTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
          <GlassCard style={styles.chartCard}>
            <Text style={styles.chartTitle}>{t('userTrial.progress.strengthTrends')}</Text>
            <UserTrialProgressBar
              label={t('userTrial.progress.sessionAdherence')}
              valueLabel={`${Math.round(progress.data.totals.avgAdherencePct)}%`}
              progress={progress.data.totals.avgAdherencePct}
            />
            <UserTrialProgressBar
              label={t('userTrial.progress.volumeByMuscle')}
              valueLabel={`${Math.round(progress.data.totals.volumeKg)} kg`}
              progress={Math.min(100, progress.data.totals.volumeKg / 100)}
            />
            <UserTrialProgressBar
              label={t('userTrial.progress.setsPerSession')}
              valueLabel={`${progress.data.totals.sessions ? Math.round(progress.data.totals.totalSets / progress.data.totals.sessions) : 0}`}
              progress={Math.min(100, progress.data.totals.totalSets * 2)}
            />
          </GlassCard>
          <GlassCard style={styles.chartCard}>
            <Text style={styles.chartTitle}>{t('userTrial.progress.adaptiveProgress')}</Text>
            <Badge label={progress.data.totals.sessions > 0 ? t('userTrial.progress.achievementUnlocked') : t('userTrial.progress.firstSessionPending')} tone="primary" />
            <Text style={styles.subTitle}>{t('userTrial.progress.adaptiveBody')}</Text>
          </GlassCard>
          <GlassCard style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{t('screens.progressClient.sessionsPerWeek')}</Text>
          <Badge label={t('screens.progressClient.badgeWeeks', { count: WEEKS_BADGE_COUNT })} tone="neutral" />
        </View>
        <WeeklyBars points={progress.data.weekly} />
      </GlassCard>

      <GlassCard style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{t('screens.progressClient.weeklyVolumeKg')}</Text>
          <Badge label={t('screens.progressClient.badgeWeeks', { count: WEEKS_BADGE_COUNT })} tone="neutral" />
        </View>
        <VolumeLine points={progress.data.weekly} />
      </GlassCard>
        </>
      )}

      <Text style={styles.sectionTitle}>{t('screens.progressClient.sessionHistory')}</Text>
      {progress.error ? (
        <GlassCard>
          <Text style={styles.errorText}>{progress.error}</Text>
        </GlassCard>
      ) : null}

      {filteredHistory.length === 0 && !progress.loading ? (
        <GlassCard>
          <EmptyState
            icon="stats-chart-outline"
            title={t('screens.progressClient.emptyHistoryTitle')}
            body={t('screens.progressClient.emptyHistoryBody')}
          />
        </GlassCard>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable onPress={() => setSelectedHistoryId(item.id)} style={styles.historyPressable}>
              <GlassCard style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyProgram}>{item.programName}</Text>
                  <Text style={styles.historyDate}>{format(parseISO(item.createdAt), 'd MMM')}</Text>
                </View>
                <Text style={styles.historyDay}>{item.dayLabel}</Text>
                <Text style={styles.historyMeta}>
                  {t('screens.progressClient.historyRowMeta', {
                    count: item.exerciseCount,
                    volume: Math.round(item.totalVolumeKg),
                  })}
                </Text>
              </GlassCard>
            </Pressable>
          )}
          scrollEnabled={false}
          ListFooterComponent={
            progress.hasMore ? (
              <Pressable
                onPress={() => {
                  void progress.loadMore();
                }}
                disabled={progress.loadingMore}
                style={styles.loadMoreBtn}
                accessibilityLabel={t('screens.progressClient.loadMoreA11y')}
              >
                <Text style={styles.loadMoreText}>
                  {progress.loadingMore ? t('common.loading') : t('screens.progressClient.loadMore')}
                </Text>
              </Pressable>
            ) : null
          }
        />
      )}

      <Modal
        visible={Boolean(selectedRegion)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRegion(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedRegion(null)}>
          <Pressable style={styles.modalSheet} onPress={() => undefined}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{selectedRegion?.label}</Text>
            <Text style={styles.modalSubtitle}>{selectedRegion?.note}</Text>
            <Text style={styles.modalDay}>{t('userTrial.progress.lastExercise', { name: selectedRegion?.lastExercise ?? 'N/A' })}</Text>
            <Pressable style={styles.loadMoreBtn} onPress={() => setNoteEditorOpen(true)}>
              <Text style={styles.loadMoreText}>{t('userTrial.progress.addNote')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <BioMapNotesDrawer
        visible={notesDrawerOpen}
        notes={bodyNotes}
        onClose={() => setNotesDrawerOpen(false)}
      />
      <Modal
        visible={noteEditorOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteEditorOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setNoteEditorOpen(false)}>
          <Pressable style={styles.modalSheet} onPress={() => undefined}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{t('userTrial.progress.bioMapNote')}</Text>
            <Text style={styles.modalSubtitle}>{selectedRegion?.label ?? t('userTrial.progress.bodyRegion')}</Text>
            <TextInput
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder={t('userTrial.progress.notePlaceholder')}
              placeholderTextColor={colors.textFaint}
              style={styles.noteInput}
              multiline
            />
            <Pressable
              style={[styles.loadMoreBtn, !noteDraft.trim() && { opacity: 0.5 }]}
              disabled={!noteDraft.trim()}
              onPress={onSaveBodyNote}
            >
              <Text style={styles.loadMoreText}>{t('userTrial.progress.saveNote')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={Boolean(selectedHistory)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedHistoryId(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedHistoryId(null)}>
          <Pressable style={styles.modalSheet} onPress={() => undefined}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {selectedHistory?.programName ?? t('screens.progressClient.sessionDetails')}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedHistory ? format(parseISO(selectedHistory.createdAt), 'EEE d MMM · HH:mm') : ''}
            </Text>
            <Text style={styles.modalDay}>{selectedHistory?.dayLabel}</Text>

            <View style={styles.modalList}>
              {selectedHistory?.exercises.map((exercise, index) => (
                <View key={`${index}-${exercise.exerciseId}`} style={styles.modalRow}>
                  <View style={styles.modalDot} />
                  <View style={styles.modalRowBody}>
                    <Text style={styles.modalRowTitle}>{t('screens.progressClient.exerciseIndex', { n: index + 1 })}</Text>
                    <Text style={styles.modalRowMeta}>
                      {t('screens.progressClient.setsRepsLine', {
                        sets: exercise.setsCompleted,
                        reps: exercise.repsPerSet.join('/'),
                      })}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

function WeeklyBars({ points }: { points: { weekLabel: string; sessions: number }[] }) {
  const width = 320;
  const height = 150;
  const chartTop = 14;
  const chartBottom = 118;
  const barWidth = 22;
  const spacing = 18;
  const maxSessions = Math.max(1, ...points.map((point) => point.sessions));

  return (
    <View style={styles.chartWrap}>
      <Svg width={width} height={height}>
        <Line x1={0} y1={chartBottom} x2={width} y2={chartBottom} stroke={colors.borderDefault} strokeWidth={1} />
        {points.map((point, index) => {
          const x = 12 + index * (barWidth + spacing);
          const barHeight = maxSessions > 0 ? (point.sessions / maxSessions) * (chartBottom - chartTop) : 0;
          const y = chartBottom - barHeight;
          return (
            <Rect
              key={`${point.weekLabel}-${index}`}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(2, barHeight)}
              fill={colors.primary}
              rx={4}
            />
          );
        })}
      </Svg>
      <View style={styles.chartLabels}>
        {points.map((point) => (
          <Text key={point.weekLabel} style={styles.chartLabel}>{point.weekLabel}</Text>
        ))}
      </View>
    </View>
  );
}

function MiniKpiCard({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard variant="stat" style={styles.kpiCard}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </GlassCard>
  );
}

function buildBodyRegions({
  t,
  constraints,
  history,
  demoEnabled,
}: {
  t: ReturnType<typeof useTranslation>['t'];
  constraints: ConstraintListItem[];
  history: ProgressHistoryItem[];
  demoEnabled: boolean;
}): BodyRegion[] {
  const lastExerciseByRegion = getLastExerciseByRegion(history);

  return BODY_REGION_DEFS.map((definition) => {
    const matchedConstraint = constraints.find((constraint) => {
      const target = `${constraint.body_region ?? ''} ${constraint.target ?? ''} ${constraint.constraint_type ?? ''}`.toLowerCase();
      return definition.matchers.some((matcher) => target.includes(matcher));
    });
    const demoOverride = demoEnabled ? DEMO_BODY_REGION_OVERRIDES[definition.id] : undefined;
    const tone = matchedConstraint
      ? constraintTone(matchedConstraint.severity)
      : demoOverride?.tone ?? 'neutral';

    return {
      id: definition.id,
      label: t(`userTrial.progress.${definition.labelKey}`),
      tone,
      note: matchedConstraint?.notes ?? matchedConstraint?.value ?? (demoOverride ? t(`userTrial.progress.${demoOverride.noteKey}`) : t('userTrial.progress.neutralBodyNote')),
      lastExercise: lastExerciseByRegion[definition.id] ?? (demoOverride ? t(`userTrial.progress.${demoOverride.lastExerciseKey}`) : undefined),
    };
  });
}

function constraintTone(severity: ConstraintListItem['severity']): BodyRegion['tone'] {
  if (severity === 'hard') return 'restricted';
  if (severity === 'soft') return 'pain';
  return 'sore';
}

function getLastExerciseByRegion(history: ProgressHistoryItem[]) {
  const lastByRegion: Record<string, string> = {};
  for (const item of history) {
    for (const exercise of item.exercises) {
      const label = exercise.exerciseId;
      const haystack = label.toLowerCase();
      const region = BODY_REGION_DEFS.find((definition) =>
        definition.matchers.some((matcher) => haystack.includes(matcher)),
      );
      if (region && !lastByRegion[region.id]) {
        lastByRegion[region.id] = label;
      }
    }
  }
  return lastByRegion;
}

function buildTimelineStatuses(history: ProgressHistoryItem[]): ProgressDayStatus[] {
  const byDate = history.reduce<Record<string, ProgressDayStatus>>((acc, item) => {
    const key = format(parseISO(item.createdAt), 'yyyy-MM-dd');
    const completed = item.exercises.filter((exercise) => !exercise.skipped).length;
    acc[key] = completed === 0 || completed < item.exercises.length ? 'partial' : 'done';
    return acc;
  }, {});

  return Array.from({ length: 28 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - index));
    const key = format(date, 'yyyy-MM-dd');
    const day = date.getDay();
    return byDate[key] ?? (day === 0 || day === 6 ? 'rest' : 'missed');
  });
}

function getCurrentStreakDays(history: ProgressHistoryItem[]) {
  const loggedDays = new Set(history.map((item) => format(parseISO(item.createdAt), 'yyyy-MM-dd')));
  let streak = 0;
  const cursor = new Date();
  while (loggedDays.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function VolumeLine({ points }: { points: { weekLabel: string; volumeKg: number }[] }) {
  const width = 320;
  const height = 150;
  const chartTop = 14;
  const chartBottom = 116;
  const chartLeft = 12;
  const chartRight = width - 12;
  const maxVolume = Math.max(1, ...points.map((point) => point.volumeKg));
  const step = points.length > 1 ? (chartRight - chartLeft) / (points.length - 1) : 0;

  const pointsAsXY = points.map((point, index) => {
    const x = chartLeft + index * step;
    const ratio = point.volumeKg / maxVolume;
    const y = chartBottom - ratio * (chartBottom - chartTop);
    return { x, y };
  });

  const path = pointsAsXY.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <View style={styles.chartWrap}>
      <Svg width={width} height={height}>
        <Line x1={0} y1={chartBottom} x2={width} y2={chartBottom} stroke={colors.borderDefault} strokeWidth={1} />
        <Path d={path} stroke={colors.clinical} strokeWidth={3} fill="none" />
        {pointsAsXY.map((point, index) => (
          <Circle key={`${index}`} cx={point.x} cy={point.y} r={3.5} fill={colors.clinical} />
        ))}
      </Svg>
      <View style={styles.chartLabels}>
        {points.map((point) => (
          <Text key={point.weekLabel} style={styles.chartLabel}>{point.weekLabel}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  literalStatStack: { gap: 10 },
  modeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  subTitle: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm, flex: 1 },
  shareBtn: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shareText: { color: colors.textMuted, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 8 },
  segmentActive: { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder, borderWidth: 1 },
  segmentText: { color: colors.textMuted, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  segmentTextActive: { color: colors.primary },
  chartCard: { gap: 10 },
  chartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chartTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  chartWrap: { alignItems: 'center', gap: 6 },
  chartLabels: { width: 320, flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
    width: 34,
    textAlign: 'center',
  },
  sectionTitle: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipActive: { borderColor: colors.primaryBorder, backgroundColor: colors.primaryDim },
  filterText: { color: colors.textMuted, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },
  filterTextActive: { color: colors.primary, fontFamily: typography.family.bodyBold },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiCard: { width: '48%', gap: 4 },
  kpiValue: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  kpiLabel: { color: colors.textFaint, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs, textTransform: 'uppercase' },
  regionList: { gap: 8 },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    padding: 10,
  },
  regionToneDot: { width: 10, height: 10, borderRadius: 5 },
  tone_neutral: { backgroundColor: colors.textFaint },
  tone_pain: { backgroundColor: colors.danger },
  tone_sore: { backgroundColor: colors.warning },
  tone_restricted: { backgroundColor: colors.clinical },
  tone_resolved: { backgroundColor: colors.success },
  regionTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  regionMeta: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.xs, marginTop: 2 },
  noteList: { gap: 8 },
  noteRow: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    padding: 10,
  },
  noteTitle: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  noteBody: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm, marginTop: 2 },
  historyPressable: { marginBottom: 10 },
  historyCard: { gap: 4 },
  historyTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyProgram: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  historyDate: { color: colors.textFaint, fontSize: typography.size.xs },
  historyDay: { color: colors.primary, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  historyMeta: { color: colors.textMuted, fontSize: typography.size.sm },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
    marginBottom: 12,
  },
  loadMoreText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 8, 0.62)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '68%',
    gap: 8,
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.lg },
  modalSubtitle: { color: colors.textFaint, fontSize: typography.size.xs },
  modalDay: { color: colors.primary, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  noteInput: {
    minHeight: 104,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    color: colors.textStrong,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    padding: 12,
    textAlignVertical: 'top',
  },
  modalList: { gap: 8, marginTop: 4 },
  modalRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  modalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  modalRowBody: { flex: 1 },
  modalRowTitle: { color: colors.textStrong, fontFamily: typography.family.bodyMedium, fontSize: typography.size.base },
  modalRowMeta: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 1 },
  errorText: { color: colors.danger, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
});
