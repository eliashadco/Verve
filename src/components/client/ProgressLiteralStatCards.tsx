import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/auth/AuthProvider';
import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { getOrCreateDirectConversation } from '@/hooks/useConversations';
import { useLinkedPractitioners } from '@/hooks/useLinkedPractitioners';
import { supabase } from '@/lib/supabase';
import {
  PROGRESS_MUSCLE_REGION_DEFS,
  computeCompletedVolumeRolling7dForProgram,
  computeTargetVolumeByMuscle,
  countSessionsRolling7dForProgram,
  delayedMuscleRegionCountOver72h,
  lastWorkedHoursByMuscle,
  pickTopMuscleKeys,
} from '@/lib/progressMuscleStats';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';
import type { Program } from '@/types/database';
import type { ProgressHistoryItem } from '@/hooks/useProgressStats';

const ENERGY_STORAGE_KEY = 'verve_energy_level_v1';

type Tone = 'success' | 'warning' | 'danger' | 'primary';

const MILESTONE_ROWS: {
  icon: string;
  labelKey: string;
  achieved: boolean;
  dateKey?: string;
  chips?: string[];
  progress?: number;
  goal?: number;
  current?: number;
  unitKey?: string;
  nextKey?: string;
}[] = [
  {
    icon: '🏆',
    labelKey: 'userTrial.progress.milestone10Sessions',
    achieved: true,
    dateKey: 'userTrial.progress.milestone10SessionsDate',
    chips: ['userTrial.progress.milestoneChipConsistency', 'userTrial.progress.milestoneChipEarly'],
  },
  {
    icon: '💪',
    labelKey: 'userTrial.progress.milestoneSquat',
    achieved: false,
    progress: 90,
    goal: 100,
    current: 90,
    unitKey: 'userTrial.progress.milestoneUnitKg',
    nextKey: 'userTrial.progress.milestoneSquatNext',
  },
  {
    icon: '🔥',
    labelKey: 'userTrial.progress.milestoneStreak',
    achieved: false,
    progress: 12,
    goal: 21,
    current: 12,
    unitKey: 'userTrial.progress.milestoneUnitDays',
    nextKey: 'userTrial.progress.milestoneStreakNext',
  },
];

function muscleLabel(t: ReturnType<typeof useTranslation>['t'], id: string): string {
  const def = PROGRESS_MUSCLE_REGION_DEFS.find((d) => d.id === id);
  return def ? t(`userTrial.progress.${def.labelKey}`) : id;
}

function recoveryTone(readiness: number): Tone {
  if (readiness >= 85) return 'success';
  if (readiness >= 60) return 'warning';
  return 'danger';
}

function volumeTone(pct: number): Tone {
  if (pct >= 85) return 'success';
  if (pct >= 55) return 'primary';
  return 'warning';
}

function energyBadge(energy: number, t: ReturnType<typeof useTranslation>['t']): { label: string; tone: 'success' | 'warning' | 'danger' } {
  if (energy >= 8) return { label: t('userTrial.progress.energyHigh'), tone: 'success' };
  if (energy >= 5) return { label: t('userTrial.progress.energyBalanced'), tone: 'warning' };
  return { label: t('userTrial.progress.energyRecovery'), tone: 'danger' };
}

const toneColors: Record<Tone, string> = {
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  primary: colors.primary,
};

