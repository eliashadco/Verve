import { useCallback, useEffect } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/Badge';
import { ExerciseLibraryModal } from '@/components/client/ExerciseLibraryModal';
import { BuilderVolumeDashboard } from '@/components/programBuilder/BuilderVolumeDashboard';
import { BuilderMuscleHeatmap } from '@/components/programBuilder/BuilderMuscleHeatmap';
import { BuilderTargetEditor } from '@/components/programBuilder/BuilderTargetEditor';
import { BuilderTargetProgress } from '@/components/programBuilder/BuilderTargetProgress';
import { BuilderDayBoard } from '@/components/programBuilder/BuilderDayBoard';
import { DayTabs } from '@/components/programBuilder/DayTabs';
import { useProgramBuilder } from '@/hooks/useProgramBuilder';
import { seedPreviewProgramLoose } from '@/lib/programBuilder/seedPreviewProgram';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, typography } from '@/lib/theme';
import { useConstraints } from '@/hooks/useConstraints';
import { useAuth } from '@/auth/AuthProvider';
import type { BuilderProgram } from '@/lib/programBuilder/types';

/** Clearance for the floating (absolute) UserTrialBottomNav pill + its Live FAB overhang. */
const TAB_BAR_CLEARANCE = 120;
const FREQUENCY_OPTIONS = [2, 3, 4, 5] as const;

export interface ProgramBuilderShellProps {
  programId?: string;
  embedded?: boolean;
  role?: 'client' | 'trainer';
  /** When provided (embedded mode), Save Plan persists the program locally for later reuse. */
  onSavePlan?: (program: BuilderProgram) => void;
}

/**
 * Primary program builder screen container. Renders as a single vertical ScrollView
 * (concept-accurate) so the whole tab scrolls together and clears the floating tab bar.
 */
