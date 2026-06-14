import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import Svg, { Circle, G } from 'react-native-svg';
import { router } from 'expo-router';

import type { ScheduleEvent } from '@/hooks/useScheduleEvents';
import type { AdherenceEntry, Booking, Program } from '@/types/database';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, spacing, typography } from '@/lib/theme';

interface Props {
  program: Program | null;
  adherenceEntries: AdherenceEntry[];
  streakDays: number;
  bookings: Booking[];
  scheduleEvents: ScheduleEvent[];
}

const RING_R = 36;
const RING_STROKE = 8;
const RING_LEN = 2 * Math.PI * RING_R;

function completesInProgramWeek(entries: AdherenceEntry[], programId: string, weekKey: string): number {
  return entries.filter(
    (e) => e.program_id === programId && format(parseISO(e.created_at), 'RRRR-II') === weekKey,
  ).length;
}

function bestStreakFromEntries(entries: AdherenceEntry[]): number {
  if (!entries.length) return 0;
  const dates = [...new Set(entries.map((e) => format(parseISO(e.created_at), 'yyyy-MM-dd')))].sort();
  let best = 0;
  let cur = 0;
  let prev: Date | null = null;
  for (const key of dates) {
    const d = new Date(`${key}T12:00:00`);
    if (prev) {
      const diff = (d.getTime() - prev.getTime()) / 86400000;
      cur = diff === 1 ? cur + 1 : 1;
    } else {
      cur = 1;
    }
    best = Math.max(best, cur);
    prev = d;
  }
  return best;
}

function bookingDayKey(iso: string): string {
  return format(parseISO(iso), 'yyyy-MM-dd');
}

