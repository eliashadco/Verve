import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/lib/theme';

interface UserTrialMetricRowProps {
  label: string;
  value: string;
  meta?: string;
}

export function UserTrialMetricRow({ label, value, meta }: UserTrialMetricRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.label}>{label}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.textSub,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
  value: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
  },
  meta: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: typography.size.xs,
  },
});
