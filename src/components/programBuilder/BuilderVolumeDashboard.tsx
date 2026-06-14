import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, typography } from '@/lib/theme';

interface BuilderVolumeDashboardProps {
  weeksPlanned: number;
  dayCount: number;
  totalSets: number;
}

export function BuilderVolumeDashboard({ weeksPlanned, dayCount, totalSets }: BuilderVolumeDashboardProps) {
  return (
    <View style={styles.grid}>
      <View style={styles.card}>
        <Text style={styles.label}>Duration</Text>
        <Text style={styles.val}>{weeksPlanned} Weeks</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Weekly Days</Text>
        <Text style={styles.val}>{dayCount} Days</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Total Volume</Text>
        <Text style={styles.val}>{totalSets} Sets</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8 },
  card: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: 10,
    alignItems: 'center',
  },
  label: {
    color: colors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
    fontFamily: typography.family.bodyBold,
  },
  val: {
    color: colors.textStrong,
    fontSize: typography.size.sm,
    fontFamily: typography.family.headingExtra,
    marginTop: 4,
  },
});
