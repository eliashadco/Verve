import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/theme';

export interface UserTrialSegmentedItem<T extends string> {
  value: T;
  label: string;
}

interface UserTrialSegmentedControlProps<T extends string> {
  value: T;
  items: UserTrialSegmentedItem<T>[];
  onChange: (next: T) => void;
}

export function UserTrialSegmentedControl<T extends string>({
  value,
  items,
  onChange,
}: UserTrialSegmentedControlProps<T>) {
  return (
    <View style={styles.shell}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            style={[styles.segment, active && styles.segmentActive]}
            accessibilityLabel={item.label}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    borderRadius: radii.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primaryDim,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  segmentText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
  segmentTextActive: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
  },
});
