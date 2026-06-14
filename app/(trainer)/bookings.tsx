import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/auth/AuthProvider';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { VerveButton } from '@/components/VerveButton';
import {
  cancelBooking as cancelBookingMutation,
  rescheduleBooking as rescheduleBookingMutation,
  updateBookingStatus,
} from '@/hooks/useBookingMutations';
import { useBookings } from '@/hooks/useBookings';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';
import type { Booking, BookingStatus } from '@/types/database';

type ScheduleFilter = 'confirmed' | 'pending' | 'past';

export default function TrainerBookings() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { bookings, loading, refresh } = useBookings(profile?.id ?? null, 'trainer');
  const [filter, setFilter] = useState<ScheduleFilter>('confirmed');
  const [mutationBusyId, setMutationBusyId] = useState<string | null>(null);

  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [rescheduleDraft, setRescheduleDraft] = useState<Date>(new Date());
  const [androidPickerPhase, setAndroidPickerPhase] = useState<'hidden' | 'date' | 'time'>('hidden');
  const [rescheduleBusy, setRescheduleBusy] = useState(false);

  const relativeLabel = (iso: string) => {
    const d = parseISO(iso);
    if (isToday(d)) return t('trainerBookings.relativeToday', { time: format(d, 'HH:mm') });
    if (isTomorrow(d)) return t('trainerBookings.relativeTomorrow', { time: format(d, 'HH:mm') });
    return format(d, 'EEE d MMM · HH:mm');
  };

  const filtered = useMemo(() => {
    const now = Date.now();
    const list = bookings.filter((b) => {
      const start = new Date(b.starts_at).getTime();
      if (filter === 'past') {
        return start < now || ['completed', 'cancelled', 'no_show'].includes(b.status);
      }
      if (filter === 'confirmed') {
        return b.status === 'confirmed' && start >= now;
      }
      return b.status === 'pending' && start >= now;
    });
    return [...list].sort((a, b) => {
      const ta = new Date(a.starts_at).getTime();
      const tb = new Date(b.starts_at).getTime();
      return filter === 'past' ? tb - ta : ta - tb;
    });
  }, [bookings, filter]);

  const openReschedule = (booking: Booking) => {
    setRescheduleDraft(parseISO(booking.starts_at));
    setAndroidPickerPhase('hidden');
    setRescheduleTarget(booking);
  };

  const closeReschedule = () => {
    setRescheduleTarget(null);
    setAndroidPickerPhase('hidden');
  };

  const bookingDurationMs = (b: Booking) =>
    Math.max(0, new Date(b.ends_at).getTime() - new Date(b.starts_at).getTime());

  const submitReschedule = async () => {
    if (!rescheduleTarget) return;
    const duration = bookingDurationMs(rescheduleTarget);
    const startsIso = rescheduleDraft.toISOString();
    const endsIso = new Date(rescheduleDraft.getTime() + duration).toISOString();
    setRescheduleBusy(true);
    try {
      await rescheduleBookingMutation(rescheduleTarget.id, startsIso, endsIso);
      await refresh();
      Alert.alert(t('alerts.bookingsTrainer.rescheduled'), t('alerts.bookingsTrainer.rescheduledBody'));
      closeReschedule();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('alerts.bookingsTrainer.rescheduleFail');
      Alert.alert(t('alerts.bookingsTrainer.rescheduleFail'), message);
    } finally {
      setRescheduleBusy(false);
    }
  };

  const runMutation = async (bookingId: string, fn: () => Promise<unknown>) => {
    setMutationBusyId(bookingId);
    try {
      await fn();
      await refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('alerts.bookingsTrainer.error');
      Alert.alert(t('alerts.bookingsTrainer.error'), message);
    } finally {
      setMutationBusyId(null);
    }
  };

  const openStatusSheet = (booking: Booking) => {
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [{ text: t('trainerBookings.statusDismiss'), style: 'cancel' }];

    if (booking.status === 'pending') {
      buttons.push({
        text: t('trainerBookings.statusConfirm'),
        onPress: () =>
          void runMutation(booking.id, () => updateBookingStatus(booking.id, 'confirmed')),
      });
    }

    buttons.push(
      {
        text: t('trainerBookings.statusMarkComplete'),
        onPress: () =>
          void runMutation(booking.id, () => updateBookingStatus(booking.id, 'completed')),
      },
      {
        text: t('trainerBookings.statusNoShow'),
        onPress: () =>
          void runMutation(booking.id, () => updateBookingStatus(booking.id, 'no_show')),
      },
      {
        text: t('trainerBookings.statusCancelSession'),
        style: 'destructive',
        onPress: () =>
          void runMutation(booking.id, () => cancelBookingMutation(booking.id, 'Trainer cancelled from schedule')),
      },
    );

    Alert.alert(t('alerts.bookingsTrainer.updateTitle'), booking.title ?? t('common.session'), buttons);
  };

  const canReschedule = (b: Booking) => {
    const start = new Date(b.starts_at).getTime();
    return (
      start >= Date.now() && !['cancelled', 'completed', 'no_show'].includes(b.status)
    );
  };

  const segmentA11y = (key: ScheduleFilter) => {
    if (key === 'confirmed') return t('trainerBookings.filterConfirmedA11y');
    if (key === 'pending') return t('trainerBookings.filterPendingA11y');
    return t('trainerBookings.filterPastA11y');
  };

  const segmentLabel = (key: ScheduleFilter) => {
    if (key === 'confirmed') return t('screens.bookingsTrainer.confirmed');
    if (key === 'pending') return t('screens.bookingsTrainer.pending');
    return t('screens.bookingsTrainer.past');
  };

  const emptyBody =
    filter === 'past'
      ? t('trainerBookings.emptyBodyPast')
      : filter === 'confirmed'
        ? t('trainerBookings.emptyUpcomingConfirmed')
        : t('trainerBookings.emptyUpcomingPending');

  return (
    <>
      <ScreenContainer
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
      >
        <Header title={t('screens.bookingsTrainer.title')} />

        <View style={styles.segmentedRow}>
          {(['confirmed', 'pending', 'past'] as const).map((key) => (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              style={[styles.segment, filter === key && styles.segmentActive]}
              accessibilityLabel={segmentA11y(key)}
            >
              <Text style={[styles.segmentText, filter === key && styles.segmentTextActive]}>{segmentLabel(key)}</Text>
            </Pressable>
          ))}
        </View>

        {filtered.length === 0 ? (
          <GlassCard>
            <EmptyState
              icon="calendar-outline"
              title={t('trainerBookings.emptyTitle')}
              body={emptyBody}
            />
          </GlassCard>
        ) : (
          filtered.map((b) => {
            const busy = mutationBusyId === b.id;
            return (
              <Pressable
                key={b.id}
                onLongPress={() => {
                  if (canReschedule(b)) openReschedule(b);
                }}
                delayLongPress={420}
                disabled={!canReschedule(b)}
              >
                <GlassCard style={[styles.row, busy && styles.rowBusy]}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="calendar" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{b.title ?? t('common.session')}</Text>
                    <Text style={styles.meta}>{relativeLabel(b.starts_at)}</Text>
                    {canReschedule(b) ? (
                      <Text style={styles.longPressHint}>{t('trainerBookings.longPressReschedule')}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => openStatusSheet(b)}
                    disabled={busy}
                    accessibilityLabel={t('trainerBookings.statusChangeA11y', { status: b.status })}
                  >
                    <Badge label={b.status} tone={statusBadgeTone(b.status)} />
                  </Pressable>
                </GlassCard>
              </Pressable>
            );
          })
        )}
      </ScreenContainer>

      <Modal visible={rescheduleTarget !== null} transparent animationType="fade" onRequestClose={closeReschedule}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('trainerBookings.rescheduleTitle')}</Text>
            <Text style={styles.modalMeta}>
              {rescheduleTarget
                ? t('trainerBookings.durationKept', {
                    minutes: Math.round(bookingDurationMs(rescheduleTarget) / 60000),
                  })
                : ''}
            </Text>

            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={rescheduleDraft}
                mode="datetime"
                display="spinner"
                onChange={(_, date) => {
                  if (date) setRescheduleDraft(date);
                }}
              />
            ) : (
              <>
                {androidPickerPhase === 'hidden' ? (
                  <VerveButton
                    label={t('trainerBookings.chooseDateTime')}
                    variant="ghost"
                    onPress={() => setAndroidPickerPhase('date')}
                  />
                ) : null}
                {androidPickerPhase === 'date' ? (
                  <DateTimePicker
                    value={rescheduleDraft}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      if (event.type === 'dismissed') {
                        setAndroidPickerPhase('hidden');
                        return;
                      }
                      if (date) {
                        setRescheduleDraft((prev) =>
                          new Date(
                            date.getFullYear(),
                            date.getMonth(),
                            date.getDate(),
                            prev.getHours(),
                            prev.getMinutes(),
                            0,
                            0,
                          ),
                        );
                        setAndroidPickerPhase('time');
                      }
                    }}
                  />
                ) : null}
                {androidPickerPhase === 'time' ? (
                  <DateTimePicker
                    value={rescheduleDraft}
                    mode="time"
                    display="default"
                    onChange={(event, date) => {
                      if (event.type === 'dismissed') {
                        setAndroidPickerPhase('hidden');
                        return;
                      }
                      if (date) {
                        setRescheduleDraft((prev) =>
                          new Date(
                            prev.getFullYear(),
                            prev.getMonth(),
                            prev.getDate(),
                            date.getHours(),
                            date.getMinutes(),
                            0,
                            0,
                          ),
                        );
                        setAndroidPickerPhase('hidden');
                      }
                    }}
                  />
                ) : null}
                <Text style={styles.previewTime}>
                  {format(rescheduleDraft, "EEE d MMM yyyy · HH:mm")}
                </Text>
              </>
            )}

            <View style={styles.modalButtons}>
              <VerveButton label={t('common.close')} variant="ghost" onPress={closeReschedule} disabled={rescheduleBusy} />
              <VerveButton label={t('trainerBookings.save')} onPress={() => void submitReschedule()} loading={rescheduleBusy} />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
}

function statusBadgeTone(status: BookingStatus): 'primary' | 'warning' | 'neutral' | 'danger' | 'clinical' {
  switch (status) {
    case 'confirmed':
      return 'primary';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'danger';
    case 'no_show':
      return 'clinical';
    default:
      return 'neutral';
  }
}

const styles = StyleSheet.create({
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 8,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primaryBorder,
    borderWidth: 1,
  },
  segmentText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBusy: { opacity: 0.65 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  meta: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
  longPressHint: {
    color: colors.textFaint,
    fontSize: typography.size.xs,
    marginTop: 4,
    fontFamily: typography.family.bodyMedium,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 8, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  modalCard: { gap: 10 },
  modalTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  modalMeta: { color: colors.textMuted, fontSize: typography.size.sm },
  previewTime: {
    color: colors.textSub,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  modalButtons: { flexDirection: 'row', gap: 8, marginTop: 4 },
});
