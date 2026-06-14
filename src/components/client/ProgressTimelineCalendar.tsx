import { StyleSheet, Text, View } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

export type ProgressDayStatus = 'done' | 'partial' | 'missed' | 'rest';

interface ProgressTimelineCalendarProps {
  statuses: ProgressDayStatus[];
  loggedSessions: number;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function ProgressTimelineCalendar({ statuses, loggedSessions }: ProgressTimelineCalendarProps) {
  const { t } = useTranslation();
  const cells = Array.from({ length: 28 }, (_, index) => statuses[index] ?? 'rest');

  return (
    <GlassCard variant="stat" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('userTrial.progress.trainingCalendar')}</Text>
        <Text style={styles.meta}>{t('userTrial.progress.loggedSessions', { count: loggedSessions })}</Text>
      </View>
      <View style={styles.weekdays}>
        {DAYS.map((day, index) => (
          <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((status, index) => (
          <View key={`${status}-${index}`} style={[styles.cell, styles[status]]} />
        ))}
      </View>
      <View style={styles.legend}>
        {(['done', 'partial', 'missed', 'rest'] as const).map((status) => (
          <View key={status} style={styles.legendItem}>
            <View style={[styles.legendDot, styles[status]]} />
            <Text style={styles.legendText}>{t(`userTrial.progress.${status}`)}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { color: colors.textStrong, fontFamily: typography.family.headingSemi, fontSize: typography.size.md },
  meta: { color: colors.textFaint, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between' },
  weekday: { flex: 1, color: colors.textFaint, textAlign: 'center', fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  cell: { width: '12.6%', height: 18, borderRadius: radii.xs, borderWidth: 1 },
  done: { backgroundColor: colors.primaryDim, borderColor: colors.primaryBorder },
  partial: { backgroundColor: colors.warningDim, borderColor: colors.warning },
  missed: { backgroundColor: colors.dangerDim, borderColor: colors.dangerBorder },
  rest: { backgroundColor: colors.surface2, borderColor: colors.borderSubtle },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { width: 8, height: 8, borderRadius: radii.pill },
  legendText: { color: colors.textMuted, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs, textTransform: 'capitalize' },
});
