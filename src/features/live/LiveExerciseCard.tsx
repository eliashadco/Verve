import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { colors, radii, spacing, typography } from '@/lib/theme';

export interface LiveSetRow {
  reps: string;
  weight: string;
  rir: string;
  done: boolean;
}

interface LiveExerciseCardProps {
  indexLabel: string;
  name: string;
  /** e.g. "3 x 8-12 reps" */
  prescription: string;
  /** e.g. "3-1-2-0" */
  tempo?: string | null;
  /** e.g. 90 */
  restSeconds?: number;
  notes?: string | null;
  muscleTags?: string[];
  sets: LiveSetRow[];
  totalSets: number;
  /** Prescribed rep range shown on inactive rows, e.g. "8-12" */
  prescribedReps?: string;
  onChangeSet: (setIndex: number, field: 'reps' | 'weight' | 'rir', value: string) => void;
  onToggleSetDone: (setIndex: number) => void;
  onAddSet: () => void;
  onCopyPreviousSet: () => void;
  onCopySetValues: (setIndex: number) => void;
  onNextExercise: () => void;
  onStartRest: () => void;
  restLabel?: string | null;
}

export function calculateRpe(rir: number | null) {
  if (rir == null || Number.isNaN(rir)) return null;
  return Math.max(5, Math.min(10, 10 - rir));
}