export function DashboardThisWeekCard({
  program,
  adherenceEntries,
  streakDays,
  bookings,
  scheduleEvents,
}: Props) {
  const { t } = useTranslation();

  const weeklyTarget = useMemo(
    () => Math.max(1, Math.min(7, program?.days?.length || 4)),
    [program?.days?.length],
  );

  const now = new Date();
  const thisWeekKey = format(now, 'RRRR-II');
  const lastWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekKey = format(lastWeekDate, 'RRRR-II');

  const completed = useMemo(
    () => (program?.id ? completesInProgramWeek(adherenceEntries, program.id, thisWeekKey) : 0),
    [adherenceEntries, program?.id, thisWeekKey],
  );

  const prevCompleted = useMemo(
    () => (program?.id ? completesInProgramWeek(adherenceEntries, program.id, lastWeekKey) : 0),
    [adherenceEntries, program?.id, lastWeekKey],
  );

  const progress = Math.min(1, completed / weeklyTarget);
  const dashOffset = RING_LEN * (1 - progress);
  const adherencePct = Math.round(progress * 100);

  const thisPct = Math.min(100, Math.round((completed / weeklyTarget) * 100));
  const prevPct = Math.min(100, Math.round((prevCompleted / weeklyTarget) * 100));
  const vsLastWeek = thisPct - prevPct;

  const bestStreak = Math.max(bestStreakFromEntries(adherenceEntries), streakDays, 1);

  const threeDayStrip = useMemo(() => {
    const start = startOfDay(addDays(new Date(), 1));
    const activeBookings = bookings.filter((b) => b.status !== 'cancelled');
    return [0, 1, 2].map((offset) => {
      const day = addDays(start, offset);
      const key = format(day, 'yyyy-MM-dd');
      const hasSession = activeBookings.some((b) => bookingDayKey(b.starts_at) === key);
      const fromSchedule = scheduleEvents
        .filter((e) => e.date === key)
        .sort((a, b) => a.time.localeCompare(b.time));
      const primary = fromSchedule[0];
      const moreCount = Math.max(0, fromSchedule.length - 1);
      const dayLabel = offset === 0 ? t('dates.tomorrow') : format(day, 'EEE');
      return {
        key,
        dayLabel,
        dayNum: format(day, 'd'),
        monthHint: format(day, 'MMM'),
        hasSession,
        primary,
        moreCount,
      };
    });
  }, [bookings, scheduleEvents, t]);

  const openBookingDay = (dateKey: string) => {
    router.push(`/(client)/booking?date=${dateKey}`);
  };

  return (
    <View style={styles.shell}>
      <Text style={styles.title}>{t('home.client.thisWeekTitle')}</Text>

      <View style={styles.ringRow}>
        <View style={styles.ringWrap}>
          <Svg width={90} height={90}>
            <Circle
              cx={45}
              cy={45}
              r={RING_R}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={RING_STROKE}
              fill="none"
            />
            <G transform="rotate(-90 45 45)">
              <Circle
                cx={45}
                cy={45}
                r={RING_R}
                stroke={colors.primary}
                strokeWidth={RING_STROKE}
                fill="none"
                strokeDasharray={`${RING_LEN} ${RING_LEN}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
              />
            </G>
          </Svg>
          <View style={styles.ringCenter}>
            <Text style={styles.ringFraction}>
              {completed}
              <Text style={styles.ringOver}>/{weeklyTarget}</Text>
            </Text>
            <Text style={styles.ringSub}>{t('home.client.thisWeekSessions')}</Text>
          </View>
        </View>
        <View style={styles.ringMeta}>
          <Text style={styles.mutedSmall}>{t('home.client.thisWeekSessionsDoneLabel')}</Text>
          <Text style={styles.fs5}>
            {completed} {t('home.client.thisWeekOf')} {weeklyTarget}
          </Text>
          <Text style={styles.adherenceMuted}>{t('home.client.thisWeekAdherence', { pct: adherencePct })}</Text>
          <Text style={styles.vsLast}>
            {vsLastWeek >= 0 ? '+' : ''}
            {vsLastWeek}% {t('home.client.thisWeekVsLast')}
          </Text>
        </View>
      </View>

      <View style={styles.streakBox}>
        <Text style={styles.flame}>🔥</Text>
        <View style={styles.streakTextCol}>
          <Text style={styles.streakBig}>
            {streakDays}{' '}
            <Text style={styles.streakSmall}>{t('home.client.thisWeekDaysWord')}</Text>
          </Text>
          <Text style={styles.streakCaption}>
            {t('home.client.thisWeekStreakCaption', { best: bestStreak })}
          </Text>
        </View>
      </View>

      <View style={styles.stripRow}>
        {threeDayStrip.map((d) => {
          const preview = d.primary
            ? `${d.primary.time} · ${d.primary.title}${d.moreCount > 0 ? `. ${t('home.client.stripMoreEvents', { count: d.moreCount })}` : ''}`
            : d.hasSession
              ? t('home.client.stripSessionNoTitle')
              : t('home.client.stripNoEvents');
          return (
            <Pressable
              key={d.key}
              onPress={() => openBookingDay(d.key)}
              style={({ pressed }) => [styles.stripCell, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={t('home.client.thisWeekStripA11y', {
                day: d.dayLabel,
                preview,
              })}
            >
              <Text style={styles.stripDay}>{d.dayLabel}</Text>
              <Text style={styles.stripDate}>
                {d.monthHint} {d.dayNum}
              </Text>
              {d.primary ? (
                <>
                  <Text style={styles.stripPreview} numberOfLines={2}>
                    {d.primary.time} · {d.primary.title}
                  </Text>
                  {d.moreCount > 0 ? (
                    <Text style={styles.stripMore}>
                      {t('home.client.stripMoreEvents', { count: d.moreCount })}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text style={styles.stripPreviewMuted} numberOfLines={2}>
                  {d.hasSession ? t('home.client.stripSessionNoTitle') : t('home.client.stripNoEvents')}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  ringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  ringWrap: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringFraction: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: 22,
    lineHeight: 24,
  },
  ringOver: {
    color: colors.textMuted,
    fontFamily: typography.family.heading,
    fontSize: 15,
  },
  ringSub: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: typography.family.bodyMedium,
  },
  ringMeta: {
    flex: 1,
    gap: 2,
  },
  mutedSmall: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    fontFamily: typography.family.body,
    marginBottom: 2,
  },
  fs5: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.lg,
  },
  adherenceMuted: {
    color: 'rgba(255,255,255,0.48)',
    fontSize: typography.size.sm,
    fontFamily: typography.family.body,
    marginTop: 4,
  },
  vsLast: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    marginTop: 4,
    fontFamily: typography.family.body,
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.thisWeekStreakBg,
    borderWidth: 1,
    borderColor: colors.thisWeekStreakBorder,
  },
  flame: {
    fontSize: 22,
  },
  streakTextCol: {
    flex: 1,
    minWidth: 0,
  },
  streakBig: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: 24,
  },
  streakSmall: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: 14,
    fontWeight: '400',
  },
  streakCaption: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    fontFamily: typography.family.body,
  },
  stripRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.countdownChipBg,
    borderWidth: 1,
    borderColor: colors.countdownChipBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  stripCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minWidth: 0,
  },
  stripDay: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.5,
    fontFamily: typography.family.bodyBold,
    textTransform: 'uppercase',
  },
  stripDate: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    marginTop: 4,
  },
  stripPreview: {
    marginTop: 8,
    color: colors.textSub,
    fontFamily: typography.family.bodyMedium,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    width: '100%',
  },
  stripPreviewMuted: {
    marginTop: 8,
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    width: '100%',
  },
  stripMore: {
    marginTop: 4,
    color: colors.textFaint,
    fontFamily: typography.family.bodyBold,
    fontSize: 10,
    textAlign: 'center',
  },
});
