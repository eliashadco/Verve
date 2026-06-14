import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { ExerciseCard } from '@/components/programBuilder/ExerciseCard';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, typography } from '@/lib/theme';
import type { BuilderExercise } from '@/lib/programBuilder/types';
import type { ClinicalConstraint } from '@/types/database';
import { useBuilderStore } from '@/lib/programBuilder/builderStore';

interface BuilderDayBoardProps {
  exercises: BuilderExercise[];
  constraints?: ClinicalConstraint[];
  onDragEnd: (data: BuilderExercise[]) => void;
  onDuplicate: (exercise: BuilderExercise) => void;
  onDelete: (exerciseId: string) => void;
  onUpdateSets: (exerciseId: string, delta: number) => void;
  onUpdateReps: (exerciseId: string, delta: number) => void;
  onUpdateRir: (exerciseId: string, delta: number) => void;
  onAddExercise: () => void;
}

function getGroupDisplayLabel(groupId: string | null): string {
  if (!groupId) return '';
  const parts = groupId.split('_');
  const kind = parts[0];
  const suffix = parts[1];
  const letter = String(suffix || 'a').slice(0, 1).toUpperCase();
  return `${kind === 'circuit' ? 'Circuit' : 'Superset'} ${letter}`;
}

/** Assessment §3.2 — exercise list with swipe + drag reorder. */
export function BuilderDayBoard({
  exercises,
  constraints,
  onDragEnd,
  onDuplicate,
  onDelete,
  onUpdateSets,
  onUpdateReps,
  onUpdateRir,
  onAddExercise,
}: BuilderDayBoardProps) {
  const { t } = useTranslation();

  const expandedExerciseId = useBuilderStore((state) => state.expandedExerciseId);
  const setExpandedExerciseId = useBuilderStore((state) => state.setExpandedExerciseId);
  const updateExerciseProperty = useBuilderStore((state) => state.updateExerciseProperty);
  const selectedDayIndex = useBuilderStore((state) => state.selectedDayIndex);

  return (
    <View style={styles.root}>
      <DraggableFlatList
        data={exercises}
        onDragEnd={({ data }) => onDragEnd(data)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="journal-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>{t('userTrial.programs.builderDayEmpty')}</Text>
          </View>
        }
        renderItem={({ item, drag, isActive }) => {
          const firstExWithGroup = item.groupId 
            ? exercises.find((ex) => ex.groupId === item.groupId) 
            : null;
          const isFirstInGroup = item.groupId && firstExWithGroup && firstExWithGroup.id === item.id;
          const isInGroup = !!item.groupId;

          return (
            <ScaleDecorator>
              <View style={[
                styles.groupWrapper,
                isInGroup && styles.groupedItemContainer,
                isFirstInGroup && styles.firstGroupedItemContainer
              ]}>
                {isFirstInGroup && (
                  <View style={styles.groupHeader}>
                    <Ionicons name="link-outline" size={14} color={colors.primary} />
                    <Text style={styles.groupHeaderTitle}>
                      {getGroupDisplayLabel(item.groupId)}
                    </Text>
                    <View style={styles.groupHeaderDivider} />
                    <Text style={styles.groupHeaderRest}>
                      {item.restSeconds ?? item.rest ?? 90}s Rest
                    </Text>
                  </View>
                )}
                
                <Swipeable
                  renderRightActions={() => (
                    <View style={styles.swipeActions}>
                      <TouchableOpacity onPress={() => onDuplicate(item)} style={[styles.swipeBtn, styles.dupBtn]}>
                        <Ionicons name="copy-outline" size={16} color="#fff" />
                        <Text style={styles.swipeText}>Dup</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => onDelete(item.id)} style={[styles.swipeBtn, styles.delBtn]}>
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                        <Text style={styles.swipeText}>Del</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                >
                  <ExerciseCard
                    exercise={item}
                    isDragging={isActive}
                    constraints={constraints}
                    isExpanded={expandedExerciseId === item.id}
                    onToggleExpand={() => setExpandedExerciseId(expandedExerciseId === item.id ? null : item.id)}
                    onUpdateField={(field, val) => updateExerciseProperty(selectedDayIndex, item.id, field, val)}
                    onLongPressDrag={drag}
                    onUpdateSets={(d) => onUpdateSets(item.id, d)}
                    onUpdateReps={(d) => onUpdateReps(item.id, d)}
                    onUpdateRir={(d) => onUpdateRir(item.id, d)}
                  />
                </Swipeable>
              </View>
            </ScaleDecorator>
          );
        }}
      />

      <TouchableOpacity onPress={onAddExercise} style={styles.addBtn}>
        <Ionicons name="add" size={18} color={colors.primary} />
        <Text style={styles.addText}>{t('userTrial.programs.addExercise')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingBottom: 8 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.md,
  },
  emptyText: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 8 },
  swipeActions: { flexDirection: 'row', width: 130, marginBottom: 12, borderRadius: radii.md, overflow: 'hidden' },
  swipeBtn: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 },
  dupBtn: { backgroundColor: '#3B82F6' },
  delBtn: { backgroundColor: colors.danger },
  swipeText: { color: '#fff', fontSize: typography.size.xs, fontFamily: typography.family.bodyBold },
  addBtn: {
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radii.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  addText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  groupWrapper: {
    width: '100%',
  },
  groupedItemContainer: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    marginLeft: 4,
  },
  firstGroupedItemContainer: {
    marginTop: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    marginTop: 4,
  },
  groupHeaderTitle: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  groupHeaderDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    marginHorizontal: 8,
  },
  groupHeaderRest: {
    color: colors.textMuted,
    fontFamily: typography.family.bodySemi,
    fontSize: 10,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
});