export function ProgressRecoveryByMuscleCard({
  program,
  history,
}: {
  program: Program | null;
  history: ProgressHistoryItem[];
}) {
  const { t } = useTranslation();
  const nameById = program ? { [program.id]: program.name } : {};
  const completed = computeCompletedVolumeRolling7dForProgram(history, program?.id ?? null, nameById);
  const targets = computeTargetVolumeByMuscle(program);
  const focusKeys = pickTopMuscleKeys(completed, targets, 3);
  const hoursBy = lastWorkedHoursByMuscle(history);

  const rows = focusKeys.map((key) => {
    const lastH = hoursBy[key];
    const hours = lastH != null ? lastH : 72;
    const readiness = Math.min(100, Math.round((hours / 48) * 100));
    const tone = recoveryTone(readiness);
    const restLabel =
      lastH != null
        ? t('userTrial.progress.recoveryHoursRest', { count: lastH })
        : t('userTrial.progress.recoveryNoRecentLoad');
    return { key, label: muscleLabel(t, key), readiness, tone, restLabel };
  });

  const delayed = delayedMuscleRegionCountOver72h(history);
  const note = delayed
    ? t('userTrial.progress.recoveryNoteDelayed', { count: delayed })
    : t('userTrial.progress.recoveryNoteDefault');

  return (
    <GlassCard style={styles.statCard}>
      <Text style={styles.statLabel}>{t('userTrial.progress.recoveryByMuscleTitle')}</Text>
      <View style={styles.listGap}>
        {rows.length === 0 ? (
          <Text style={styles.mutedSmall}>{t('userTrial.progress.recoveryEmpty')}</Text>
        ) : (
          rows.map((row) => (
            <View key={row.key} style={styles.listGap}>
              <View style={styles.rowBetween}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={[styles.rowValue, { color: toneColors[row.tone] }]}>
                  {row.readiness}% · {row.restLabel}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${row.readiness}%`, backgroundColor: toneColors[row.tone] },
                  ]}
                />
              </View>
            </View>
          ))
        )}
      </View>
      <Text style={styles.note}>{note}</Text>
    </GlassCard>
  );
}

export function ProgressWeeklyVolumeCard({
  program,
  history,
}: {
  program: Program | null;
  history: ProgressHistoryItem[];
}) {
  const { t } = useTranslation();
  const targets = computeTargetVolumeByMuscle(program);
  const nameById = program ? { [program.id]: program.name } : {};
  const completed = computeCompletedVolumeRolling7dForProgram(history, program?.id ?? null, nameById);
  const focusKeys =
    Object.keys(targets).length > 0 ? pickTopMuscleKeys({}, targets, 3) : pickTopMuscleKeys(completed, {}, 3);

  const sessionsThisWeek = countSessionsRolling7dForProgram(history, program?.id ?? null, nameById);
  const note = program
    ? t('userTrial.progress.weeklyVolumeNoteProgram', { count: sessionsThisWeek })
    : t('userTrial.progress.weeklyVolumeNoteDefault');

  const clampPct = (n: number) => Math.min(100, Math.max(0, n));

  return (
    <GlassCard style={styles.statCard}>
      <Text style={styles.statLabel}>{t('userTrial.progress.weeklyVolumeCardTitle')}</Text>
      <View style={styles.listGap}>
        {focusKeys.length === 0 ? (
          <Text style={styles.mutedSmall}>{t('userTrial.progress.weeklyVolumeEmpty')}</Text>
        ) : (
          focusKeys.map((key) => {
            const c = completed[key] || 0;
            const target = targets[key] || Math.max(c, 8);
            const pct = target ? clampPct(Math.round((c / target) * 100)) : 0;
            const tone = volumeTone(pct);
            return (
              <View key={key} style={styles.listGap}>
                <View style={styles.rowBetween}>
                  <Text style={styles.rowLabel}>{muscleLabel(t, key)}</Text>
                  <Text style={styles.rowValueBold}>
                    {c} / {target} {t('userTrial.progress.setsSuffix')}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(8, pct)}%`, backgroundColor: toneColors[tone] },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>
      <Text style={styles.note}>{note}</Text>
    </GlassCard>
  );
}

export function ProgressEnergyLevelCard() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const practitioners = useLinkedPractitioners(profile?.id ?? null);
  const [energy, setEnergy] = useState(7);
  const [trackWidth, setTrackWidth] = useState(280);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(ENERGY_STORAGE_KEY);
        const n = Number(raw);
        if (!cancelled && Number.isFinite(n) && n >= 1 && n <= 10) setEnergy(n);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void AsyncStorage.setItem(ENERGY_STORAGE_KEY, String(energy));
  }, [energy]);

  const badge = energyBadge(energy, t);
  const badgeTone: 'primary' | 'warning' | 'danger' =
    energy >= 8 ? 'primary' : energy >= 5 ? 'warning' : 'danger';
  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setTrackWidth(w);
  };

  const onTrackPress = (evt: { nativeEvent: { locationX: number } }) => {
    const x = evt.nativeEvent.locationX;
    const w = Math.max(1, trackWidth);
    const segment = Math.round((x / w) * 9) + 1;
    setEnergy(Math.min(10, Math.max(1, segment)));
  };

  const thumbLeft = Math.max(0, ((energy - 1) / 9) * (trackWidth - 20));

  const onNotifyTrainer = useCallback(async () => {
    const practitioner = practitioners.data[0];
    if (!profile?.id) {
      Alert.alert(t('userTrial.progress.energyNotifyNeedProfile'));
      return;
    }
    if (!practitioner?.id) {
      Alert.alert(t('userTrial.progress.energyNotifyNeedPractitioner'));
      return;
    }
    setBusy(true);
    try {
      const conversationId = await getOrCreateDirectConversation(profile.id, practitioner.id);
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        content: t('userTrial.progress.energyNotifyMessage', { n: energy }),
      });
      if (error) throw error;
      Alert.alert(t('userTrial.progress.energyNotifyOkTitle'), t('userTrial.progress.energyNotifyOkBody'));
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('common.serverError');
      Alert.alert(t('userTrial.progress.energyNotifyFailTitle'), msg);
    } finally {
      setBusy(false);
    }
  }, [energy, practitioners.data, profile?.id, t]);

  return (
    <GlassCard style={styles.statCard}>
      <Text style={styles.statLabel}>{t('userTrial.progress.energyLevelTitle')}</Text>
      <View style={styles.energyTop}>
        <Text style={styles.energyValue}>{t('userTrial.progress.energyFraction', { n: energy })}</Text>
        <Badge label={badge.label} tone={badgeTone} />
      </View>
      <Text style={styles.adjustLabel}>{t('userTrial.progress.energyAdjustLabel')}</Text>
      <Pressable onPress={onTrackPress} onLayout={onTrackLayout} style={styles.sliderTrack}>
        <View style={[styles.sliderThumb, { left: thumbLeft }]} />
      </Pressable>
      <Pressable
        onPress={() => void onNotifyTrainer()}
        disabled={busy}
        style={[styles.notifyBtn, busy && { opacity: 0.6 }]}
      >
        <Text style={styles.notifyBtnText}>{t('userTrial.progress.notifyTrainer')}</Text>
      </Pressable>
    </GlassCard>
  );
}

