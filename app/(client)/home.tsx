import { useCallback, useMemo } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import Svg, { Circle } from 'react-native-svg';

import { useAuth } from '@/auth/AuthProvider';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ClientTopStatus } from '@/components/client/ClientTopStatus';
import { ClientHomeTopActions } from '@/components/client/ClientHomeTopActions';
import { DashboardProtocolBanner } from '@/components/client/DashboardProtocolBanner';
import { DashboardThisWeekCard } from '@/components/client/DashboardThisWeekCard';
import { DashboardTodaysFocusHero } from '@/components/client/DashboardTodaysFocusHero';
import { PractitionerNotesCard } from '@/components/client/PractitionerNotesCard';
import { PrimaryGoalCard } from '@/components/client/PrimaryGoalCard';
import { TodayAtGlancePanel } from '@/components/client/TodayAtGlancePanel';
import { useClientOverview } from '@/hooks/useClientOverview';
import { useScheduleEvents } from '@/hooks/useScheduleEvents';
import { USER_TRIAL_DEMO_FLAGS, USER_TRIAL_DEMO_PRACTITIONER_NOTES, USER_TRIAL_DEMO_PROTOCOL_BANNER } from '@/lib/demo/userTrialFixtures';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

export default function ClientHome() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const userId = profile?.id ?? null;
  const overview = useClientOverview(userId);
  const schedule = useScheduleEvents(userId, 'client');
  const activeProgram = overview.data.activeProgram;
  const upcomingBooking = overview.data.nextBooking;
  const streak = overview.data.streak;

  const weeklyCompleted = useMemo(() => {
    const now = new Date();
    const currentWeek = format(now, 'RRRR-II');
    return overview.data.adherenceEntries.filter((entry) => format(parseISO(entry.created_at), 'RRRR-II') === currentWeek).length;
  }, [overview.data.adherenceEntries]);

  const weeklyGoal = activeProgram?.days?.length ?? 0;
  const weeklyProgress = weeklyGoal > 0 ? Math.min(weeklyCompleted / weeklyGoal, 1) : 0;
  const refreshing = overview.loading;

  const onRefresh = () => {
    overview.refresh();
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 18) return t('greeting.afternoon');
    return t('greeting.evening');
  }, [t]);

  const displayName = profile?.first_name ?? t('home.client.athleteFallback');

  const relativeWhen = useCallback(
    (iso: string) => {
      const d = parseISO(iso);
      if (isToday(d)) return `${t('dates.today')} · ${format(d, 'HH:mm')}`;
      if (isTomorrow(d)) return `${t('dates.tomorrow')} · ${format(d, 'HH:mm')}`;
      return format(d, 'EEE d MMM · HH:mm');
    },
    [t],
  );

  const wearableGlance = overview.data.wearable
    ? {
        steps: overview.data.wearable.steps,
        restingHeartRate: overview.data.wearable.restingHeartRate,
        activityMinutes: overview.data.wearable.activityMinutes,
        avgHeartRate: overview.data.wearable.avgHeartRate,
        highHeartRate: overview.data.wearable.highHeartRate,
      }
    : null;

  return (
    <ScreenContainer
      ambient="tealGlass"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.homeTopSection}>
        <View style={styles.welcomeBlock}>
          <View style={styles.welcomeTitleRow}>
            <Text style={styles.welcomeH1}>{t('home.client.welcomeLead', { greeting })}</Text>
            <Pressable
              onPress={() => router.push('/(client)/profile')}
              accessibilityRole="link"
              accessibilityLabel={t('home.client.openProfileA11y', { name: displayName })}
            >
              <Text style={styles.welcomeName}>{displayName}</Text>
            </Pressable>
            <Text style={styles.welcomeH1}>{t('home.client.welcomeTrail')}</Text>
          </View>
          <Text style={styles.welcomeMotivation}>
            {t('home.client.welcomeMotivationBefore')}
            <Text style={styles.welcomeStreak}>{t('home.client.welcomeStreakPhrase', { count: streak })}</Text>
            {t('home.client.welcomeMotivationAfter')}
          </Text>
        </View>
        <ClientHomeTopActions />
      </View>

      {USER_TRIAL_DEMO_FLAGS.enabled ? (
        <DashboardProtocolBanner
          protocolName={USER_TRIAL_DEMO_PROTOCOL_BANNER.name}
          assignedLabel={t('home.client.demoProtocolAssignedAgo')}
        />
      ) : null}

      <ClientTopStatus />

      {overview.error ? (
        <GlassCard>
          <Text style={styles.errorText}>{t('errors.loadFailed')}</Text>
          <View style={{ height: 8 }} />
          <Pressable onPress={overview.refresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('errors.retry')}</Text>
          </Pressable>
        </GlassCard>
      ) : null}

      <PrimaryGoalCard
        title={activeProgram?.focus ?? t('home.client.goalFallback')}
        targetLabel={activeProgram ? activeProgram.name : t('home.client.goalTargetPending')}
        milestoneLabel={t('home.client.milestone')}
        milestoneValue={t('home.client.milestoneThisWeek', { completed: weeklyCompleted, goal: weeklyGoal || 0 })}
        progressPct={weeklyProgress * 100}
      />

      <DashboardTodaysFocusHero
        program={activeProgram}
        practitioner={overview.data.practitioner}
        adherenceEntries={overview.data.adherenceEntries}
      />

      <TodayAtGlancePanel
        upcomingBooking={upcomingBooking}
        wearable={wearableGlance}
        streakDays={streak}
        onOpenCalendarHref="/(client)/booking"
      />

      <DashboardThisWeekCard
        program={activeProgram}
        adherenceEntries={overview.data.adherenceEntries}
        streakDays={streak}
        bookings={overview.data.bookings}
        scheduleEvents={schedule.events}
      />

      <PractitionerNotesCard notes={[...USER_TRIAL_DEMO_PRACTITIONER_NOTES]} />

      <View style={styles.statsRow}>
        <GlassCard style={[styles.statCard, styles.streakCard]} padding={14}>
          <Text style={styles.statLabel}>{t('home.client.streak')}</Text>
          <StreakRing streak={streak} />
          <Text style={styles.statSub}>{t('common.daysInRow')}</Text>
        </GlassCard>
        <GlassCard style={styles.statCard} padding={14}>
          <Text style={styles.statLabel}>{t('home.client.sessions')}</Text>
          <Text style={styles.statValue}>{overview.data.adherenceEntries.length}</Text>
          <Text style={styles.statSub}>{t('common.logged')}</Text>
        </GlassCard>
        <GlassCard style={styles.statCard} padding={14}>
          <Text style={styles.statLabel}>{t('home.client.programs')}</Text>
          <Text style={styles.statValue}>{overview.data.programCount}</Text>
          <Text style={styles.statSub}>{t('common.assigned')}</Text>
        </GlassCard>
      </View>

      <Text style={styles.sectionTitle}>{t('home.client.nextUp')}</Text>
      {upcomingBooking ? (
        <GlassCard>
          <View style={styles.bookingRow}>
            <View style={styles.bookingIcon}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingTitle}>{upcomingBooking.title ?? t('common.session')}</Text>
              <Text style={styles.bookingSub}>{relativeWhen(upcomingBooking.starts_at)}</Text>
            </View>
            <Badge label={upcomingBooking.booking_type.replace('_', ' ')} tone="clinical" />
          </View>
        </GlassCard>
      ) : (
        <GlassCard>
          <EmptyState
            icon="calendar-clear-outline"
            title={t('home.client.noBookingTitle')}
            body={t('home.client.noBookingBody')}
          />
        </GlassCard>
      )}
      <View style={styles.quickLinks}>
        <Link href="/(client)/live-session" asChild>
          <Pressable style={styles.quickLink}>
            <GlassCard style={styles.quickCard} padding={14}>
              <Ionicons name="play-circle-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>Start Live Session</Text>
                <Text style={styles.quickBody}>Jump right into your workout</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </GlassCard>
          </Pressable>
        </Link>
        <Link href="/(client)/programs" asChild>
          <Pressable style={styles.quickLink}>
            <GlassCard style={styles.quickCard} padding={14}>
              <Ionicons name="barbell-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>{t('home.client.programsCtaTitle')}</Text>
                <Text style={styles.quickBody}>{t('home.client.programsCtaBody')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </GlassCard>
          </Pressable>
        </Link>
        <Link href="/(client)/therapy" asChild>
          <Pressable style={styles.quickLink}>
            <GlassCard style={styles.quickCard} padding={14}>
              <Ionicons name="medical-outline" size={20} color={colors.clinical} />
              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>{t('home.client.therapyCtaTitle')}</Text>
                <Text style={styles.quickBody}>{t('home.client.therapyCtaBody')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </GlassCard>
          </Pressable>
        </Link>
        <Link href="/(client)/hub" asChild>
          <Pressable style={styles.quickLink}>
            <GlassCard style={styles.quickCard} padding={14}>
              <Ionicons name="folder-open-outline" size={20} color={colors.accentBlue} />
              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>{t('home.client.hubCtaTitle')}</Text>
                <Text style={styles.quickBody}>{t('home.client.hubCtaBody')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </GlassCard>
          </Pressable>
        </Link>
        <Link href="/(client)/social" asChild>
          <Pressable style={styles.quickLink}>
            <GlassCard style={styles.quickCard} padding={14}>
              <Ionicons name="people-circle-outline" size={20} color={colors.accentAmber} />
              <View style={{ flex: 1 }}>
                <Text style={styles.quickTitle}>{t('home.client.socialCtaTitle')}</Text>
                <Text style={styles.quickBody}>{t('home.client.socialCtaBody')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </GlassCard>
          </Pressable>
        </Link>
      </View>
    </ScreenContainer>
  );
}

function StreakRing({ streak }: { streak: number }) {
  const progress = Math.min(streak / 7, 1);
  return (
    <View style={styles.streakRingWrap}>
      <ProgressRing progress={progress} size={58} stroke={6} />
      <View style={styles.streakRingCenter}>
        <Text style={styles.streakRingValue}>{streak}</Text>
      </View>
    </View>
  );
}

function ProgressRing({ progress, size, stroke }: { progress: number; size: number; stroke: number }) {
  const clamped = Math.max(0, Math.min(progress, 1));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);
  const center = size / 2;
  return (
    <Svg width={size} height={size}>
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={colors.surfaceHover}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={colors.primary}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${center}, ${center}`}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  homeTopSection: {
    position: 'relative',
    paddingRight: 52,
    marginBottom: 4,
  },
  welcomeBlock: {
    gap: 8,
    paddingTop: 4,
  },
  welcomeTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 2,
  },
  welcomeH1: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xxl,
    letterSpacing: -0.3,
  },
  welcomeName: {
    color: colors.primary,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xxl,
    letterSpacing: -0.3,
    textDecorationLine: 'underline',
    textDecorationColor: colors.primaryBorder,
  },
  welcomeMotivation: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: typography.size.sm * typography.lineHeight.relaxed,
  },
  welcomeStreak: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, alignItems: 'flex-start', gap: 2 },
  streakCard: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  streakRingWrap: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  streakRingCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  streakRingValue: { color: colors.textStrong, fontFamily: typography.family.heading, fontSize: typography.size.lg },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    fontFamily: typography.family.bodyMedium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xxl,
  },
  statSub: { color: colors.textFaint, fontSize: typography.size.xs },
  quickLinks: { gap: 10 },
  quickLink: { borderRadius: 14 },
  quickCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  quickBody: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: 2 },
  sectionTitle: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bookingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  bookingSub: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
  errorText: { color: colors.danger, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  retryBtn: {
    borderWidth: 1,
    borderColor: colors.borderAccent,
    borderRadius: 999,
    backgroundColor: colors.primaryDim,
    paddingVertical: 6,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
});
