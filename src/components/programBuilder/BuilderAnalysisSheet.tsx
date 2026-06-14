import { useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

import { BuilderMuscleHeatmap } from '@/components/programBuilder/BuilderMuscleHeatmap';
import { BuilderTargetEditor } from '@/components/programBuilder/BuilderTargetEditor';
import { BuilderTargetProgress } from '@/components/programBuilder/BuilderTargetProgress';
import { BuilderVolumeDashboard } from '@/components/programBuilder/BuilderVolumeDashboard';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, typography } from '@/lib/theme';

interface BuilderAnalysisSheetProps {
  bottomInset: number;
  weeksPlanned: number;
  dayCount: number;
  totalSets: number;
  volumeMap: Record<string, number>;
  targetMap: Record<string, number>;
  progressMuscles: string[];
  selectedMuscle: string;
  heatmapScope: 'all' | 'day';
  onSelectMuscle: (muscle: string) => void;
  onAdjustTarget: (delta: number) => void;
  onToggleScope: () => void;
  sheetRef?: React.RefObject<BottomSheet | null>;
}

/** Batch 12 Step 5 — volume dashboard + heatmap bottom sheet. */
export function BuilderAnalysisSheet({
  bottomInset,
  weeksPlanned,
  dayCount,
  totalSets,
  volumeMap,
  targetMap,
  progressMuscles,
  selectedMuscle,
  heatmapScope,
  onSelectMuscle,
  onAdjustTarget,
  onToggleScope,
  sheetRef: externalRef,
}: BuilderAnalysisSheetProps) {
  const { t } = useTranslation();
  const internalRef = useRef<BottomSheet>(null);
  const sheetRef = externalRef ?? internalRef;
  const snapPoints = useMemo(() => ['12%', '50%', '90%'], []);

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      bottomInset={bottomInset}
      backgroundStyle={styles.bg}
      handleIndicatorStyle={styles.handle}
    >
      <Pressable onPress={() => sheetRef.current?.snapToIndex(2)} style={styles.collapsedTrigger}>
        <Ionicons name="chevron-up" size={16} color={colors.primary} />
        <Text style={styles.collapsedText}>
          {t('userTrial.programs.viewHeatmapDashboard') || 'View Heatmap & Volume Dashboard'}
        </Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.title}>{t('userTrial.programs.analysisTargets') || 'Analysis & Targets'}</Text>
        <Pressable onPress={onToggleScope} style={styles.scopeBtn}>
          <Text style={styles.scopeText}>{heatmapScope === 'all' ? 'All days' : 'This day'}</Text>
        </Pressable>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.content}>
        <BuilderVolumeDashboard weeksPlanned={weeksPlanned} dayCount={dayCount} totalSets={totalSets} />
        <BuilderMuscleHeatmap
          volumeMap={volumeMap}
          targetMap={targetMap}
          selectedMuscle={selectedMuscle}
          onSelectMuscle={onSelectMuscle}
        />
        <BuilderTargetEditor
          muscle={selectedMuscle}
          targetValue={targetMap[selectedMuscle] || 0}
          onAdjust={onAdjustTarget}
        />
        <BuilderTargetProgress muscles={progressMuscles} volumeMap={volumeMap} targetMap={targetMap} />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  handle: { backgroundColor: colors.textFaint, width: 36 },
  collapsedTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  collapsedText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: { color: colors.textStrong, fontFamily: typography.family.heading, fontSize: typography.size.md },
  scopeBtn: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scopeText: { color: colors.textMuted, fontSize: typography.size.xs, fontFamily: typography.family.bodySemi },
  content: { paddingHorizontal: 16, paddingBottom: 48, gap: 16 },
});

export { BottomSheet };
