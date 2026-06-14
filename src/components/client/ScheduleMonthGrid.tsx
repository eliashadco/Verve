import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { GlassCard } from '@/components/GlassCard';
import { buildMonthCells, type ScheduleEvent } from '@/hooks/useScheduleEvents';
import { colors, spacing, typography } from '@/lib/theme';

interface ScheduleMonthGridProps {
  year: number;
  monthIndex: number;
  events: ScheduleEvent[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

export function ScheduleMonthGrid({
  year,
  monthIndex,
  events,
  onPrevMonth,
  onNextMonth,
  onToday,
}: ScheduleMonthGridProps) {
  const cells = buildMonthCells(year, monthIndex, events);
  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Pressable onPress={onPrevMonth}><Text style={styles.nav}>{'<'}</Text></Pressable>
        <Text style={styles.title}>{new Date(year, monthIndex, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={onToday}><Text style={styles.nav}>Today</Text></Pressable>
          <Pressable onPress={onNextMonth}><Text style={styles.nav}>{'>'}</Text></Pressable>
        </View>
      </View>
      <View style={styles.weekHeader}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <Text key={day} style={styles.weekLabel}>{day}</Text>)}
      </View>
      <View style={styles.grid}>
        {cells.map((cell, index) => (
          <View key={index} style={styles.cell}>
            <Text style={styles.day}>{cell?.day ?? ''}</Text>
            {cell?.events?.[0] ? <Badge label={cell.events[0].type} tone="neutral" /> : null}
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerRight: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.base },
  nav: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  weekHeader: { flexDirection: 'row' },
  weekLabel: { flex: 1, color: colors.textFaint, fontSize: typography.size.xs, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.285%', minHeight: 52, borderWidth: 1, borderColor: colors.borderSubtle, padding: 3, gap: 2 },
  day: { color: colors.textMuted, fontSize: typography.size.xs },
});
