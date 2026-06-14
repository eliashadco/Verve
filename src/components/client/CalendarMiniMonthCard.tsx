import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';

import { GlassCard } from '@/components/GlassCard';
import { buildMonthCells, type ScheduleEvent } from '@/hooks/useScheduleEvents';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

const CLASS_COLOR = '#8b5cf6';

function dotColor(type: ScheduleEvent['type']): string {
  if (type === 'session') return colors.primary;
  if (type === 'class') return CLASS_COLOR;
  return colors.warning;
}

interface Props {
  year: number;
  monthIndex: number;
  events: ScheduleEvent[];
  selectedDateKey: string | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDay: (dateKey: string) => void;
}

/**
 * Compact month grid matching `User trial.html` calendar tab: month title, legend (sessions / classes / community),
 * Mon–Sun header, prev–today–next, and per-day event markers.
 */
export function CalendarMiniMonthCard({
  year,
  monthIndex,
  events,
  selectedDateKey,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDay,
}: Props) {
  const { t } = useTranslation();
  const weekLabels = useMemo(
    () => [
      t('screens.bookingClient.dowMon'),
      t('screens.bookingClient.dowTue'),
      t('screens.bookingClient.dowWed'),
      t('screens.bookingClient.dowThu'),
      t('screens.bookingClient.dowFri'),
      t('screens.bookingClient.dowSat'),
      t('screens.bookingClient.dowSun'),
    ],
    [t],
  );
  const cells = buildMonthCells(year, monthIndex, events);
  const monthTitle = new Date(year, monthIndex, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });

  return (
    <GlassCard style={styles.card}>
      <View style={styles.titleBlock}>
        <Text style={styles.monthTitle}>{monthTitle}</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.legendText}>{t('screens.bookingClient.legendSessions')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: CLASS_COLOR }]} />
            <Text style={styles.legendText}>{t('screens.bookingClient.legendClasses')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>{t('screens.bookingClient.legendCommunity')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={onPrevMonth} style={styles.ctrlBtn} accessibilityLabel={t('screens.bookingClient.miniPrevMonth')}>
          <Ionicons name="chevron-back" size={20} color={colors.textSub} />
        </Pressable>
        <Pressable onPress={onToday} style={styles.todayBtn}>
          <Text style={styles.todayText}>{t('screens.bookingClient.miniToday')}</Text>
        </Pressable>
        <Pressable onPress={onNextMonth} style={styles.ctrlBtn} accessibilityLabel={t('screens.bookingClient.miniNextMonth')}>
          <Ionicons name="chevron-forward" size={20} color={colors.textSub} />
        </Pressable>
      </View>

      <View style={styles.weekHeader}>
        {weekLabels.map((label, i) => (
          <Text key={i} style={styles.weekLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell, index) => {
          if (!cell) {
            return <View key={`e-${index}`} style={styles.cell} />;
          }
          const typeOrder: ScheduleEvent['type'][] = ['session', 'class', 'community'];
          const markers = typeOrder.filter((type) => cell.events.some((e) => e.type === type));
          const selected = selectedDateKey === cell.date;
          return (
            <Pressable
              key={cell.date}
              onPress={() => onSelectDay(cell.date)}
              style={[styles.cell, styles.cellPressable, selected && styles.cellSelected]}
              accessibilityRole="button"
              accessibilityLabel={t('screens.bookingClient.miniDayA11y', { date: cell.date })}
            >
              <Text style={[styles.dayNum, selected && styles.dayNumSelected]}>{cell.day}</Text>
              {markers.length > 0 ? (
                <View style={styles.dots}>
                  {markers.map((type) => (
                    <View key={type} style={[styles.dot, { backgroundColor: dotColor(type) }]} />
                  ))}
                </View>
              ) : (
                <View style={styles.dotsPlaceholder} />
              )}
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    borderRadius: radii.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(15,23,42,0.72)',
    borderColor: colors.borderDefault,
  },
  titleBlock: { gap: 6 },
  monthTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.md,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: 10,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctrlBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
  },
  todayBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
  },
  todayText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  weekHeader: { flexDirection: 'row', marginTop: 4 },
  weekLabel: {
    flex: 1,
    color: colors.textFaint,
    fontSize: 9,
    fontFamily: typography.family.bodyBold,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.285%',
    paddingVertical: 4,
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  cellPressable: { backgroundColor: 'rgba(0,0,0,0.12)' },
  cellSelected: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryDim,
  },
  dayNum: {
    color: colors.textMuted,
    fontSize: 11,
    fontFamily: typography.family.bodyMedium,
  },
  dayNumSelected: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
  },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2, height: 5, alignItems: 'center' },
  dotsPlaceholder: { height: 5, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
