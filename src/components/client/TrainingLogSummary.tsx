import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { colors, spacing, typography } from '@/lib/theme';

interface TrainingLogSummaryProps {
  sessions: number;
  totalSets: number;
  volumeKg: number;
  avgAdherencePct: number;
}

export function TrainingLogSummary({
  sessions,
  totalSets,
  volumeKg,
  avgAdherencePct,
}: TrainingLogSummaryProps) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>Training Log Summary</Text>
      <View style={styles.row}>
        <Metric label="Sessions" value={`${sessions}`} />
        <Metric label="Total Sets" value={`${totalSets}`} />
      </View>
      <View style={styles.row}>
        <Metric label="Volume (kg)" value={`${Math.round(volumeKg)}`} />
        <Metric label="Avg Adherence" value={`${Math.round(avgAdherencePct)}%`} />
      </View>
    </GlassCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, gap: 2 },
  metricLabel: { color: colors.textMuted, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },
  metricValue: { color: colors.primary, fontFamily: typography.family.heading, fontSize: typography.size.lg },
});
