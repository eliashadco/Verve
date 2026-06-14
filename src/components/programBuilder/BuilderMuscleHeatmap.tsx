import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { HEATMAP_PATHS } from '@/lib/programBuilder/heatmapPaths';
import { getMuscleLabel } from '@/lib/programBuilder/muscles';
import { muscleFillColor } from '@/lib/programBuilder/volume';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, typography } from '@/lib/theme';
import { useBuilderStore } from '@/lib/programBuilder/builderStore';
import { HeatmapMuscleDetail } from '@/components/programBuilder/HeatmapMuscleDetail';

interface BuilderMuscleHeatmapProps {
  volumeMap: Record<string, number>;
  targetMap: Record<string, number>;
  selectedMuscle: string;
  onSelectMuscle: (muscle: string) => void;
}

/** Batch 12 Step 6 + Assessment §2.3 — SVG heatmap with accessible muscle list. */
export function BuilderMuscleHeatmap({ volumeMap, targetMap, selectedMuscle, onSelectMuscle }: BuilderMuscleHeatmapProps) {
  const { t } = useTranslation();

  const program = useBuilderStore((state) => state.program);
  const scope = useBuilderStore((state) => state.heatmapScope);
  const dayIndex = useBuilderStore((state) => state.selectedDayIndex);
  const setHeatmapScope = useBuilderStore((state) => state.setHeatmapScope);

  const [detailVisible, setDetailVisible] = useState(false);
  const [detailMuscleKey, setDetailMuscleKey] = useState<string | null>(null);

  const handleMusclePress = (muscle: string) => {
    onSelectMuscle(muscle);
    setDetailMuscleKey(muscle);
    setDetailVisible(true);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.scopeRow}>
        <Text style={styles.header}>{t('userTrial.programs.selectMuscleTarget') || 'Select Muscle To Edit Goal'}</Text>
        <Pressable onPress={() => setHeatmapScope(scope === 'all' ? 'day' : 'all')} style={styles.scopeToggle}>
          <Text style={styles.scopeToggleText}>
            {scope === 'all' ? 'All Days' : 'This Day'}
          </Text>
        </Pressable>
      </View>
      
      <Svg viewBox="0 0 100 220" width={140} height={260} style={styles.svg}>
        {HEATMAP_PATHS.map(({ muscle, d }) => (
          <Path
            key={muscle}
            d={d}
            fill={muscleFillColor(muscle, volumeMap, targetMap, selectedMuscle)}
            stroke={selectedMuscle === muscle ? colors.primary : '#334155'}
            strokeWidth={selectedMuscle === muscle ? 1.2 : 0.8}
            onPress={() => handleMusclePress(muscle)}
          />
        ))}
      </Svg>
      <Text style={styles.footer}>Front View Outline (Tap region to inspect details)</Text>

      <View style={styles.list}>
        <Text style={styles.listHeader}>{t('userTrial.programs.muscleTargetList') || 'Muscle targets (tap to edit/inspect)'}</Text>
        {Object.keys(targetMap).map((muscle) => {
          const planned = volumeMap[muscle] || 0;
          const target = targetMap[muscle] || 0;
          const active = muscle === selectedMuscle;
          return (
            <Pressable
              key={muscle}
              onPress={() => handleMusclePress(muscle)}
              style={[styles.row, active && styles.rowActive]}
            >
              <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>{getMuscleLabel(muscle)}</Text>
              <Text style={styles.rowMeta}>
                {planned} / {target} sets
              </Text>
            </Pressable>
          );
        })}
      </View>

      {detailMuscleKey && (
        <HeatmapMuscleDetail
          visible={detailVisible}
          onClose={() => setDetailVisible(false)}
          muscleKey={detailMuscleKey}
          program={program}
          scope={scope}
          dayIndex={dayIndex}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    gap: 8,
  },
  scopeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  header: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontFamily: typography.family.bodyBold,
    textTransform: 'uppercase',
  },
  scopeToggle: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.bgElevated,
  },
  scopeToggleText: {
    color: colors.primary,
    fontSize: 9,
    fontFamily: typography.family.bodyBold,
    textTransform: 'uppercase',
  },
  svg: { alignSelf: 'center' },
  footer: { color: colors.textFaint, fontSize: 9, textAlign: 'center' },
  list: { gap: 6, marginTop: 4 },
  listHeader: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontFamily: typography.family.bodyBold,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: { borderColor: colors.primaryBorder, backgroundColor: colors.primaryDim },
  rowLabel: { color: colors.textMain, fontFamily: typography.family.bodySemi, fontSize: typography.size.sm },
  rowLabelActive: { color: colors.primary },
  rowMeta: { color: colors.textMuted, fontSize: typography.size.xs },
});

