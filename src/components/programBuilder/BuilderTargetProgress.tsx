import { StyleSheet, Text, View } from 'react-native';

import { getMuscleLabel } from '@/lib/programBuilder/muscles';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

interface BuilderTargetProgressProps {
  muscles: string[];
  volumeMap: Record<string, number>;
  targetMap: Record<string, number>;
}

export function BuilderTargetProgress({ muscles, volumeMap, targetMap }: BuilderTargetProgressProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.header}>{t('userTrial.programs.targetGoalsProgress') || 'Target Set Goals Progress'}</Text>
      {muscles.map((muscle) => {
        const planned = volumeMap[muscle] || 0;
        const target = targetMap[muscle] || 0;
        const pct = target > 0 ? Math.min(100, (planned / target) * 100) : 0;
        const isOver = planned > target && target > 0;
        return (
          <View key={muscle} style={styles.row}>
            <View style={styles.labels}>
              <Text style={styles.muscle}>{getMuscleLabel(muscle)}</Text>
              <Text style={styles.nums}>
                {planned} / {target} sets
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${pct}%` }, isOver && styles.fillOver]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontFamily: typography.family.bodyBold,
    textTransform: 'uppercase',
  },
  row: { gap: 4 },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  muscle: { color: colors.textMain, fontSize: typography.size.xs, fontFamily: typography.family.bodySemi },
  nums: { color: colors.textMuted, fontSize: typography.size.xs },
  track: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  fillOver: { backgroundColor: '#f59e0b' },
});
