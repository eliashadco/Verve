import { StyleSheet, View } from 'react-native';

import { UserTrialStatCard } from '@/components/client/UserTrialStatCard';
import { useTranslation } from '@/lib/i18n';
import { spacing } from '@/lib/theme';

interface TodayGlanceGridProps {
  nextSession: string;
  steps: string;
  avgHr: string;
  activity: string;
  streak: string;
}

export function TodayGlanceGrid({ nextSession, steps, avgHr, activity, streak }: TodayGlanceGridProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.grid}>
      <UserTrialStatCard label={t('home.client.glanceNextSession')} value={nextSession} />
      <UserTrialStatCard label={t('home.client.glanceSteps')} value={steps} tone="primary" />
      <UserTrialStatCard label={t('home.client.glanceAvgHr')} value={avgHr} />
      <UserTrialStatCard label={t('home.client.glanceActivity')} value={activity} />
      <UserTrialStatCard label={t('home.client.glanceStreak')} value={streak} tone="warning" />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
