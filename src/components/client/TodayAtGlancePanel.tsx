import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import { format, parseISO } from 'date-fns';

import type { Booking } from '@/types/database';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface WearableLike {
  steps: number;
  restingHeartRate: number;
  activityMinutes: number;
  avgHeartRate?: number;
  highHeartRate?: number;
}

interface Props {
  upcomingBooking: Booking | null;
  wearable: WearableLike | null;
  streakDays: number;
  onOpenCalendarHref: Href;
}

function sessionLeadBadge(iso: string | null, t: (k: string, o?: Record<string, string | number>) => string): string {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return t('home.client.glanceStatusNow');
  const h = Math.ceil(ms / 3600000);
  if (h <= 24) return t('home.client.glanceStatusInHours', { count: h });
  return t('home.client.glanceStatusUpcoming');
}

export function TodayAtGlancePanel({
  upcomingBooking,
  wearable,
  streakDays,
  onOpenCalendarHref,
}: Props) {
  const { t } = useTranslation();

  const nextTitle = upcomingBooking?.title ?? t('home.client.glanceNoSessionTitle');
  const nextMeta = useMemo(() => {
    if (!upcomingBooking) return t('home.client.glanceNoSessionMeta');
    const st = parseISO(upcomingBooking.starts_at);
    const en = parseISO(upcomingBooking.ends_at);
    const durMin = Math.max(0, Math.round((en.getTime() - st.getTime()) / 60000));
    let place = t('home.client.glanceDefaultPlace');
    const loc = upcomingBooking.location;
    if (loc && typeof loc === 'object' && loc !== null) {
      if ('address' in loc && typeof (loc as { address?: unknown }).address === 'string') {
        place = (loc as { address: string }).address;
      } else if ('type' in loc && typeof (loc as { type?: unknown }).type === 'string') {
        place = (loc as { type: string }).type;
      }
    }
    return t('home.client.glanceSessionMeta', {
      time: format(st, 'HH:mm'),
      minutes: durMin,
      place,
    });
  }, [upcomingBooking, t]);

  const stepsValue = wearable ? wearable.steps.toLocaleString() : '—';
  const stepsMeta = wearable ? t('home.client.glanceStepsMeta') : t('wearables.notConnected');

  const avg = wearable ? wearable.avgHeartRate ?? wearable.restingHeartRate : 0;
  const hrValue = wearable ? `${avg} bpm` : '—';
  const hrMeta = wearable
    ? t('home.client.glanceHrMeta', {
        rest: wearable.restingHeartRate,
        high: wearable.highHeartRate ?? t('common.emDash'),
      })
    : t('wearables.notConnected');

  const actValue = wearable ? t('home.client.minutesValue', { count: wearable.activityMinutes }) : '—';
  const actMeta = wearable ? t('home.client.glanceActivityMeta') : t('wearables.notConnected');

  return (
    <View style={styles.shell}>
      <View style={styles.headRow}>
        <Text style={styles.sectionTitle}>{t('home.client.todayAtGlance')}</Text>
        <Link href={onOpenCalendarHref} asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.calendarLink}>{t('home.client.glanceOpenCalendar')}</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.leadCard}>
        <View style={styles.leadTop}>
          <Text style={styles.mutedSmall}>{t('home.client.glanceNextSession')}</Text>
          {upcomingBooking ? (
            <View style={styles.badgeSuccess}>
              <Text style={styles.badgeSuccessText}>
                {sessionLeadBadge(upcomingBooking.starts_at, t)}
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.leadTitle}>{nextTitle}</Text>
        <Text style={styles.leadMeta}>{nextMeta}</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCell, styles.metricHalf]}>
          <Text style={styles.mutedSmall}>{t('home.client.glanceSteps')}</Text>
          <Text style={styles.metricValue}>{stepsValue}</Text>
          <Text style={styles.metricSub}>{stepsMeta}</Text>
        </View>
        <View style={[styles.metricCell, styles.metricHalf]}>
          <View style={styles.leadTop}>
            <Text style={styles.mutedSmall}>{t('home.client.glanceAvgHr')}</Text>
            <View style={styles.badgePrimary}>
              <Text style={styles.badgePrimaryText}>{t('home.client.glanceHrBadgeToday')}</Text>
            </View>
          </View>
          <Text style={styles.metricValue}>{hrValue}</Text>
          <Text style={styles.metricSub}>{hrMeta}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={[styles.metricCell, styles.metricHalf]}>
          <Text style={styles.mutedSmall}>{t('home.client.glanceActivity')}</Text>
          <Text style={styles.metricValue}>{actValue}</Text>
          <Text style={styles.metricSub}>{actMeta}</Text>
        </View>
        <View style={[styles.metricCell, styles.metricHalf]}>
          <View style={styles.leadTop}>
            <Text style={styles.mutedSmall}>{t('home.client.glanceStreak')}</Text>
            <View style={styles.badgeStreak}>
              <Text style={styles.badgeStreakText}>
                {t('home.client.glanceStreakBadge', { count: streakDays })}
              </Text>
            </View>
          </View>
          <Text style={styles.streakSemibold}>{t('home.client.glanceStreakTitle')}</Text>
          <Text style={styles.metricSub}>{t('home.client.glanceStreakMeta')}</Text>
        </View>
      </View>
    </View>
  );
}

const cardBase = {
  backgroundColor: colors.glassGlanceSurface,
  borderWidth: 1,
  borderColor: colors.glassGlanceBorder,
  borderRadius: radii.md,
};

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  headRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
    letterSpacing: 0.3,
  },
  calendarLink: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  leadCard: {
    ...cardBase,
    padding: spacing.md,
  },
  leadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  mutedSmall: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    fontFamily: typography.family.body,
  },
  badgeSuccess: {
    backgroundColor: colors.successDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  badgeSuccessText: {
    color: colors.success,
    fontSize: typography.size.xs,
    fontFamily: typography.family.bodyBold,
  },
  badgePrimary: {
    backgroundColor: colors.primaryDim,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  badgePrimaryText: {
    color: colors.primary,
    fontSize: typography.size.xs,
    fontFamily: typography.family.bodyBold,
  },
  badgeStreak: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  badgeStreakText: {
    color: colors.bgApp,
    fontSize: typography.size.xs,
    fontFamily: typography.family.bodyBold,
  },
  leadTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.bodySemi,
    fontSize: typography.size.md,
  },
  leadMeta: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    marginTop: 4,
    fontFamily: typography.family.body,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricHalf: {
    flex: 1,
  },
  metricCell: {
    ...cardBase,
    padding: spacing.md,
    minHeight: 100,
  },
  metricValue: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xxl,
    marginTop: 4,
  },
  metricSub: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    marginTop: 4,
    fontFamily: typography.family.body,
  },
  streakSemibold: {
    color: colors.textStrong,
    fontFamily: typography.family.bodySemi,
    fontSize: typography.size.base,
    marginTop: 4,
  },
});
