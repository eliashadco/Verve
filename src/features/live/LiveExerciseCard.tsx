import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  meta: string;
  notes?: string | null;
  sets: LiveSetRow[];
  onChangeSet: (setIndex: number, field: 'reps' | 'weight' | 'rir', value: string) => void;
  onToggleSetDone: (setIndex: number) => void;
  onAddSet: () => void;
  onCopyPreviousSet: () => void;
  onNextExercise: () => void;
  restLabel?: string | null;
}

export function calculateRpe(rir: number | null) {
  if (rir == null || Number.isNaN(rir)) return null;
  return Math.max(5, Math.min(10, 10 - rir));
}

export function LiveExerciseCard({
  indexLabel,
  name,
  meta,
  notes,
  sets,
  onChangeSet,
  onToggleSetDone,
  onAddSet,
  onCopyPreviousSet,
  onNextExercise,
  restLabel,
}: LiveExerciseCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.index}>{indexLabel}</Text>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        {notes ? <Badge label={notes} tone="warning" /> : null}
      </View>
      {restLabel ? <Text style={styles.rest}>{restLabel}</Text> : null}

      <View style={styles.tableHead}>
        <Text style={[styles.tableCell, styles.setCol]}>Set</Text>
        <Text style={styles.tableCell}>Kg</Text>
        <Text style={styles.tableCell}>Reps</Text>
        <Text style={styles.tableCell}>RIR</Text>
        <Text style={styles.tableCell}>RPE</Text>
        <Text style={[styles.tableCell, styles.logCol]}>Log</Text>
      </View>

      {sets.map((set, setIdx) => {
        const rirNum = Number.parseInt(set.rir, 10);
        const rpe = calculateRpe(Number.isNaN(rirNum) ? null : rirNum);
        return (
          <View key={setIdx} style={[styles.tableRow, set.done && styles.rowDone]}>
            <Text style={[styles.tableCell, styles.setCol]}>{setIdx + 1}</Text>
            <NumericCell value={set.weight} onChange={(v) => onChangeSet(setIdx, 'weight', v)} editable={!set.done} />
            <NumericCell value={set.reps} onChange={(v) => onChangeSet(setIdx, 'reps', v)} editable={!set.done} />
            <NumericCell value={set.rir} onChange={(v) => onChangeSet(setIdx, 'rir', v)} editable={!set.done} />
            <Text style={styles.tableCell}>{rpe ?? '-'}</Text>
            <Pressable onPress={() => onToggleSetDone(setIdx)} style={styles.logBtn}>
              {set.done ? <Ionicons name="checkmark" size={14} color={colors.bgApp} /> : null}
            </Pressable>
          </View>
        );
      })}

      <View style={styles.actions}>
        <Pressable onPress={onCopyPreviousSet} style={styles.action}>
          <Text style={styles.actionText}>Copy previous set</Text>
        </Pressable>
        <Pressable onPress={onAddSet} style={styles.action}>
          <Text style={styles.actionText}>Add set</Text>
        </Pressable>
        <Pressable onPress={onNextExercise} style={styles.action}>
          <Text style={styles.actionText}>Next exercise</Text>
        </Pressable>
        <View style={styles.actionDisabled}>
          <Text style={styles.actionDisabledText}>Voice log (soon)</Text>
        </View>
      </View>
    </GlassCard>
  );
}

function NumericCell({
  value,
  onChange,
  editable,
}: {
  value: string;
  onChange: (next: string) => void;
  editable: boolean;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      editable={editable}
      keyboardType="numeric"
      placeholder="-"
      placeholderTextColor={colors.textFaint}
      style={[styles.input, !editable && styles.inputDisabled]}
    />
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  headerLeft: { flex: 1, gap: 2 },
  index: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  name: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  meta: { color: colors.textMuted, fontSize: typography.size.xs },
  rest: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  tableHead: { flexDirection: 'row', alignItems: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  rowDone: { opacity: 0.6 },
  tableCell: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
  setCol: { flex: 0.7 },
  logCol: { flex: 0.9 },
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.sm,
    color: colors.textStrong,
    fontSize: typography.size.sm,
    textAlign: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  inputDisabled: { opacity: 0.5 },
  logBtn: {
    flex: 0.9,
    marginHorizontal: 4,
    height: 28,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  action: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: { color: colors.primary, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },
  actionDisabled: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface2,
  },
  actionDisabledText: { color: colors.textFaint, fontFamily: typography.family.body, fontSize: typography.size.xs },
});
