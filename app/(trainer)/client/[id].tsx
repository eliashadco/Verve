import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, subDays } from 'date-fns';

import { useAuth } from '@/auth/AuthProvider';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Input } from '@/components/Input';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ScreenContainer } from '@/components/ScreenContainer';
import { VerveButton } from '@/components/VerveButton';
import { createBooking as createBookingMutation } from '@/hooks/useBookingMutations';
import { getOrCreateDirectConversation } from '@/hooks/useConversations';
import { useClientDetail } from '@/hooks/useClientDetail';
import { useConstraints } from '@/hooks/useConstraints';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';
import type { ConstraintSeverity } from '@/types/database';

export default function TrainerClientDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const detail = useClientDetail(id ?? null);
  const constraints = useConstraints(id ?? null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingBusy, setBookingBusy] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [title, setTitle] = useState('');

  const activeProgram = detail.programs.find((program) => program.status === 'active') ?? null;
  const recentAdherence30d = useMemo(
    () => detail.recentAdherence.filter((entry) => new Date(entry.started_at) >= subDays(new Date(), 30)),
    [detail.recentAdherence],
  );

  const openBookingModal = () => {
    setTitle(t('trainerClientDetail.defaultSessionTitle'));
    setShowBookingModal(true);
  };

  const startConversation = async () => {
    if (!profile?.id || !id) return;
    try {
      const conversationId = await getOrCreateDirectConversation(profile.id, id);
      router.push(`/conversation/${conversationId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('messages.openFail');
      Alert.alert(t('alerts.clientDetail.messageFail'), message);
    }
  };

  const createBooking = async () => {
    if (!profile?.id || !id) return;
    const duration = Number(durationMinutes);
    if (!Number.isFinite(duration) || duration <= 0) {
      Alert.alert(t('alerts.clientDetail.invalidDuration'), t('alerts.clientDetail.invalidDurationBody'));
      return;
    }
    const startsAt = new Date(`${startDate}T${startTime}:00`);
    if (Number.isNaN(startsAt.getTime())) {
      Alert.alert(t('alerts.clientDetail.invalidDt'), t('alerts.clientDetail.invalidDtBody'));
      return;
    }
    const endsAt = new Date(startsAt.getTime() + duration * 60_000);
    const bookingTitle = title.trim() || t('trainerClientDetail.defaultSessionTitle');

    setBookingBusy(true);
    try {
      await createBookingMutation({
        practitionerId: profile.id,
        clientId: id,
        bookingType: 'pt_session',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        status: 'confirmed',
        title: bookingTitle,
      });
      setShowBookingModal(false);
      Alert.alert(t('alerts.clientDetail.scheduled'), t('alerts.clientDetail.scheduledBody'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('alerts.clientDetail.scheduleFail');
      Alert.alert(t('alerts.clientDetail.scheduleFail'), message);
    } finally {
      setBookingBusy(false);
    }
  };

  if (detail.loading) return <LoadingScreen label={t('loading.client')} />;
  if (detail.error) {
    return (
      <ScreenContainer>
        <Text style={styles.errorText}>{detail.error}</Text>
      </ScreenContainer>
    );
  }

  const client = detail.profile;
  const fullName = `${client?.first_name ?? ''} ${client?.last_name ?? ''}`.trim() || client?.email || t('common.client');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer
        refreshControl={
          <RefreshControl
            refreshing={detail.loading || constraints.loading}
            onRefresh={() => {
              void detail.refresh();
              void constraints.refresh();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel={t('common.back')}>
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>

        <GlassCard style={styles.profileCard}>
          <Avatar uri={client?.avatar_url ?? null} name={fullName} size={58} />
          <View style={{ flex: 1 }}>
            <Text style={styles.clientName}>{fullName}</Text>
            <Text style={styles.clientEmail}>{client?.email ?? t('common.emDash')}</Text>
            <Text style={styles.clientMeta}>
              {detail.clientProfile?.primary_goal
                ? t('common.goalWithValue', { goal: detail.clientProfile.primary_goal })
                : t('trainerClientDetail.noPrimaryGoal')}
            </Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('trainerClientDetail.activeProgram')}</Text>
          {activeProgram ? (
            <View style={{ gap: 6 }}>
              <Text style={styles.strong}>{activeProgram.name}</Text>
              <View style={styles.badgeRow}>
                <Badge label={activeProgram.status} tone="primary" />
                {activeProgram.focus ? <Badge label={activeProgram.focus} tone="clinical" /> : null}
                {activeProgram.duration_weeks ? (
                  <Badge label={t('common.weeksShort', { weeks: activeProgram.duration_weeks })} tone="neutral" />
                ) : null}
              </View>
            </View>
          ) : (
            <EmptyState
              icon="barbell-outline"
              title={t('trainerClientDetail.noActiveProgramTitle')}
              body={t('trainerClientDetail.noActiveProgramBody')}
            />
          )}
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('trainerClientDetail.adherence30')}</Text>
          {recentAdherence30d.length === 0 ? (
            <EmptyState
              icon="pulse-outline"
              title={t('trainerClientDetail.noRecentLogsTitle')}
              body={t('trainerClientDetail.noRecentLogsBody')}
            />
          ) : (
            recentAdherence30d.slice(0, 6).map((entry) => (
              <View key={entry.id} style={styles.adherenceRow}>
                <Text style={styles.strong}>{format(parseISO(entry.started_at), 'EEE d MMM · HH:mm')}</Text>
                <Text style={styles.muted}>
                  {t('trainerClientDetail.adherenceRowMeta', {
                    day: entry.day_index + 1,
                    count: entry.exercises_logged.length,
                  })}
                </Text>
              </View>
            ))
          )}
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('trainerClientDetail.constraints')}</Text>
          {constraints.error ? <Text style={styles.errorText}>{constraints.error}</Text> : null}
          {constraints.data.length === 0 && !constraints.loading ? (
            <EmptyState
              icon="shield-checkmark-outline"
              title={t('trainerClientDetail.noConstraintsTitle')}
              body={t('trainerClientDetail.noConstraintsBody')}
            />
          ) : (
            constraints.data.map((constraint) => (
              <Pressable
                key={constraint.id}
                onPress={() =>
                  Alert.alert(
                    t('alerts.programTrainer.constraintTitle'),
                    [
                      constraint.physio_name ? t('trainerClientDetail.constraintPhysio', { name: constraint.physio_name }) : null,
                      constraint.notes?.trim() || t('trainerClientDetail.constraintNoNotes'),
                    ]
                      .filter(Boolean)
                      .join('\n\n'),
                  )
                }
                accessibilityLabel={t('trainerClientDetail.viewConstraintA11y')}
              >
                <GlassCard style={styles.constraintCard}>
                  <View style={styles.constraintHeader}>
                    <Badge label={constraint.constraint_type.replace(/_/g, ' ')} tone="neutral" />
                    <Badge label={constraint.severity} tone={severityTone(constraint.severity)} />
                  </View>
                  <Text style={styles.target}>{constraint.target}</Text>
                  {constraint.value ? (
                    <Text style={styles.value}>{t('therapyDetail.limit', { value: constraint.value })}</Text>
                  ) : null}
                  {constraint.notes ? <Text style={styles.notes}>{constraint.notes}</Text> : null}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>{t('trainerClientDetail.physioMeta')}</Text>
                    <Text style={styles.metaValue}>{constraint.physio_name ?? t('therapyDetail.physio')}</Text>
                  </View>
                </GlassCard>
              </Pressable>
            ))
          )}
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('trainerClientDetail.quickActions')}</Text>
          <View style={{ gap: 10 }}>
            <VerveButton label={t('trainerClientDetail.messageClient')} onPress={() => void startConversation()} />
            <VerveButton label={t('trainerClientDetail.scheduleSession')} variant="ghost" onPress={openBookingModal} />
          </View>
        </GlassCard>
      </ScreenContainer>

      <Modal visible={showBookingModal} transparent animationType="fade" onRequestClose={() => setShowBookingModal(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <Text style={styles.sectionTitle}>{t('trainerClientDetail.scheduleModalTitle')}</Text>
            <Input label={t('trainerClientDetail.fieldTitle')} value={title} onChangeText={setTitle} />
            <Input label={t('trainerClientDetail.fieldDate')} value={startDate} onChangeText={setStartDate} />
            <Input label={t('trainerClientDetail.fieldTime')} value={startTime} onChangeText={setStartTime} />
            <Input
              label={t('trainerClientDetail.fieldDuration')}
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              keyboardType="numeric"
            />
            <View style={styles.modalButtons}>
              <VerveButton label={t('common.cancel')} variant="ghost" onPress={() => setShowBookingModal(false)} />
              <VerveButton label={t('trainerClientDetail.createBooking')} onPress={() => void createBooking()} loading={bookingBusy} />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </>
  );
}

function severityTone(severity: ConstraintSeverity): 'danger' | 'warning' | 'clinical' {
  if (severity === 'hard') return 'danger';
  if (severity === 'soft') return 'warning';
  return 'clinical';
}

const styles = StyleSheet.create({
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backText: { color: colors.primary, fontFamily: typography.family.bodyMedium, fontSize: typography.size.sm },
  errorText: { color: colors.danger, fontSize: typography.size.sm },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clientName: { color: colors.textStrong, fontFamily: typography.family.heading, fontSize: typography.size.lg },
  clientEmail: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 1 },
  clientMeta: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 4 },
  sectionCard: { gap: 8 },
  sectionTitle: {
    color: colors.textSub,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  strong: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base },
  muted: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  adherenceRow: { borderTopWidth: 1, borderTopColor: colors.borderSubtle, paddingTop: 8, marginTop: 2 },
  constraintCard: { gap: 8, marginBottom: 8 },
  constraintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  target: {
    color: colors.textStrong,
    fontFamily: typography.family.headingSemi,
    fontSize: typography.size.lg,
  },
  value: {
    color: colors.textSub,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.sm,
  },
  notes: {
    color: colors.textMuted,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaLabel: {
    color: colors.textFaint,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metaValue: {
    color: colors.clinical,
    fontFamily: typography.family.bodySemi,
    fontSize: typography.size.sm,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 8, 0.65)',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  modalCard: { gap: 8 },
  modalButtons: { gap: 8, marginTop: 6 },
});
