import { useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { format, parseISO } from 'date-fns';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/auth/AuthProvider';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { GlassCard } from '@/components/GlassCard';
import { Header } from '@/components/Header';
import { ScreenContainer } from '@/components/ScreenContainer';
import { getOrCreateDirectConversation, useConversations } from '@/hooks/useConversations';
import { useLinkedClients } from '@/hooks/useLinkedClients';
import { useTranslation } from '@/lib/i18n';
import { colors, typography } from '@/lib/theme';

export default function TrainerMessages() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const router = useRouter();
  const { items, loading, refresh } = useConversations(profile?.id ?? null);
  const linkedClients = useLinkedClients(profile?.id ?? null);
  const [showRoster, setShowRoster] = useState(false);
  const [fabBusy, setFabBusy] = useState(false);
  const [fabError, setFabError] = useState<string | null>(null);

  const startWithClient = async (clientId: string) => {
    if (!profile?.id) return;
    setFabBusy(true);
    setFabError(null);
    try {
      const conversationId = await getOrCreateDirectConversation(profile.id, clientId);
      setShowRoster(false);
      router.push(`/conversation/${conversationId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('messages.openFail');
      setFabError(message);
    } finally {
      setFabBusy(false);
    }
  };

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
    >
      <Header title={t('messages.title')} />

      {items.length === 0 ? (
        <GlassCard>
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title={t('messages.trainerEmptyTitle')}
            body={t('messages.trainerEmptyBody')}
          />
        </GlassCard>
      ) : (
        items.map((item) => {
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
        })
      )}

      <Pressable
        onPress={() => setShowRoster(true)}
        style={styles.fab}
        accessibilityLabel={t('messages.fabA11y')}
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
              <Text style={styles.modalTitle}>{t('messages.rosterTitle')}</Text>
              <Pressable onPress={() => setShowRoster(false)} accessibilityLabel={t('messages.closeRoster')}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
            {fabBusy ? <Text style={styles.modalHint}>{t('common.opening')}</Text> : null}
            {fabError ? <Text style={styles.modalError}>{fabError}</Text> : null}
            {!fabBusy && linkedClients.clients.length === 0 ? (
              <Text style={styles.modalHint}>{t('messages.rosterHint')}</Text>
            ) : (
              linkedClients.clients.map((client) => {
                const name =
                  `${client.first_name ?? ''} ${client.last_name ?? ''}`.trim() || client.email;
                return (
                  <Pressable
                    key={client.id}
                    style={styles.clientRow}
                    onPress={() => void startWithClient(client.id)}
                    disabled={fabBusy}
                    accessibilityLabel={t('messages.startWithNameA11y', { name })}
                  >
                    <Avatar uri={client.avatar_url} name={name} size={38} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clientName}>{name}</Text>
                      <Text style={styles.clientMeta}>{t('messages.clientMeta')}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { color: colors.textStrong, fontFamily: typography.family.bodyBold, fontSize: typography.size.base, flex: 1 },
  time: { color: colors.textFaint, fontSize: typography.size.xs },
  preview: { color: colors.textMuted, fontSize: typography.size.sm, marginTop: 2 },
  previewUnread: { color: colors.textMain, fontFamily: typography.family.bodyMedium },
  unreadDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
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
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  clientName: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.base,
  },
  clientMeta: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginTop: 1,
    textTransform: 'uppercase',
  },
});
