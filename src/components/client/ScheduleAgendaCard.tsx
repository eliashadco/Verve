import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import type { ScheduleEvent } from '@/hooks/useScheduleEvents';
import { colors, spacing, typography } from '@/lib/theme';

interface ScheduleAgendaCardProps {
  title: string;
  items: ScheduleEvent[];
  emptyLabel?: string;
}

export function ScheduleAgendaCard({ title, items, emptyLabel = 'No events today' }: ScheduleAgendaCardProps) {
  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {items.length === 0 ? <Text style={styles.empty}>{emptyLabel}</Text> : null}
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.time}>{item.time}</Text>
          <View style={styles.body}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.location}</Text>
          </View>
        </View>
      ))}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  empty: { color: colors.textFaint, fontSize: typography.size.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  time: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm, width: 52 },
  body: { flex: 1 },
  itemTitle: { color: colors.textSub, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  meta: { color: colors.textFaint, fontSize: typography.size.xs },
});
