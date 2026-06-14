import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { useConversations } from '@/hooks/useConversations';
import { supabase } from '@/lib/supabase';
import { useTranslation } from '@/lib/i18n';
import { colors, shadows, spacing, typography } from '@/lib/theme';

const BTN = 40;

export function ClientHomeTopActions() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { items, refresh } = useConversations(profile?.id ?? null);
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(() => items.filter((item) => item.unread).length, [items]);

  const markAllRead = useCallback(async () => {
    if (!profile?.id) return;
    const now = new Date().toISOString();
    await supabase.from('conversation_members').update({ last_read_at: now }).eq('user_id', profile.id);
    await refresh();
  }, [profile?.id, refresh]);

  const onBell = () => setOpen((v) => !v);

  const onHeat = () => {
    router.push('/(client)/progress');
  };

  const openConversation = (id: string) => {
    setOpen(false);
    router.push(`/conversation/${id}`);
  };

  return (
    <>
      <View style={styles.stack} pointerEvents="box-none">
        <Pressable
          onPress={onBell}
          style={({ pressed }) => [styles.circleBtn, pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
          accessibilityLabel={t('home.client.notifBellA11y')}
          accessibilityState={{ expanded: open }}
        >
          <Ionicons name="notifications" size={18} color={colors.textSub} />
          {unreadCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          onPress={onHeat}
          style={({ pressed }) => [styles.circleBtn, pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
          accessibilityLabel={t('home.client.heatA11y')}
        >
          <Ionicons name="flame" size={18} color={colors.warning} />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalDismissLayer} onPress={() => setOpen(false)} />
          <View style={[styles.dropdownWrap, { marginTop: insets.top + spacing.sm + BTN + 4 }]} pointerEvents="box-none">
            <View style={styles.dropdown}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>{t('home.client.notifTitle')}</Text>
                <Pressable
                  onPress={() => {
                    void markAllRead();
                  }}
                  hitSlop={8}
                >
                  <Text style={styles.markRead}>{t('home.client.notifMarkAllRead')}</Text>
                </Pressable>
              </View>
              <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
                {items.length === 0 ? (
                  <View style={styles.empty}>
                    <Ionicons name="notifications-off-outline" size={36} color={colors.textFaint} />
                    <Text style={styles.emptyText}>{t('home.client.notifEmpty')}</Text>
                  </View>
                ) : (
                  items.map((item) => (
                    <Pressable
                      key={item.conversation.id}
                      onPress={() => openConversation(item.conversation.id)}
                      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
                    >
                      <View style={styles.rowBody}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {item.conversation.title ??
                            (item.members.map((m) => m.first_name ?? m.email).filter(Boolean).join(', ') ||
                              t('common.conversation'))}
                        </Text>
                        <Text style={styles.rowPreview} numberOfLines={2}>
                          {item.lastMessage?.content ?? t('home.client.notifNoPreview')}
                        </Text>
                      </View>
                      {item.unread ? <View style={styles.unreadDot} /> : null}
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  stack: {
    position: 'absolute',
    right: 0,
    top: 0,
    alignItems: 'center',
    gap: 8,
    zIndex: 20,
  },
  circleBtn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: 'rgba(15,23,42,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 99,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: typography.family.bodyBold,
  },
  modalRoot: {
    flex: 1,
  },
  modalDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 4, 8, 0.45)',
  },
  dropdownWrap: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    alignItems: 'flex-end',
  },
  dropdown: {
    width: 320,
    maxHeight: 400,
    backgroundColor: 'rgba(15,23,42,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    overflow: 'hidden',
    ...shadows.lg,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  dropdownTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  markRead: {
    color: colors.textFaint,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
  },
  list: { maxHeight: 320 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: {
    color: colors.textStrong,
    fontFamily: typography.family.bodyBold,
    fontSize: typography.size.sm,
  },
  rowPreview: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
});
