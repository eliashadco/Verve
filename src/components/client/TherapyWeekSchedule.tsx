import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { colors, spacing, typography } from '@/lib/theme';

interface TherapyWeekScheduleProps {
  completionLabel: string;
  statusLabel: string;
  items: string[];
}

export function TherapyWeekSchedule({ completionLabel, statusLabel, items }: TherapyWeekScheduleProps) {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.completion}>{completionLabel}</Text>
        <Text style={styles.status}>{statusLabel}</Text>
      </View>
      {items.map((item) => (
        <Text key={item} style={styles.item}>
          - {item}
        </Text>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  completion: { color: colors.textStrong, fontFamily: typography.family.heading, fontSize: typography.size.xl },
  status: { color: colors.success, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  item: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm },
});
