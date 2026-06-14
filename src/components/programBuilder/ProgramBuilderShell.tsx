import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type BottomSheet from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/Badge';
import { ExerciseLibraryModal } from '@/components/client/ExerciseLibraryModal';
import { BuilderAnalysisSheet } from '@/components/programBuilder/BuilderAnalysisSheet';
import { BuilderDayBoard } from '@/components/programBuilder/BuilderDayBoard';
import { DayTabs } from '@/components/programBuilder/DayTabs';
import { useProgramBuilder } from '@/hooks/useProgramBuilder';
import { seedPreviewProgramLoose } from '@/lib/programBuilder/seedPreviewProgram';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, typography } from '@/lib/theme';
import { useConstraints } from '@/hooks/useConstraints';
import { useAuth } from '@/auth/AuthProvider';

const TAB_BAR_HEIGHT = 64;

export interface ProgramBuilderShellProps {
  programId?: string;
  embedded?: boolean;
  role?: 'client' | 'trainer';
}

/**
 * Primary program builder screen container — assessment §3.2 `program-builder` layout.
 * Composes day board, analysis sheet, and exercise library.
 */
export function ProgramBuilderShell({ programId, embedded = false, role = 'client' }: ProgramBuilderShellProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheet>(null);
  const bottomInset = embedded ? insets.bottom + TAB_BAR_HEIGHT : insets.bottom;
  const { profile } = useAuth();

  const builder = useProgramBuilder({
    programId,
    role,
    fallbackLoose: seedPreviewProgramLoose(),
  });

  const clientId = builder.program.clientId || (role === 'client' ? (profile?.id ?? null) : null);
  const { data: constraints } = useConstraints(clientId);

  useEffect(() => {
    if (embedded) return;
    navigation.setOptions({
      title: builder.program.name || 'Program Builder',
      headerRight: () => (
        <Pressable onPress={() => void builder.handleSave()} disabled={builder.saving} style={styles.saveBtn}>
          <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [embedded, builder.handleSave, builder.program.name, builder.saving, navigation]);

  const focusLabel = builder.program.focus || 'Custom';

  return (
    <View style={[styles.root, embedded && { paddingTop: insets.top }]}>
      {builder.saveToast ? (
        <View style={[styles.toast, embedded && { top: insets.top + 8 }]}>
          <Text style={styles.toastText}>{t('userTrial.programs.savedLocalTitle')}</Text>
        </View>
      ) : null}

      {embedded ? (
        <View style={styles.embeddedHeader}>
          <View style={styles.titleRow}>
            <TextInput
              style={styles.titleInput}
              value={builder.program.name}
              onChangeText={builder.setProgramName}
              placeholder={t('userTrial.programs.planName')}
              placeholderTextColor={colors.textFaint}
            />
            <Badge label={focusLabel} tone="primary" />
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => void builder.handleSave()}
              disabled={builder.saving}
              style={styles.iconBtn}
              accessibilityLabel={t('userTrial.programs.savePlan')}
            >
              <Ionicons name="cloud-upload-outline" size={18} color={colors.textMain} />
            </Pressable>
            <Pressable
              onPress={() => sheetRef.current?.snapToIndex(2)}
              style={styles.iconBtn}
              accessibilityLabel={t('userTrial.programs.reviewStats')}
            >
              <Ionicons name="bar-chart-outline" size={18} color={colors.textMain} />
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.nameCard}>
          <TextInput
            style={styles.nameInput}
            value={builder.program.name}
            onChangeText={builder.setProgramName}
            placeholder="Program Name"
            placeholderTextColor={colors.textFaint}
          />
          <Badge label={focusLabel} tone="primary" />
        </View>
      )}

      <DayTabs
        days={builder.program.days}
        selectedIndex={builder.selectedDayIndex}
        onSelect={builder.setSelectedDayIndex}
        onAddDay={builder.onAddDay}
      />

      <View style={styles.boardArea}>
        <BuilderDayBoard
          exercises={builder.activeExercises}
          constraints={constraints}
          onDragEnd={builder.onDragEnd}
          onDuplicate={(ex) => builder.duplicateExercise(builder.selectedDayIndex, ex.id)}
          onDelete={(id) => builder.removeExercise(builder.selectedDayIndex, id)}
          onUpdateSets={(id, d) => builder.updateExerciseProperty(builder.selectedDayIndex, id, 'sets', d)}
          onUpdateReps={(id, d) => builder.updateExerciseProperty(builder.selectedDayIndex, id, 'reps', d)}
          onUpdateRir={(id, d) => builder.updateExerciseProperty(builder.selectedDayIndex, id, 'targetRIR', d)}
          onAddExercise={() => builder.setLibraryOpen(true)}
        />
      </View>

      <BuilderAnalysisSheet
        sheetRef={sheetRef}
        bottomInset={bottomInset}
        weeksPlanned={builder.program.weeksPlanned || 4}
        dayCount={builder.program.days.length}
        totalSets={builder.totalSets}
        volumeMap={builder.volumeMap}
        targetMap={builder.targets}
        progressMuscles={builder.progressMuscles}
        selectedMuscle={builder.selectedMuscleTarget}
        heatmapScope={builder.heatmapScope}
        onSelectMuscle={builder.setSelectedMuscleTarget}
        onAdjustTarget={(d) => builder.adjustMuscleTarget(builder.selectedMuscleTarget, d)}
        onToggleScope={() => builder.setHeatmapScope(builder.heatmapScope === 'all' ? 'day' : 'all')}
      />

      <ExerciseLibraryModal
        visible={builder.libraryOpen}
        constraints={constraints}
        onClose={() => builder.setLibraryOpen(false)}
        onPickExercise={(ex) => {
          builder.addCatalogExerciseToSelectedDay(ex, constraints);
          builder.setLibraryOpen(false);
        }}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgApp },
  saveBtn: { marginRight: 8 },
  toast: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    zIndex: 100,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    elevation: 8,
  },
  toastText: { color: colors.bgApp, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  embeddedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    gap: 8,
  },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleInput: {
    flex: 1,
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.lg,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameCard: {
    margin: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgSurface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  nameInput: { flex: 1, color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  boardArea: { flex: 1, paddingHorizontal: 16, paddingBottom: 90 },
});

/** @deprecated Use ProgramBuilderShell */
export const SuggestedProgramBuilder = ProgramBuilderShell;
