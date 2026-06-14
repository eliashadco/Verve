import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getMuscleLabel } from '@/lib/programBuilder/muscles';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, typography } from '@/lib/theme';

interface BuilderTargetEditorProps {
  muscle: string;
  targetValue: number;
  onAdjust: (delta: number) => void;
}

export function BuilderTargetEditor({ muscle, targetValue, onAdjust }: BuilderTargetEditorProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <View>
        <Text style={styles.name}>{getMuscleLabel(muscle).toUpperCase()}</Text>
        <Text style={styles.sub}>{t('userTrial.programs.adjustTargetSets') || 'Adjust target sets target'}</Text>
      </View>
      <View style={styles.controls}>
        <Pressable onPress={() => onAdjust(-1)} style={styles.btn}>
          <Text style={styles.btnText}>-</Text>
        </Pressable>
        <Text style={styles.val}>{targetValue}</Text>
        <Pressable onPress={() => onAdjust(1)} style={styles.btn}>
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 12,
    gap: 12,
  },
  name: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  sub: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: 24,
    height: 24,
    borderRadius: radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: colors.textStrong, fontFamily: typography.family.bodyBold },
  val: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    minWidth: 16,
    textAlign: 'center',
  },
});
