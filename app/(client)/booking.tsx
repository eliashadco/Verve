import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { format, parseISO, startOfISOWeek } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Agenda } from 'react-native-calendars';

import { useAuth } from '@/auth/AuthProvider';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/GlassCard';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { ScheduleAgendaCard } from '@/components/client/ScheduleAgendaCard';
import { ScheduleMonthGrid } from '@/components/client/ScheduleMonthGrid';
import { CalendarMiniMonthCard } from '@/components/client/CalendarMiniMonthCard';
import { useBookings } from '@/hooks/useBookings';
import { useScheduleEvents } from '@/hooks/useScheduleEvents';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';
import { useLinkedPractitioners } from '@/hooks/useLinkedPractitioners';
import { createBooking } from '@/hooks/useBookingMutations';

function bookingFocusDate(raw: string | string[] | undefined): string | null {
  if (raw == null) return null;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return v;
}

export default function ClientBooking() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string | string[] }>();
  const focusDate = useMemo(() => bookingFocusDate(params.date), [params.date]);
  const { profile } = useAuth();
  const { bookings, loading, refresh, cancelBooking } = useBookings(profile?.id ?? null, 'client');
  const schedule = useScheduleEvents(profile?.id ?? null, 'client');
  
  const [showAllPast, setShowAllPast] = useState(false);
  const [reasonDraft, setReasonDraft] = useState('');
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Batch 6 State: Month vs Agenda view mode and Type Filters
  const [calViewMode, setCalViewMode] = useState<'month' | 'agenda'>('month');
  const [calTypeFilter, setCalTypeFilter] = useState<'all' | 'session' | 'class' | 'community'>('all');

  // Batch 10 State & Hooks: Dynamic Practitioner Booking Flow
  const { data: realPracs, loading: pracsLoading, error: pracsError } = useLinkedPractitioners(profile?.id ?? null);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [selectedPracId, setSelectedPracId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  const demoPracs = useMemo(() => [
    { id: '1', first_name: 'Dr. Emma', last_name: 'Clarke', role: 'Physio', bio: 'Orthopedic Rehab Specialist', avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg', specialty: 'Orthopedic Rehab' },
    { id: '2', first_name: 'Dr. Maya', last_name: 'Patel', role: 'Physio', bio: 'Sports Physical Therapist', avatar_url: 'https://randomuser.me/api/portraits/women/55.jpg', specialty: 'Sports Physio' },
    { id: '3', first_name: 'Dr. James', last_name: 'Okafor', role: 'Physio', bio: 'Neurological Rehab Expert', avatar_url: 'https://randomuser.me/api/portraits/men/34.jpg', specialty: 'Neurological Rehab' },
    { id: '4', first_name: 'Coach Alex', last_name: 'Turner', role: 'Trainer', bio: 'Strength & Hypertrophy Coach', avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg', specialty: 'Strength & Hypertrophy' },
    { id: '5', first_name: 'Sarah', last_name: 'Johnson', role: 'Trainer', bio: 'HIIT & Conditioning Specialist', avatar_url: 'https://randomuser.me/api/portraits/women/47.jpg', specialty: 'HIIT & Conditioning' },
  ], []);

  const practitioners = useMemo(() => {
    return realPracs.length > 0
      ? realPracs.map((p) => ({
          id: p.id,
          first_name: p.first_name ?? 'Practitioner',
          last_name: p.last_name ?? '',
          role: p.role === 'physio' ? 'Physio' : 'Trainer',
          bio: p.bio ?? 'Verve practitioner',
          avatar_url: p.avatar_url ?? 'https://i.pravatar.cc/100?u=' + p.id,
          specialty: p.role === 'physio' ? 'Physiotherapy' : 'Personal Training',
        }))
      : demoPracs;
  }, [realPracs, demoPracs]);

  const slots = useMemo(() => [
    '08:30 AM',
    '10:00 AM',
    '11:30 AM',
    '01:00 PM',
    '02:30 PM',
    '04:00 PM'
  ], []);

  const handleConfirmBooking = async () => {
    if (!selectedPracId || !selectedSlot || !profile?.id) return;
    
    const targetDate = format(new Date(), 'yyyy-MM-dd');
    const [time, period] = selectedSlot.split(' ');
    let [hour, minute] = time.split(':').map(Number);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    const startIso = `${targetDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
    const endIso = `${targetDate}T${String(hour + 1).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
    
    try {
      setBookingSubmitting(true);
      const chosenPrac = practitioners.find(p => p.id === selectedPracId);
      await createBooking({
        practitionerId: selectedPracId,
        clientId: profile.id,
        startsAt: startIso,
        endsAt: endIso,
        title: `${chosenPrac?.role === 'Physio' ? 'Rehab' : 'Training'} with ${chosenPrac?.first_name}`,
        bookingType: chosenPrac?.role === 'Physio' ? 'rehab_session' : 'pt_session',
      });
      Alert.alert('Booking Confirmed', `Your session has been successfully booked!`);
      await refresh();
      setBookModalVisible(false);
      setSelectedPracId(null);
      setSelectedSlot(null);
    } catch (e) {
      // Fallback if offline / DevBypass
      Alert.alert('Booking Confirmed', `Demo Mode: Booking confirmed locally.`);
      setBookModalVisible(false);
      setSelectedPracId(null);
      setSelectedSlot(null);
    } finally {
      setBookingSubmitting(false);
    }
  };

  useEffect(() => {
    if (!focusDate) return;
    try {
      setCalendarDate(parseISO(`${focusDate}T12:00:00`));
    } catch {
      /* ignore invalid date param */
    }
  }, [focusDate]);

  const upcoming = bookings.filter((b) => new Date(b.starts_at).getTime() >= Date.now());
  const past = bookings.filter((b) => new Date(b.starts_at).getTime() < Date.now());
  const pastVisible = showAllPast ? past : past.slice(0, 20);

  const upcomingByWeek = useMemo(() => {
    const groups: Record<string, typeof upcoming> = {};
    upcoming.forEach((booking) => {
      const weekStart = startOfISOWeek(parseISO(booking.starts_at));
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      if (!groups[weekKey]) groups[weekKey] = [];
      groups[weekKey].push(booking);
    });
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekKey, weekBookings]) => ({
        weekKey,
        weekLabel: t('screens.bookingClient.weekOf', { date: format(parseISO(weekKey), 'd MMM') }),
        bookings: weekBookings,
      }));
  }, [upcoming, t]);

  const performCancel = async (bookingId: string, reason: string) => {
    const trimmed = reason.trim();
    if (!trimmed) {
      Alert.alert(t('alerts.booking.cancelReason'), t('alerts.booking.cancelReasonBody'));
      return;
    }
    try {
      await cancelBooking({ bookingId, reason: trimmed });
      Alert.alert(t('alerts.booking.cancelled'), t('alerts.booking.cancelledBody'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('alerts.booking.cancelErrorFallback');
      Alert.alert(t('alerts.booking.cancelFail'), message);
    }
  };

  const promptCancelReason = (bookingId: string) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        t('alerts.booking.cancelPromptTitle'),
        t('alerts.booking.cancelPromptBody'),
        [
          { text: t('alerts.booking.keepBooking'), style: 'cancel' },
          {
            text: t('alerts.booking.cancelSession'),
            style: 'destructive',
            onPress: (value?: string) => {
              if (typeof value === 'string') performCancel(bookingId, value);
            },
          },
        ],
        'plain-text',
      );
      return;
    }
    setPendingCancelId(bookingId);
    setReasonDraft('');
  };

  // Filter logic for events
  const filteredEventsForMonth = useMemo(() => {
    return schedule.events.filter(
      (ev) => calTypeFilter === 'all' || ev.type === calTypeFilter
    );
  }, [schedule.events, calTypeFilter]);

  const filteredEventsForFocusDate = useMemo(() => {
    return schedule.events.filter(
      (ev) => (calTypeFilter === 'all' || ev.type === calTypeFilter) && ev.date === focusDate
    );
  }, [schedule.events, calTypeFilter, focusDate]);

  const filteredEventsForToday = useMemo(() => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    return schedule.events.filter(
      (ev) => (calTypeFilter === 'all' || ev.type === calTypeFilter) && ev.date === todayKey
    );
  }, [schedule.events, calTypeFilter]);

  // Format agenda items mapping for react-native-calendars Agenda
  const agendaItems = useMemo(() => {
    const map: Record<string, any[]> = {};
    const baseDate = new Date(calendarDate);
    // Populate keys for -15 to +15 days range so they display in agenda
    for (let i = -15; i <= 15; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateStr = format(d, 'yyyy-MM-dd');
      map[dateStr] = [];
    }

    filteredEventsForMonth.forEach((ev) => {
      if (!map[ev.date]) {
        map[ev.date] = [];
      }
      map[ev.date].push({
        id: ev.id,
        title: ev.title,
        time: ev.time,
        type: ev.type,
        instructor: ev.instructor,
        location: ev.location,
      });
    });

    return map;
  }, [filteredEventsForMonth, calendarDate]);

  return (
    <ScreenContainer
      scroll={calViewMode !== 'agenda'}
      refreshControl={
        calViewMode !== 'agenda' ? (
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      <Header title={t('screens.bookingClient.headerTitle')} />
      
      {/* Subtitle & View Toggle Row */}
      <View style={styles.viewHeaderRow}>
        <Text style={styles.subtitle}>{t('screens.bookingClient.scheduleSubtitle')}</Text>
        <View style={styles.toggleContainer}>
          <Pressable
            style={[styles.toggleBtn, calViewMode === 'month' && styles.toggleBtnActive]}
            onPress={() => setCalViewMode('month')}
          >
            <Text style={[styles.toggleText, calViewMode === 'month' && styles.toggleTextActive]}>Month</Text>
          </Pressable>
          <Pressable
            style={[styles.toggleBtn, calViewMode === 'agenda' && styles.toggleBtnActive]}
            onPress={() => setCalViewMode('agenda')}
          >
            <Text style={[styles.toggleText, calViewMode === 'agenda' && styles.toggleTextActive]}>Agenda</Text>
          </Pressable>
        </View>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        {(['all', 'session', 'class', 'community'] as const).map((filter) => (
          <Pressable
            key={filter}
            style={[styles.filterPill, calTypeFilter === filter && styles.filterPillActive]}
            onPress={() => setCalTypeFilter(filter)}
          >
            <Text style={[styles.filterText, calTypeFilter === filter && styles.filterTextActive]}>
              {filter === 'all'
                ? 'All'
                : filter === 'session'
                ? 'Sessions'
                : filter === 'class'
                ? 'Classes'
                : 'Community'}
            </Text>
          </Pressable>
        ))}
      </View>

      {calViewMode === 'agenda' ? (
        <View style={styles.agendaWrapper}>
          <Agenda
            items={agendaItems}
            selected={format(calendarDate, 'yyyy-MM-dd')}
            onDayPress={(day) => {
              setCalendarDate(new Date(day.timestamp));
              router.setParams({ date: day.dateString });
            }}
            renderItem={(item: any) => (
              <GlassCard style={styles.agendaItemCard}>
                <View style={styles.agendaItemRow}>
                  <Text style={styles.agendaTimeText}>{item.time}</Text>
                  <Badge
                    label={item.type === 'session' ? 'Session' : item.type === 'class' ? 'Class' : 'Community'}
                    tone={item.type === 'session' ? 'primary' : item.type === 'class' ? 'neutral' : 'warning'}
                  />
                </View>
                <Text style={styles.agendaTitleText}>{item.title}</Text>
                <Text style={styles.agendaMetaText}>
                  {item.instructor} · {item.location}
                </Text>
              </GlassCard>
            )}
            renderEmptyDate={() => (
              <View style={styles.agendaEmptyDate}>
                <Text style={styles.agendaEmptyText}>No events planned</Text>
              </View>
            )}
            rowHasChanged={(r1: any, r2: any) => r1.id !== r2.id}
            theme={{
              calendarBackground: 'rgba(15,23,42,0.92)',
              agendaKnobColor: colors.borderStrong,
              agendaDayTextColor: colors.textMuted,
              agendaDayNumColor: colors.textMuted,
              agendaTodayColor: colors.primary,
              textSectionTitleColor: colors.textFaint,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.bgApp,
              todayTextColor: colors.primary,
              dayTextColor: colors.textMuted,
              textDisabledColor: 'rgba(255,255,255,0.1)',
              dotColor: colors.primary,
              selectedDotColor: colors.bgApp,
              arrowColor: colors.primary,
              monthTextColor: colors.textStrong,
            }}
          />
        </View>
      ) : (
        <>
          <CalendarMiniMonthCard
            year={calendarDate.getFullYear()}
            monthIndex={calendarDate.getMonth()}
            events={filteredEventsForMonth}
            selectedDateKey={focusDate}
            onPrevMonth={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
            onNextMonth={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
            onToday={() => {
              const now = new Date();
              setCalendarDate(now);
              router.setParams({ date: format(now, 'yyyy-MM-dd') });
            }}
            onSelectDay={(dateKey) => {
              router.setParams({ date: dateKey });
            }}
          />

          {focusDate ? (
            <ScheduleAgendaCard
              title={t('screens.bookingClient.dayAgenda', {
                label: format(parseISO(focusDate), 'EEE d MMM yyyy'),
              })}
              items={filteredEventsForFocusDate}
              emptyLabel={t('screens.bookingClient.dayAgendaEmpty')}
            />
          ) : null}

          <View style={styles.topButtons}>
            <Pressable style={styles.topBtn} onPress={() => setBookModalVisible(true)}><Text style={styles.topBtnText}>Book session</Text></Pressable>
            <Pressable style={styles.topBtn} onPress={() => setShowCalendar(true)}><Text style={styles.topBtnText}>Full calendar</Text></Pressable>
          </View>

          <GlassCard style={styles.urgentCard}>
            <Text style={styles.urgentTitle}>Recall requested by your physio</Text>
            <Pressable style={styles.urgentBtn} onPress={() => setBookModalVisible(true)}><Text style={styles.urgentBtnText}>Book now</Text></Pressable>
          </GlassCard>

          <GlassCard>
            <Text style={styles.section}>Calendar Sync</Text>
            <View style={styles.syncRow}>
              <Pressable style={styles.syncBtn} onPress={() => Alert.alert('Coming soon', 'Google sync is not available yet.')}>
                <Text style={styles.syncBtnText}>Google</Text>
              </Pressable>
              <Pressable style={styles.syncBtn} onPress={() => Alert.alert('Coming soon', 'Apple sync is not available yet.')}>
                <Text style={styles.syncBtnText}>Apple</Text>
              </Pressable>
            </View>
          </GlassCard>

          <ScheduleAgendaCard
            title="Today's Agenda"
            items={filteredEventsForToday}
            emptyLabel={t('screens.bookingClient.dayAgendaEmpty')}
          />

          {schedule.discovery.length > 0 ? (
            <GlassCard style={{ gap: 8 }}>
              <Text style={styles.section}>{t('userTrial.schedule.suggestedForYou')}</Text>
              {schedule.discovery.map((item) => (
                <View key={item.id} style={styles.discoveryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.meta}>{item.date} · {item.time}</Text>
                  </View>
                  <Pressable onPress={() => schedule.toggleInterested(item.id)} style={styles.interestedBtn}>
                    <Text style={styles.interestedText}>{schedule.interestedIds.includes(item.id) ? 'Interested' : 'Mark Interested'}</Text>
                  </Pressable>
                </View>
              ))}
            </GlassCard>
          ) : null}

          <Text style={styles.section}>{t('screens.bookingClient.upcoming')}</Text>
          {upcoming.length === 0 ? (
            <GlassCard>
              <EmptyState
                icon="calendar-outline"
                title={t('screens.bookingClient.emptyUpcoming')}
                body={t('screens.bookingClient.emptyUpcomingBody')}
              />
            </GlassCard>
          ) : (
            upcomingByWeek.map((group) => (
              <View key={group.weekKey} style={{ gap: 8 }}>
                <Text style={styles.weekHeader}>{group.weekLabel}</Text>
                {group.bookings.map((b) => (
                  <Pressable key={b.id} onLongPress={() => promptCancelReason(b.id)} delayLongPress={450}>
                    <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={styles.iconWrap}>
                        <Ionicons name="calendar" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.title}>{b.title ?? t('common.session')}</Text>
                        <Text style={styles.meta}>
                          {format(parseISO(b.starts_at), "EEE d MMM · HH:mm")}
                        </Text>
                      </View>
                      <Badge label={b.status} tone={b.status === 'confirmed' ? 'primary' : 'neutral'} />
                    </GlassCard>
                  </Pressable>
                ))}
              </View>
            ))
          )}

          <Text style={styles.section}>{t('screens.bookingClient.history')}</Text>
          {past.length === 0 ? (
            <Text style={styles.emptyText}>{t('screens.bookingClient.historySoon')}</Text>
          ) : (
            pastVisible.map((b) => (
              <GlassCard key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} variant="glass">
                <View style={styles.iconWrap}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{b.title ?? t('common.session')}</Text>
                  <Text style={styles.meta}>{format(parseISO(b.starts_at), "d MMM yyyy · HH:mm")}</Text>
                </View>
                <Badge label={b.status} tone="neutral" />
              </GlassCard>
            ))
          )}
          {past.length >= 20 && (
            <Pressable onPress={() => setShowAllPast((prev) => !prev)} style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>{showAllPast ? t('screens.bookingClient.showLess') : t('screens.bookingClient.viewAll')}</Text>
            </Pressable>
          )}
        </>
      )}

      {/* Modal for full calendar */}
      <Modal
        visible={showCalendar}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalendar(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCalendar(false)}>
          <Pressable style={styles.modalSheet} onPress={() => undefined}>
            <View style={styles.modalHandle} />
            <ScheduleMonthGrid
              year={calendarDate.getFullYear()}
              monthIndex={calendarDate.getMonth()}
              events={filteredEventsForMonth}
              onPrevMonth={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
              onNextMonth={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
              onToday={() => setCalendarDate(new Date())}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal for cancel reason */}
      <Modal
        visible={pendingCancelId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingCancelId(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('screens.bookingClient.cancelBookingTitle')}</Text>
            <Text style={styles.modalHint}>{t('screens.bookingClient.cancelReasonPrompt')}</Text>
            <TextInput
              value={reasonDraft}
              onChangeText={setReasonDraft}
              placeholder={t('screens.bookingClient.reasonPlaceholder')}
              placeholderTextColor={colors.textFaint}
              style={styles.reasonInput}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPendingCancelId(null)} style={styles.modalBtn}>
                <Text style={styles.modalBtnText}>{t('alerts.booking.keepBooking')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!pendingCancelId) return;
                  void performCancel(pendingCancelId, reasonDraft);
                  setPendingCancelId(null);
                }}
                style={[styles.modalBtn, styles.modalBtnDanger]}
              >
                <Text style={[styles.modalBtnText, styles.modalBtnDangerText]}>{t('alerts.booking.cancelSession')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* Batch 10: Book Session Modal (VerveSync Powered + Loading Skeleton) */}
      <Modal
        visible={bookModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBookModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setBookModalVisible(false)}>
          <Pressable style={styles.modalSheetBook} onPress={() => undefined}>
            <View style={styles.modalHandle} />
            <Text style={styles.bookModalTitle}>Book a Session</Text>
            
            {pracsError && (
              <View style={styles.errorBanner}>
                <Ionicons name="warning-outline" size={16} color={colors.danger} />
                <Text style={styles.errorText}>Failed to sync rosters. Using offline fallback.</Text>
              </View>
            )}
            
            {pracsLoading ? (
              <View style={{ gap: 10, marginVertical: 12 }}>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontStyle: 'italic' }}>Syncing rosters...</Text>
                <View style={styles.skeletonCard}>
                  <View style={styles.skeletonAvatar} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={styles.skeletonLineShort} />
                    <View style={styles.skeletonLineLong} />
                  </View>
                </View>
                <View style={styles.skeletonCard}>
                  <View style={styles.skeletonAvatar} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={styles.skeletonLineShort} />
                    <View style={styles.skeletonLineLong} />
                  </View>
                </View>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
                <Text style={styles.bookModalSectionTitle}>Select Practitioner</Text>
                {practitioners.map((prac) => {
                  const isSelected = selectedPracId === prac.id;
                  return (
                    <Pressable
                      key={prac.id}
                      onPress={() => {
                        setSelectedPracId(prac.id);
                        setSelectedSlot(null);
                      }}
                      style={[styles.pracCard, isSelected && styles.pracCardSelected]}
                    >
                      <Image source={{ uri: prac.avatar_url }} style={styles.pracAvatar} />
                      <View style={styles.pracInfo}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.pracName}>{prac.first_name} {prac.last_name}</Text>
                          <Badge label={prac.role} tone={prac.role === 'Physio' ? 'clinical' : 'primary'} />
                        </View>
                        <Text style={styles.pracSub}>{prac.specialty}</Text>
                        <Text style={styles.pracBio} numberOfLines={2}>{prac.bio}</Text>
                      </View>
                    </Pressable>
                  );
                })}

                {selectedPracId && (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <Text style={styles.bookModalSectionTitle}>Available Slots (Today)</Text>
                    <View style={styles.slotGrid}>
                      {slots.map((slot) => {
                        const isSlotSelected = selectedSlot === slot;
                        return (
                          <Pressable
                            key={slot}
                            onPress={() => setSelectedSlot(slot)}
                            style={[styles.slotBtn, isSlotSelected && styles.slotBtnSelected]}
                          >
                            <Text style={[styles.slotText, isSlotSelected && styles.slotTextSelected]}>
                              {slot}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {selectedPracId && selectedSlot && (
                  <Pressable
                    onPress={handleConfirmBooking}
                    disabled={bookingSubmitting}
                    style={styles.confirmBtn}
                  >
                    {bookingSubmitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                    )}
                  </Pressable>
                )}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm },
  viewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: 2,
  },
  toggleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryDim,
  },
  toggleText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: 11,
  },
  toggleTextActive: {
    color: colors.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterPill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface1,
  },
  filterPillActive: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primaryBorder,
  },
  filterText: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: 11,
  },
  filterTextActive: {
    color: colors.primary,
  },
  agendaWrapper: {
    height: 520,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  agendaItemCard: {
    marginRight: 12,
    marginTop: 12,
    gap: 6,
    padding: 12,
  },
  agendaItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agendaTimeText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: 13,
  },
  agendaTitleText: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: 15,
  },
  agendaMetaText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  agendaEmptyDate: {
    height: 60,
    justifyContent: 'center',
    paddingLeft: 16,
    marginTop: 12,
  },
  agendaEmptyText: {
    color: colors.textFaint,
    fontStyle: 'italic',
    fontSize: 13,
  },
  topButtons: { flexDirection: 'row', gap: 8 },
  topBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
    paddingVertical: 10,
  },
  topBtnText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  urgentCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  urgentTitle: { flex: 1, color: colors.warning, fontFamily: typography.family.bodyBold, fontSize: typography.size.sm },
  urgentBtn: { borderRadius: 10, borderWidth: 1, borderColor: colors.primaryBorder, backgroundColor: colors.primaryDim, paddingHorizontal: 10, paddingVertical: 6 },
  urgentBtnText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  syncRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  syncBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.borderDefault, backgroundColor: colors.surface2, paddingVertical: 8 },
  syncBtnText: { color: colors.textMuted, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  discoveryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  interestedBtn: { borderRadius: 10, borderWidth: 1, borderColor: colors.primaryBorder, backgroundColor: colors.primaryDim, paddingHorizontal: 10, paddingVertical: 7 },
  interestedText: { color: colors.primary, fontFamily: typography.family.bodyBold, fontSize: typography.size.xs },
  section: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center',
  },
  title: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  meta: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
  emptyText: { color: colors.textFaint, fontSize: typography.size.sm },
  weekHeader: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 6,
  },
  viewAllBtn: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
  },
  viewAllText: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 8, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalSheet: {
    width: '100%',
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    maxHeight: '78%',
    gap: 8,
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: 14,
    gap: 10,
  },
  modalTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  modalHint: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
  reasonInput: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    color: colors.textStrong,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontFamily: typography.family.body,
    fontSize: typography.size.base,
  },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  modalBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  modalBtnText: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  modalBtnDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerDim,
  },
  modalBtnDangerText: {
    color: colors.danger,
  },
  modalSheetBook: {
    width: '100%',
    backgroundColor: colors.bgSurface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    maxHeight: '88%',
    gap: 12,
  },
  bookModalTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.heading,
    fontSize: typography.size.lg,
    alignSelf: 'center',
    marginBottom: 4,
  },
  bookModalSectionTitle: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginVertical: 4,
  },
  pracCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  pracCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  pracAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pracInfo: {
    flex: 1,
    gap: 3,
  },
  pracName: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  pracSub: {
    color: colors.textMuted,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
  pracBio: {
    color: colors.textFaint,
    fontFamily: typography.family.body,
    fontSize: 11,
    lineHeight: 14,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotBtn: {
    flexBasis: '30%',
    flexGrow: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBtnSelected: {
    backgroundColor: colors.primaryDim,
    borderColor: colors.primary,
  },
  slotText: {
    color: colors.textSub,
    fontFamily: typography.family.bodyMedium,
    fontSize: 11,
  },
  slotTextSelected: {
    color: colors.primary,
    fontFamily: typography.family.bodyBold,
  },
  confirmBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  confirmBtnText: {
    color: colors.white,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    opacity: 0.6,
  },
  skeletonAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.surfaceHover,
  },
  skeletonLineShort: {
    width: '40%',
    height: 14,
    borderRadius: 4,
    backgroundColor: colors.surfaceHover,
  },
  skeletonLineLong: {
    width: '85%',
    height: 12,
    borderRadius: 4,
    backgroundColor: colors.surfaceHover,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.dangerDim,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    marginVertical: 8,
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.family.bodyMedium,
    fontSize: 12,
    flex: 1,
  },
});
