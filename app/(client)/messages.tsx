import { useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';

import { useAuth } from '@/auth/AuthProvider';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Header } from '@/components/Header';
import { GlassCard } from '@/components/GlassCard';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { MessagesChannelTabs, type MessageChannel } from '@/components/client/MessagesChannelTabs';
import { getOrCreateDirectConversation, useConversations } from '@/hooks/useConversations';
import { useLinkedPractitioners } from '@/hooks/useLinkedPractitioners';
import { USER_TRIAL_DEMO_FLAGS } from '@/lib/demo/userTrialFixtures';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

export default function ClientMessages() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const router = useRouter();
  const { items, loading, refresh } = useConversations(profile?.id ?? null);
  const [showRoster, setShowRoster] = useState(false);
  const [channel, setChannel] = useState<MessageChannel>('practitioners');
  const [search, setSearch] = useState('');
  const practitionersQuery = useLinkedPractitioners(showRoster ? profile?.id ?? null : null);
  const [fabError, setFabError] = useState<string | null>(null);
  const unreadCount = items.filter((item) => item.unread).length;
  const demoEnabled = USER_TRIAL_DEMO_FLAGS.enabled;
  const channelLabel = {
    practitioners: t('userTrial.messages.channelPractitioners'),
    users: t('userTrial.messages.channelUsers'),
    community: t('userTrial.messages.channelCommunity'),
  }[channel];
  const demoThreads = demoEnabled
    ? [
        {
          id: 'demo-users-1',
          channel: 'users' as const,
          title: t('userTrial.messages.demoUsersTitle'),
          preview: t('userTrial.messages.demoUsersPreview'),
          time: '09:24',
          unread: true,
        },
        {
          id: 'demo-community-1',
          channel: 'community' as const,
          title: t('userTrial.messages.demoCommunityTitle'),
          preview: t('userTrial.messages.demoCommunityPreview'),
          time: '08:10',
          unread: false,
        },
      ]
    : [];

  const onStartConversation = async (practitionerId: string) => {
    if (!profile?.id) return;
    setFabError(null);
    try {
      const conversationId = await getOrCreateDirectConversation(profile.id, practitionerId);
      setShowRoster(false);
      router.push(`/conversation/${conversationId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('messages.openFail');
      setFabError(message);
    }
  };

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Header title={t('messages.title')} />
      <Text style={styles.subtitle}>{t('userTrial.messages.subtitle')}</Text>
      <View style={styles.summaryGrid}>
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('userTrial.messages.unread')}</Text>
          <Text style={styles.summaryValue}>{unreadCount}</Text>
        </GlassCard>
        <GlassCard style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('userTrial.messages.channel')}</Text>
          <Text style={styles.summaryValue}>{channelLabel}</Text>
        </GlassCard>
      </View>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={t('userTrial.messages.searchPlaceholder')}
        placeholderTextColor={colors.textFaint}
        style={styles.search}
      />
      <MessagesChannelTabs value={channel} onChange={setChannel} />

      {channel !== 'practitioners' && !demoEnabled ? (
        <GlassCard>
          <EmptyState
            icon="people-circle-outline"
            title={t('userTrial.messages.demoUnavailableTitle')}
            body={t('userTrial.messages.demoUnavailableBody')}
          />
        </GlassCard>
      ) : channel === 'practitioners' && items.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title={t('messages.clientEmptyTitle')}
            body={t('messages.practitionerInboxBody')}
          />
        </GlassCard>
      ) : (
        channel === 'practitioners' ? items.filter((item) => {
          const partner = item.members[0];
          const name = partner ? `${partner.first_name ?? ''} ${partner.last_name ?? ''}`.trim() : '';
          return name.toLowerCase().includes(search.toLowerCase()) || (item.lastMessage?.content ?? '').toLowerCase().includes(search.toLowerCase());
        }).map((item) => {
          const partner = item.members[0];
          const name = partner ? `${partner.first_name ?? ''} ${partner.last_name ?? ''}`.trim() : t('common.conversation');
          return (
            <Link key={item.conversation.id} href={`/conversation/${item.conversation.id}`} asChild>
              <Pressable>
                <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar uri={partner?.avatar_url} name={name} size={44} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.row}>
                      <Text style={styles.name}>{name || t('common.unknown')}</Text>
                      {item.lastMessage ? (
                        <Text style={styles.time}>
                          {format(parseISO(item.lastMessage.created_at), 'HH:mm')}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={[styles.preview, item.unread && styles.previewUnread]} numberOfLines={1}>
                      {item.lastMessage?.content ?? t('common.sayHi')}
                    </Text>
                  </View>
                  {item.unread ? <View style={styles.unreadDot} /> : null}
                </GlassCard>
              </Pressable>
            </Link>
          );
        }) : demoThreads
          .filter((thread) => thread.channel === channel)
          .filter((thread) => thread.title.toLowerCase().includes(search.toLowerCase()) || thread.preview.toLowerCase().includes(search.toLowerCase()))
          .map((thread) => (
            <Link key={thread.id} href={`/conversation/${thread.id}?channel=${thread.channel}`} asChild>
              <Pressable>
                <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar uri={null} name={thread.title} size={44} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.row}>
                      <Text style={styles.name}>{thread.title}</Text>
                      <Text style={styles.time}>{thread.time}</Text>
                    </View>
                    <Text style={[styles.preview, thread.unread && styles.previewUnread]} numberOfLines={1}>{thread.preview}</Text>
                  </View>
                  {thread.unread ? <View style={styles.unreadDot} /> : null}
                </GlassCard>
              </Pressable>
            </Link>
          ))
      )}

      <Pressable
        onPress={() => setShowRoster(true)}
        style={styles.fab}
        accessibilityLabel={t('messages.clientFabStartA11y')}
      >
        <Ionicons name="add" size={26} color={colors.bgApp} />
      </Pressable>

      <Modal
        visible={showRoster}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRoster(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('messages.startConversationTitle')}</Text>
              <Pressable onPress={() => setShowRoster(false)} accessibilityLabel={t('messages.closePractitionerRosterA11y')}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            {practitionersQuery.loading ? <Text style={styles.modalHint}>{t('messages.loadingPractitioners')}</Text> : null}
            {fabError || practitionersQuery.error ? (
              <Text style={styles.modalError}>{fabError ?? practitionersQuery.error}</Text>
            ) : null}
            {!practitionersQuery.loading && practitionersQuery.data.length === 0 ? (
              <Text style={styles.modalHint}>{t('messages.noLinkedPractitioners')}</Text>
            ) : (
              practitionersQuery.data.map((practitioner) => {
                const name = `${practitioner.first_name ?? ''} ${practitioner.last_name ?? ''}`.trim() || practitioner.email;
                return (
                  <Pressable
                    key={practitioner.id}
                    style={styles.practitionerRow}
                    onPress={() => onStartConversation(practitioner.id)}
                    accessibilityLabel={t('messages.startWithNameA11y', { name })}
                  >
                    <Avatar uri={practitioner.avatar_url} name={name} size={38} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.practitionerName}>{name}</Text>
                      <Text style={styles.practitionerRole}>{practitioner.role}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                  </Pressable>
                );
              })
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: { color: colors.textMuted, fontFamily: typography.family.body, fontSize: typography.size.sm },
  summaryGrid: { flexDirection: 'row', gap: 8 },
  summaryCard: { flex: 1, gap: 2 },
  summaryLabel: { color: colors.textFaint, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs, textTransform: 'uppercase' },
  summaryValue: { color: colors.primary, fontFamily: typography.family.headingSemi, fontSize: typography.size.lg },
  search: {
    backgroundColor: colors.surface2,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.textStrong,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: typography.family.body,
    fontSize: typography.size.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base, flex: 1 },
  time: { color: colors.textFaint, fontSize: typography.size.xs },
  preview: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
  previewUnread: { color: colors.textMain, fontFamily: typography.family.bodyMedium },
  unreadDot: {
    width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary,
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primaryBorderStrong,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 4, 8, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.bgSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: 14,
    gap: 8,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  modalHint: { color: colors.textMuted, fontSize: typography.size.sm },
  modalError: { color: colors.danger, fontSize: typography.size.sm, fontFamily: typography.family.bodyMedium },
  practitionerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  practitionerName: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  practitionerRole: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginTop: 1,
    textTransform: 'uppercase',
  },
});