export function LiveExerciseCard({
  indexLabel,
  name,
  prescription,
  tempo,
  restSeconds,
  notes,
  muscleTags,
  sets,
  totalSets,
  prescribedReps,
  onChangeSet,
  onToggleSetDone,
  onAddSet,
  onCopyPreviousSet,
  onCopySetValues,
  onNextExercise,
  onStartRest,
  restLabel,
}: LiveExerciseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const completedSets = sets.filter((s) => s.done).length;

  return (
    <GlassCard style={styles.card}>
      {/* ── Header Row ── */}
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.index}>{indexLabel}</Text>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
          </View>
          {/* Muscle tags */}
          {muscleTags && muscleTags.length > 0 && (
            <View style={styles.tagRow}>
              {muscleTags.map((tag) => (
                <Badge key={tag} label={tag} tone="clinical" />
              ))}
            </View>
          )}
          {/* Meta row */}
          <View style={styles.metaRow}>
            {tempo ? (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={10} color={colors.textMuted} />
                <Text style={styles.metaText}>Tempo {tempo}</Text>
              </View>
            ) : null}
            {restSeconds ? (
              <View style={styles.metaChip}>
                <Ionicons name="hourglass-outline" size={10} color={colors.textMuted} />
                <Text style={styles.metaText}>Rest {restSeconds}s</Text>
              </View>
            ) : null}
            <Text style={styles.prescriptionText}>{prescription}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.progressCounter}>{completedSets}/{totalSets} sets</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textMuted}
          />
        </View>
      </Pressable>

      {/* Notes warning */}
      {notes ? (
        <View style={styles.notesRow}>
          <Badge label={notes} tone="warning" />
        </View>
      ) : null}

      {/* Rest timer */}
      {restLabel ? <Text style={styles.rest}>{restLabel}</Text> : null}

      {/* ── Set Table (collapsible) ── */}
      {expanded && (
        <>
          {/* Table header */}
          <View style={styles.tableHead}>
            <Text style={[styles.tableCell, styles.setCol]}>SET</Text>
            <Text style={styles.tableCell}>KG</Text>
            <Text style={styles.tableCell}>REPS</Text>
            <Text style={[styles.tableCell, styles.narrowCol]}>RIR</Text>
            <Text style={[styles.tableCell, styles.narrowCol]}>RPE</Text>
            {tempo ? <Text style={styles.tableCell}>TEMPO</Text> : null}
            <Text style={[styles.tableCell, styles.actionCol]}>ACTION</Text>
          </View>

          {/* Set rows */}
          {sets.map((set, setIdx) => {
            const rirNum = Number.parseInt(set.rir, 10);
            const rpe = calculateRpe(Number.isNaN(rirNum) ? null : rirNum);
            const isActive = !set.done && (setIdx === 0 || sets[setIdx - 1]?.done);
            const isInactive = !set.done && !isActive;

            return (
              <View key={setIdx} style={[styles.tableRow, set.done && styles.rowDone, isInactive && styles.rowInactive]}>
                {/* Set number */}
                <Text style={[styles.tableCell, styles.setCol, styles.setNum]}>{setIdx + 1}</Text>

                {/* KG */}
                {isActive || set.done ? (
                  <NumericCell value={set.weight} onChange={(v) => onChangeSet(setIdx, 'weight', v)} editable={!set.done} placeholder="— ·" />
                ) : (
                  <Text style={[styles.tableCell, styles.inactiveText]}>—</Text>
                )}

                {/* REPS */}
                {isActive || set.done ? (
                  <NumericCell value={set.reps} onChange={(v) => onChangeSet(setIdx, 'reps', v)} editable={!set.done} placeholder={prescribedReps || '—'} />
                ) : (
                  <Text style={[styles.tableCell, styles.inactiveText]}>{prescribedReps || '—'}</Text>
                )}

                {/* RIR */}
                {isActive ? (
                  <Pressable style={styles.rirBtn}>
                    <NumericCell value={set.rir} onChange={(v) => onChangeSet(setIdx, 'rir', v)} editable placeholder="RIR" />
                  </Pressable>
                ) : (
                  <Text style={[styles.tableCell, styles.narrowCol, styles.inactiveText]}>
                    {set.done && set.rir ? set.rir : '—'}
                  </Text>
                )}

                {/* RPE (auto-computed) */}
                <Text style={[styles.tableCell, styles.narrowCol, styles.inactiveText]}>
                  {rpe ?? '—'}
                </Text>

                {/* TEMPO (optional column) */}
                {tempo ? (
                  <Text style={[styles.tableCell, styles.inactiveText]}>{tempo}</Text>
                ) : null}

                {/* ACTION column: copy + Log */}
                <View style={[styles.actionCol, styles.actionGroup]}>
                  {(isActive || set.done) ? (
                    <>
                      <Pressable
                        onPress={() => onCopySetValues(setIdx)}
                        style={styles.copyBtn}
                        accessibilityLabel="Copy previous set"
                      >
                        <Ionicons name="copy-outline" size={12} color={colors.textMuted} />
                      </Pressable>
                      <Pressable
                        onPress={() => onToggleSetDone(setIdx)}
                        style={[styles.logBtn, set.done && styles.logBtnDone]}
                      >
                        {set.done ? (
                          <Ionicons name="checkmark" size={13} color={colors.bgApp} />
                        ) : (
                          <Text style={styles.logBtnText}>✓ Log</Text>
                        )}
                      </Pressable>
                    </>
                  ) : (
                    <View style={styles.logBtnInactive}>
                      <Text style={styles.logBtnInactiveText}>Log</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* Add Set */}
          <Pressable onPress={onAddSet} style={styles.addSetBtn}>
            <Ionicons name="add-circle-outline" size={14} color={colors.primary} />
            <Text style={styles.addSetText}>Add Set</Text>
          </Pressable>

          {/* ── Bottom Action Bar ── */}
          <View style={styles.bottomBar}>
            <Pressable onPress={onStartRest} style={styles.restBtn}>
              <Ionicons name="timer-outline" size={14} color={colors.textMain} />
              <Text style={styles.restBtnText}>Rest {restSeconds || 90}s</Text>
            </Pressable>
            <Pressable onPress={onNextExercise}>
              <LinearGradient
                colors={[colors.primary, '#0ea5e9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.nextBtn}
              >
                <Text style={styles.nextBtnText}>Next Ex</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.bgApp} />
              </LinearGradient>
            </Pressable>
          </View>
        </>
      )}
    </GlassCard>
  );
}

function NumericCell({
  value,
  onChange,
  editable,
  placeholder = '-',
}: {
  value: string;
  onChange: (next: string) => void;
  editable: boolean;
  placeholder?: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      editable={editable}
      keyboardType="numeric"
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      style={[styles.input, !editable && styles.inputDisabled]}
    />
  );
}

const styles = StyleSheet.create({
  card: { gap: 6, paddingBottom: 8 },

  /* ── Header ── */
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  headerLeft: { flex: 1, gap: 4 },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  index: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  name: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base, flex: 1 },
  progressCounter: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.xs },
  prescriptionText: {
    color: colors.textSub,
    fontFamily: typography.family.bodySemi,
    fontSize: typography.size.xs,
    marginLeft: 'auto',
  },

  /* ── Notes ── */
  notesRow: { paddingTop: 2 },

  /* ── Rest ── */
  rest: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },

  /* ── Table ── */
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingBottom: 6,
    marginTop: 4,
  },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  rowDone: { opacity: 0.5 },
  rowInactive: { opacity: 0.4 },
  tableCell: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  setCol: { flex: 0.5 },
  narrowCol: { flex: 0.7 },
  actionCol: { flex: 1.3 },
  setNum: { color: colors.textSub, fontFamily: typography.family.bodySemi, fontSize: typography.size.sm },
  inactiveText: { color: colors.textFaint, fontFamily: typography.family.body, fontSize: typography.size.sm },

  /* ── Inputs ── */
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.sm,
    color: colors.textStrong,
    fontSize: typography.size.sm,
    textAlign: 'center',
    paddingVertical: 7,
    marginHorizontal: 3,
  },
  inputDisabled: { opacity: 0.5 },

  rirBtn: { flex: 0.7 },

  /* ── Action Column ── */
  actionGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  copyBtn: {
    width: 26,
    height: 26,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtn: {
    flex: 1,
    maxWidth: 60,
    height: 28,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  logBtnText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
  },
  logBtnInactive: {
    flex: 1,
    maxWidth: 60,
    height: 28,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  logBtnInactiveText: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: 10,
  },

  /* ── Add Set ── */
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: 2,
  },
  addSetText: { color: colors.primary, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },

  /* ── Bottom Action Bar ── */
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  restBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 40,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
  },
  restBtnText: {
    color: colors.textMain,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 40,
    borderRadius: radii.md,
    minWidth: 130,
    paddingHorizontal: 16,
  },
  nextBtnText: {
    color: colors.bgApp,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
});
