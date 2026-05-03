'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import {
  fetchMessagesByRestaurantId,
  fetchMessagesByTableId,
  insertMessage,
} from '@/lib/model/messages.repository';
import {
  assignTableToWaiter,
  fetchTablesByRestaurant,
} from '@/lib/model/tables.repository';
import { fetchProfileByUserId } from '@/lib/model/profiles.repository';
import { REALTIME_CHANNEL_RESTAURANT } from '@/lib/model/realtime.constants';
import type { Message, Profile, Table } from '@/lib/model/types';

export function useWaiterDashboardViewModel() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [tables, setTables] = useState<Table[]>([]);
  const [requests, setRequests] = useState<Message[]>([]);

  const [activeTable, setActiveTable] = useState<string | null>(null);
  const activeTableRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');

  const [unread, setUnread] = useState<Record<string, number>>({});

  useEffect(() => {
    activeTableRef.current = activeTable;
  }, [activeTable]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        router.push('/login');
        return;
      }

      if (cancelled) return;
      setUser(auth.user);

      const prof = await fetchProfileByUserId(supabase, auth.user.id);
      if (!prof) return;

      if (cancelled) return;
      setProfile(prof);

      const [tbls, reqs] = await Promise.all([
        fetchTablesByRestaurant(supabase, prof.restaurant_id),
        fetchMessagesByRestaurantId(supabase, prof.restaurant_id),
      ]);

      if (cancelled) return;
      setTables(tbls);
      setRequests(reqs);
    };

    void init();

    const channel = supabase
      .channel(REALTIME_CHANNEL_RESTAURANT)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tables' },
        (payload) => {
          const row = payload.new as Table | undefined;
          if (!row?.id) return;

          setTables((prev) => {
            const idx = prev.findIndex((t) => t.id === row.id);
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = row;
              return copy;
            }
            return [row, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new as Message;
          const isActiveConversation = msg.table_id === activeTableRef.current;

          if (isActiveConversation) {
            setMessages((prev) => [...prev, msg]);
            setUnread((prev) => ({
              ...prev,
              [msg.table_id]: 0,
            }));
            return;
          }

          if (msg.sender === 'waiter') return;

          setUnread((prev) => ({
            ...prev,
            [msg.table_id]: (prev[msg.table_id] || 0) + 1,
          }));

          setTables((prevTables) => {
            const table = prevTables.find((t) => t.id === msg.table_id);

            if (!table || !table.assigned_to) {
              setRequests((prev) => [msg, ...prev]);
            }

            return prevTables;
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push('/login');
  }, [router]);

  const openChat = useCallback(async (tableId: string) => {
    activeTableRef.current = tableId;
    setActiveTable(tableId);

    setUnread((prev) => ({
      ...prev,
      [tableId]: 0,
    }));

    const data = await fetchMessagesByTableId(supabase, tableId);
    if (activeTableRef.current !== tableId) return;
    setMessages(data);
  }, []);

  const takeTable = useCallback(
    async (tableId: string) => {
      if (!profile || !user) return;

      await assignTableToWaiter(supabase, {
        tableId,
        userId: user.id,
        fullName: profile.full_name,
      });

      await openChat(tableId);
    },
    [profile, user, openChat]
  );

  const sendMessage = useCallback(async () => {
    if (!activeTable || !text.trim() || !profile) return;

    await insertMessage(supabase, {
      table_id: activeTable,
      restaurant_id: profile.restaurant_id,
      sender: 'waiter',
      text,
    });

    setText('');
  }, [activeTable, text, profile]);

  const pendingRequests = useMemo(() => {
    return requests.filter((r) => {
      const table = tables.find((t) => t.id === r.table_id);
      return !table?.assigned_to;
    });
  }, [requests, tables]);

  return {
    user,
    profile,
    tables,
    pendingRequests,
    activeTable,
    messages,
    text,
    setText,
    unread,
    handleLogout,
    takeTable,
    openChat,
    sendMessage,
  };
}
