import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { UserTrialProgressBar } from '@/components/client/UserTrialProgressBar';
import { colors, spacing, typography } from '@/lib/theme';

interface MuscleLoadRow {
  muscle: string;
  load: number;
}

interface LiveMuscleLoadPanelProps {
  rows: MuscleLoadRow[];
}

export function LiveMuscleLoadPanel({ rows }: LiveMuscleLoadPanelProps) {
  const max = rows.reduce((m, row) => Math.max(m, row.load), 1);
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>Muscle Load</Text>
      {rows.map((row) => (
        <UserTrialProgressBar
          key={row.muscle}
          label={row.muscle}
          valueLabel={`${row.load}`}
          progress={Math.round((row.load / max) * 100)}
        />
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
  },
});
