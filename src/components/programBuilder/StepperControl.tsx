import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, typography } from '@/lib/theme';

interface StepperControlProps {
  label: string;
  value: string | number;
  onDecrement: () => void;
  onIncrement: () => void;
  compact?: boolean;
}

/** Batch 12 Step 4 — keyboard-bypass prescription stepper. */
export function StepperControl({ label, value, onDecrement, onIncrement, compact }: StepperControlProps) {
  return (
    <View style={[styles.item, compact && styles.itemCompact]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable onPress={onDecrement} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnText}>-</Text>
        </Pressable>
        <Text style={styles.val}>{value}</Text>
        <Pressable onPress={onIncrement} style={styles.btn} accessibilityRole="button">
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.bgElevated,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCompact: { minWidth: undefined },
  label: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    fontFamily: typography.family.bodySemi,
  },
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
