import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Conversation, Message, Profile } from '@/types/database';

export interface ConversationListItem {
  conversation: Conversation;
  members: Profile[];
  lastMessage?: Message;
  unread: boolean;
}

export async function getOrCreateDirectConversation(myId: string, otherId: string) {
  if (myId === otherId) {
    throw new Error('Cannot create a direct conversation with yourself.');
  }

  const { data: conversationId, error: rpcError } = await supabase.rpc(
    'create_direct_conversation',
    { other_id: otherId },
  );
  if (rpcError) throw new Error(rpcError.message);
  if (!conversationId) throw new Error('Failed to create conversation.');

  const { data: conversation, error: fetchError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
  if (fetchError) throw new Error(fetchError.message);

  return conversation.id;
}

export function useConversations(userId: string | null) {
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: memberships, error: e1 } = await supabase
      .from('conversation_members')
      .select('conversation_id, last_read_at')
      .eq('user_id', userId);

    if (e1 || !memberships?.length) {
      if (e1) setError(e1.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const conversationIds = memberships.map((m) => m.conversation_id);

    const [{ data: conversations }, { data: allMembers }, { data: lastMessages }] =
      await Promise.all([
        supabase.from('conversations').select('*').in('id', conversationIds),
        supabase
          .from('conversation_members')
          .select('conversation_id, user_id, profiles:profiles!inner(*)')
          .in('conversation_id', conversationIds),
        supabase
          .from('messages')
          .select('*')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false }),
      ]);

    const memberMap: Record<string, Profile[]> = {};
    (allMembers ?? []).forEach((row: Record<string, unknown>) => {
      const cid = row['conversation_id'] as string;
      const profile = row['profiles'] as Profile | undefined;
      if (!profile) return;
      memberMap[cid] = memberMap[cid] ?? [];
      if (profile.id !== userId) memberMap[cid].push(profile);
    });

    const lastByConv: Record<string, Message> = {};
    (lastMessages ?? []).forEach((m: Message) => {
      if (!lastByConv[m.conversation_id]) lastByConv[m.conversation_id] = m;
    });

    const lastReadMap: Record<string, string | null> = {};
    memberships.forEach((m) => {
      lastReadMap[m.conversation_id] = m.last_read_at;
    });

    const list: ConversationListItem[] = (conversations ?? []).map((c: Conversation) => {
      const last = lastByConv[c.id];
      const lastRead = lastReadMap[c.id];
      return {
        conversation: c,
        members: memberMap[c.id] ?? [],
        lastMessage: last,
        unread: Boolean(last && (!lastRead || new Date(last.created_at) > new Date(lastRead))),
      };
    });

    list.sort((a, b) => {
      const aT = a.lastMessage?.created_at ?? a.conversation.created_at;
      const bT = b.lastMessage?.created_at ?? b.conversation.created_at;
      return new Date(bT).getTime() - new Date(aT).getTime();
    });

    setItems(list);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}
