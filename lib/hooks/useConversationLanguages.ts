'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchActiveConversationLanguages } from '@/lib/model/conversation-languages.repository';

export function useConversationLanguages(conversationId: string | null) {
  const [languages, setLanguages] = useState<string[]>([]);
  const channelIdRef = useRef<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  );

  const refresh = useCallback(async (): Promise<string[]> => {
    const cid = conversationId?.trim() ?? '';
    if (!cid) {
      setLanguages([]);
      return [];
    }
    try {
      const uniq = await fetchActiveConversationLanguages(supabase, cid);
      setLanguages(uniq);
      return uniq;
    } catch {
      setLanguages([]);
      return [];
    }
  }, [conversationId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const cid = conversationId?.trim() ?? '';
    if (!cid) return;

    const channel = supabase
      .channel(`conversation-languages:${cid}:${channelIdRef.current}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_members',
          filter: `conversation_id=eq.${cid}`,
        },
        () => {
          void refresh();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, refresh]);

  return {
    languages,
    refresh,
    refetchConversationLanguages: refresh,
    setLanguages,
  };
}
