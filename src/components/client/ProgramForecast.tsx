import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';

import { GlassCard } from '@/components/GlassCard';
import type { ForecastDayModel } from '@/lib/programHeroModel';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

export interface ProgramForecastProps {
  days: ForecastDayModel[];
  summaryKey: 'none' | 'next' | 'all_done';
  nextDate?: Date;
  onSelectPlannedDay?: (dayIndex: number) => void;
}

export function ProgramForecast({ days, summaryKey, nextDate, onSelectPlannedDay }: ProgramForecastProps) {
  const { t } = useTranslation();

  const summary =
    summaryKey === 'next' && nextDate
      ? t('userTrial.programs.forecastSummaryNext', { date: format(nextDate, 'EEE d MMM') })
      : summaryKey === 'all_done'
        ? t('userTrial.programs.forecastSummaryAllDone')
        : t('userTrial.programs.forecastSummaryNone');

  return (
    <GlassCard style={styles.card}>
      <Text style={styles.title}>{t('userTrial.programs.forecastTitle')}</Text>
      <Text style={styles.summary}>{summary}</Text>
      <View style={styles.grid}>
        {days.map((d) => {
          const label = format(d.date, 'EEE').charAt(0);
          const sub = format(d.date, 'd');
          let tone: 'rest' | 'planned' | 'done' = 'rest';
          if (d.planned && d.done) tone = 'done';
          else if (d.planned) tone = 'planned';

          const cell = (
            <View style={[styles.cell, d.today && styles.cellToday, tone === 'done' && styles.cellDone, tone === 'planned' && styles.cellPlanned]}>
              <Text style={styles.cellLetter}>{label}</Text>
              <Text style={styles.cellNum}>{sub}</Text>
              {d.done && d.adherence > 0 ? <Text style={styles.cellPct}>{d.adherence}%</Text> : null}
            </View>
          );

          if (d.planned && d.dayIndex != null && onSelectPlannedDay) {
            return (
              <Pressable key={d.dateKey} onPress={() => onSelectPlannedDay(d.dayIndex!)} style={styles.cellWrap}>
                {cell}
              </Pressable>
            );
          }

          return (
            <View key={d.dateKey} style={styles.cellWrap}>
              {cell}
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <LegendDot tone="rest" label={t('userTrial.programs.forecastLegendRest')} />
        <LegendDot tone="planned" label={t('userTrial.programs.forecastLegendPlanned')} />
        <LegendDot tone="done" label={t('userTrial.programs.forecastLegendDone')} />
      </View>
    </GlassCard>
  );
}

function LegendDot({ tone, label }: { tone: 'rest' | 'planned' | 'done'; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, tone === 'rest' && styles.legRest, tone === 'planned' && styles.legPlanned, tone === 'done' && styles.legDone]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  summary: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  cellWrap: { width: '13.5%', minWidth: 40, maxWidth: 52 },
  cell: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface2,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
    gap: 2,
  },
  cellToday: { borderColor: colors.primaryBorder },
  cellPlanned: { borderColor: colors.primaryBorder, backgroundColor: colors.primaryDim },
  cellDone: { borderColor: colors.success, backgroundColor: colors.successDim },
  cellLetter: { color: colors.textFaint, fontFamily: typography.family.bodyBold, fontSize: 10 },
  cellNum: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.sm },
  cellPct: { color: colors.textMuted, fontSize: 9 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3, borderWidth: 1, borderColor: colors.borderSubtle },
  legRest: { backgroundColor: colors.surface2 },
  legPlanned: { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder },
  legDone: { backgroundColor: colors.successDim, borderColor: colors.success },
  legendLabel: { color: colors.textMuted, fontSize: typography.size.xs },
});
