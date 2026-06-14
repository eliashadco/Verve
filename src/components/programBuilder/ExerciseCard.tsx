import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { StepperControl } from '@/components/programBuilder/StepperControl';
import { WhyBlockedSheet } from '@/features/constraints/WhyBlockedSheet';
import { validate } from '@/features/constraints/validate';
import { colors, radii, typography } from '@/lib/theme';
import type { BuilderExercise } from '@/lib/programBuilder/types';
import type { ClinicalConstraint } from '@/types/database';

interface ExerciseCardProps {
  exercise: BuilderExercise;
  isDragging?: boolean;
  isExpanded?: boolean;
  constraints?: ClinicalConstraint[];
  onLongPressDrag: () => void;
  onUpdateSets: (delta: number) => void;
  onUpdateReps: (delta: number) => void;
  onUpdateRir: (delta: number) => void;
  onToggleExpand: () => void;
  onUpdateField: (field: 'rest' | 'tempo' | 'weight' | 'notes' | 'warmup', value: any) => void;
}

export function ExerciseCard({
  exercise,
  isDragging,
  isExpanded = false,
  constraints,
  onLongPressDrag,
  onUpdateSets,
  onUpdateReps,
  onUpdateRir,
  onToggleExpand,
  onUpdateField,
}: ExerciseCardProps) {
  const violations = constraints ? validate(exercise as any, constraints) : [];
  const primaryV = violations.length > 0 ? violations[0] : null;
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <View style={[styles.card, isDragging && styles.cardDragging]}>
      <View style={styles.header}>
        <Pressable onPress={onToggleExpand} style={styles.titleCol}>
          <Text style={styles.name}>{exercise.name}</Text>
          <View style={styles.muscleRow}>
            <Text style={styles.muscle}>{exercise.muscle}</Text>
            {exercise.warmup && <Text style={styles.warmupBadge}>Warmup</Text>}
          </View>
          {primaryV && (
            <Pressable
              onPress={() => setSheetVisible(true)}
              style={[
                styles.constraintBadge,
                primaryV.level === 'hard' ? styles.constraintHard : primaryV.level === 'soft' ? styles.constraintSoft : styles.constraintAdvisory,
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={12}
                color={primaryV.level === 'hard' ? '#ef4444' : primaryV.level === 'soft' ? '#f59e0b' : '#3b82f6'}
              />
              <Text
                style={[
                  styles.constraintText,
                  primaryV.level === 'hard' ? styles.constraintTextHard : primaryV.level === 'soft' ? styles.constraintTextSoft : styles.constraintTextAdvisory,
                ]}
              >
                {primaryV.badgeLabel}: {primaryV.detail}
              </Text>
            </Pressable>
          )}
        </Pressable>
        <View style={styles.rightHeaderActions}>
          <Pressable onPress={onToggleExpand} style={styles.expandToggle}>
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textMuted} />
          </Pressable>
          <Pressable onLongPress={onLongPressDrag} delayLongPress={80} style={styles.handle}>
            <Ionicons name="menu-outline" size={24} color={colors.textFaint} />
          </Pressable>
        </View>
      </View>
      <View style={styles.grid}>
        <StepperControl label="Sets" value={exercise.sets} onDecrement={() => onUpdateSets(-1)} onIncrement={() => onUpdateSets(1)} />
        <StepperControl label="Reps" value={exercise.reps} onDecrement={() => onUpdateReps(-1)} onIncrement={() => onUpdateReps(1)} />
        <StepperControl label="RIR Target" value={exercise.targetRIR} onDecrement={() => onUpdateRir(-1)} onIncrement={() => onUpdateRir(1)} />
        <View style={[styles.rpeCell]}>
          <Text style={styles.rpeText}>RPE: {10 - exercise.targetRIR}</Text>
        </View>
      </View>

      <WhyBlockedSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        exerciseName={exercise.name}
        violations={violations}
        constraints={constraints ?? []}
      />

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Weight</Text>
              <TextInput
                style={styles.fieldInput}
                value={exercise.weight}
                onChangeText={(val) => onUpdateField('weight', val)}
                placeholder="e.g. 60kg or TBD"
                placeholderTextColor={colors.textFaint}
              />
            </View>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Tempo</Text>
              <TextInput
                style={styles.fieldInput}
                value={exercise.tempo}
                onChangeText={(val) => onUpdateField('tempo', val)}
                placeholder="e.g. 3-1-2-0"
                placeholderTextColor={colors.textFaint}
              />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Rest Period</Text>
              <StepperControl 
                label="" 
                value={`${exercise.restSeconds ?? exercise.rest ?? 90}s`} 
                onDecrement={() => onUpdateField('rest', Math.max(0, (exercise.restSeconds ?? exercise.rest ?? 90) - 15))} 
                onIncrement={() => onUpdateField('rest', Math.min(600, (exercise.restSeconds ?? exercise.rest ?? 90) + 15))} 
                compact
              />
            </View>
            <View style={styles.warmupCol}>
              <Text style={styles.fieldLabel}>Warmup Set</Text>
              <Switch
                value={exercise.warmup}
                onValueChange={(val) => onUpdateField('warmup', val)}
                trackColor={{ false: colors.bgElevated, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.notesCol}>
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.fieldInput, styles.notesInput]}
              value={exercise.notes}
              onChangeText={(val) => onUpdateField('notes', val)}
              placeholder="Add cues, focus points or setup..."
              placeholderTextColor={colors.textFaint}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSurface,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
    marginBottom: 12,
  },
  cardDragging: { borderColor: colors.primary, opacity: 0.9 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  titleCol: { flex: 1, marginRight: 8 },
  muscleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  warmupBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
    fontSize: 9,
    fontFamily: typography.family.bodyBold,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radii.sm,
    textTransform: 'uppercase',
  },
  rightHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expandToggle: { padding: 4 },
  name: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  muscle: { color: colors.textMuted, fontSize: typography.size.xs, textTransform: 'uppercase' },
  handle: { padding: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rpeCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgElevated,
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rpeText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  constraintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  constraintHard: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
  },
  constraintSoft: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
  },
  constraintAdvisory: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    borderWidth: 1,
  },
  constraintText: {
    fontSize: 10,
    fontFamily: typography.family.bodyBold,
  },
  constraintTextHard: {
    color: '#ef4444',
  },
  constraintTextSoft: {
    color: '#f59e0b',
  },
  constraintTextAdvisory: {
    color: '#3b82f6',
  },
  expandedContent: {
    marginTop: 12,
    borderTopColor: colors.borderSubtle,
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 12,
  },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldCol: { flex: 1 },
  warmupCol: { width: 100, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  fieldInput: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: radii.sm,
    color: colors.textStrong,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  notesCol: { flex: 1 },
  notesInput: {
    minHeight: 50,
    textAlignVertical: 'top',
  },
});


