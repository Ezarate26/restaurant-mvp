'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchMessagesByTableId,
  insertMessage,
} from '@/lib/model/messages.repository';
import { fetchTableRestaurantId } from '@/lib/model/tables.repository';
import { REALTIME_CHANNEL_TABLE } from '@/lib/model/realtime.constants';
import type { Message } from '@/lib/model/types';

export function useTableChatViewModel(tableId: string) {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const rid = await fetchTableRestaurantId(supabase, tableId);
      if (cancelled || !rid) return;

      setRestaurantId(rid);

      const msgs = await fetchMessagesByTableId(supabase, tableId);
      if (!cancelled) setMessages(msgs);
    };

    void load();

    const channel = supabase
      .channel(REALTIME_CHANNEL_TABLE)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || !restaurantId) return;

    await insertMessage(supabase, {
      table_id: tableId,
      restaurant_id: restaurantId,
      sender: 'customer',
      text: message,
    });

    setMessage('');
  }, [message, restaurantId, tableId]);

  const callWaiter = useCallback(async () => {
    if (!restaurantId) return;

    await insertMessage(supabase, {
      table_id: tableId,
      restaurant_id: restaurantId,
      sender: 'system',
      text: '🔔 Solicitan atención',
    });
  }, [restaurantId, tableId]);

  return {
    restaurantId,
    message,
    setMessage,
    messages,
    sendMessage,
    callWaiter,
  };
}
