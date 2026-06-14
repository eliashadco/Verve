import { StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { colors, spacing, typography } from '@/lib/theme';

interface WearableReadinessCardProps {
  readiness: number;
  hrv: number;
  rhr: number;
  sleepHours: number;
}

export function WearableReadinessCard({ readiness, hrv, rhr, sleepHours }: WearableReadinessCardProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Apple Health + Readiness</Text>
        <Badge label="Connected" tone="clinical" />
      </View>
      <Text style={styles.readiness}>{readiness}</Text>
      <View style={styles.kpis}>
        <Text style={styles.kpi}>HRV {hrv}ms</Text>
        <Text style={styles.kpi}>RHR {rhr} bpm</Text>
        <Text style={styles.kpi}>Sleep {sleepHours}h</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  readiness: { color: colors.primary, fontFamily: typography.family.heading, fontSize: typography.size.xxl },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpi: { color: colors.textMuted, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
});
