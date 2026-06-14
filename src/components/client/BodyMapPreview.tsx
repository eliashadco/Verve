import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '@/lib/theme';

export interface BodyRegion {
  id: string;
  label: string;
  tone: 'neutral' | 'pain' | 'sore' | 'restricted' | 'resolved';
  note?: string;
  lastExercise?: string;
}

export function BodyMapPreview({
  regions,
  onSelect,
}: {
  regions: BodyRegion[];
  onSelect: (region: BodyRegion) => void;
}) {
  return (
    <View style={styles.bodyMap}>
      {regions.map((region) => (
        <Pressable
          key={region.id}
          onPress={() => onSelect(region)}
          style={[styles.regionDot, styles[region.tone]]}
          accessibilityLabel={`Open ${region.label} body map note`}
        >
          <Text style={styles.regionInitial}>{region.label.slice(0, 1)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bodyMap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  regionDot: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  regionInitial: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  neutral: { backgroundColor: colors.surface2, borderColor: colors.borderDefault },
  pain: { backgroundColor: colors.dangerDim, borderColor: colors.dangerBorder },
  sore: { backgroundColor: colors.warningDim, borderColor: colors.warning },
  restricted: { backgroundColor: colors.clinicalDim, borderColor: colors.clinicalBorder },
  resolved: { backgroundColor: colors.successDim, borderColor: colors.success },
});
