import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO } from 'date-fns';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { useMessages } from '@/hooks/useMessages';
import { USER_TRIAL_DEMO_FLAGS } from '@/lib/demo/userTrialFixtures';
import { useTranslation } from '@/lib/i18n';
import { colors, radii, typography } from '@/lib/theme';

/** Shared 1:1 chat — used by both client and trainer (P-2.6). */
export default function ConversationScreen() {
  const { t } = useTranslation();
  const { id, channel } = useLocalSearchParams<{ id: string; channel?: 'practitioners' | 'users' | 'community' }>();
  const router = useRouter();
  const { profile } = useAuth();
  const isDemoId = (id ?? '').startsWith('demo-');
  const isDemoThread = isDemoId && USER_TRIAL_DEMO_FLAGS.enabled;
  const isBlockedDemoThread = isDemoId && !USER_TRIAL_DEMO_FLAGS.enabled;
  const { messages, loading, send, markRead } = useMessages(isDemoThread || isBlockedDemoThread ? null : (id ?? null));
  const [demoMessages, setDemoMessages] = useState<{ id: string; sender_id: string; created_at: string; content: string }[]>([
    { id: 'demo-1', sender_id: 'other', created_at: new Date().toISOString(), content: t('userTrial.conversation.demoWelcome') },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!id || !profile || isDemoThread) return;
    markRead(profile.id).catch((error) => {
      if (__DEV__) console.warn('[Verve] mark conversation read failed', error);
    });
  }, [id, isDemoThread, markRead, profile, messages.length]);

  const onSend = async () => {
    if (!draft.trim() || !profile || isBlockedDemoThread) return;
    setSending(true);
    setSendError(null);
    try {
      if (isDemoThread) {
        setDemoMessages((prev) => [
          ...prev,
          { id: `demo-${Date.now()}`, sender_id: profile.id, created_at: new Date().toISOString(), content: draft.trim() },
        ]);
      } else {
        await send(draft.trim(), profile.id);
      }
      setDraft('');
    } catch (error) {
      const message = error instanceof Error ? error.message : t('conversation.couldNotSend');
      setSendError(message);
      Alert.alert(t('conversation.sendFailed'), message);
    } finally {
      setSending(false);
    }
  };

  const activeChannel = channel ?? 'practitioners';
  const QUICK_ACTIONS: Record<'practitioners' | 'users' | 'community', { key: string; label: string }[]> = {
    practitioners: [
      { key: 'pain-update', label: 'Share pain update' },
      { key: 'book', label: 'Book appointment' },
      { key: 'therapy', label: 'Open therapy plan' },
    ],
    users: [
      { key: 'encourage', label: 'Send encouragement' },
      { key: 'routine', label: 'Ask about routine' },
      { key: 'community', label: 'Open community' },
    ],
    community: [
      { key: 'challenge', label: 'Share challenge update' },
      { key: 'win', label: 'Post a win' },
      { key: 'book', label: 'Book follow-up' },
    ],
  };
  const feed = isDemoThread ? demoMessages : messages;
  const onQuickAction = (action: { key: string; label: string }) => {
    if (action.key === 'community') {
      if (!USER_TRIAL_DEMO_FLAGS.enabled) {
        Alert.alert(t('userTrial.conversation.demoUnavailableTitle'), t('userTrial.conversation.demoUnavailableBody'));
        return;
      }
      router.push('/(client)/social');
      return;
    }
    Alert.alert(t('userTrial.conversation.quickAction'), t('userTrial.conversation.readyFlow', { label: action.label }));
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bgApp }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel={t('conversation.backA11y')}>
              <Ionicons name="chevron-back" size={22} color={colors.primary} />
              <Text style={styles.backText}>{t('conversation.inbox')}</Text>
            </Pressable>
            <Text style={styles.title}>{t('conversation.title')}</Text>
            <View style={{ width: 60 }} />
          </View>
          <View style={styles.quickActions}>
            {QUICK_ACTIONS[activeChannel].map((action) => (
              <Pressable
                key={action.key}
                style={styles.quickAction}
                onPress={() => onQuickAction(action)}
              >
                <Text style={styles.quickActionText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>

          <FlatList
            ref={listRef}
            data={feed}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const mine = item.sender_id === profile?.id;
              return (
                <View style={[styles.bubbleRow, mine && { justifyContent: 'flex-end' }]}>
                  <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, mine && { color: colors.bgApp }]}>
                      {item.content}
                    </Text>
                    <Text style={[styles.bubbleTime, mine && { color: 'rgba(2,4,8,0.6)' }]}>
                      {format(parseISO(item.created_at), 'HH:mm')}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              loading ? null : (
                <Text style={styles.empty}>
                  {isBlockedDemoThread ? t('userTrial.conversation.demoUnavailableBody') : t('conversation.empty')}
                </Text>
              )
            }
          />

          <View style={styles.composer}>
            <Pressable
              onPress={() => Alert.alert(t('userTrial.conversation.comingSoonTitle'), t('userTrial.conversation.attachmentsBody'))}
              style={styles.attachBtn}
            >
              <Ionicons name="attach" size={18} color={colors.textMuted} />
            </Pressable>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('conversation.placeholder')}
              placeholderTextColor={colors.textFaint}
              style={styles.composerInput}
              multiline
            />
            <Pressable
              onPress={onSend}
              disabled={sending || !draft.trim() || isBlockedDemoThread}
              style={[styles.sendBtn, (!draft.trim() || sending || isBlockedDemoThread) && { opacity: 0.5 }]}
              accessibilityLabel={t('conversation.sendA11y')}
            >
              <Ionicons name="send" size={18} color={colors.bgApp} />
            </Pressable>
          </View>
          {sendError ? <Text style={styles.sendError}>{sendError}</Text> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomColor: colors.borderDefault, borderBottomWidth: 1,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backText: { color: colors.primary, fontFamily: typography.family.bodyMedium },
  title: { color: colors.textStrong, fontFamily: typography.family.heading, fontSize: typography.size.lg },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  quickAction: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: radii.pill,
    backgroundColor: colors.surface2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickActionText: { color: colors.primary, fontFamily: typography.family.bodyMedium, fontSize: typography.size.xs },
  listContent: { padding: 16, gap: 6, flexGrow: 1 },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '78%', padding: 10, borderRadius: radii.lg, gap: 4 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: colors.surface2,
    borderColor: colors.borderDefault,
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: colors.textStrong, fontSize: typography.size.base, fontFamily: typography.family.body, lineHeight: 20 },
  bubbleTime: { color: colors.textFaint, fontSize: 10, alignSelf: 'flex-end' },
  empty: { color: colors.textFaint, textAlign: 'center', marginTop: 40 },
  composer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, borderTopColor: colors.borderDefault, borderTopWidth: 1,
    backgroundColor: colors.bgSurface,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface2,
  },
  composerInput: {
    flex: 1, maxHeight: 120, color: colors.textStrong,
    fontFamily: typography.family.body, fontSize: typography.size.base,
    backgroundColor: colors.surface2,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.borderDefault,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendError: {
    color: colors.danger,
    fontFamily: typography.family.bodyMedium,
    fontSize: typography.size.xs,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: colors.bgSurface,
  },
});