export function ProgressMilestonesPanel() {
  const { t } = useTranslation();
  return (
    <GlassCard style={styles.milestonesCard}>
      <View style={styles.milestonesHeader}>
        <Text style={styles.sectionTitle}>{t('userTrial.progress.milestonesTitle')}</Text>
        <Text style={styles.premiumBadge}>{t('userTrial.progress.milestonesPremium')}</Text>
      </View>
      <View style={styles.listGap}>
        {MILESTONE_ROWS.map((row, index) =>
          row.achieved ? (
            <View key={index} style={styles.milestoneAchieved}>
              <Text style={styles.milestoneIcon}>{row.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.milestoneTitle}>{t(row.labelKey)}</Text>
                {row.dateKey ? (
                  <Text style={styles.milestoneMeta}>{t(row.dateKey)}</Text>
                ) : null}
                <View style={styles.chipRow}>
                  {row.chips?.map((ck) => (
                    <View key={ck} style={styles.chip}>
                      <Text style={styles.chipText}>{t(ck)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <View key={index}>
              <View style={styles.rowBetween}>
                <Text style={styles.milestoneRowLabel}>
                  {row.icon} {t(row.labelKey)}
                </Text>
                <Text style={styles.milestoneMeta}>
                  {row.current}/{row.goal} {row.unitKey ? t(row.unitKey) : ''}
                </Text>
              </View>
              <View style={styles.milestoneBar}>
                <View
                  style={[
                    styles.milestoneFill,
                    { width: `${Math.round(((row.progress ?? 0) / (row.goal ?? 1)) * 100)}%` },
                  ]}
                />
              </View>
              {row.nextKey ? <Text style={styles.milestoneNext}>{t(row.nextKey)}</Text> : null}
            </View>
          ),
        )}
      </View>
      <View style={styles.digitalTwinFooter}>
        <Text style={styles.digitalTwinIcon}>✦</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.digitalTwinTitle}>{t('userTrial.progress.digitalTwinComingTitle')}</Text>
          <Text style={styles.digitalTwinBody}>{t('userTrial.progress.digitalTwinComingBody')}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  statCard: {
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(71,85,105,0.35)',
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  statLabel: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    marginBottom: 4,
  },
  listGap: { gap: 8 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  rowLabel: { color: colors.textStrong, fontSize: typography.size.sm, fontFamily: typography.family.body },
  rowValue: { fontSize: typography.size.sm, fontFamily: typography.family.bodyMedium },
  rowValueBold: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  mutedSmall: { color: colors.textMuted, fontSize: typography.size.sm },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 4 },
  note: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 8 },
  energyTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  energyValue: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.xl,
  },
  adjustLabel: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 12 },
  sliderTrack: {
    height: 28,
    marginTop: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    position: 'relative',
  },
  sliderThumb: {
    position: 'absolute',
    top: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.textStrong,
  },
  notifyBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    alignItems: 'center',
  },
  notifyBtnText: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  milestonesCard: { gap: spacing.md },
  milestonesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  premiumBadge: {
    color: colors.warning,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
  },
  milestoneAchieved: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.22)',
  },
  milestoneIcon: { fontSize: 22, lineHeight: 24 },
  milestoneTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  milestoneMeta: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 },
  milestoneRowLabel: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  milestoneBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 6,
    overflow: 'hidden',
  },
  milestoneFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  milestoneNext: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.35)',
  },
  chipText: { color: colors.success, fontFamily: typography.family.bodyMedium, fontSize: 10 },
  digitalTwinFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(139,92,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.28)',
  },
  digitalTwinIcon: { color: '#a78bfa', fontSize: 18 },
  digitalTwinTitle: { color: '#c4b5fd', fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  digitalTwinBody: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2, lineHeight: 16 },
});