export function ProgramBuilderShell({ programId, embedded = false, role = 'client', onSavePlan }: ProgramBuilderShellProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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

  const handleSavePlan = useCallback(() => {
    if (onSavePlan) {
      onSavePlan(builder.program);
      builder.setSaveToast(true);
      setTimeout(() => builder.setSaveToast(false), 2000);
      return;
    }
    void builder.handleSave();
  }, [onSavePlan, builder]);

  const handleSetFrequency = useCallback(
    (n: number) => {
      const current = builder.program.days.length;
      if (n < current) {
        const removedWithExercises = builder.program.days.slice(n).some((d) => d.exercises.length > 0);
        if (removedWithExercises) {
          Alert.alert(
            t('userTrial.programs.reduceDaysTitle') || 'Remove training days?',
            t('userTrial.programs.reduceDaysBody', { count: current - n }) ||
              `This deletes ${current - n} day(s) and any exercises on them.`,
            [
              { text: t('common.cancel'), style: 'cancel' },
              {
                text: t('userTrial.programs.removeDays') || 'Remove',
                style: 'destructive',
                onPress: () => builder.setDaysPerWeek(n),
              },
            ],
          );
          return;
        }
      }
      builder.setDaysPerWeek(n);
    },
    [builder, t],
  );

  return (
    <View style={styles.root}>
      {builder.saveToast ? (
        <View style={[styles.toast, { top: (embedded ? 8 : insets.top + 8) }]}>
          <Text style={styles.toastText}>{t('userTrial.programs.savedLocalTitle')}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {embedded ? (
          <View style={styles.builderHeaderBlock}>
            <View style={styles.builderHeaderRow}>
              <View style={styles.builderHeaderTitleRow}>
                <Ionicons name="options-outline" size={18} color={colors.primary} />
                <Text style={styles.builderHeaderTitle}>{t('userTrial.programs.programBuilderTitle') || 'Program Builder'}</Text>
              </View>
              <Pressable
                onPress={handleSavePlan}
                disabled={builder.saving}
                style={styles.savePlanBtn}
                accessibilityLabel={t('userTrial.programs.savePlan')}
              >
                <Ionicons name="cloud-upload-outline" size={15} color={colors.primary} />
                <Text style={styles.savePlanText}>{t('userTrial.programs.savePlan') || 'Save Plan'}</Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('userTrial.programs.programTitleLabel') || 'Program Title'}</Text>
              <View style={styles.titleInputRow}>
                <TextInput
                  style={styles.titleInputFull}
                  value={builder.program.name}
                  onChangeText={builder.setProgramName}
                  placeholder={t('userTrial.programs.planName')}
                  placeholderTextColor={colors.textFaint}
                />
                <Badge label={focusLabel} tone="primary" />
              </View>
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

        <View style={styles.frequencyRow}>
          <Text style={styles.inputLabel}>{t('userTrial.programs.frequencyLabel') || 'Days / Week'}</Text>
          <View style={styles.frequencySegments}>
            {FREQUENCY_OPTIONS.map((n) => {
              const active = builder.program.days.length === n;
              return (
                <Pressable
                  key={n}
                  onPress={() => handleSetFrequency(n)}
                  style={[styles.freqSegment, active && styles.freqSegmentActive]}
                >
                  <Text style={[styles.freqSegmentText, active && styles.freqSegmentTextActive]}>{n}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

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
            onDuplicate={(ex) => builder.duplicateExercise(builder.selectedDayIndex, ex.id)}
            onDelete={(id) => builder.removeExercise(builder.selectedDayIndex, id)}
            onUpdateSets={(id, d) => builder.updateExerciseProperty(builder.selectedDayIndex, id, 'sets', d)}
            onUpdateReps={(id, d) => builder.updateExerciseProperty(builder.selectedDayIndex, id, 'reps', d)}
            onUpdateRir={(id, d) => builder.updateExerciseProperty(builder.selectedDayIndex, id, 'targetRIR', d)}
            onAddExercise={() => builder.setLibraryOpen(true)}
            onGroupWithNext={(id) => builder.groupExerciseWithNext(builder.selectedDayIndex, id)}
            onUngroup={(groupId) => builder.ungroupSuperset(builder.selectedDayIndex, groupId)}
            footer={
              <View style={styles.analysisCard}>
                <View style={styles.analysisHeader}>
                  <Text style={styles.analysisTitle}>{t('userTrial.programs.targetVolumeMap') || 'Target Volume Map'}</Text>
                  <Pressable
                    onPress={() => builder.setHeatmapScope(builder.heatmapScope === 'all' ? 'day' : 'all')}
                    style={styles.scopeBtn}
                  >
                    <Text style={styles.scopeText}>
                      {builder.heatmapScope === 'all'
                        ? (t('userTrial.programs.scopeAllDays') || 'All days')
                        : (t('userTrial.programs.scopeThisDay') || 'This day')}
                    </Text>
                  </Pressable>
                </View>
                <BuilderVolumeDashboard
                  weeksPlanned={builder.program.weeksPlanned || 4}
                  dayCount={builder.program.days.length}
                  totalSets={builder.totalSets}
                />
                <BuilderMuscleHeatmap
                  volumeMap={builder.volumeMap}
                  targetMap={builder.targets}
                  selectedMuscle={builder.selectedMuscleTarget}
                  onSelectMuscle={builder.setSelectedMuscleTarget}
                />
                <BuilderTargetEditor
                  muscle={builder.selectedMuscleTarget}
                  targetValue={builder.targets[builder.selectedMuscleTarget] || 0}
                  onAdjust={(d) => builder.adjustMuscleTarget(builder.selectedMuscleTarget, d)}
                />
                <BuilderTargetProgress
                  muscles={builder.progressMuscles}
                  volumeMap={builder.volumeMap}
                  targetMap={builder.targets}
                />
              </View>
            }
          />
        </View>
      </ScrollView>

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
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4 },
  saveBtn: { marginRight: 8 },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 100,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.pill,
    elevation: 8,
  },
  toastText: { color: colors.bgApp, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },

  builderHeaderBlock: { paddingHorizontal: 16, paddingTop: 6, gap: 12 },
  builderHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  builderHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  builderHeaderTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
  },
  savePlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  savePlanText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },

  inputGroup: { gap: 6 },
  inputLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleInputFull: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  nameCard: {
    marginHorizontal: 16,
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

  frequencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  frequencySegments: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    padding: 3,
    gap: 3,
  },
  freqSegment: {
    minWidth: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  freqSegmentActive: { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder },
  freqSegmentText: { color: colors.textMuted, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  freqSegmentTextActive: { color: colors.primary },

  boardArea: { paddingHorizontal: 16, paddingTop: 8 },
  analysisCard: {
    marginTop: 14,
    padding: 14,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    gap: 14,
  },
  analysisHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  analysisTitle: { color: colors.textStrong, fontFamily: typography.family.heading, fontSize: typography.size.md },
  scopeBtn: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scopeText: { color: colors.textMuted, fontSize: typography.size.xs, fontFamily: typography.family.bodySemi },
});

/** @deprecated Use ProgramBuilderShell */
export const SuggestedProgramBuilder = ProgramBuilderShell;
