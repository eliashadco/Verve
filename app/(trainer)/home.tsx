import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { format, parseISO, isSameDay } from 'date-fns';

import { useAuth } from '@/auth/AuthProvider';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useBookings } from '@/hooks/useBookings';
import { useLinkedClients } from '@/hooks/useLinkedClients';
import { usePrograms } from '@/hooks/usePrograms';
import { useTrainerKpis } from '@/hooks/useTrainerKpis';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

export default function TrainerHome() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();
  const userId = profile?.id ?? null;
  const programs = usePrograms(userId, 'trainer');
  const bookings = useBookings(userId, 'trainer');
  const clients = useLinkedClients(userId);
  const kpis = useTrainerKpis(userId);

  const today = bookings.bookings.filter((b) => isSameDay(parseISO(b.starts_at), new Date()));
  const refreshing = programs.loading || bookings.loading || clients.loading || kpis.loading;

  const onRefresh = () => {
    programs.refresh();
    bookings.refresh();
    clients.refresh();
    kpis.refresh();
  };

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Header
        greeting={t('greeting.coach')}
        title={profile?.first_name ?? t('home.trainer.verveFallback')}
        roleLabel={t('home.trainer.roleLabel')}
      />

      <View style={styles.statsRow}>
        <Stat label={t('home.trainer.statClients')} value={kpis.activeClients} />
        <Stat label={t('home.trainer.statSessions')} value={kpis.sessionsThisWeek} />
        <Stat label={t('home.trainer.statAdherence')} value={kpis.avgAdherencePct} />
      </View>

      <Text style={styles.section}>{t('home.trainer.sectionToday')}</Text>
      {today.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="calendar-outline"
            title={t('home.trainer.emptyTodayTitle')}
            body={t('home.trainer.emptyTodayBody')}
          />
        </GlassCard>
      ) : (
        today.map((b) => (
          <GlassCard key={b.id} style={styles.bookingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.bookingTitle}>{b.title ?? t('common.session')}</Text>
              <Text style={styles.bookingMeta}>
                {format(parseISO(b.starts_at), 'HH:mm')} – {format(parseISO(b.ends_at), 'HH:mm')}
              </Text>
            </View>
            <Badge label={b.status} tone={b.status === 'confirmed' ? 'primary' : 'neutral'} />
          </GlassCard>
        ))
      )}

      <Text style={styles.section}>{t('home.trainer.sectionAttention')}</Text>
      {kpis.attention.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="checkmark-done-outline"
            title={t('home.trainer.emptyAttentionTitle')}
            body={t('home.trainer.emptyAttentionBody')}
          />
        </GlassCard>
      ) : (
        kpis.attention.map((flag) => (
          <Pressable
            key={`${flag.clientId}-${flag.reason}`}
            onPress={() => router.push(`/(trainer)/client/${flag.clientId}`)}
          >
            <GlassCard style={styles.bookingRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingTitle}>{flag.label}</Text>
                <Text style={styles.bookingMeta}>
                  {flag.reason === 'no_active_program'
                    ? t('home.trainer.noProgramReason')
                    : t('home.trainer.noLogsReason')}
                </Text>
              </View>
              <Badge label={t('home.trainer.actionBadge')} tone="warning" />
            </GlassCard>
          </Pressable>
        ))
      )}
    </ScreenContainer>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <GlassCard style={{ flex: 1 }} padding={14}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 10 },
  statLabel: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
  statValue: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.xxl,
    marginTop: 2,
  },
  section: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bookingTitle: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  bookingMeta: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
});
