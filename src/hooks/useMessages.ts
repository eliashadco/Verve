import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Message } from '@/types/database';

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error: e } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (e) {
      setError(e.message);
      setMessages([]);
    } else {
      setMessages((data ?? []) as Message[]);
      setError(null);
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription so new messages stream in.
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const send = useCallback(
    async (content: string, senderId: string) => {
      if (!conversationId || !content.trim()) return;
      const { error: e } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      });
      if (e) throw e;
    },
    [conversationId],
  );

  const markRead = useCallback(
    async (userId: string) => {
      if (!conversationId) return;
      const { error: e } = await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);
      if (e) throw e;
    },
    [conversationId],
  );

  return { messages, loading, error, send, markRead, refresh: load };
}
